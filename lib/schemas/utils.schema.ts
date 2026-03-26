import { z } from "zod";

// Validação de CPF (formato apenas — verificação de dígitos pode ser adicionada)
export const cpfSchema = z
  .string()
  .min(11, "CPF inválido")
  .max(14, "CPF inválido")
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido");