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
import { buscarAssociadosInativos } from "@/lib/services/hinova.service";
import { criarLeadInativoCRM } from "@/lib/services/powercrm.service";
import { log } from "@/lib/services/log.service";
import { prisma } from "@/lib/prisma";
import {
  AutomacaoTipo,
  IntegracaoTipo,
  SituacaoAssociado,
  SituacaoFinanceira,
} from "@/lib/generated/prisma/enums";
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

    // Log de início da execução
    await log.info({
      automacao: AutomacaoTipo.INATIVOS,
      integracao: IntegracaoTipo.SISTEMA,
      mensagem: `Execução iniciada para o período ${data_inicial} a ${data_final}`,
      detalhes: { data_inicial, data_final },
      execucaoManual: execucao_manual,
    });

    // Busca associados inativos no intervalo informado via Hinova
    let associados: Awaited<ReturnType<typeof buscarAssociadosInativos>>["associados"];
    try {
      const resultado = await buscarAssociadosInativos(data_inicial, data_final);
      associados = resultado.associados;

      await log.info({
        automacao: AutomacaoTipo.INATIVOS,
        integracao: IntegracaoTipo.HINOVA,
        mensagem: `Hinova retornou ${associados.length} associado(s) inativo(s) no período`,
        detalhes: { total: associados.length, data_inicial, data_final },
        execucaoManual: execucao_manual,
      });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro ao buscar na Hinova";
      await log.erro({
        automacao: AutomacaoTipo.INATIVOS,
        integracao: IntegracaoTipo.HINOVA,
        mensagem: `Falha ao buscar associados inativos: ${mensagem}`,
        detalhes: { data_inicial, data_final, erro: mensagem },
        execucaoManual: execucao_manual,
      });
      return NextResponse.json({ erro: mensagem }, { status: 500 });
    }

    if (associados.length === 0) {
      await log.info({
        automacao: AutomacaoTipo.INATIVOS,
        integracao: IntegracaoTipo.SISTEMA,
        mensagem: "Nenhum associado inativo encontrado no período. Execução encerrada.",
        execucaoManual: execucao_manual,
      });
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
          // Upsert do associado no banco (cria ou atualiza pelo CPF)
          // Os campos da Hinova usam snake_case: cpf, nome, email, telefone_celular, codigo_cooperativa
          const associadoDb = await prisma.associado.upsert({
            where: { cpf: associado.cpf },
            create: {
              cpf: associado.cpf,
              nome: associado.nome,
              email: associado.email ?? null,
              telefoneCelular: associado.telefone_celular ?? null,
              codigoCooperativa: associado.codigo_cooperativa ?? null,
            },
            update: {
              nome: associado.nome,
              email: associado.email ?? null,
              telefoneCelular: associado.telefone_celular ?? null,
              codigoCooperativa: associado.codigo_cooperativa ?? null,
            },
          });

          // Registra o status INATIVO no histórico
          await prisma.associadoStatus.create({
            data: {
              associadoId: associadoDb.id,
              situacao: SituacaoAssociado.INATIVO,
              situacaoFinanceira: SituacaoFinanceira.DESCONHECIDA,
              fonte: "HINOVA",
              observacao: `Identificado como inativo no período ${data_inicial} a ${data_final}`,
            },
          });

          // Cria cotação + atividade no PowerCRM
          // Mapeia os campos da Hinova (snake_case) para o formato esperado pelo PowerCRM
          const { quotationCode } = await criarLeadInativoCRM({
            cpf: associado.cpf,
            nome: associado.nome,
            email: associado.email ?? "",
            telefone_celular: associado.telefone_celular ?? "",
            codigo_cooperativa: associado.codigo_cooperativa ?? "",
          });

          // Log de sucesso individual
          await log.sucesso({
            automacao: AutomacaoTipo.INATIVOS,
            integracao: IntegracaoTipo.POWERCRM,
            mensagem: `Lead criado com sucesso para ${associado.nome}`,
            detalhes: { quotationCode },
            cpfAssociado: associado.cpf,
            quotationCode,
            execucaoManual: execucao_manual,
          });

          return { cpf: associado.cpf, nome: associado.nome, status: "sucesso", quotationCode };
        } catch (err) {
          const mensagem = err instanceof Error ? err.message : "Erro desconhecido";

          // Log de falha individual
          await log.erro({
            automacao: AutomacaoTipo.INATIVOS,
            integracao: IntegracaoTipo.POWERCRM,
            mensagem: `Falha ao processar ${associado.nome}: ${mensagem}`,
            detalhes: { erro: mensagem },
            cpfAssociado: associado.cpf,
            execucaoManual: execucao_manual,
          });

          return { cpf: associado.cpf, nome: associado.nome, status: "falha", erro: mensagem };
        }
      })
    );

    // Consolida o resumo
    const sucesso = resultados.filter((r) => r.status === "sucesso").length;
    const falhas = resultados.filter((r) => r.status === "falha").length;

    // Log de conclusão
    await log.info({
      automacao: AutomacaoTipo.INATIVOS,
      integracao: IntegracaoTipo.SISTEMA,
      mensagem: `Execução concluída: ${sucesso} sucesso(s), ${falhas} falha(s) de ${resultados.length} total`,
      detalhes: { total: resultados.length, sucesso, falhas },
      execucaoManual: execucao_manual,
    });

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

    await log.erro({
      automacao: AutomacaoTipo.INATIVOS,
      integracao: IntegracaoTipo.SISTEMA,
      mensagem: `Erro crítico na execução: ${mensagem}`,
      detalhes: { erro: mensagem },
    });

    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
