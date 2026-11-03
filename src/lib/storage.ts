import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { Card } from "./db";

/** Operações mínimas de armazenamento: cada card é guardado por id. */
export interface CardStorage {
  all(): Promise<Card[]>;
  get(id: string): Promise<Card | undefined>;
  put(card: Card): Promise<void>;
  remove(id: string): Promise<boolean>;
}

/**
 * Upstash Redis: usado em produção (Vercel). Todos os cards ficam num único
 * hash (id → card). Lê as credenciais de KV_REST_API_URL/KV_REST_API_TOKEN
 * (nomes criados pela integração da Vercel) ou UPSTASH_REDIS_REST_URL/TOKEN.
 */
class RedisStorage implements CardStorage {
  private redis = Redis.fromEnv();
  private key = process.env.REDIS_CARDS_KEY ?? "revisor:cards";

  async all() {
    const map = await this.redis.hgetall<Record<string, Card>>(this.key);
    return map ? Object.values(map) : [];
  }
  async get(id: string) {
    return (await this.redis.hget<Card>(this.key, id)) ?? undefined;
  }
  async put(card: Card) {
    await this.redis.hset(this.key, { [card.id]: card });
  }
  async remove(id: string) {
    return (await this.redis.hdel(this.key, id)) > 0;
  }
}

/**
 * Memória + arquivo JSON: usado no desenvolvimento local. As leituras usam a
 * memória, e cada alteração regrava data/cards.json (ou DATA_FILE).
 */
class FileStorage implements CardStorage {
  private file = path.resolve(
    process.env.DATA_FILE ?? path.join(process.cwd(), "data", "cards.json"),
  );
  private cards: Map<string, Card>;

  constructor() {
    // Fica no globalThis para sobreviver ao hot reload em desenvolvimento.
    const g = globalThis as unknown as { __revisorDb?: Map<string, Card> };
    this.cards = g.__revisorDb ??= this.load();
    if (this.cards.size > 0 && !fs.existsSync(this.file)) this.save();
  }

  private load(): Map<string, Card> {
    try {
      const list = JSON.parse(fs.readFileSync(this.file, "utf8")) as Card[];
      return new Map(list.map((c) => [c.id, c]));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return new Map();
      // Arquivo corrompido: não sobrescreve, para não perder dados.
      throw new Error(`Não foi possível ler ${this.file}: ${(err as Error).message}`);
    }
  }

  /** Grava em arquivo temporário e renomeia, para nunca deixar o JSON pela metade. */
  private save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify([...this.cards.values()], null, 2));
    fs.renameSync(tmp, this.file);
  }

  async all() {
    return [...this.cards.values()];
  }
  async get(id: string) {
    return this.cards.get(id);
  }
  async put(card: Card) {
    this.cards.set(card.id, card);
    this.save();
  }
  async remove(id: string) {
    const removed = this.cards.delete(id);
    if (removed) this.save();
    return removed;
  }
}

export const hasRedisConfig = Boolean(
  (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
);

function createStorage(): CardStorage {
  if (hasRedisConfig) return new RedisStorage();
  if (process.env.VERCEL) {
    // Na Vercel o disco não é persistente: sem Redis, os cards se perderiam.
    throw new Error(
      "Banco de dados não configurado. Conecte um Upstash Redis ao projeto na Vercel (aba Storage).",
    );
  }
  return new FileStorage();
}

let storage: CardStorage | undefined;
/** Criado sob demanda, para não exigir as variáveis de ambiente durante o build. */
export function getStorage(): CardStorage {
  return (storage ??= createStorage());
}
