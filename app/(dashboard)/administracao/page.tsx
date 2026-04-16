"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  CalendarDays,
  Users,
  Plus,
  Trash2,
  Pencil,
  UserPlus,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Tipos ---

interface Feriado {
  id: string;
  data: string; // ISO string do banco
  descricao: string;
}

interface Consultor {
  id: string;
  nome: string;
  email: string;
  codigoPowerCRM: string;
  idCooperativa: string;
  ativo: boolean;
}

// --- Schemas de validação ---

const feriadoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  descricao: z.string().min(2, "Descrição obrigatória"),
});

const consultorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  codigoPowerCRM: z.string().min(1, "Código PowerCRM obrigatório"),
  idCooperativa: z.string().min(1, "ID Cooperativa obrigatório"),
});

type FeriadoFormData = z.infer<typeof feriadoSchema>;
type ConsultorFormData = z.infer<typeof consultorSchema>;

// --- Feriados nacionais pré-definidos para importação rápida ---
// Estes são dados estáticos de referência — não são mocks de banco
const FERIADOS_2025 = [
  { data: "2025-01-01", descricao: "Confraternização Universal" },
  { data: "2025-03-04", descricao: "Carnaval" },
  { data: "2025-03-05", descricao: "Quarta-feira de Cinzas" },
  { data: "2025-04-18", descricao: "Sexta-feira Santa" },
  { data: "2025-04-21", descricao: "Tiradentes" },
  { data: "2025-05-01", descricao: "Dia do Trabalho" },
  { data: "2025-06-19", descricao: "Corpus Christi" },
  { data: "2025-09-07", descricao: "Independência do Brasil" },
  { data: "2025-10-12", descricao: "Nossa Senhora Aparecida" },
  { data: "2025-11-02", descricao: "Finados" },
  { data: "2025-11-15", descricao: "Proclamação da República" },
  { data: "2025-12-25", descricao: "Natal" },
];

const FERIADOS_2026 = [
  { data: "2026-01-01", descricao: "Confraternização Universal" },
  { data: "2026-02-17", descricao: "Carnaval" },
  { data: "2026-02-18", descricao: "Quarta-feira de Cinzas" },
  { data: "2026-04-03", descricao: "Sexta-feira Santa" },
  { data: "2026-04-21", descricao: "Tiradentes" },
  { data: "2026-05-01", descricao: "Dia do Trabalho" },
  { data: "2026-06-04", descricao: "Corpus Christi" },
  { data: "2026-09-07", descricao: "Independência do Brasil" },
  { data: "2026-10-12", descricao: "Nossa Senhora Aparecida" },
  { data: "2026-11-02", descricao: "Finados" },
  { data: "2026-11-15", descricao: "Proclamação da República" },
  { data: "2026-12-25", descricao: "Natal" },
];

/** Formata data ISO para DD/MM/YYYY */
function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// --- Skeleton para tabelas ---
function TabelaSkeleton({ colunas }: { colunas: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: colunas }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function AdministracaoPage() {
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [carregandoFeriados, setCarregandoFeriados] = useState(true);
  const [carregandoConsultores, setCarregandoConsultores] = useState(true);
  const [salvandoFeriado, setSalvandoFeriado] = useState(false);
  const [salvandoConsultor, setSalvandoConsultor] = useState(false);
  const [importando, setImportando] = useState(false);

  const feriadoForm = useForm<FeriadoFormData>({
    resolver: zodResolver(feriadoSchema),
    defaultValues: { data: "", descricao: "" },
  });

  const consultorForm = useForm<ConsultorFormData>({
    resolver: zodResolver(consultorSchema),
    defaultValues: { nome: "", email: "", codigoPowerCRM: "", idCooperativa: "" },
  });

  // --- Feriados: busca do banco ---
  const buscarFeriados = useCallback(async () => {
    setCarregandoFeriados(true);
    try {
      const res = await fetch("/api/feriados");
      if (!res.ok) throw new Error("Falha ao buscar feriados");
      const data = await res.json();
      setFeriados(data);
    } catch {
      toast.error("Não foi possível carregar os feriados.");
    } finally {
      setCarregandoFeriados(false);
    }
  }, []);

  // --- Consultores: busca do banco ---
  const buscarConsultores = useCallback(async () => {
    setCarregandoConsultores(true);
    try {
      const res = await fetch("/api/consultores");
      if (!res.ok) throw new Error("Falha ao buscar consultores");
      const data = await res.json();
      setConsultores(data);
    } catch {
      toast.error("Não foi possível carregar os consultores.");
    } finally {
      setCarregandoConsultores(false);
    }
  }, []);

  useEffect(() => {
    buscarFeriados();
    buscarConsultores();
  }, [buscarFeriados, buscarConsultores]);

  // --- Feriados: cadastro ---
  async function adicionarFeriado(data: FeriadoFormData) {
    setSalvandoFeriado(true);
    try {
      const res = await fetch("/api/feriados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.erro ?? "Erro ao cadastrar feriado");
      toast.success("Feriado cadastrado com sucesso!");
      feriadoForm.reset();
      buscarFeriados();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSalvandoFeriado(false);
    }
  }

  // --- Feriados: remoção ---
  async function removerFeriado(id: string) {
    try {
      const res = await fetch(`/api/feriados/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover feriado");
      toast.success("Feriado removido.");
      setFeriados((prev) => prev.filter((f) => f.id !== id));
    } catch {
      toast.error("Não foi possível remover o feriado.");
    }
  }

  // --- Feriados: importação em lote ---
  async function importarFeriados(ano: 2025 | 2026) {
    setImportando(true);
    try {
      const lista = ano === 2025 ? FERIADOS_2025 : FERIADOS_2026;
      const res = await fetch("/api/feriados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feriados: lista }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.erro ?? "Erro ao importar feriados");
      toast.success(`${json.importados} feriados de ${ano} importados!`);
      buscarFeriados();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setImportando(false);
    }
  }

  // --- Consultores: cadastro ---
  async function adicionarConsultor(data: ConsultorFormData) {
    setSalvandoConsultor(true);
    try {
      const res = await fetch("/api/consultores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.erro ?? "Erro ao cadastrar consultor");
      toast.success("Consultor cadastrado com sucesso!");
      consultorForm.reset();
      buscarConsultores();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSalvandoConsultor(false);
    }
  }

  // --- Consultores: remoção ---
  async function removerConsultor(id: string) {
    try {
      const res = await fetch(`/api/consultores/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover consultor");
      toast.success("Consultor removido.");
      setConsultores((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Não foi possível remover o consultor.");
    }
  }

  // --- Consultores: alternar status ativo/inativo ---
  async function alternarStatusConsultor(id: string, ativo: boolean) {
    // Atualização otimista — reflete na UI imediatamente
    setConsultores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ativo: !ativo } : c))
    );
    try {
      const res = await fetch(`/api/consultores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
    } catch {
      // Reverte em caso de erro
      setConsultores((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ativo } : c))
      );
      toast.error("Não foi possível atualizar o status do consultor.");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground text-sm">Gerencie feriados e consultores do sistema</p>
        </div>
      </div>

      {/* Abas */}
      <Tabs defaultValue="feriados" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11">
          <TabsTrigger value="feriados" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Feriados
          </TabsTrigger>
          <TabsTrigger value="consultores" className="gap-2">
            <Users className="h-4 w-4" />
            Consultores PowerCRM
          </TabsTrigger>
        </TabsList>

        {/* ─── Aba de Feriados ─── */}
        <TabsContent value="feriados" className="mt-4 space-y-4">
          {/* Formulário de adicionar feriado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" />
                Adicionar Feriado
              </CardTitle>
              <p className="text-xs text-muted-foreground">Cadastre um novo feriado nacional</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={feriadoForm.handleSubmit(adicionarFeriado)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="feriado-data">Data</Label>
                    <Input id="feriado-data" type="date" {...feriadoForm.register("data")} />
                    {feriadoForm.formState.errors.data && (
                      <p className="text-xs text-red-500">{feriadoForm.formState.errors.data.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feriado-descricao">Descrição</Label>
                    <Input
                      id="feriado-descricao"
                      placeholder="Ex: Natal"
                      {...feriadoForm.register("descricao")}
                    />
                    {feriadoForm.formState.errors.descricao && (
                      <p className="text-xs text-red-500">{feriadoForm.formState.errors.descricao.message}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={salvandoFeriado} className="gap-2">
                  {salvandoFeriado ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Cadastrar Feriado
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Importação rápida */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Importação Rápida</CardTitle>
              <p className="text-xs text-muted-foreground">Importe feriados nacionais pré-definidos</p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="gap-2"
                disabled={importando}
                onClick={() => importarFeriados(2025)}
              >
                {importando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                Importar Feriados 2025
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={importando}
                onClick={() => importarFeriados(2026)}
              >
                {importando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                Importar Feriados 2026
              </Button>
            </CardContent>
          </Card>

          {/* Tabela de feriados cadastrados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Feriados Cadastrados</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {carregandoFeriados ? "Carregando..." : `${feriados.length} feriado(s) cadastrado(s)`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={buscarFeriados} disabled={carregandoFeriados}>
                <RefreshCw className={`h-4 w-4 ${carregandoFeriados ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {!carregandoFeriados && feriados.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 opacity-40" />
                  <p className="text-sm">Nenhum feriado cadastrado.</p>
                  <p className="text-xs">Use o formulário acima ou importe os feriados nacionais.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carregandoFeriados ? (
                      <TabelaSkeleton colunas={3} />
                    ) : (
                      feriados.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-sm">{formatarData(f.data)}</TableCell>
                          <TableCell>{f.descricao}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removerFeriado(f.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Aba de Consultores ─── */}
        <TabsContent value="consultores" className="mt-4 space-y-4">
          {/* Formulário de cadastro de consultor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="h-4 w-4" />
                Cadastrar Novo Consultor
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Adicione consultores manualmente para matching com voluntários da Hinova
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={consultorForm.handleSubmit(adicionarConsultor)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="consultor-nome">Nome Completo</Label>
                    <Input
                      id="consultor-nome"
                      placeholder="Ex: João Silva"
                      {...consultorForm.register("nome")}
                    />
                    {consultorForm.formState.errors.nome && (
                      <p className="text-xs text-red-500">{consultorForm.formState.errors.nome.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultor-email">E-mail</Label>
                    <Input
                      id="consultor-email"
                      type="email"
                      placeholder="joao@exemplo.com"
                      {...consultorForm.register("email")}
                    />
                    {consultorForm.formState.errors.email && (
                      <p className="text-xs text-red-500">{consultorForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultor-codigo">Código PowerCRM</Label>
                    <Input
                      id="consultor-codigo"
                      placeholder="Ex: 12345"
                      {...consultorForm.register("codigoPowerCRM")}
                    />
                    {consultorForm.formState.errors.codigoPowerCRM && (
                      <p className="text-xs text-red-500">{consultorForm.formState.errors.codigoPowerCRM.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultor-cooperativa">ID Cooperativa</Label>
                    <Input
                      id="consultor-cooperativa"
                      placeholder="Ex: 1317"
                      {...consultorForm.register("idCooperativa")}
                    />
                    {consultorForm.formState.errors.idCooperativa && (
                      <p className="text-xs text-red-500">{consultorForm.formState.errors.idCooperativa.message}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={salvandoConsultor} className="gap-2">
                  {salvandoConsultor ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Cadastrar Consultor
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tabela de consultores */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Consultores Cadastrados</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {carregandoConsultores
                    ? "Carregando..."
                    : `${consultores.filter((c) => c.ativo).length} consultor(es) disponível(is) para atribuição automática`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={buscarConsultores} disabled={carregandoConsultores}>
                <RefreshCw className={`h-4 w-4 ${carregandoConsultores ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {!carregandoConsultores && consultores.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 opacity-40" />
                  <p className="text-sm">Nenhum consultor cadastrado.</p>
                  <p className="text-xs">Use o formulário acima para adicionar consultores do PowerCRM.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Código PowerCRM</TableHead>
                      <TableHead>ID Cooperativa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carregandoConsultores ? (
                      <TabelaSkeleton colunas={6} />
                    ) : (
                      consultores.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell className="text-muted-foreground">{c.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {c.codigoPowerCRM}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{c.idCooperativa}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={c.ativo}
                                onCheckedChange={() => alternarStatusConsultor(c.id, c.ativo)}
                              />
                              <span className={`text-xs font-medium ${c.ativo ? "text-emerald-600" : "text-muted-foreground"}`}>
                                {c.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removerConsultor(c.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
