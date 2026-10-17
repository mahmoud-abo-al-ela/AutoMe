// Ops role repository - what the connected database role may do
import type { PrismaClient } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

export interface RolePosture {
  /** The session starts read-only (`default_transaction_read_only` on the role). */
  readOnly: boolean;
  superuser: boolean;
  /** May create objects in the public schema. */
  canCreate: boolean;
  /** Tables, views and sequences in public it may INSERT, UPDATE, DELETE or TRUNCATE. */
  writable: string[];
}

export async function readRolePosture(client: Pick<PrismaClient, "$queryRaw"> = db): Promise<RolePosture> {
  const [row] = await client.$queryRaw<RolePosture[]>`
    SELECT
      current_setting('transaction_read_only') = 'on' AS "readOnly",
      (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS "superuser",
      has_schema_privilege('public', 'CREATE') AS "canCreate",
      ARRAY(
        SELECT c.relname::text
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
          AND (
            has_table_privilege(c.oid, 'INSERT') OR has_table_privilege(c.oid, 'UPDATE')
            OR has_table_privilege(c.oid, 'DELETE') OR has_table_privilege(c.oid, 'TRUNCATE')
          )
        ORDER BY 1
      ) AS "writable"`;
  return row;
}
