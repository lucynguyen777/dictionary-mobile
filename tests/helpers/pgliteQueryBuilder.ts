import type { PGlite } from '@electric-sql/pglite';

type Filter = { op: 'eq' | 'like' | 'is' | 'in'; column: string; value: unknown };
type Result = { data: Record<string, unknown>[] | null; error: { code?: string; message: string } | null };

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;
function ident(name: string) {
  if (!IDENTIFIER.test(name)) throw new Error(`Unsafe identifier: ${name}`);
  return name;
}

function toPostgrest(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]));
}

/**
 * A small supabase-js style query builder (select/eq/like/is/in/order, upsert, delete) that runs each
 * request as the `authenticated` role for one user in its own committed transaction, so RLS and
 * grants apply as they would through PostgREST.
 */
export function createPgliteQueryClient(db: PGlite, userId: string) {
  const run = async (sql: string, params: unknown[]): Promise<Result> => {
    try {
      const rows = await db.transaction(async (tx) => {
        await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
        await tx.exec('set local role authenticated');
        return (await tx.query<Record<string, unknown>>(sql, params)).rows;
      });
      return { data: rows.map(toPostgrest), error: null };
    } catch (error) {
      return { data: null, error: { code: (error as { code?: string }).code, message: (error as Error).message } };
    }
  };

  const whereClause = (filters: Filter[], params: unknown[]) => {
    const parts = filters.map(({ column, op, value }) => {
      if (op === 'is') return `${ident(column)} is null`;
      if (op === 'in') {
        const list = (value as unknown[]).map((item) => {
          params.push(item);
          return `$${params.length}`;
        });
        return list.length ? `${ident(column)} in (${list.join(', ')})` : 'false';
      }
      params.push(value);
      return `${ident(column)} ${op === 'eq' ? '=' : 'like'} $${params.length}`;
    });
    return parts.length ? ` where ${parts.join(' and ')}` : '';
  };

  const filterable = <T extends object>(filters: Filter[], extra: T, execute: () => Promise<Result>) => {
    const builder: any = {
      ...extra,
      eq: (column: string, value: unknown) => (filters.push({ column, op: 'eq', value }), builder),
      in: (column: string, value: unknown[]) => (filters.push({ column, op: 'in', value }), builder),
      is: (column: string, value: null) => (filters.push({ column, op: 'is', value }), builder),
      like: (column: string, value: string) => (filters.push({ column, op: 'like', value }), builder),
      then: (resolve: (value: Result) => unknown, reject: (error: unknown) => unknown) => execute().then(resolve, reject),
    };
    return builder;
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: userId } } }, error: null }),
    },
    from(table: string) {
      return {
        delete() {
          const filters: Filter[] = [];
          return filterable(filters, {}, () => {
            const params: unknown[] = [];
            return run(`delete from public.${ident(table)}${whereClause(filters, params)} returning *`, params);
          });
        },
        select(columns = '*') {
          const filters: Filter[] = [];
          let orderBy = '';
          const cols = columns === '*' ? '*' : columns.split(',').map((column) => ident(column.trim())).join(', ');
          const builder = filterable(filters, {
            order: (column: string, options?: { ascending?: boolean }) => {
              orderBy = ` order by ${ident(column)} ${options?.ascending === false ? 'desc' : 'asc'}`;
              return builder;
            },
          }, () => {
            const params: unknown[] = [];
            return run(`select ${cols} from public.${ident(table)}${whereClause(filters, params)}${orderBy}`, params);
          });
          return builder;
        },
        async upsert(rows: Record<string, unknown>[], options?: { onConflict?: string }) {
          if (!rows.length) return { data: [], error: null };
          const columns = Object.keys(rows[0]).map(ident);
          const params: unknown[] = [];
          const values = rows.map((row) => `(${columns.map((column) => {
            params.push(row[column]);
            return `$${params.length}`;
          }).join(', ')})`);
          const conflict = (options?.onConflict ?? 'id').split(',').map((column) => ident(column.trim()));
          const updates = columns.filter((column) => !conflict.includes(column)).map((column) => `${column} = excluded.${column}`);
          return run(
            `insert into public.${ident(table)} (${columns.join(', ')}) values ${values.join(', ')} `
              + `on conflict (${conflict.join(', ')}) do update set ${updates.join(', ')} returning *`,
            params
          );
        },
      };
    },
  };
}
