/**
 * prisma.config.ts — Prisma 7
 *
 * No Prisma 7, a datasource é configurada aqui (não mais no schema.prisma).
 * - DIRECT_URL : conexão direta ao banco (sem PgBouncer) — usada para migrations e db push
 * - DATABASE_URL: connection pooling via PgBouncer — usada em runtime pelo Prisma Client
 *
 * Nota: o Prisma 7 não aceita `directUrl` no defineConfig — apenas `url`.
 * O Prisma Client em runtime usa a DATABASE_URL do .env automaticamente.
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Conexão direta para migrations (evita timeout do PgBouncer)
    url: process.env.DIRECT_URL!,
  },
});
