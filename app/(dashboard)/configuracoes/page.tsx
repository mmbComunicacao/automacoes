"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Webhook,
  Clock,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// --- Tipos ---

interface ConfiguracaoNotificacao {
  notificarSucesso: boolean;
  notificarFalha: boolean;
  notificarExecucaoManual: boolean;
}

interface ConfiguracaoAgendamento {
  intervaloInativos: string;
  executarApenasUteisInativos: boolean;
  intervaloInadimplentes: string;
  executarApenasUteisInadimplentes: boolean;
}

// --- Dados iniciais ---
const notificacoesIniciais: ConfiguracaoNotificacao = {
  notificarSucesso: true,
  notificarFalha: true,
  notificarExecucaoManual: false,
};

const agendamentoInicial: ConfiguracaoAgendamento = {
  intervaloInativos: "30",
  executarApenasUteisInativos: true,
  intervaloInadimplentes: "1440", // 24h em minutos
  executarApenasUteisInadimplentes: true,
};

export default function ConfiguracoesPage() {
  const [notificacoes, setNotificacoes] = useState<ConfiguracaoNotificacao>(notificacoesIniciais);
  const [agendamento, setAgendamento] = useState<ConfiguracaoAgendamento>(agendamentoInicial);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Simula o salvamento das configurações
  async function salvarConfiguracoes() {
    setSalvando(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.success("Configurações salvas com sucesso!");
    setSalvando(false);
  }

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
        <Button onClick={salvarConfiguracoes} disabled={salvando} className="gap-2">
          {salvando ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
          ) : (
            <><Save className="h-4 w-4" />Salvar Configurações</>
          )}
        </Button>
      </div>

      {/* Seção: Credenciais da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-blue-600" />
            Credenciais das APIs
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Configure os tokens de acesso para as integrações externas.
            Estes valores são lidos das variáveis de ambiente do servidor.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hinova */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Token Hinova (HINOVA_TOKEN)</Label>
              <Badge variant="outline" className="text-xs">
                Variável de Ambiente
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                type={mostrarToken ? "text" : "password"}
                value="••••••••••••••••••••••••"
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMostrarToken((v) => !v)}
                className="shrink-0"
              >
                {mostrarToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Defina via <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">HINOVA_TOKEN</code> no arquivo <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.local</code>
            </p>
          </div>

          {/* PowerCRM */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Token PowerCRM (POWERCRM_TOKEN)</Label>
              <Badge variant="outline" className="text-xs">
                Variável de Ambiente
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                value="••••••••••••••••••••••••"
                readOnly
                className="font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Defina via <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">POWERCRM_TOKEN</code> no arquivo <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.local</code>
            </p>
          </div>
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
          <div className="divide-y">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Notificar execuções com sucesso</p>
                <p className="text-xs text-muted-foreground">Envia mensagem ao Google Chat quando uma execução é concluída com sucesso</p>
              </div>
              <Switch
                checked={notificacoes.notificarSucesso}
                onCheckedChange={(v) => setNotificacoes((prev) => ({ ...prev, notificarSucesso: v }))}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Notificar falhas</p>
                <p className="text-xs text-muted-foreground">Envia alerta imediato quando ocorrem erros durante a execução</p>
              </div>
              <Switch
                checked={notificacoes.notificarFalha}
                onCheckedChange={(v) => setNotificacoes((prev) => ({ ...prev, notificarFalha: v }))}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Notificar execuções manuais</p>
                <p className="text-xs text-muted-foreground">Envia notificação quando uma execução manual é disparada pelo painel</p>
              </div>
              <Switch
                checked={notificacoes.notificarExecucaoManual}
                onCheckedChange={(v) => setNotificacoes((prev) => ({ ...prev, notificarExecucaoManual: v }))}
              />
            </div>
          </div>
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
                  value={agendamento.intervaloInativos}
                  onChange={(e) => setAgendamento((prev) => ({ ...prev, intervaloInativos: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Mínimo: 5 minutos</p>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="uteis-inativos"
                  checked={agendamento.executarApenasUteisInativos}
                  onCheckedChange={(v) => setAgendamento((prev) => ({ ...prev, executarApenasUteisInativos: v }))}
                />
                <div>
                  <Label htmlFor="uteis-inativos" className="cursor-pointer">Apenas dias úteis</Label>
                  <p className="text-xs text-muted-foreground">Ignora finais de semana e feriados cadastrados</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Inadimplentes</p>
              <Badge className="bg-blue-600 text-white text-xs">Ativo</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="intervalo-inadimplentes">Intervalo (minutos)</Label>
                <Input
                  id="intervalo-inadimplentes"
                  type="number"
                  min="60"
                  max="10080"
                  value={agendamento.intervaloInadimplentes}
                  onChange={(e) => setAgendamento((prev) => ({ ...prev, intervaloInadimplentes: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">1440 = 1 vez por dia</p>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="uteis-inadimplentes"
                  checked={agendamento.executarApenasUteisInadimplentes}
                  onCheckedChange={(v) => setAgendamento((prev) => ({ ...prev, executarApenasUteisInadimplentes: v }))}
                />
                <div>
                  <Label htmlFor="uteis-inadimplentes" className="cursor-pointer">Apenas dias úteis</Label>
                  <p className="text-xs text-muted-foreground">Ignora finais de semana e feriados cadastrados</p>
                </div>
              </div>
            </div>
          </div>
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
              <Input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/webhook/clicksign`}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  const url = `${window.location.origin}/api/webhook/clicksign`;
                  navigator.clipboard.writeText(url);
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