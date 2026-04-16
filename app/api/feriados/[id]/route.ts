/**
 * DELETE /api/feriados/[id] — remove um feriado pelo ID
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.feriado.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    // Código P2025 = registro não encontrado
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2025") {
      return NextResponse.json({ erro: "Feriado não encontrado" }, { status: 404 });
    }
    console.error("[DELETE /api/feriados/[id]]", err);
    return NextResponse.json({ erro: "Erro ao remover feriado" }, { status: 500 });
  }
}
