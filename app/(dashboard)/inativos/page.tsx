"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserX,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Globe,
  Settings2,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// --- Tipos ---

interface MetricasInativos {
  total: number;
  sucesso: number;
  falhas: number;
  duplicatas: number;
  ultimaExecucao: string | null;
}

interface ResultadoExecucao {
  mensagem: string;
  total: number;
  sucesso: number;
  falhas: number;
}

// Schema de validação do formulário do modal
const executarSchema = z.object({
  data_inicial: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inicial inválida"),
  data_final: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data final inválida"),
});

type ExecutarFormData = z.infer<typeof executarSchema>;

// --- Helpers ---

/** Retorna a data atual no fuso de Brasília no formato YYYY-MM-DD (para input type="date") */
function getDataHojeBrasilia(): string {
  return new Date()
    .toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/")
    .reverse()
    .join("-");
}

/** Converte YYYY-MM-DD para DD/MM/YYYY (formato esperado pela API Hinova) */
function formatarParaHinova(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
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

// --- Componente de Skeleton para os cards de métricas ---
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

export default function InativosPage() {
  const [metricas, setMetricas] = useState<MetricasInativos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoExecucao | null>(null);

  const hoje = getDataHojeBrasilia();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExecutarFormData>({
    resolver: zodResolver(executarSchema),
    defaultValues: {
      data_inicial: hoje,
      data_final: hoje,
    },
  });

  // Busca as métricas reais do banco via API
  const buscarMetricas = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/inativos/metricas");
      if (!res.ok) throw new Error("Falha ao buscar métricas");
      const data = await res.json();
      setMetricas(data);
    } catch {
      toast.error("Não foi possível carregar as métricas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carrega as métricas ao montar o componente
  useEffect(() => {
    buscarMetricas();
  }, [buscarMetricas]);

  // Abre o modal e reseta o formulário com a data de hoje
  function abrirModal() {
    reset({ data_inicial: hoje, data_final: hoje });
    setResultado(null);
    setModalAberto(true);
  }

  // Executa o fluxo de inativos via API Route
  async function onSubmit(data: ExecutarFormData) {
    setExecutando(true);
    setResultado(null);

    try {
      const res = await fetch("/api/inativos/executar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data_inicial: formatarParaHinova(data.data_inicial),
          data_final: formatarParaHinova(data.data_final),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.erro ?? "Erro ao executar automação.");
      }

      setResultado(json);
      toast.success(`Execução concluída: ${json.sucesso} sucesso(s), ${json.falhas} falha(s).`);

      // Atualiza as métricas após execução
      buscarMetricas();
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro inesperado.";
      toast.error(mensagem);
    } finally {
      setExecutando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes Inativos</h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento automático de clientes que mudaram para situação inativa
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
          <Badge className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
            <Activity className="h-3 w-3" />
            Ativo
          </Badge>
          <Button onClick={abrirModal} className="gap-2">
            <Play className="h-4 w-4" />
            Executar Agora
          </Button>
        </div>
      </div>

      {/* Cards de métricas — skeleton enquanto carrega */}
      {carregando ? (
        <MetricasSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Notificações
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metricas?.total ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Desde o início do monitoramento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Notificações Enviadas
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-500">{metricas?.sucesso ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Enviadas com sucesso</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Controle de Duplicidade
              </CardTitle>
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
          <p className="text-xs text-muted-foreground">Scheduler configurado e em execução</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Clientes Inativos</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <Clock className="h-3 w-3" />
                {metricas?.ultimaExecucao ? (
                  <span>Última execução: {formatarData(metricas.ultimaExecucao)}</span>
                ) : (
                  <span className="italic">Nenhuma execução registrada</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">A cada 30 minutos (dias úteis)</p>
            </div>
            <Badge className="bg-blue-600 text-white hover:bg-blue-700">Ativo</Badge>
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
              <span className="text-sm text-muted-foreground">30 minutos</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Status do Robô
              </div>
              <Badge className="bg-blue-600 text-white">Ativo</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                API ERP (Hinova)
              </div>
              <Badge className={process.env.NEXT_PUBLIC_HINOVA_CONFIGURED === "true" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}>
                Configurada via .env
              </Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                API CRM (PowerCRM)
              </div>
              <Badge className="bg-emerald-600 text-white">
                Configurada via .env
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Execução */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-blue-600" />
              Executar Busca de Inativos
            </DialogTitle>
            <DialogDescription>
              Defina o intervalo de datas para buscar associados que ficaram inativos.
              Os resultados serão enviados ao PowerCRM automaticamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicial">Data Inicial</Label>
                <Input
                  id="data_inicial"
                  type="date"
                  {...register("data_inicial")}
                />
                {errors.data_inicial && (
                  <p className="text-xs text-red-500">{errors.data_inicial.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_final">Data Final</Label>
                <Input
                  id="data_final"
                  type="date"
                  {...register("data_final")}
                />
                {errors.data_final && (
                  <p className="text-xs text-red-500">{errors.data_final.message}</p>
                )}
              </div>
            </div>

            {/* Resultado da execução */}
            {resultado && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {resultado.mensagem}
                </p>
                <div className="mt-1 flex gap-4 text-xs text-emerald-700 dark:text-emerald-400">
                  <span>Total: <strong>{resultado.total}</strong></span>
                  <span>Sucesso: <strong>{resultado.sucesso}</strong></span>
                  <span>Falhas: <strong>{resultado.falhas}</strong></span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAberto(false)}
                disabled={executando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={executando} className="gap-2">
                {executando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Executar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
