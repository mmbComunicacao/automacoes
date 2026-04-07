/**
 * GET  /api/consultores — lista todos os consultores
 * POST /api/consultores — cadastra um novo consultor
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Schema de validação para criação de consultor
const criarConsultorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  codigoPowerCRM: z.string().min(1, "Código PowerCRM obrigatório"),
  idCooperativa: z.string().min(1, "ID Cooperativa obrigatório"),
});

export async function GET() {
  try {
    const consultores = await prisma.consultor.findMany({
      orderBy: { criadoEm: "desc" },
    });

    return NextResponse.json(consultores);
  } catch (err) {
    console.error("[GET /api/consultores]", err);
    return NextResponse.json({ erro: "Erro ao buscar consultores" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = criarConsultorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const consultor = await prisma.consultor.create({
      data: {
        nome: parsed.data.nome,
        email: parsed.data.email,
        codigoPowerCRM: parsed.data.codigoPowerCRM,
        idCooperativa: parsed.data.idCooperativa,
        ativo: true,
      },
    });

    return NextResponse.json(consultor, { status: 201 });
  } catch (err: unknown) {
    // Código P2002 = e-mail duplicado
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ erro: "Já existe um consultor com este e-mail" }, { status: 409 });
    }
    console.error("[POST /api/consultores]", err);
    return NextResponse.json({ erro: "Erro ao cadastrar consultor" }, { status: 500 });
  }
}
