/**
 * GET /api/configuracoes  — retorna todas as configurações do sistema
 * PUT /api/configuracoes  — salva/atualiza configurações (upsert por chave)
 *
 * As configurações são armazenadas como pares chave-valor no banco.
 * O valor é serializado em JSON para suportar qualquer tipo de dado.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Chaves de configuração conhecidas pelo sistema
const CHAVES_VALIDAS = [
  "notificar_sucesso",
  "notificar_falha",
  "notificar_execucao_manual",
  "intervalo_inativos",
  "executar_apenas_uteis_inativos",
  "hora_inicio_inativos",
  "hora_fim_inativos",
  "intervalo_inadimplentes",
  "executar_apenas_uteis_inadimplentes",
  "hora_inicio_inadimplentes",
  "hora_fim_inadimplentes",
] as const;

// Schema para salvar configurações em lote
const salvarConfiguracoesSchema = z.record(
  z.enum(CHAVES_VALIDAS),
  z.union([z.string(), z.number(), z.boolean()])
);

export async function GET() {
  try {
    const registros = await prisma.configuracao.findMany();

    // Converte o array de {chave, valor} para um objeto plano
    // O valor é deserializado do JSON string
    const config = Object.fromEntries(
      registros.map((r) => {
        try {
          return [r.chave, JSON.parse(r.valor)];
        } catch {
          return [r.chave, r.valor];
        }
      })
    );

    return NextResponse.json(config);
  } catch (err) {
    console.error("[GET /api/configuracoes]", err);
    return NextResponse.json({ erro: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = salvarConfiguracoesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Upsert de cada configuração — cria se não existir, atualiza se existir
    const operacoes = Object.entries(parsed.data).map(([chave, valor]) =>
      prisma.configuracao.upsert({
        where: { chave },
        create: { chave, valor: JSON.stringify(valor) },
        update: { valor: JSON.stringify(valor) },
      })
    );

    await Promise.all(operacoes);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/configuracoes]", err);
    return NextResponse.json({ erro: "Erro ao salvar configurações" }, { status: 500 });
  }
}
