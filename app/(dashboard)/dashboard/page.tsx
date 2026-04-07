"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  UserX,
  XCircle,
  ArrowRight,
  Clock,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// --- Tipos ---

interface MetricasModulo {
  total: number;
  sucesso?: number;
  alertas?: number;
  falhas: number;
  ultimaExecucao: string | null;
}

interface MetricasDashboard {
  total: number;
  sucesso: number;
  falhas: number;
  taxaSucesso: number;
  modulos: {
    inativos: MetricasModulo;
    inadimplentes: MetricasModulo;
  };
  logsPorDia: Array<{ criadoEm: string; nivel: string; _count: { id: number } }>;
  logsPorMes: Array<{ criadoEm: string; nivel: string }>;
}

// --- Helpers ---

/** Formata data ISO para exibição legível no fuso de Brasília */
function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Agrega os logs brutos por dia da semana para o gráfico de área */
function agruparPorDia(
  logs: Array<{ criadoEm: string; nivel: string; _count: { id: number } }>
): Array<{ dia: string; sucesso: number; falhas: number }> {
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const hoje = new Date();
  const resultado: Record<string, { dia: string; sucesso: number; falhas: number }> = {};

  // Inicializa os últimos 7 dias
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const chave = d.toISOString().split("T")[0];
    resultado[chave] = { dia: diasSemana[d.getDay()], sucesso: 0, falhas: 0 };
  }

  // Preenche com os dados reais
  for (const log of logs) {
    const chave = new Date(log.criadoEm).toISOString().split("T")[0];
    if (resultado[chave]) {
      if (log.nivel === "SUCESSO") resultado[chave].sucesso += log._count.id;
      if (log.nivel === "ERRO") resultado[chave].falhas += log._count.id;
    }
  }

  return Object.values(resultado);
}

/** Agrega os logs brutos por mês para o gráfico de barras */
function agruparPorMes(
  logs: Array<{ criadoEm: string; nivel: string }>
): Array<{ mes: string; sucesso: number; falhas: number }> {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const resultado: Record<string, { mes: string; sucesso: number; falhas: number }> = {};

  // Inicializa os últimos 6 meses
  const hoje = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    resultado[chave] = { mes: meses[d.getMonth()], sucesso: 0, falhas: 0 };
  }

  for (const log of logs) {
    const d = new Date(log.criadoEm);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (resultado[chave]) {
      if (log.nivel === "SUCESSO") resultado[chave].sucesso++;
      if (log.nivel === "ERRO") resultado[chave].falhas++;
    }
  }

  return Object.values(resultado);
}

// --- Skeleton dos cards ---
function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [dados, setDados] = useState<MetricasDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);

  const buscarMetricas = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/dashboard/metricas");
      if (!res.ok) throw new Error("Falha ao buscar métricas");
      const data = await res.json();
      setDados(data);
    } catch {
      // Mantém dados anteriores em caso de erro de rede
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarMetricas();
  }, [buscarMetricas]);

  // Dados processados para os gráficos
  const dadosDia = dados ? agruparPorDia(dados.logsPorDia) : [];
  const dadosMes = dados ? agruparPorMes(dados.logsPorMes) : [];
  const distribuicao = dados
    ? [
        { name: "Sucesso", value: dados.sucesso, color: "#10b981" },
        { name: "Falhas", value: dados.falhas, color: "#ef4444" },
      ]
    : [];

  // Configuração dos módulos de automação
  const modulos = [
    {
      id: "inativos",
      titulo: "Clientes Inativos",
      descricao: "Monitoramento de situação inativa",
      icon: UserX,
      iconBg: "bg-blue-100 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400",
      status: "Ativo",
      total: dados?.modulos.inativos.total ?? 0,
      sucesso: dados?.modulos.inativos.sucesso ?? 0,
      falhas: dados?.modulos.inativos.falhas ?? 0,
      ultimaExecucao: dados?.modulos.inativos.ultimaExecucao ?? null,
      href: "/inativos",
    },
    {
      id: "inadimplentes",
      titulo: "Inadimplência",
      descricao: "Monitoramento de boletos vencidos",
      icon: AlertCircle,
      iconBg: "bg-red-100 dark:bg-red-950",
      iconColor: "text-red-500 dark:text-red-400",
      status: "Ativo",
      total: dados?.modulos.inadimplentes.total ?? 0,
      alertas: dados?.modulos.inadimplentes.sucesso ?? 0,
      falhas: dados?.modulos.inadimplentes.falhas ?? 0,
      ultimaExecucao: dados?.modulos.inadimplentes.ultimaExecucao ?? null,
      href: "/inadimplentes",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral de todas as automações do sistema
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={buscarMetricas}
          disabled={carregando}
          title="Atualizar dados"
        >
          {carregando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Cards de módulos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {modulos.map((modulo) => {
          const Icon = modulo.icon;
          return (
            <Card
              key={modulo.id}
              className="group relative overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${modulo.iconBg}`}>
                      <Icon className={`h-5 w-5 ${modulo.iconColor}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{modulo.titulo}</CardTitle>
                      <p className="text-xs text-muted-foreground">{modulo.descricao}</p>
                    </div>
                  </div>
                  <Link href={modulo.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <Badge className="gap-1 bg-blue-600 text-white hover:bg-blue-700">
                    <Activity className="h-3 w-3" />
                    {modulo.status}
                  </Badge>
                </div>

                {/* Métricas do módulo */}
                {carregando ? (
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-7 w-12 mb-1" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{modulo.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    {"sucesso" in modulo ? (
                      <>
                        <div>
                          <p className="text-2xl font-bold text-emerald-500">{modulo.sucesso}</p>
                          <p className="text-xs text-muted-foreground">Sucesso</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-500">{modulo.falhas}</p>
                          <p className="text-xs text-muted-foreground">Falhas</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-2xl font-bold text-amber-500">{modulo.alertas}</p>
                          <p className="text-xs text-muted-foreground">Alertas</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-500">{modulo.falhas}</p>
                          <p className="text-xs text-muted-foreground">Falhas</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Última execução */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <Clock className="h-3 w-3" />
                  {carregando ? (
                    <Skeleton className="h-3 w-36" />
                  ) : modulo.ultimaExecucao ? (
                    <span>{formatarData(modulo.ultimaExecucao)}</span>
                  ) : (
                    <span className="italic">Nenhuma execução registrada</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cards de métricas consolidadas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {carregando ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{dados?.total ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Todas as notificações</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sucesso Total</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-500">{dados?.sucesso ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Enviadas com sucesso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Falhas Totais</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-500">{dados?.falhas ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Notificações que falharam</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-500">{dados?.taxaSucesso ?? 0}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Eficiência geral</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Gráfico de área — notificações por dia */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Notificações por Dia</CardTitle>
            <p className="text-xs text-muted-foreground">Sucesso vs. Falhas nos últimos 7 dias</p>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dadosDia}>
                  <defs>
                    <linearGradient id="gradSucesso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradFalhas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="sucesso"
                    name="Sucesso"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gradSucesso)"
                  />
                  <Area
                    type="monotone"
                    dataKey="falhas"
                    name="Falhas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#gradFalhas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de pizza — distribuição de status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Status</CardTitle>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {carregando ? (
              <Skeleton className="h-[220px] w-full rounded-full" />
            ) : dados?.total === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="text-sm">Sem dados ainda</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={distribuicao}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras — evolução mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Mensal</CardTitle>
          <p className="text-xs text-muted-foreground">
            Total de notificações por mês nos últimos 6 meses
          </p>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <Skeleton className="h-[200px] w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dadosMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="sucesso" name="Sucesso" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="falhas" name="Falhas" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
