import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buscarAssociadosInativos } from "@/lib/services/hinova.service";
import { criarLeadInativoCRM } from "@/lib/services/powercrm.service";

// Schema de validação do body da requisição
const executarInativosSchema = z.object({
  data_inicial: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data inicial inválida (use DD/MM/AAAA)"),
  data_final: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data final inválida (use DD/MM/AAAA)"),
});

// Resultado individual por associado processado
interface ResultadoAssociado {
  cpf: string;
  nome: string;
  status: "sucesso" | "falha";
  quotationCode?: string;
  erro?: string;
}

/**
 * POST /api/inativos/executar
 *
 * Fluxo:
 * 1. Valida o intervalo de datas recebido
 * 2. Busca associados que ficaram inativos no período (Hinova)
 * 3. Para cada associado, cria uma cotação + atividade no PowerCRM
 * 4. Retorna o resumo da execução
 */
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

    const { data_inicial, data_final } = parsed.data;

    // Busca associados inativos no intervalo informado
    const { associados } = await buscarAssociadosInativos(data_inicial, data_final);

    if (associados.length === 0) {
      return NextResponse.json({
        mensagem: "Nenhum associado inativo encontrado no período.",
        total: 0,
        sucesso: 0,
        falhas: 0,
        resultados: [],
      });
    }

    // Processa cada associado em paralelo (com tolerância a falhas individuais)
    const resultados: ResultadoAssociado[] = await Promise.all(
      associados.map(async (associado): Promise<ResultadoAssociado> => {
        try {
          const { quotationCode } = await criarLeadInativoCRM(associado);
          return {
            cpf: associado.cpf,
            nome: associado.nome,
            status: "sucesso",
            quotationCode,
          };
        } catch (err) {
          const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
          console.error(`[Inativos] Falha ao processar ${associado.cpf}:`, mensagem);
          return {
            cpf: associado.cpf,
            nome: associado.nome,
            status: "falha",
            erro: mensagem,
          };
        }
      })
    );

    // Consolida o resumo
    const sucesso = resultados.filter((r) => r.status === "sucesso").length;
    const falhas = resultados.filter((r) => r.status === "falha").length;

    return NextResponse.json({
      mensagem: `Execução concluída: ${sucesso} sucesso(s), ${falhas} falha(s).`,
      total: resultados.length,
      sucesso,
      falhas,
      resultados,
    });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro interno do servidor";
    console.error("[Inativos] Erro na execução:", mensagem);
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
