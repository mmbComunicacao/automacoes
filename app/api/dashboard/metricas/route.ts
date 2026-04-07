/**
 * GET /api/dashboard/metricas
 *
 * Retorna as métricas consolidadas do dashboard a partir dos logs reais do banco.
 * Calcula: total, sucesso, falhas, taxa de sucesso, evolução por dia e por mês.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NivelLog, AutomacaoTipo } from "@/lib/generated/prisma/enums";

export async function GET() {
  try {
    // Contagens globais por nível de log
    const [totalSucesso, totalFalhas, totalInfo] = await Promise.all([
      prisma.log.count({ where: { nivel: NivelLog.SUCESSO } }),
      prisma.log.count({ where: { nivel: NivelLog.ERRO } }),
      prisma.log.count({ where: { nivel: NivelLog.INFO } }),
    ]);

    const total = totalSucesso + totalFalhas;
    const taxaSucesso = total > 0 ? Math.round((totalSucesso / total) * 100) : 0;

    // Métricas por automação
    const [totalInativos, sucessoInativos, falhasInativos, ultimoLogInativos] =
      await Promise.all([
        prisma.log.count({
          where: { automacao: AutomacaoTipo.INATIVOS, nivel: { in: [NivelLog.SUCESSO, NivelLog.ERRO] } },
        }),
        prisma.log.count({
          where: { automacao: AutomacaoTipo.INATIVOS, nivel: NivelLog.SUCESSO },
        }),
        prisma.log.count({
          where: { automacao: AutomacaoTipo.INATIVOS, nivel: NivelLog.ERRO },
        }),
        prisma.log.findFirst({
          where: { automacao: AutomacaoTipo.INATIVOS },
          orderBy: { criadoEm: "desc" },
          select: { criadoEm: true },
        }),
      ]);

    const [totalInadimplentes, sucessoInadimplentes, falhasInadimplentes, ultimoLogInadimplentes] =
      await Promise.all([
        prisma.log.count({
          where: { automacao: AutomacaoTipo.INADIMPLENTES, nivel: { in: [NivelLog.SUCESSO, NivelLog.ERRO] } },
        }),
        prisma.log.count({
          where: { automacao: AutomacaoTipo.INADIMPLENTES, nivel: NivelLog.SUCESSO },
        }),
        prisma.log.count({
          where: { automacao: AutomacaoTipo.INADIMPLENTES, nivel: NivelLog.ERRO },
        }),
        prisma.log.findFirst({
          where: { automacao: AutomacaoTipo.INADIMPLENTES },
          orderBy: { criadoEm: "desc" },
          select: { criadoEm: true },
        }),
      ]);

    // Evolução dos últimos 7 dias (logs de sucesso e erro por dia)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
    seteDiasAtras.setHours(0, 0, 0, 0);

    const logsPorDia = await prisma.log.groupBy({
      by: ["criadoEm", "nivel"],
      where: {
        criadoEm: { gte: seteDiasAtras },
        nivel: { in: [NivelLog.SUCESSO, NivelLog.ERRO] },
      },
      _count: { id: true },
    });

    // Evolução dos últimos 6 meses
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
    seisMesesAtras.setDate(1);
    seisMesesAtras.setHours(0, 0, 0, 0);

    const logsPorMes = await prisma.log.findMany({
      where: {
        criadoEm: { gte: seisMesesAtras },
        nivel: { in: [NivelLog.SUCESSO, NivelLog.ERRO] },
      },
      select: { criadoEm: true, nivel: true },
    });

    return NextResponse.json({
      // Métricas globais
      total,
      sucesso: totalSucesso,
      falhas: totalFalhas,
      info: totalInfo,
      taxaSucesso,

      // Métricas por módulo
      modulos: {
        inativos: {
          total: totalInativos,
          sucesso: sucessoInativos,
          falhas: falhasInativos,
          ultimaExecucao: ultimoLogInativos?.criadoEm ?? null,
        },
        inadimplentes: {
          total: totalInadimplentes,
          sucesso: sucessoInadimplentes,
          falhas: falhasInadimplentes,
          ultimaExecucao: ultimoLogInadimplentes?.criadoEm ?? null,
        },
      },

      // Dados brutos para os gráficos (o frontend agrupa por dia/mês)
      logsPorDia,
      logsPorMes,
    });
  } catch (err) {
    console.error("[GET /api/dashboard/metricas]", err);
    return NextResponse.json({ erro: "Erro ao buscar métricas" }, { status: 500 });
  }
}
