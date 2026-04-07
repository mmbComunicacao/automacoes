/**
 * GET  /api/feriados — lista todos os feriados ordenados por data
 * POST /api/feriados — cadastra um novo feriado
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Schema de validação para criação de feriado
const criarFeriadoSchema = z.object({
  // Aceita YYYY-MM-DD (formato do input type="date")
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use YYYY-MM-DD)"),
  descricao: z.string().min(2, "Descrição obrigatória"),
});

// Schema para importação em lote
const importarFeriadosSchema = z.object({
  feriados: z.array(
    z.object({
      data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      descricao: z.string().min(2),
    })
  ),
});

export async function GET() {
  try {
    const feriados = await prisma.feriado.findMany({
      orderBy: { data: "asc" },
    });

    return NextResponse.json(feriados);
  } catch (err) {
    console.error("[GET /api/feriados]", err);
    return NextResponse.json({ erro: "Erro ao buscar feriados" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verifica se é importação em lote ou cadastro individual
    if (Array.isArray(body.feriados)) {
      // Importação em lote
      const parsed = importarFeriadosSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { erro: "Dados inválidos", detalhes: parsed.error.flatten() },
          { status: 400 }
        );
      }

      // Usa createMany com skipDuplicates para ignorar feriados já cadastrados
      const result = await prisma.feriado.createMany({
        data: parsed.data.feriados.map((f) => ({
          data: new Date(f.data),
          descricao: f.descricao,
        })),
        skipDuplicates: true,
      });

      return NextResponse.json({ importados: result.count });
    }

    // Cadastro individual
    const parsed = criarFeriadoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const feriado = await prisma.feriado.create({
      data: {
        data: new Date(parsed.data.data),
        descricao: parsed.data.descricao,
      },
    });

    return NextResponse.json(feriado, { status: 201 });
  } catch (err: unknown) {
    // Código P2002 = violação de unique constraint (feriado duplicado)
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ erro: "Já existe um feriado nesta data" }, { status: 409 });
    }
    console.error("[POST /api/feriados]", err);
    return NextResponse.json({ erro: "Erro ao cadastrar feriado" }, { status: 500 });
  }
}
