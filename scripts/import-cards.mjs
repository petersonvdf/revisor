// Envia os cards do arquivo local (data/cards.json) para o Upstash Redis.
// Uso: npm run import-cards   (lê as credenciais de .env.local)
import fs from "node:fs";
import { Redis } from "@upstash/redis";

const file = process.env.DATA_FILE ?? "data/cards.json";
const key = process.env.REDIS_CARDS_KEY ?? "revisor:cards";

if (!fs.existsSync(file)) {
  console.error(`Arquivo ${file} não encontrado.`);
  process.exit(1);
}
const cards = JSON.parse(fs.readFileSync(file, "utf8"));
if (cards.length === 0) {
  console.log("Nenhum card para importar.");
  process.exit(0);
}

const redis = Redis.fromEnv();
await redis.hset(key, Object.fromEntries(cards.map((c) => [c.id, c])));
console.log(`${cards.length} card(s) importado(s). Total no Redis: ${await redis.hlen(key)}.`);
