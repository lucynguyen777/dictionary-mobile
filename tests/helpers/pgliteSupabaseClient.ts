import type { PGlite } from '@electric-sql/pglite';

import type { SupabaseSyncRuntimeClient } from '../../data/supabaseSyncRuntimeAdapter';
import { asRole } from './supabaseTestDatabase';

const JSON_COLUMNS = new Set(['notification_preferences', 'tags', 'retrieval_settings']);

// Postgres timestamps come back as Date; PostgREST would send ISO strings with an explicit offset.
function toPostgrestValue(value: unknown) {
  return value instanceof Date ? value.toISOString().replace('Z', '+00:00') : value;
}

function toPostgrestRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, toPostgrestValue(value)]));
}

/**
 * The slice of supabase-js the sync adapter uses, executed against PGlite as the `authenticated`
 * role for one user, so RLS and grants apply exactly as they would through PostgREST.
 */
export function createPgliteSupabaseClient(db: PGlite, userId: string): SupabaseSyncRuntimeClient {
  const runSelect = async (table: string, since: string | null, count: number) => {
    try {
      const rows = await asRole(db, 'authenticated', userId, async (tx) => {
        const result = since
          ? await tx.query<Record<string, unknown>>(
              `select * from public.${table} where synced_at >= $1 order by synced_at asc limit ${count}`,
              [since]
            )
          : await tx.query<Record<string, unknown>>(`select * from public.${table} order by synced_at asc limit ${count}`);
        return result.rows;
      });
      return { data: rows.map(toPostgrestRow), error: null };
    } catch (error) {
      return { data: null, error: { message: (error as Error).message } };
    }
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: userId } } }, error: null }),
    },
    from: (table: string) => ({
      select: () => ({
        gte: (_column: string, value: string) => ({
          order: () => ({ limit: (count: number) => runSelect(table, value, count) }),
        }),
        order: () => ({ limit: (count: number) => runSelect(table, null, count) }),
      }),
      upsert: async (rows: Record<string, unknown>[], options?: { onConflict?: string }) => {
        try {
          // Each upsert commits, like a PostgREST request.
          await db.transaction(async (tx) => {
            await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
            await tx.exec('set local role authenticated');
            for (const row of rows) {
              const columns = Object.keys(row);
              const values = columns.map((column) =>
                JSON_COLUMNS.has(column) ? JSON.stringify(row[column]) : row[column]
              );
              const conflict = options?.onConflict ?? 'user_id,id';
              const conflictColumns = conflict.split(',');
              const updates = columns
                .filter((column) => !conflictColumns.includes(column))
                .map((column) => `${column} = excluded.${column}`)
                .join(', ');
              await tx.query(
                `insert into public.${table} (${columns.join(', ')})
                 values (${columns.map((_, index) => `$${index + 1}`).join(', ')})
                 on conflict (${conflict}) do update set ${updates}`,
                values
              );
            }
          });
          return { data: [], error: null };
        } catch (error) {
          return { data: null, error: { message: (error as Error).message } };
        }
      },
    }),
  };
}
