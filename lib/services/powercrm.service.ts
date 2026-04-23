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


interface AddTagPayload {
  quotationCode: string;
  tagId: number;
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

  console.log(local.toISOString().replace("T", " ").slice(0, 19))

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
async function addLead(associado: ContratacaoFormData): Promise<AddLeadResponse> {
  const origemId = parseInt(process.env.POWERCRM_ORIGEM_ID ?? "0", 10);
  const regiao = getRegionByDDD({ phoneNumber: associado.telefone });

  const payload: AddLeadPayload = {
    name: associado.nome,
    email: associado.email,
    phone: associado.telefone.replace(/\D/g, ""),
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

  const { quotationCode } = data;

  // Lógica de Tags com Retry (Background)
  const tagIdInativo = 21452;
  const { tag: tagRegional } = getRegionByDDD({ phoneNumber: associado.telefone });
  const tagsParaAdicionar = [tagIdInativo, tagRegional];

  for (const id of tagsParaAdicionar) {
    if (!id) continue;
    // Dispara cada tag com retry, mas sem mudar a coop (geralmente tag não exige isso)
    executeGenericRetry(`Tag ${id}`, quotationCode, () => tryAddTag(quotationCode, id), false).catch(console.error);
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

/** Tenta adicionar a atividade uma única vez */
async function tryAddActivity(
  quotationCode: string, 
  description: string, 
  scheduledMinutes: number = 20
): Promise<boolean> {
  const payload: AddActivityPayload = {
    type: 2,
    description,
    quotationCode,
    scheduled: scheduledAt(scheduledMinutes),
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
 * Lógica robusta de Retry Genérica
 * @param label Nome para o log (Atividade, Tag, etc)
 * @param quotationCode Código do lead
 * @param tryFn Função que executa a tentativa e retorna boolean
 * @param useFallbackCoop Se deve tentar mudar para Goiânia em caso de falha total
 */
async function executeGenericRetry(
  label: string,
  quotationCode: string,
  tryFn: () => Promise<boolean>,
  useFallbackCoop: boolean = true
): Promise<void> {
  const delays = [30_000, 10_000, 10_000]; // 30s iniciais + retentativas

  // Bloco 1: Tentativas iniciais
  for (let i = 0; i < delays.length; i++) {
    await sleep(delays[i]);
    if (await tryFn()) {
      console.log(`[PowerCRM] ${label} adicionada com sucesso.`);
      return;
    }
    console.warn(`[PowerCRM] Tentativa ${i + 1}/3 de ${label} falhou.`);
  }

  // Bloco 2: Fallback para Goiânia
  if (useFallbackCoop) {
    console.warn(`[PowerCRM] Bloco 1 esgotado para ${label}. Migrando para Goiânia...`);
    await updateLeadCoop(quotationCode);
    
    for (let i = 0; i < 2; i++) {
      await sleep(10_000);
      if (await tryFn()) return;
    }
  }

  console.error(`[PowerCRM] Falha definitiva em ${label} para o lead ${quotationCode}`);
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
  const { coop, tag } = getRegionByDDD({ phoneNumber: associado.telefone_celular });

  const payload: AddLeadPayload = {
    name: associado.nome,
    email: associado.email,
    phone: associado.telefone_celular.replace(/\D/g, ""),
    origemId,
    coop,
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

  // Tenta adicionar tag de inativos
  const tagIdInativo = 21452;
  const tags = [tagIdInativo, tag]
  
  for (const tag of tags) { 
    tryAddTag(data.quotationCode, tag).catch(console.error);
  }

  return { quotationCode: data.quotationCode, negotiationCode: data.negotiationCode };
}

/**
 * Cria o lead no CRM e dispara o fluxo de atividade em background.
 * Retorna quotationCode e negotiationCode para serem salvos no banco.
 */
export async function criarLeadCRM(dados: ContratacaoFormData): Promise<AddLeadResponse> {
  const codes = await addLead(dados);
  const msg = "Lead originado pelo Projeto Automações.";

  executeGenericRetry("Atividade", codes.quotationCode, () => 
    tryAddActivity(codes.quotationCode, msg)
  ).catch(console.error);

  return codes;
}

/**
 * Cria o lead de associado inativo no CRM e registra a atividade correspondente.
 * Aguarda 5s antes de tentar criar a atividade (CRM precisa processar o lead).
 */
export async function criarLeadInativoCRM(associado: AssociadoInativoData): Promise<AddLeadResponse> {
  const codes = await addLeadInativo(associado);
  const msg = "Associado identificado como INATIVO. Dar tratativa na retenção.";

  executeGenericRetry("Atividade Inativo", codes.quotationCode, () => 
    tryAddActivity(codes.quotationCode, msg, 30)
  ).catch(console.error);

  return codes;
}

/** Tenta adicionar a atividade uma única vez */
async function tryAddTag(
  quotationCode: string,
  tagId: number,
): Promise<boolean> {

  const payload: AddTagPayload = {
    quotationCode,
    tagId,
  };

  try {
    // Promise para adicionar tag por tag, uma por uma
    const res = await fetch(`${getBaseUrl()}/api/quotation/add-tag`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch {
    return false;
  }
}