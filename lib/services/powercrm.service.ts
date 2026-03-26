/**
 * PowerCRM Service
 *
 * Responsável por:
 * - Criar leads de contratação (fluxo original)
 * - Criar leads de associados inativos (novo fluxo)
 * - Adicionar atividades com retry automático
 * - Enviar anexos PDF
 *
 * Fluxo de contratação:
 * 1. addLead()              — cria o lead com coop determinada pelo DDD
 * 2. addActivityWithRetry() — tenta 3x (10s > 5s > 5s) com fallback para Goiânia
 * 3. updateLeadCoop()       — atualiza a coop para Goiânia antes do segundo bloco de retry
 *
 * Fluxo de inativos:
 * 1. addLeadInativo()       — cria cotação para associado inativo
 * 2. addActivityInativo()   — registra atividade informando que é inativo
 */

import { getRegionByDDD, getGoianiaRegion } from "@/lib/utils/get-region-by-ddd";
import { ContratacaoFormData } from "@/lib/schemas/contratacao.schema";

// --- Tipos de resposta da API ---

export interface AddLeadResponse {
  quotationCode: string;
  negotiationCode: string;
}

interface AddLeadPayload {
  name: string;
  email: string;
  phone: string;
  origemId: number;
  coop: number;
}

interface AddActivityPayload {
  type: number;
  description: string;
  quotationCode: string;
  scheduled: string;
}

interface UpdateLeadPayload {
  code: string;
  coop: number;
}

// Dados mínimos de um associado inativo recebidos da Hinova
export interface AssociadoInativoData {
  cpf: string;
  nome: string;
  email: string;
  telefone_celular: string;
  codigo_cooperativa: string;
}

// --- Helpers ---

/** Aguarda N milissegundos */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retorna a data/hora atual + N minutos no formato esperado pelo CRM (GMT-3) */
function scheduledAt(minutesFromNow: number): string {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000);

  // Ajusta para GMT-3 (Brasil)
  const offset = -3 * 60;
  const local = new Date(date.getTime() + offset * 60 * 1000);

  return local.toISOString().replace("T", " ").slice(0, 19);
}

/** Cabeçalhos padrão para todas as requisições */
function getHeaders(): HeadersInit {
  const token = process.env.POWERCRM_TOKEN;
  if (!token) throw new Error("[PowerCRM] POWERCRM_TOKEN não está definido.");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/** URL base da API */
function getBaseUrl(): string {
  return process.env.POWERCRM_API_URL ?? "https://api.powercrm.com.br";
}

// --- Funções da API ---

/** Adiciona o lead no CRM e retorna quotationCode e negotiationCode */
async function addLead(dados: ContratacaoFormData): Promise<AddLeadResponse> {
  const origemId = parseInt(process.env.POWERCRM_ORIGEM_ID ?? "0", 10);
  const regiao = getRegionByDDD({ phoneNumber: dados.telefone });

  const payload: AddLeadPayload = {
    name: dados.nome,
    email: dados.email,
    phone: dados.telefone.replace(/\D/g, ""),
    origemId,
    coop: regiao.coop,
  };

  const res = await fetch(`${getBaseUrl()}/api/quotation/add`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[PowerCRM] addLead falhou (${res.status}): ${body}`);
  }

  const data = await res.json();

  if (!data.quotationCode || !data.negotiationCode) {
    throw new Error(
      "[PowerCRM] addLead: resposta sem quotationCode ou negotiationCode."
    );
  }

  return {
    quotationCode: data.quotationCode as string,
    negotiationCode: data.negotiationCode as string,
  };
}

/** Atualiza a coop do lead para o fallback de Goiânia */
async function updateLeadCoop(quotationCode: string): Promise<void> {
  const goiania = getGoianiaRegion();

  const payload: UpdateLeadPayload = {
    code: quotationCode,
    coop: goiania.coop,
  };

  const res = await fetch(`${getBaseUrl()}/api/quotation/update`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    console.warn(`[PowerCRM] updateLeadCoop falhou (${res.status}): ${body}`);
  }
}

/** Tenta adicionar a atividade uma única vez — retorna true se bem-sucedido */
async function tryAddActivity(quotationCode: string): Promise<boolean> {
  const payload: AddActivityPayload = {
    type: 2,
    description:
      "Lead originado pelo Clube Mais Seguro. Termo de adesão encaminhado para assinatura via ClickSign.",
    quotationCode,
    scheduled: scheduledAt(20), // 20 minutos após a criação do lead
  };

  try {
    const res = await fetch(`${getBaseUrl()}/api/quotation/add-activity`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Tenta adicionar a atividade com retry automático.
 *
 * Estratégia:
 * - Bloco 1: 3 tentativas — aguarda 10s antes da 1ª, 5s antes da 2ª, 5s antes da 3ª
 * - Se falhar: atualiza coop para Goiânia e faz mais 3 tentativas (5s entre cada)
 * - Se ainda falhar: registra aviso e segue sem bloquear o fluxo
 */
async function addActivityWithRetry(quotationCode: string): Promise<void> {
  const delaysBloco1 = [10_000, 5_000, 5_000];

  // --- Bloco 1: tentativas com coop original ---
  for (let i = 0; i < 3; i++) {
    await sleep(delaysBloco1[i]);

    const ok = await tryAddActivity(quotationCode);
    if (ok) {
      console.log(`[PowerCRM] Atividade adicionada na tentativa ${i + 1} (bloco 1).`);
      return;
    }

    console.warn(`[PowerCRM] Tentativa ${i + 1}/3 (bloco 1) falhou.`);
  }

  // --- Fallback: atualiza coop para Goiânia ---
  console.warn(
    "[PowerCRM] Bloco 1 esgotado. Atualizando coop para Goiânia e retentando..."
  );
  await updateLeadCoop(quotationCode);

  // --- Bloco 2: 3 novas tentativas após atualizar a coop ---
  for (let i = 0; i < 3; i++) {
    if (i > 0) await sleep(5_000);

    const ok = await tryAddActivity(quotationCode);
    if (ok) {
      console.log(
        `[PowerCRM] Atividade adicionada na tentativa ${i + 1} (bloco 2 / fallback Goiânia).`
      );
      return;
    }

    console.warn(`[PowerCRM] Tentativa ${i + 1}/3 (bloco 2) falhou.`);
  }

  // Não bloqueia o fluxo — contrato e ClickSign já foram processados
  console.warn(
    "[PowerCRM] Não foi possível adicionar a atividade após 6 tentativas. Seguindo sem ela."
  );
}

/**
 * Envia o PDF assinado como anexo para o PowerCRM.
 * O PowerCRM espera o arquivo em base64 com o prefixo data URI.
 */
export async function enviarAnexoCRM(
  quotationCode: string,
  nomeArquivo: string,
  pdfBuffer: Buffer
): Promise<void> {
  const base64 = pdfBuffer.toString("base64");
  const dataUri = `data:application/pdf;name=${encodeURIComponent(nomeArquivo)};base64,${base64}`;

  const res = await fetch(
    `${getBaseUrl()}/api/quotation/send-attachment?quotationCode=${quotationCode}`,
    {
      method: "POST",
      headers: {
        ...getHeaders(),
        "Content-Type": "application/octet-stream",
      },
      body: dataUri,
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `[PowerCRM] enviarAnexoCRM falhou (${res.status}): ${body}`
    );
  }

  console.log(`[PowerCRM] Anexo enviado com sucesso para quotation ${quotationCode}.`);
}

/**
 * Envia o PDF assinado como anexo para o PowerCRM a partir de uma URL.
 * Baixa o PDF da URL do ClickSign e envia em base64 para o CRM.
 * Usar quando o signed_file_url estiver disponível no payload do webhook.
 *
 * Atenção: a signed_file_url do ClickSign expira em ~5 minutos (X-Amz-Expires=300).
 * Esta função deve ser chamada imediatamente ao receber o webhook.
 */
export async function enviarAnexoCRMViaUrl(
  quotationCode: string,
  nomeArquivo: string,
  signedFileUrl: string,
  nomeTitular?: string
): Promise<void> {
  // Baixa o PDF da URL temporária do ClickSign
  const downloadRes = await fetch(signedFileUrl);

  if (!downloadRes.ok) {
    throw new Error(
      `[PowerCRM] Falha ao baixar PDF do ClickSign (${downloadRes.status}): ${signedFileUrl}`
    );
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);

  console.log(
    `[PowerCRM] PDF baixado — ${pdfBuffer.length} bytes | Titular: ${nomeTitular ?? "desconhecido"}`
  );

  // Envia o buffer para o CRM via base64
  await enviarAnexoCRM(quotationCode, nomeArquivo, pdfBuffer);
}

// --- Funções para o fluxo de Inativos ---

/**
 * Adiciona um lead de associado inativo no CRM.
 * Usa a região determinada pelo telefone do associado.
 */
async function addLeadInativo(associado: AssociadoInativoData): Promise<AddLeadResponse> {
  const origemId = parseInt(
    process.env.POWERCRM_ORIGEM_INATIVOS_ID ?? process.env.POWERCRM_ORIGEM_ID ?? "0",
    10
  );

  // Determina a coop pelo telefone do associado
  const regiao = getRegionByDDD({ phoneNumber: associado.telefone_celular });

  const payload: AddLeadPayload = {
    name: associado.nome,
    email: associado.email,
    phone: associado.telefone_celular.replace(/\D/g, ""),
    origemId,
    coop: regiao.coop,
  };

  const res = await fetch(`${getBaseUrl()}/api/quotation/add`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[PowerCRM] addLeadInativo falhou (${res.status}): ${body}`);
  }

  const data = await res.json();

  if (!data.quotationCode || !data.negotiationCode) {
    throw new Error("[PowerCRM] addLeadInativo: resposta sem quotationCode ou negotiationCode.");
  }

  return { quotationCode: data.quotationCode, negotiationCode: data.negotiationCode };
}

/**
 * Adiciona a atividade de inativo no CRM.
 * Informa que o lead é um associado que ficou inativo.
 */
async function addActivityInativo(quotationCode: string): Promise<void> {
  const payload: AddActivityPayload = {
    type: 2,
    description:
      "Associado identificado como INATIVO pelo sistema de monitoramento automático. Verificar possibilidade de reativação.",
    quotationCode,
    scheduled: scheduledAt(30), // Agendado para 30 minutos após criação
  };

  try {
    const res = await fetch(`${getBaseUrl()}/api/quotation/add-activity`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[PowerCRM] addActivityInativo falhou (${res.status}) para ${quotationCode}`);
    } else {
      console.log(`[PowerCRM] Atividade de inativo registrada para ${quotationCode}`);
    }
  } catch (err) {
    console.warn(`[PowerCRM] Erro ao adicionar atividade de inativo:`, err);
  }
}

// --- Funções principais exportadas ---

/**
 * Cria o lead no CRM e dispara o fluxo de atividade em background.
 * Retorna quotationCode e negotiationCode para serem salvos no banco.
 */
export async function criarLeadCRM(
  dados: ContratacaoFormData
): Promise<AddLeadResponse> {
  const codes = await addLead(dados);

  // Dispara o retry de atividade em background — não bloqueia a resposta ao usuário
  addActivityWithRetry(codes.quotationCode).catch((err) =>
    console.error("[PowerCRM] Erro inesperado no addActivityWithRetry:", err)
  );

  return codes;
}

/**
 * Cria o lead de associado inativo no CRM e registra a atividade correspondente.
 * Aguarda 5s antes de tentar criar a atividade (CRM precisa processar o lead).
 */
export async function criarLeadInativoCRM(
  associado: AssociadoInativoData
): Promise<AddLeadResponse> {
  const codes = await addLeadInativo(associado);

  // Aguarda antes de criar a atividade para garantir que o lead foi processado
  await sleep(5_000);
  await addActivityInativo(codes.quotationCode);

  return codes;
}
