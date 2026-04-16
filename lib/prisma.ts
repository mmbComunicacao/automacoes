/**
 * lib/prisma.ts
 *
 * Singleton do Prisma Client para uso em Server Components e API Routes.
 *
 * No Prisma 7, o engine type "client" requer um adapter de banco de dados.
 * Usamos @prisma/adapter-pg com o pg (node-postgres) para conectar ao Supabase.
 *
 * Em desenvolvimento, o Next.js faz hot-reload e recriaria uma nova instância
 * a cada mudança, esgotando as conexões do banco. O padrão de singleton via
 * `globalThis` evita esse problema.
 *
 * Ref: https://pris.ly/d/client-constructor
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Tipagem para o globalThis com a instância do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Cria uma nova instância do PrismaClient com o adapter PostgreSQL.
 * Usa DATABASE_URL para connection pooling via PgBouncer (runtime).
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("[Prisma] DATABASE_URL não está definida no .env");
  }

  // Pool de conexões via pg — o PrismaPg adapter faz a ponte com o Prisma 7
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

// Reutiliza a instância existente em dev, cria nova em prod
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Persiste a instância no globalThis apenas em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
