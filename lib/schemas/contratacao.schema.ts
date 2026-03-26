import { z } from "zod";
import { cpfSchema } from "./utils.schema";

// Schema de um dependente
export const dependenteSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  cpf: cpfSchema,
  parentesco: z.enum(["CONJUGE", "FILHO", "FILHA", "PAI", "MAE", "OUTRO"], {
    message: "Selecione o parentesco",
  }),
});

// Schema completo do formulário de contratação
export const contratacaoSchema = z.object({
  // Dados do titular
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  cpf: cpfSchema,
  email: z.string().email("E-mail inválido"),
  telefone: z
    .string()
    .min(10, "Telefone inválido")
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone inválido"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  endereco: z.string().min(5, "Endereço obrigatório"),
  numero: z.string().min(1, "Número obrigatório"),
  bairro: z.string().min(2, "Bairro obrigatório"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  estado: z.string().length(2, "UF inválida"),

  // Dependentes — array obrigatório (mínimo 0 itens)
  dependentes: z.array(dependenteSchema),
});

export type ContratacaoFormData = z.infer<typeof contratacaoSchema>;
export type DependenteFormData = z.infer<typeof dependenteSchema>;
