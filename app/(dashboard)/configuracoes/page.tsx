"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Bell,
  Shield,
  Webhook,
  Clock,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// --- Tipos ---

interface Configuracoes {
  notificar_sucesso: boolean;
  notificar_falha: boolean;
  notificar_execucao_manual: boolean;
  intervalo_inativos: string;
  executar_apenas_uteis_inativos: boolean;
  intervalo_inadimplentes: string;
  executar_apenas_uteis_inadimplentes: boolean;
}

// Valores padrão — usados quando o banco ainda não tem configurações salvas
const DEFAULTS: Configuracoes = {
  notificar_sucesso: true,
  notificar_falha: true,
  notificar_execucao_manual: false,
  intervalo_inativos: "30",
  executar_apenas_uteis_inativos: true,
  intervalo_inadimplentes: "1440",
  executar_apenas_uteis_inadimplentes: true,
};

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Configuracoes>(DEFAULTS);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Busca as configurações salvas no banco
  const buscarConfiguracoes = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/configuracoes");
      if (!res.ok) throw new Error("Falha ao buscar configurações");
      const data = await res.json();

      // Mescla com os defaults para garantir que todos os campos existam
      setConfig({ ...DEFAULTS, ...data });
    } catch {
      setErro("Não foi possível carregar as configurações. Usando valores padrão.");
      setConfig(DEFAULTS);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarConfiguracoes();
  }, [buscarConfiguracoes]);

  // Salva as configurações no banco via API
  async function salvarConfiguracoes() {
    setSalvando(true);
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Não foi possível salvar as configurações.");
    } finally {
      setSalvando(false);
    }
  }

  // Helper para atualizar um campo do estado
  function atualizar<K extends keyof Configuracoes>(chave: K, valor: Configuracoes[K]) {
    setConfig((prev) => ({ ...prev, [chave]: valor }));
  }

  // URL do webhook baseada no domínio atual
  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/clicksign`
      : "https://seu-dominio.com/api/webhook/clicksign";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground text-sm">Gerencie as configurações gerais do sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={buscarConfiguracoes} disabled={carregando}>
            <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={salvarConfiguracoes} disabled={salvando || carregando} className="gap-2">
            {salvando ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
            ) : (
              <><Save className="h-4 w-4" />Salvar Configurações</>
            )}
          </Button>
        </div>
      </div>

      {/* Banner de erro ao carregar */}
      {erro && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-300">{erro}</p>
        </div>
      )}

      {/* Seção: Credenciais da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-blue-600" />
            Credenciais das APIs
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Os tokens são lidos exclusivamente das variáveis de ambiente do servidor — nunca expostos ao cliente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hinova */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Token Hinova</p>
              <p className="text-xs text-muted-foreground font-mono">HINOVA_TOKEN</p>
            </div>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Variável de Ambiente
            </Badge>
          </div>

          {/* PowerCRM */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Token PowerCRM</p>
              <p className="text-xs text-muted-foreground font-mono">POWERCRM_TOKEN</p>
            </div>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Variável de Ambiente
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Defina os tokens no arquivo{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">.env.local</code> ou nas
            variáveis de ambiente da plataforma de deploy.
          </p>
        </CardContent>
      </Card>

      {/* Seção: Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-blue-600" />
            Notificações
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Controle quais eventos geram notificações no Google Chat
          </p>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Notificar execuções com sucesso</p>
                  <p className="text-xs text-muted-foreground">
                    Envia mensagem ao Google Chat quando uma execução é concluída com sucesso
                  </p>
                </div>
                <Switch
                  checked={config.notificar_sucesso}
                  onCheckedChange={(v) => atualizar("notificar_sucesso", v)}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Notificar falhas</p>
                  <p className="text-xs text-muted-foreground">
                    Envia alerta imediato quando ocorrem erros durante a execução
                  </p>
                </div>
                <Switch
                  checked={config.notificar_falha}
                  onCheckedChange={(v) => atualizar("notificar_falha", v)}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Notificar execuções manuais</p>
                  <p className="text-xs text-muted-foreground">
                    Envia notificação quando uma execução manual é disparada pelo painel
                  </p>
                </div>
                <Switch
                  checked={config.notificar_execucao_manual}
                  onCheckedChange={(v) => atualizar("notificar_execucao_manual", v)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção: Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-blue-600" />
            Agendamento Automático
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Configure os intervalos de execução dos robôs de monitoramento
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {carregando ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {/* Inativos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Clientes Inativos</p>
                  <Badge className="bg-blue-600 text-white text-xs">Ativo</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="intervalo-inativos">Intervalo (minutos)</Label>
                    <Input
                      id="intervalo-inativos"
                      type="number"
                      min="5"
                      max="1440"
                      value={config.intervalo_inativos}
                      onChange={(e) => atualizar("intervalo_inativos", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo: 5 minutos</p>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id="uteis-inativos"
                      checked={config.executar_apenas_uteis_inativos}
                      onCheckedChange={(v) => atualizar("executar_apenas_uteis_inativos", v)}
                    />
                    <div>
                      <Label htmlFor="uteis-inativos" className="cursor-pointer">
                        Apenas dias úteis
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Ignora finais de semana e feriados cadastrados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inadimplentes */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Inadimplentes</p>
                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                    Pendente
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="intervalo-inadimplentes">Intervalo (minutos)</Label>
                    <Input
                      id="intervalo-inadimplentes"
                      type="number"
                      min="60"
                      max="10080"
                      value={config.intervalo_inadimplentes}
                      onChange={(e) => atualizar("intervalo_inadimplentes", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">1440 = 1 vez por dia</p>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id="uteis-inadimplentes"
                      checked={config.executar_apenas_uteis_inadimplentes}
                      onCheckedChange={(v) => atualizar("executar_apenas_uteis_inadimplentes", v)}
                    />
                    <div>
                      <Label htmlFor="uteis-inadimplentes" className="cursor-pointer">
                        Apenas dias úteis
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Ignora finais de semana e feriados cadastrados
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Seção: Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4 text-blue-600" />
            Webhooks
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Endpoints para receber eventos externos (ex: ClickSign)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook ClickSign</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast.success("URL copiada!");
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure este endpoint no painel do ClickSign para receber eventos de assinatura
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
