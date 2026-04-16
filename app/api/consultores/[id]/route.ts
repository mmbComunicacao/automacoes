/**
 * PATCH  /api/consultores/[id] — atualiza dados ou status de um consultor
 * DELETE /api/consultores/[id] — remove um consultor pelo ID
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Schema parcial — todos os campos são opcionais no PATCH
const atualizarConsultorSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.string().email().optional(),
  codigoPowerCRM: z.string().min(1).optional(),
  idCooperativa: z.string().min(1).optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = atualizarConsultorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const consultor = await prisma.consultor.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(consultor);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2025") {
      return NextResponse.json({ erro: "Consultor não encontrado" }, { status: 404 });
    }
    console.error("[PATCH /api/consultores/[id]]", err);
    return NextResponse.json({ erro: "Erro ao atualizar consultor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.consultor.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2025") {
      return NextResponse.json({ erro: "Consultor não encontrado" }, { status: 404 });
    }
    console.error("[DELETE /api/consultores/[id]]", err);
    return NextResponse.json({ erro: "Erro ao remover consultor" }, { status: 500 });
  }
}
