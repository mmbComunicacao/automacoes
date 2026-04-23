import { buscarAssociadosInativos } from "./hinova.service";
import { criarLeadInativoCRM } from "./powercrm.service";
import { log } from "./log.service";
import { prisma } from "@/lib/prisma";
import {
  AutomacaoTipo,
  IntegracaoTipo,
  SituacaoAssociado,
  SituacaoFinanceira,
} from "@/lib/generated/prisma/enums";

interface ResultadoExecucao {
  total: number;
  sucesso: number;
  falhas: number;
}

/**
 * Executa a automação de inativos para um determinado período.
 */
export async function executarAutomacaoInativos(
  dataInicial: string,
  dataFinal: string,
  execucaoManual: boolean = false
): Promise<ResultadoExecucao> {
  // Log de início da execução
  await log.info({
    automacao: AutomacaoTipo.INATIVOS,
    integracao: IntegracaoTipo.SISTEMA,
    mensagem: `Execução iniciada para o período ${dataInicial} a ${dataFinal}`,
    detalhes: { dataInicial, dataFinal },
    execucaoManual,
  });

  try {
    const { associados } = await buscarAssociadosInativos(dataInicial, dataFinal);

    if (associados.length === 0) {
      await log.info({
        automacao: AutomacaoTipo.INATIVOS,
        integracao: IntegracaoTipo.SISTEMA,
        mensagem: "Nenhum associado inativo encontrado no período.",
        execucaoManual,
      });
      return { total: 0, sucesso: 0, falhas: 0 };
    }

    const resultados = await Promise.all(
      associados.map(async (associado) => {
        try {
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

          // Verifica se já registramos este status hoje para evitar duplicidade em execuções frequentes
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          const statusExistente = await prisma.associadoStatus.findFirst({
            where: {
              associadoId: associadoDb.id,
              situacao: SituacaoAssociado.INATIVO,
              registradoEm: { gte: hoje },
            },
          });

          if (!statusExistente) {
            await prisma.associadoStatus.create({
              data: {
                associadoId: associadoDb.id,
                situacao: SituacaoAssociado.INATIVO,
                situacaoFinanceira: SituacaoFinanceira.DESCONHECIDA,
                fonte: "HINOVA",
                observacao: `Identificado automaticamente no período ${dataInicial} a ${dataFinal}`,
              },
            });
          }

          const { quotationCode } = await criarLeadInativoCRM({
            cpf: associado.cpf,
            nome: associado.nome,
            email: associado.email ?? "",
            telefone_celular: associado.telefone_celular ?? "",
            codigo_cooperativa: associado.codigo_cooperativa ?? "",
          });

          await log.sucesso({
            automacao: AutomacaoTipo.INATIVOS,
            integracao: IntegracaoTipo.POWERCRM,
            mensagem: `Lead criado para ${associado.nome}`,
            detalhes: { quotationCode },
            cpfAssociado: associado.cpf,
            quotationCode,
            execucaoManual,
          });

          return true;
        } catch (err) {
          const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
          await log.erro({
            automacao: AutomacaoTipo.INATIVOS,
            integracao: IntegracaoTipo.POWERCRM,
            mensagem: `Falha ao processar ${associado.nome}: ${mensagem}`,
            cpfAssociado: associado.cpf,
            execucaoManual,
          });
          return false;
        }
      })
    );

    const sucesso = resultados.filter((r) => r).length;
    const falhas = resultados.length - sucesso;

    await log.info({
      automacao: AutomacaoTipo.INATIVOS,
      integracao: IntegracaoTipo.SISTEMA,
      mensagem: `Execução concluída: ${sucesso} sucesso(s), ${falhas} falha(s)`,
      detalhes: { total: resultados.length, sucesso, falhas },
      execucaoManual,
    });

    return { total: resultados.length, sucesso, falhas };
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro interno";
    await log.erro({
      automacao: AutomacaoTipo.INATIVOS,
      integracao: IntegracaoTipo.SISTEMA,
      mensagem: `Erro crítico na execução: ${mensagem}`,
      execucaoManual,
    });
    throw err;
  }
}

/**
 * Placeholder para a automação de inadimplentes.
 */
export async function executarAutomacaoInadimplentes(
  dataInicial: string,
  dataFinal: string,
  execucaoManual: boolean = false
): Promise<ResultadoExecucao> {
  await log.info({
    automacao: AutomacaoTipo.INADIMPLENTES,
    integracao: IntegracaoTipo.SISTEMA,
    mensagem: "Agendamento de Inadimplentes acionado, mas lógica ainda não implementada.",
    execucaoManual,
  });

  return { total: 0, sucesso: 0, falhas: 0 };
}
