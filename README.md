<p align="center">
  <img src="public/logo.svg" alt="Logo do Revisor: um gato de óculos revisando um texto" width="128">
</p>

# revisor
Projeto que auxilia na revisão de conteúdos estudados.

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento: http://localhost:3000
# ou
npm run build && npm start
```

## Seções

- **Revisar hoje** (`/`): mostra os cards cuja revisão é hoje (ou está atrasada), em ordem aleatória e um por vez. Ao clicar em **Revisão concluída**, o sistema calcula a próxima data e o card sai da lista. Só os cards dessa lista podem ser editados ou excluídos.
- **Novo card** (`/novo`): editor de texto com tamanho da letra, negrito, itálico, sublinhado, tachado, cor do texto, destaque, títulos, listas, citação e alinhamento.

## Estratégia de revisão

Baseada no SuperMemo SM-0 (Piotr Wozniak), que deriva da curva do esquecimento de Ebbinghaus:

| Revisão concluída | Próxima revisão em |
| --- | --- |
| 1ª (no dia da criação) | 1 dia |
| 2ª | 7 dias |
| 3ª | 16 dias |
| 4ª | 35 dias |
| 5ª em diante | intervalo anterior × 2 (70, 140, 280…) |

O intervalo conta a partir do dia em que a revisão foi concluída. Os intervalos ficam em `src/lib/schedule.ts`.

## Onde os cards ficam guardados

O código escolhe o armazenamento sozinho (`src/lib/storage.ts`):

| Ambiente | Armazenamento |
| --- | --- |
| Vercel (produção) | **Upstash Redis**. Os cards sobrevivem a novos deploys. |
| Local (`npm run dev`) | Memória + arquivo `data/cards.json` (fica no `.gitignore`; o caminho pode ser trocado com `DATA_FILE`) |

Se as variáveis do Redis existirem, ele é usado em qualquer ambiente. Na Vercel sem Redis, o sistema mostra um erro em vez de perder dados silenciosamente.

### Configurar na Vercel (uma vez só)

1. No projeto na Vercel, abra **Storage → Create Database → Upstash for Redis** (plano gratuito) e conecte ao projeto, marcando todos os ambientes.
2. A integração cria as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` automaticamente.
3. Faça um novo deploy (ou um novo commit).

### Levar cards locais para o Redis (opcional)

```bash
npx vercel env pull .env.local   # baixa as credenciais do Redis
npm run import-cards             # envia data/cards.json para o Redis
```

Com o `.env.local` presente, o `npm run dev` local também passa a usar o mesmo Redis da produção.

## Observações

- Atrás de proxy (ex.: GitHub Codespaces), o Next.js bloqueia Server Actions quando o `Origin` do navegador difere do host do servidor. Os endereços do Codespace (portas 3000/3001) já vêm liberados em `next.config.ts`. Para outros domínios, defina `ALLOWED_ORIGINS=dominio1.com,dominio2.com`.
- O "hoje" usa o fuso `America/Sao_Paulo`. Para mudar, defina a variável de ambiente `APP_TIMEZONE`.
