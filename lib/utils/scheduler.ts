import { prisma } from "@/lib/prisma";
import { isWeekend, format } from "date-fns";

/**
 * Verifica se a data fornecida é um dia útil (não é fim de semana nem feriado cadastrado).
 */
export async function isBusinessDay(date: Date): Promise<boolean> {
  // 1. Verifica se é fim de semana (Sábado ou Domingo)
  if (isWeekend(date)) {
    return false;
  }

  // 2. Verifica se a data está cadastrada na tabela de feriados
  // Buscamos apenas pela data (YYYY-MM-DD) ignorando a hora
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const feriado = await prisma.feriado.findFirst({
    where: {
      data: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return !feriado;
}

/**
 * Verifica se a hora atual está dentro da janela permitida (HH:mm).
 */
export function isWithinWindow(now: Date, start: string, end: string): boolean {
  const currentStr = format(now, "HH:mm");
  return currentStr >= start && currentStr <= end;
}

/**
 * Verifica se já passou tempo suficiente desde o último log de sucesso/erro
 * para rodar novamente, baseado no intervalo (minutos).
 */
export async function hasEnoughTimePassed(
  automacao: "INATIVOS" | "INADIMPLENTES",
  intervaloMinutos: number
): Promise<boolean> {
  const lastLog = await prisma.log.findFirst({
    where: {
      automacao,
      execucaoManual: false,
      nivel: { in: ["SUCESSO", "ERRO"] },
    },
    orderBy: { criadoEm: "desc" },
  });

  if (!lastLog) return true;

  const diffMs = new Date().getTime() - lastLog.criadoEm.getTime();
  const diffMin = diffMs / (1000 * 60);

  return diffMin >= intervaloMinutos;
}
