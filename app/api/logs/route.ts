/**
 * GET /api/logs
 *
 * Busca logs do banco com filtros opcionais.
 * Query params:
 *   - automacao : AutomacaoTipo (INATIVOS | INADIMPLENTES | SISTEMA)
 *   - integracao: IntegracaoTipo (HINOVA | POWERCRM | SISTEMA)
 *   - nivel     : NivelLog (INFO | SUCESSO | AVISO | ERRO)
 *   - page      : número da página (default: 1)
 *   - limit     : itens por página (default: 50, max: 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  AutomacaoTipo,
  IntegracaoTipo,
  NivelLog,
} from "@/lib/generated/prisma/enums";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // Extrai e valida os filtros da query string
    const automacao = searchParams.get("automacao") as AutomacaoTipo | null;
    const integracao = searchParams.get("integracao") as IntegracaoTipo | null;
    const nivel = searchParams.get("nivel") as NivelLog | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
    );
    const skip = (page - 1) * limit;

    // Monta o filtro dinâmico
    const where = {
      ...(automacao && { automacao }),
      ...(integracao && { integracao }),
      ...(nivel && { nivel }),
    };

    // Busca logs e total em paralelo para performance
    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy: { criadoEm: "desc" },
        skip,
        take: limit,
      }),
      prisma.log.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/logs] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar logs" },
      { status: 500 }
    );
  }
}
