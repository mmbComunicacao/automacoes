import { z } from "zod";

// Schema para buscar alteracoes de associados
export const buscarAlteracoesAssociadoSchema = z.object({
  data_inicial: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data inválida").optional(),
  data_final: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data inválida").optional(),
  campos: z.array(z.string()),
});

export type BuscarAlteracoesAssociadoFormData = z.infer<typeof buscarAlteracoesAssociadoSchema>;
