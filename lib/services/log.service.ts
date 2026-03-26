/**
 * lib/services/log.service.ts
 *
 * Serviço centralizado para escrita de logs no banco de dados.
 * Todas as automações devem usar este serviço para registrar eventos,
 * garantindo consistência e rastreabilidade.
 */

import { prisma } from "@/lib/prisma";
import {
  AutomacaoTipo,
  IntegracaoTipo,
  NivelLog,
} from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";

// Tipo para os dados de criação de um log
export interface CriarLogParams {
  automacao: AutomacaoTipo;
  integracao: IntegracaoTipo;
  nivel: NivelLog;
  mensagem: string;
  // Prisma 7: campos JSON devem usar InputJsonValue (não Record<string, unknown>)
  detalhes?: Prisma.InputJsonValue;
  cpfAssociado?: string;
  quotationCode?: string;
  execucaoManual?: boolean;
}

/**
 * Registra um log no banco de dados.
 * Não lança exceção — em caso de falha, apenas imprime no console
 * para não interromper o fluxo principal da automação.
 */
export async function registrarLog(params: CriarLogParams): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        automacao: params.automacao,
        integracao: params.integracao,
        nivel: params.nivel,
        mensagem: params.mensagem,
        // Omite o campo quando undefined — o Prisma usa o default (null) do banco
        ...(params.detalhes !== undefined && { detalhes: params.detalhes }),
        cpfAssociado: params.cpfAssociado ?? null,
        quotationCode: params.quotationCode ?? null,
        execucaoManual: params.execucaoManual ?? false,
      },
    });
  } catch (error) {
    // Log de fallback no console para não quebrar a automação
    console.error("[log.service] Falha ao registrar log no banco:", error);
  }
}

/**
 * Atalhos tipados para cada nível de log — reduz verbosidade no código.
 */
export const log = {
  info: (params: Omit<CriarLogParams, "nivel">) =>
    registrarLog({ ...params, nivel: NivelLog.INFO }),

  sucesso: (params: Omit<CriarLogParams, "nivel">) =>
    registrarLog({ ...params, nivel: NivelLog.SUCESSO }),

  aviso: (params: Omit<CriarLogParams, "nivel">) =>
    registrarLog({ ...params, nivel: NivelLog.AVISO }),

  erro: (params: Omit<CriarLogParams, "nivel">) =>
    registrarLog({ ...params, nivel: NivelLog.ERRO }),
};
