"use client";

import {
  AlertCircle,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Globe,
  Settings2,
  ShieldCheck,
  Construction,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const estatisticas = { total: 0, alertas: 0, falhas: 0, duplicatas: 0 };

const configuracao = {
  intervalo: "Diariamente",
  statusRobo: true,
  webhookConfigurado: true,
  apiErpConfigurada: true,
  timezone: "America/Sao_Paulo (GMT-3)",
};

export default function InadimplentesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inadimplentes</h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento automático de associados com boletos vencidos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
            <Activity className="h-3 w-3" />
            Ativo
          </Badge>
          <Button disabled className="gap-2 cursor-not-allowed opacity-60">
            <Play className="h-4 w-4" />
            Executar Agora
          </Button>
        </div>
      </div>

      {/* Banner de em desenvolvimento */}
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <Construction className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Funcionalidade em desenvolvimento
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            A execução manual e a integração com a Hinova para inadimplentes serão implementadas em breve.
          </p>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alertas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{estatisticas.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">Desde o início do monitoramento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Enviados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-500">{estatisticas.alertas}</p>
            <p className="mt-1 text-xs text-muted-foreground">Enviados com sucesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{estatisticas.falhas}</p>
            <p className="mt-1 text-xs text-muted-foreground">Notificações que falharam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Controle de Duplicidade</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{estatisticas.duplicatas}</p>
            <p className="mt-1 text-xs text-muted-foreground">CPFs registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Status do Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status do Agendamento Automático</CardTitle>
          <p className="text-xs text-muted-foreground">Scheduler configurado e em execução</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Inadimplentes</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <Clock className="h-3 w-3" />
                <span>Diariamente às 08:00</span>
              </div>
              <p className="text-xs text-muted-foreground">Execução diária em dias úteis</p>
            </div>
            <Badge className="bg-blue-600 text-white hover:bg-blue-700">Ativo</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span>Timezone: {configuracao.timezone}</span>
          </div>
        </CardContent>
      </Card>

      {/* Configuração Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração Atual</CardTitle>
          <p className="text-xs text-muted-foreground">Parâmetros do sistema de monitoramento</p>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Intervalo de Verificação
              </div>
              <span className="text-sm text-muted-foreground">{configuracao.intervalo}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Status do Robô
              </div>
              <Badge className={configuracao.statusRobo ? "bg-blue-600 text-white" : ""}>
                {configuracao.statusRobo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                Webhook Configurado
              </div>
              <Badge className={configuracao.webhookConfigurado ? "bg-blue-600 text-white" : ""}>
                {configuracao.webhookConfigurado ? "Sim" : "Não"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                API ERP Configurada
              </div>
              <Badge className={configuracao.apiErpConfigurada ? "bg-blue-600 text-white" : ""}>
                {configuracao.apiErpConfigurada ? "Sim" : "Não"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}