import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const createPrismaClient = () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 2,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
};

export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = db;
}

