"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  UserX,
  XCircle,
  ArrowRight,
  Clock,
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

// --- Dados mockados para visualização ---
// Futuramente substituir por dados reais via API Route
const notificacoesPorDia = [
  { dia: "Seg", sucesso: 28, falhas: 2 },
  { dia: "Ter", sucesso: 35, falhas: 1 },
  { dia: "Qua", sucesso: 42, falhas: 3 },
  { dia: "Qui", sucesso: 31, falhas: 0 },
  { dia: "Sex", sucesso: 55, falhas: 7 },
  { dia: "Sab", sucesso: 0, falhas: 0 },
  { dia: "Dom", sucesso: 0, falhas: 0 },
];

const notificacoesPorMes = [
  { mes: "Jan", total: 180 },
  { mes: "Fev", total: 210 },
  { mes: "Mar", total: 204 },
  { mes: "Abr", total: 0 },
  { mes: "Mai", total: 0 },
  { mes: "Jun", total: 0 },
];

const distribuicaoStatus = [
  { name: "Sucesso", value: 191, color: "#10b981" },
  { name: "Falhas", value: 13, color: "#ef4444" },
];

// Dados dos módulos de automação
const modulos = [
  {
    id: "inativos",
    titulo: "Clientes Inativos",
    descricao: "Monitoramento de situação inativa",
    icon: UserX,
    iconBg: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    status: "Ativo",
    total: 204,
    sucesso: 191,
    falhas: 13,
    ultimaExecucao: "2026-03-26T16:22:09.665Z",
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
    total: 0,
    alertas: 0,
    falhas: 0,
    ultimaExecucao: "2026-03-27T13:00:00.000Z",
    href: "/inadimplentes",
  },
];

// Métricas consolidadas do sistema
const metricas = [
  {
    titulo: "Total Geral",
    valor: "204",
    descricao: "Todas as notificações",
    icon: Activity,
    cor: "text-foreground",
  },
  {
    titulo: "Sucesso Total",
    valor: "191",
    descricao: "Enviadas com sucesso",
    icon: CheckCircle2,
    cor: "text-emerald-500",
  },
  {
    titulo: "Falhas Totais",
    valor: "13",
    descricao: "Notificações que falharam",
    icon: XCircle,
    cor: "text-red-500",
  },
  {
    titulo: "Taxa de Sucesso",
    valor: "94%",
    descricao: "Eficiência geral",
    icon: TrendingUp,
    cor: "text-blue-500",
  },
];

// Formata a data ISO para exibição legível no fuso de Brasília
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

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral de todas as automações do sistema
        </p>
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
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${modulo.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${modulo.iconColor}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {modulo.titulo}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {modulo.descricao}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={modulo.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Status
                  </span>
                  <Badge className="gap-1 bg-blue-600 text-white hover:bg-blue-700">
                    <Activity className="h-3 w-3" />
                    {modulo.status}
                  </Badge>
                </div>

                {/* Métricas do módulo */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{modulo.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  {"sucesso" in modulo ? (
                    <>
                      <div>
                        <p className="text-2xl font-bold text-emerald-500">
                          {modulo.sucesso}
                        </p>
                        <p className="text-xs text-muted-foreground">Sucesso</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-500">
                          {modulo.falhas}
                        </p>
                        <p className="text-xs text-muted-foreground">Falhas</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-2xl font-bold text-amber-500">
                          {modulo.alertas}
                        </p>
                        <p className="text-xs text-muted-foreground">Alertas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-500">
                          {modulo.falhas}
                        </p>
                        <p className="text-xs text-muted-foreground">Falhas</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Última execução */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <Clock className="h-3 w-3" />
                  {formatarData(modulo.ultimaExecucao)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cards de métricas consolidadas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metricas.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.titulo}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {m.titulo}
                </CardTitle>
                <Icon className={`h-4 w-4 ${m.cor}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${m.cor}`}>{m.valor}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.descricao}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Gráfico de área — notificações por dia */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Notificações por Dia</CardTitle>
            <p className="text-xs text-muted-foreground">
              Sucesso vs. Falhas na semana atual
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={notificacoesPorDia}>
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
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
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
          </CardContent>
        </Card>

        {/* Gráfico de pizza — distribuição de status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Status</CardTitle>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={distribuicaoStatus}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distribuicaoStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras — evolução mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Mensal</CardTitle>
          <p className="text-xs text-muted-foreground">
            Total de notificações por mês em 2026
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={notificacoesPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
