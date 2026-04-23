/**
 * POST /api/inativos/executar
 *
 * Fluxo completo da automação de clientes inativos:
 * 1. Valida o intervalo de datas recebido (DD/MM/AAAA)
 * 2. Registra log de início da execução
 * 3. Busca associados inativos no período via Hinova
 * 4. Para cada associado:
 *    a. Upsert na tabela `associados` (cria ou atualiza pelo CPF)
 *    b. Registra o status INATIVO em `associado_status`
 *    c. Cria cotação + atividade no PowerCRM
 *    d. Registra log de sucesso ou falha
 * 5. Registra log de conclusão com resumo
 * 6. Retorna o resumo da execução
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executarAutomacaoInativos } from "@/lib/services/automacao.service";
import { log } from "@/lib/services/log.service";
import { AutomacaoTipo, IntegracaoTipo } from "@/lib/generated/prisma/enums";
// Nota: o caminho @/lib/generated/prisma/enums é resolvido pelo Next.js via alias @/*

// Schema de validação do body da requisição
const executarInativosSchema = z.object({
  data_inicial: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data inicial inválida (use DD/MM/AAAA)"),
  data_final: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data final inválida (use DD/MM/AAAA)"),
  execucao_manual: z.boolean().optional().default(true),
});

// Resultado individual por associado processado
interface ResultadoAssociado {
  cpf: string;
  nome: string;
  status: "sucesso" | "falha";
  quotationCode?: string;
  erro?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Valida os dados de entrada
    const parsed = executarInativosSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { erro: "Dados inválidos", detalhes: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data_inicial, data_final, execucao_manual } = parsed.data;

    const resultado = await executarAutomacaoInativos(data_inicial, data_final, execucao_manual);

    return NextResponse.json({
      mensagem: `Execução concluída: ${resultado.sucesso} sucesso(s), ${resultado.falhas} falha(s).`,
      ...resultado,
    });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro interno do servidor";
    console.error("[Inativos] Erro na execução:", mensagem);

    await log.erro({
      automacao: AutomacaoTipo.INATIVOS,
      integracao: IntegracaoTipo.SISTEMA,
      mensagem: `Erro crítico na execução: ${mensagem}`,
      detalhes: { erro: mensagem },
    });

    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
