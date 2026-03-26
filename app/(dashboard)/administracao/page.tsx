"use client";

import { useState } from "react";
import {
  Shield,
  CalendarDays,
  Users,
  Plus,
  Trash2,
  Pencil,
  UserPlus,
  Loader2,
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
  data: string;
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
  data: z.string().min(1, "Data obrigatória"),
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

// --- Feriados nacionais pré-definidos ---
const feriadosBrasil2025: Omit<Feriado, "id">[] = [
  { data: "01/01/2025", descricao: "Confraternização Universal" },
  { data: "04/03/2025", descricao: "Carnaval" },
  { data: "05/03/2025", descricao: "Quarta-feira de Cinzas" },
  { data: "18/04/2025", descricao: "Sexta-feira Santa" },
  { data: "21/04/2025", descricao: "Tiradentes" },
  { data: "01/05/2025", descricao: "Dia do Trabalho" },
  { data: "19/06/2025", descricao: "Corpus Christi" },
  { data: "07/09/2025", descricao: "Independência do Brasil" },
  { data: "12/10/2025", descricao: "Nossa Senhora Aparecida" },
  { data: "02/11/2025", descricao: "Finados" },
  { data: "15/11/2025", descricao: "Proclamação da República" },
  { data: "25/12/2025", descricao: "Natal" },
];

const feriadosBrasil2026: Omit<Feriado, "id">[] = [
  { data: "01/01/2026", descricao: "Confraternização Universal" },
  { data: "17/02/2026", descricao: "Carnaval" },
  { data: "18/02/2026", descricao: "Quarta-feira de Cinzas" },
  { data: "03/04/2026", descricao: "Sexta-feira Santa" },
  { data: "21/04/2026", descricao: "Tiradentes" },
  { data: "01/05/2026", descricao: "Dia do Trabalho" },
  { data: "04/06/2026", descricao: "Corpus Christi" },
  { data: "07/09/2026", descricao: "Independência do Brasil" },
  { data: "12/10/2026", descricao: "Nossa Senhora Aparecida" },
  { data: "02/11/2026", descricao: "Finados" },
  { data: "15/11/2026", descricao: "Proclamação da República" },
  { data: "25/12/2026", descricao: "Natal" },
];

// Dados mockados iniciais
const feriadosIniciais: Feriado[] = [
  { id: "1", data: "01/01/2026", descricao: "Confraternização Universal" },
  { id: "2", data: "03/04/2026", descricao: "Sexta-feira Santa" },
];

const consultoresIniciais: Consultor[] = [
  { id: "1", nome: "João Test Silva", email: "joao.test@example.com", codigoPowerCRM: "TEST123", idCooperativa: "1", ativo: true },
  { id: "2", nome: "Maria Test Santos", email: "maria.test@example.com", codigoPowerCRM: "TEST456", idCooperativa: "1", ativo: true },
];

export default function AdministracaoPage() {
  const [feriados, setFeriados] = useState<Feriado[]>(feriadosIniciais);
  const [consultores, setConsultores] = useState<Consultor[]>(consultoresIniciais);
  const [salvandoFeriado, setSalvandoFeriado] = useState(false);
  const [salvandoConsultor, setSalvandoConsultor] = useState(false);

  // Formulário de feriados
  const feriadoForm = useForm<FeriadoFormData>({
    resolver: zodResolver(feriadoSchema),
    defaultValues: { data: "", descricao: "" },
  });

  // Formulário de consultores
  const consultorForm = useForm<ConsultorFormData>({
    resolver: zodResolver(consultorSchema),
    defaultValues: { nome: "", email: "", codigoPowerCRM: "", idCooperativa: "" },
  });

  // Adiciona um feriado manualmente
  function adicionarFeriado(data: FeriadoFormData) {
    setSalvandoFeriado(true);
    // Formata a data de YYYY-MM-DD para DD/MM/YYYY
    const [ano, mes, dia] = data.data.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;

    const novoFeriado: Feriado = {
      id: Date.now().toString(),
      data: dataFormatada,
      descricao: data.descricao,
    };

    setFeriados((prev) => [...prev, novoFeriado].sort((a, b) => {
      // Ordena por data (DD/MM/YYYY)
      const [dA, mA, yA] = a.data.split("/");
      const [dB, mB, yB] = b.data.split("/");
      return new Date(`${yA}-${mA}-${dA}`).getTime() - new Date(`${yB}-${mB}-${dB}`).getTime();
    }));

    feriadoForm.reset();
    toast.success("Feriado cadastrado com sucesso!");
    setSalvandoFeriado(false);
  }

  // Remove um feriado pelo ID
  function removerFeriado(id: string) {
    setFeriados((prev) => prev.filter((f) => f.id !== id));
    toast.success("Feriado removido.");
  }

  // Importa feriados pré-definidos de um ano
  function importarFeriados(ano: 2025 | 2026) {
    const lista = ano === 2025 ? feriadosBrasil2025 : feriadosBrasil2026;
    const novos = lista.map((f, i) => ({ ...f, id: `import-${ano}-${i}` }));
    setFeriados((prev) => {
      // Remove feriados do mesmo ano antes de importar
      const filtrado = prev.filter((f) => !f.data.endsWith(`/${ano}`));
      return [...filtrado, ...novos].sort((a, b) => {
        const [dA, mA, yA] = a.data.split("/");
        const [dB, mB, yB] = b.data.split("/");
        return new Date(`${yA}-${mA}-${dA}`).getTime() - new Date(`${yB}-${mB}-${dB}`).getTime();
      });
    });
    toast.success(`${novos.length} feriados de ${ano} importados!`);
  }

  // Adiciona um consultor
  function adicionarConsultor(data: ConsultorFormData) {
    setSalvandoConsultor(true);
    const novoConsultor: Consultor = {
      id: Date.now().toString(),
      ...data,
      ativo: true,
    };
    setConsultores((prev) => [...prev, novoConsultor]);
    consultorForm.reset();
    toast.success("Consultor cadastrado com sucesso!");
    setSalvandoConsultor(false);
  }

  // Remove um consultor pelo ID
  function removerConsultor(id: string) {
    setConsultores((prev) => prev.filter((c) => c.id !== id));
    toast.success("Consultor removido.");
  }

  // Alterna o status ativo/inativo de um consultor
  function alternarStatusConsultor(id: string) {
    setConsultores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c))
    );
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

        {/* Aba de Feriados */}
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
                    <Input
                      id="feriado-data"
                      type="date"
                      {...feriadoForm.register("data")}
                    />
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
                  {salvandoFeriado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
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
              <Button variant="outline" className="gap-2" onClick={() => importarFeriados(2025)}>
                <CalendarDays className="h-4 w-4" />
                Importar Feriados 2025
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => importarFeriados(2026)}>
                <CalendarDays className="h-4 w-4" />
                Importar Feriados 2026
              </Button>
            </CardContent>
          </Card>

          {/* Lista de feriados cadastrados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feriados Cadastrados</CardTitle>
              <p className="text-xs text-muted-foreground">
                {feriados.length} feriado(s) cadastrado(s)
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {feriados.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 opacity-40" />
                  <p className="text-sm">Nenhum feriado cadastrado</p>
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
                    {feriados.map((feriado) => (
                      <TableRow key={feriado.id}>
                        <TableCell className="font-medium">{feriado.data}</TableCell>
                        <TableCell>{feriado.descricao}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => removerFeriado(feriado.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Consultores */}
        <TabsContent value="consultores" className="mt-4 space-y-4">
          {/* Formulário de adicionar consultor */}
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
                    <Label htmlFor="consultor-crm">Código PowerCRM</Label>
                    <Input
                      id="consultor-crm"
                      placeholder="Ex: 12345"
                      {...consultorForm.register("codigoPowerCRM")}
                    />
                    {consultorForm.formState.errors.codigoPowerCRM && (
                      <p className="text-xs text-red-500">{consultorForm.formState.errors.codigoPowerCRM.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultor-coop">ID Cooperativa</Label>
                    <Input
                      id="consultor-coop"
                      placeholder="Ex: 1317"
                      {...consultorForm.register("idCooperativa")}
                    />
                    {consultorForm.formState.errors.idCooperativa && (
                      <p className="text-xs text-red-500">{consultorForm.formState.errors.idCooperativa.message}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={salvandoConsultor} className="gap-2">
                  {salvandoConsultor ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Cadastrar Consultor
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de consultores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consultores Cadastrados</CardTitle>
              <p className="text-xs text-muted-foreground">
                {consultores.filter((c) => c.ativo).length} consultor(es) disponível(is) para atribuição automática
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {consultores.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Users className="h-8 w-8 opacity-40" />
                  <p className="text-sm">Nenhum consultor cadastrado</p>
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
                    {consultores.map((consultor) => (
                      <TableRow key={consultor.id}>
                        <TableCell className="font-medium">{consultor.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{consultor.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{consultor.codigoPowerCRM}</Badge>
                        </TableCell>
                        <TableCell>{consultor.idCooperativa}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={consultor.ativo}
                              onCheckedChange={() => alternarStatusConsultor(consultor.id)}
                            />
                            <span className={`text-xs font-medium ${consultor.ativo ? "text-emerald-600" : "text-muted-foreground"}`}>
                              {consultor.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => toast.info("Edição em breve.")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => removerConsultor(consultor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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