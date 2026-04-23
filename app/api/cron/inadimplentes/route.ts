import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  isBusinessDay,
  isWithinWindow,
  hasEnoughTimePassed,
} from "@/lib/utils/scheduler";
import { executarAutomacaoInadimplentes } from "@/lib/services/automacao.service";

export async function GET(req: NextRequest) {
  try {
    // 1. Validação de Segurança (Vercel Cron Secret)
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    // 2. Busca configurações
    const registros = await prisma.configuracao.findMany({
      where: {
        chave: {
          in: [
            "intervalo_inadimplentes",
            "executar_apenas_uteis_inadimplentes",
            "hora_inicio_inadimplentes",
            "hora_fim_inadimplentes",
          ],
        },
      },
    });

    const config = Object.fromEntries(
      registros.map((r) => [r.chave, JSON.parse(r.valor)])
    );

    const now = new Date();

    // 3. Validações de agendamento
    
    // Dia útil?
    if (config.executar_apenas_uteis_inadimplentes) {
      const util = await isBusinessDay(now);
      if (!util) {
        return NextResponse.json({ skip: "Fim de semana ou feriado" });
      }
    }

    // Janela de horário?
    const dentroJanela = isWithinWindow(
      now,
      config.hora_inicio_inadimplentes || "08:00",
      config.hora_fim_inadimplentes || "17:00"
    );
    if (!dentroJanela) {
      return NextResponse.json({ skip: "Fora da janela de horário" });
    }

    // Intervalo de tempo?
    const passouTempo = await hasEnoughTimePassed(
      "INADIMPLENTES",
      parseInt(config.intervalo_inadimplentes || "60")
    );
    if (!passouTempo) {
      return NextResponse.json({ skip: "Intervalo ainda não atingido" });
    }

    // 4. Execução
    const hoje = format(now, "dd/MM/yyyy");
    const resultado = await executarAutomacaoInadimplentes(hoje, hoje, false);

    return NextResponse.json({
      status: "Pendente (Lógica não implementada)",
      ...resultado,
    });
  } catch (err) {
    console.error("[CRON Inadimplentes]", err);
    return NextResponse.json(
      { status: "Erro", erro: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
