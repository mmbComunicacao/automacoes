/**
 * prisma.config.ts — Prisma 7
 *
 * No Prisma 7, a datasource é configurada aqui (não mais no schema.prisma).
 *
 * Schema do banco: "automacoes"
 * O parâmetro `search_path` na connection string aponta o Prisma para o schema
 * correto. Sem isso, ele usaria o schema "public" por padrão.
 *
 * - DIRECT_URL : conexão direta (sem PgBouncer) — usada para migrations e db push
 * - DATABASE_URL: connection pooling via PgBouncer — usada em runtime pelo adapter
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Injeta search_path=automacoes na URL direta para que o Prisma
// opere no schema correto ao rodar migrations ou db push
const directUrlWithSchema = process.env.DIRECT_URL
  ? `${process.env.DIRECT_URL}&search_path=automacoes`
  : undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrlWithSchema!,
  },
});
