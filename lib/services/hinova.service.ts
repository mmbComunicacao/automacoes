/**
 * Hinova SGA Service
 */

import type { BuscarAlteracoesAssociadoFormData } from "../schemas/hinova.schema";

/** Cabeçalhos padrão para todas as requisições */
function getHeaders(): HeadersInit {
  const token = process.env.HINOVA_API_TOKEN_USUARIO;
  if (!token) throw new Error("[Hinova] HINOVA_API_TOKEN_USUARIO não está definido.");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/** URL base da API */
function getBaseUrl(): string {
  return process.env.HINOVA_API_URL ?? "https://api.hinova.com.br/api/sga/v2";
}

/**
 * Remove qualquer caractere não numérico do CPF ou código do associado.
 * A API Hinova exige somente dígitos — pontos, traços e espaços causam erro 406.
 */
function sanitizarCpfOuCodigo(valor: string): string {
  return valor.replace(/\D/g, "");
}

interface BuscarAlteracoesAssociadoPayload {
  data_inicial: string;
  data_final: string;
  campos: string[];
}

interface BuscarAlteracoesAssociadoResponse {
  codigo_alteracao: string;
  codigo_associado: string;
  cpf_associado: string;
  nome_associado: string;
  nome_campo_tabela: string;
  valor_anterior: string;
  valor_posterior: string;
  data_alteracao: string;
  hora_alteracao: string;
  codigo_usuario_alteracao: string;
  nome_usuario_alteracao: string;
}

interface BuscarAssociadoResponse {
  cpf: string;
  nome: string;
  sexo: string;
  data_nascimento: string;
  nome_mae: string;
  nome_pai: string;
  rg: string;
  orgao_expedidor_rg: string;
  data_expedicao_rg: string;
  cnh: string;
  categoria_cnh: string;
  data_vencimento_habilitacao: string;
  telefone_celular: string;
  telefone_celular_aux: string;
  telefone_comercial: string;
  email: string;
  email_auxiliar: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  data_cadastro: string;
  codigo_estado_civil: string;
  codigo_classificacao: string;
  data_contrato: string;
  descricao_situacao: string;
  filhos: number;
  codigo_profissao: string;
  opcoes_notificacao: {
    email: string;
    sms: string;
    whatsapp: string;
  };
  codigo_associado: string;
  telefone_fixo: string;
  codigo_regional: string;
  codigo_externo: string;
  spcSerasa: string;
  codigo_associado_beneficiario: string;
  dia_vencimento: string;
  codigo_tipo_cobranca_recorrente: string;
  descricao_tipo_cobranca_recorrente: string;
  codigo_cooperativa: string;
  codigo_voluntario: string;
  pontos: number;
  codigo_situacao: string;
  veiculos: Array<{
    codigo_veiculo: string;
    placa: string;
    chassi: string;
    valor_fixo: number;
    codigo_situacao: string;
    valor_fipe: number;
    situacao: string;
    descricao_modelo: string;
    codigo_modelo: string;
    codigo_veiculo_indicador: string;
    placa_veiculo_indicador: string;
    codigo_associado_indicador: string;
    cpf_associado_indicador: string;
    nome_associado_indicador: string;
  }>;
  beneficiarios: Array<{
    codigo_associado_beneficiario: string;
    dia_vencimento: string;
    codigo_tipo_cobranca_recorrente: string;
    descricao_tipo_cobranca_recorrente: string;
    codigo_cooperativa: string;
    codigo_voluntario: string;
    pontos: number;
    descricao_situacao: string;
    codigo_situacao: string;
  }>;
  campos_opcionais: Array<string>;
}

interface BuscarAssociadosInativosResponse { associados: BuscarAssociadoResponse[] }

// --- Funções auxiliares ---

async function buscarAlteracoesAssociado(
  dados: BuscarAlteracoesAssociadoFormData
): Promise<BuscarAlteracoesAssociadoResponse[]> {
  // Data precisa estar no formato DD/MM/YYYY
  const today = new Date();
  const dataFormatada = today.toLocaleDateString("pt-BR");

  const payload: BuscarAlteracoesAssociadoPayload = {
    data_inicial: dados.data_inicial ?? dataFormatada,
    data_final: dados.data_final ?? dataFormatada,
    campos: dados.campos,
  };

  const res = await fetch(`${getBaseUrl()}/listar/alteracao-associados/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[Hinova] buscarAlteracoesAssociado falhou (${res.status}): ${body}`);
  }

  const data: BuscarAlteracoesAssociadoResponse[] = await res.json();

  // Nenhuma alteração no período — retorna lista vazia sem lançar erro
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  if (!data[0].codigo_alteracao || !data[0].codigo_associado) {
    throw new Error(
      "[Hinova] buscarAlteracoesAssociado: resposta sem codigo_alteracao ou codigo_associado."
    );
  }

  // Retornar apenas os registros onde a situação mudou para "2" (inativo)
  return data.filter((item) => item.valor_posterior === "2");
}

async function buscarAssociado(cpf: string): Promise<BuscarAssociadoResponse> {
  // Garante que apenas dígitos são enviados — evita erro 406 da Hinova
  const cpfSanitizado = sanitizarCpfOuCodigo(cpf);

  if (!cpfSanitizado) {
    throw new Error(`[Hinova] buscarAssociado: CPF inválido após sanitização — valor original: "${cpf}"`);
  }

  const res = await fetch(`${getBaseUrl()}/associado/buscar/${cpfSanitizado}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[Hinova] buscarAssociado falhou (${res.status}): ${body}`);
  }

  const data: BuscarAssociadoResponse = await res.json();

  return data;
}

// --- Funções da API ---

export async function buscarAssociadosInativos(
  data_inicial: string,
  data_final: string
): Promise<BuscarAssociadosInativosResponse> {
  const alteracoes = await buscarAlteracoesAssociado({
    data_inicial,
    data_final,
    campos: ["codigo_situacao"],
  });

  // Nenhum inativo no período — retorna lista vazia sem chamar buscarAssociado
  if (alteracoes.length === 0) {
    return { associados: [] };
  }

  const associadosInativos = await Promise.all(
    alteracoes.map((alteracao) => buscarAssociado(alteracao.cpf_associado))
  );

  return { associados: associadosInativos };
}

// export async function buscarAssociadosInadimplentes() {}
