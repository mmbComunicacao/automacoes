"use client";

/**
 * Página de Logs do Sistema
 *
 * Exibe todos os logs de automações organizados por abas:
 * - Inativos: logs da automação de clientes inativos (Hinova + PowerCRM)
 * - Inadimplentes: logs da automação de inadimplência
 * - Sistema: logs gerais (inicialização, erros críticos)
 *
 * Cada aba permite filtrar por integração e nível do log.
 */

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Filter,
  UserX,
  AlertCircle,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Tipos ───────────────────────────────────────────────────────────────────────────────────

type AutomacaoTipo = "INATIVOS" | "INADIMPLENTES" | "SISTEMA";
type IntegracaoTipo = "HINOVA" | "POWERCRM" | "SISTEMA";
type NivelLog = "INFO" | "SUCESSO" | "AVISO" | "ERRO";

interface LogItem {
  id: string;
  automacao: AutomacaoTipo;
  integracao: IntegracaoTipo;
  nivel: NivelLog;
  mensagem: string;
  detalhes: Record<string, unknown> | null;
  cpfAssociado: string | null;
  quotationCode: string | null;
  execucaoManual: boolean;
  criadoEm: string;
}

interface LogsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Configurações das abas ──────────────────────────────────────────────────────────────

const ABAS: {
  id: AutomacaoTipo;
  label: string;
  icon: React.ElementType;
  descricao: string;
}[] = [
  {
    id: "INATIVOS",
    label: "Clientes Inativos",
    icon: UserX,
    descricao: "Logs da automação de monitoramento de clientes inativos",
  },
  {
    id: "INADIMPLENTES",
    label: "Inadimplentes",
    icon: AlertCircle,
    descricao: "Logs da automação de monitoramento de inadimplência",
  },
  {
    id: "SISTEMA",
    label: "Sistema",
    icon: Settings2,
    descricao: "Logs gerais do sistema (inicialização, erros críticos)",
  },
];

// ─── Helpers de UI ──────────────────────────────────────────────────────────────────

function getNivelConfig(nivel: NivelLog) {
  switch (nivel) {
    case "SUCESSO":
      return {
        icon: CheckCircle2,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
        label: "Sucesso",
      };
    case "ERRO":
      return {
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
        label: "Erro",
      };
    case "AVISO":
      return {
        icon: AlertTriangle,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
        label: "Aviso",
      };
    default:
      return {
        icon: Info,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        label: "Info",
      };
  }
}

function getIntegracaoConfig(integracao: IntegracaoTipo) {
  switch (integracao) {
    case "HINOVA":
      return { icon: Database, label: "Hinova", color: "text-violet-600 dark:text-violet-400" };
    case "POWERCRM":
      return { icon: Zap, label: "PowerCRM", color: "text-blue-600 dark:text-blue-400" };
    default:
      return { icon: Settings2, label: "Sistema", color: "text-slate-600 dark:text-slate-400" };
  }
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

// ─── Componente de item de log ─────────────────────────────────────────────────────────────

function LogItemCard({ log }: { log: LogItem }) {
  const [expandido, setExpandido] = useState(false);
  const nivelConfig = getNivelConfig(log.nivel);
  const integracaoConfig = getIntegracaoConfig(log.integracao);
  const NivelIcon = nivelConfig.icon;
  const IntegracaoIcon = integracaoConfig.icon;

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${nivelConfig.bg} ${nivelConfig.border}`}
    >
      <div className="flex items-start gap-3">
        <NivelIcon className={`mt-0.5 h-4 w-4 shrink-0 ${nivelConfig.color}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${nivelConfig.badge}`}>
              {nivelConfig.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-black/20 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <IntegracaoIcon className={`h-3 w-3 ${integracaoConfig.color}`} />
              {integracaoConfig.label}
            </span>
            {log.execucaoManual && (
              <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                Manual
              </span>
            )}
            <span className="ml-auto flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-3 w-3" />
              {formatarData(log.criadoEm)}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
            {log.mensagem}
          </p>
          {(log.cpfAssociado || log.quotationCode) && (
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
              {log.cpfAssociado && (
                <span>CPF: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{log.cpfAssociado}</span></span>
              )}
              {log.quotationCode && (
                <span>Cotação: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{log.quotationCode}</span></span>
              )}
            </div>
          )}
          {log.detalhes && (
            <div className="mt-2">
              <button
                onClick={() => setExpandido(!expandido)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
              >
                {expandido ? "Ocultar detalhes" : "Ver detalhes"}
              </button>
              {expandido && (
                <pre className="mt-2 overflow-auto rounded-md bg-white/60 dark:bg-black/30 p-3 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 max-h-48">
                  {JSON.stringify(log.detalhes, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [abaAtiva, setAbaAtiva] = useState<AutomacaoTipo>("INATIVOS");
  const [filtroIntegracao, setFiltroIntegracao] = useState<string>("TODOS");
  const [filtroNivel, setFiltroNivel] = useState<string>("TODOS");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [meta, setMeta] = useState<LogsMeta | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [pagina, setPagina] = useState(1);

  const buscarLogs = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({
        automacao: abaAtiva,
        page: String(pagina),
        limit: "30",
      });
      if (filtroIntegracao !== "TODOS") params.set("integracao", filtroIntegracao);
      if (filtroNivel !== "TODOS") params.set("nivel", filtroNivel);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao buscar logs");
      const data = await res.json();
      setLogs(data.logs);
      setMeta(data.meta);
    } catch (err) {
      console.error("Erro ao buscar logs:", err);
    } finally {
      setCarregando(false);
    }
  }, [abaAtiva, filtroIntegracao, filtroNivel, pagina]);

  useEffect(() => {
    buscarLogs();
  }, [buscarLogs]);

  const mudarAba = (aba: AutomacaoTipo) => {
    setAbaAtiva(aba);
    setPagina(1);
    setFiltroIntegracao("TODOS");
    setFiltroNivel("TODOS");
  };

  const abaAtual = ABAS.find((a) => a.id === abaAtiva)!;
  const AbaIcon = abaAtual.icon;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Logs do Sistema
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Histórico de eventos e integrações de todas as automações
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={buscarLogs} disabled={carregando} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Abas de automação */}
      <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1">
        {ABAS.map((aba) => {
          const Icon = aba.icon;
          const ativa = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => mudarAba(aba.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                ativa
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {aba.label}
            </button>
          );
        })}
      </div>

      {/* Filtros e conteúdo */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <AbaIcon className="h-4 w-4 text-slate-500" />
                {abaAtual.label}
              </CardTitle>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{abaAtual.descricao}</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              {abaAtiva !== "SISTEMA" && (
                <Select value={filtroIntegracao} onValueChange={(v) => { setFiltroIntegracao(v); setPagina(1); }}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="Integração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todas integrações</SelectItem>
                    <SelectItem value="HINOVA">Hinova</SelectItem>
                    <SelectItem value="POWERCRM">PowerCRM</SelectItem>
                    <SelectItem value="SISTEMA">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select value={filtroNivel} onValueChange={(v) => { setFiltroNivel(v); setPagina(1); }}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os níveis</SelectItem>
                  <SelectItem value="SUCESSO">Sucesso</SelectItem>
                  <SelectItem value="ERRO">Erro</SelectItem>
                  <SelectItem value="AVISO">Aviso</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {meta && (
            <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">{meta.total}</span>{" "}
              registro{meta.total !== 1 ? "s" : ""} encontrado{meta.total !== 1 ? "s" : ""}
              {meta.totalPages > 1 && <span className="ml-1">— página {meta.page} de {meta.totalPages}</span>}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {carregando && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="text-sm">Carregando logs...</span>
              </div>
            </div>
          )}
          {!carregando && logs.length > 0 && (
            <div className="flex flex-col gap-2">
              {logs.map((log) => (
                <LogItemCard key={log.id} log={log} />
              ))}
            </div>
          )}
          {!carregando && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nenhum log encontrado</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Os logs aparecerão aqui quando as automações forem executadas
              </p>
            </div>
          )}
          {meta && meta.totalPages > 1 && !carregando && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="outline" size="sm" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-400">{pagina} / {meta.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPagina((p) => Math.min(meta.totalPages, p + 1))} disabled={pagina === meta.totalPages} className="gap-1">
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}