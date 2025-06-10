import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL deve ser configurado. Verifique as variáveis de ambiente."
  );
}

// Criando pool de conexões para PostgreSQL local
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Criando instância do Drizzle ORM
export const db = drizzle(pool, { schema });
