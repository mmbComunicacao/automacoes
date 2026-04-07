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
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// --- Tipos ---

interface MetricasInadimplentes {
  total: number;
  alertas: number;
  falhas: number;
  duplicatas: number;
  ultimaExecucao: string | null;
}

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

// Skeleton dos cards de métricas
function MetricasSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-20 mb-1" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function InadimplentesPage() {
  const [metricas, setMetricas] = useState<MetricasInadimplentes | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Busca as métricas reais do banco via API
  // TODO: criar /api/inadimplentes/metricas quando a automação for implementada
  const buscarMetricas = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/inadimplentes/metricas");
      if (!res.ok) throw new Error("Endpoint ainda não implementado");
      const data = await res.json();
      setMetricas(data);
    } catch {
      // Enquanto a automação não existe, exibe zeros — sem toast de erro
      setMetricas({ total: 0, alertas: 0, falhas: 0, duplicatas: 0, ultimaExecucao: null });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarMetricas();
  }, [buscarMetricas]);

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
          <Button
            variant="outline"
            size="icon"
            onClick={buscarMetricas}
            disabled={carregando}
            title="Atualizar métricas"
          >
            <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
          </Button>
          <Badge className="gap-1.5 bg-amber-500 text-white hover:bg-amber-600">
            <Construction className="h-3 w-3" />
            Em Desenvolvimento
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
      {carregando ? (
        <MetricasSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alertas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metricas?.total ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Desde o início do monitoramento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Enviados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-500">{metricas?.alertas ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Enviados com sucesso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Falhas</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{metricas?.falhas ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Notificações que falharam</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Controle de Duplicidade</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metricas?.duplicatas ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">CPFs únicos processados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status do Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status do Agendamento Automático</CardTitle>
          <p className="text-xs text-muted-foreground">Scheduler a ser configurado</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-dashed p-4 opacity-60">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Inadimplentes</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <Clock className="h-3 w-3" />
                {metricas?.ultimaExecucao ? (
                  <span>Última execução: {formatarData(metricas.ultimaExecucao)}</span>
                ) : (
                  <span className="italic">Nenhuma execução registrada</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Execução diária em dias úteis (a configurar)</p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Pendente
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span>Timezone: America/Sao_Paulo (GMT-3)</span>
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
              <span className="text-sm text-muted-foreground italic">A definir</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Status do Robô
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Pendente
              </Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                API ERP (Hinova)
              </div>
              <Badge className="bg-emerald-600 text-white">Configurada via .env</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                API CRM (PowerCRM)
              </div>
              <Badge className="bg-emerald-600 text-white">Configurada via .env</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
