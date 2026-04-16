/**
 * GET /api/inativos/metricas
 *
 * Retorna as métricas da automação de clientes inativos a partir dos logs reais.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NivelLog, AutomacaoTipo } from "@/lib/generated/prisma/enums";

export async function GET() {
  try {
    const [total, sucesso, falhas, totalAssociados, ultimoLog] = await Promise.all([
      // Total de logs de sucesso + erro (exclui INFO que são logs de sistema)
      prisma.log.count({
        where: {
          automacao: AutomacaoTipo.INATIVOS,
          nivel: { in: [NivelLog.SUCESSO, NivelLog.ERRO] },
        },
      }),
      prisma.log.count({
        where: { automacao: AutomacaoTipo.INATIVOS, nivel: NivelLog.SUCESSO },
      }),
      prisma.log.count({
        where: { automacao: AutomacaoTipo.INATIVOS, nivel: NivelLog.ERRO },
      }),
      // CPFs únicos processados = controle de duplicidade
      prisma.log.findMany({
        where: {
          automacao: AutomacaoTipo.INATIVOS,
          cpfAssociado: { not: null },
        },
        select: { cpfAssociado: true },
        distinct: ["cpfAssociado"],
      }),
      prisma.log.findFirst({
        where: { automacao: AutomacaoTipo.INATIVOS },
        orderBy: { criadoEm: "desc" },
        select: { criadoEm: true },
      }),
    ]);

    return NextResponse.json({
      total,
      sucesso,
      falhas,
      duplicatas: totalAssociados.length, // CPFs únicos processados
      ultimaExecucao: ultimoLog?.criadoEm ?? null,
    });
  } catch (err) {
    console.error("[GET /api/inativos/metricas]", err);
    return NextResponse.json({ erro: "Erro ao buscar métricas" }, { status: 500 });
  }
}
