import { NodePgDatabase } from "drizzle-orm/node-postgres";

type BaseSchema = Record<string, unknown>;

export interface QueryAPI {
  select: (...args: Parameters<NodePgDatabase<BaseSchema>["select"]>) => ReturnType<NodePgDatabase<BaseSchema>["select"]>;
  insert: (...args: Parameters<NodePgDatabase<BaseSchema>["insert"]>) => ReturnType<NodePgDatabase<BaseSchema>["insert"]>;
  update: (...args: Parameters<NodePgDatabase<BaseSchema>["update"]>) => ReturnType<NodePgDatabase<BaseSchema>["update"]>;
  delete: (...args: Parameters<NodePgDatabase<BaseSchema>["delete"]>) => ReturnType<NodePgDatabase<BaseSchema>["delete"]>;
}

export type AppDB<TSchema extends BaseSchema = BaseSchema> = NodePgDatabase<TSchema> & QueryAPI;




