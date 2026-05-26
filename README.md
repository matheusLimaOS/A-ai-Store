# Império do Açaí — E-commerce Fullstack

Monorepo com **React + Vite + TypeScript + Tailwind**, **Node + Express + TypeScript**, **PostgreSQL + Prisma**, **JWT (access + refresh)**, **Docker Compose** e painel administrativo com RBAC.

## Estrutura

```
/backend        API REST, Prisma, Swagger em /api/docs
/frontend       SPA (cliente + admin)
docker-compose.yml
```

## Rodar com Docker (recomendado)

```bash
cp .env.example .env   # opcional: ajuste segredos
docker compose up --build
```

- **Site (Nginx + SPA):** http://localhost:8080 — proxy de `/api` e `/uploads` para o backend.  
- **API direta (opcional):** http://localhost:4000  
- **Postgres (host):** `localhost:5433` — usuário/senha no `.env.example` da raiz (`POSTGRES_PORT=5433`)

Na **primeira subida**, o backend aplica migrations. Para popular dados de exemplo:

```bash
docker compose exec backend npx prisma db seed
```

No final do seed deve aparecer **`[seed] Verificação admin ... -> OK`**. Se aparecer **FALHA**, o hash não bate com `Admin@123` — rode o seed novamente após `migrate deploy`.

### Contas de demonstração (após seed)

| Papel  | E-mail                    | Senha      |
|--------|---------------------------|------------|
| Admin  | admin@imperioacai.com.br  | Admin@123  |
| Cliente | cliente@imperioacai.com.br | Cliente@123 |

## Debug local (Postgres no Docker + API na máquina)

Útil para breakpoints no VS Code e logs claros (`NODE_ENV=development` no `backend/.env`).

1. **Só o Postgres:** na raiz, `docker compose up postgres -d`
2. **`backend/.env`:** `DATABASE_URL=...@localhost:5433/...` (mesma porta do `POSTGRES_PORT` do `.env` da raiz)
3. **Backend:** `cd backend && npm install && npx prisma migrate deploy && npx prisma db seed && npm run dev`  
   - Com inspetor: `npm run dev:debug` e no VS Code use **Run and Debug** → `Backend: API (debug)` ou anexe em **9229** (`Backend: anexar (porta 9229)`).
4. **Frontend:** `cd frontend && npm run dev` → http://localhost:5173  

   No `frontend/.env`, defina **`DEV_API_PROXY_TARGET=http://localhost:4001`** (ou a porta do seu `backend/.env` → `PORT`). O Vite encaminha `/api` para esse endereço. No DevTools as requisições aparecem em **:5173** porque o browser só fala com o Vite; o encaminhamento para a API é feito no Node.

### Celular com cloudflared (túnel)

O Vite, por padrão, gera URLs em **`http://localhost:5173`** para módulos e para o **WebSocket do HMR**. No celular, `localhost` é o próprio aparelho — daí **`net::ERR_EMPTY_RESPONSE`** e **“failed to connect to websocket”**.

1. Suba o frontend com `host: 0.0.0.0` (já está no `vite.config.ts`).
2. Em outro terminal: `cloudflared tunnel --url http://localhost:5173` e copie o hostname (ex. `https://algo.trycloudflare.com` → use só **`algo.trycloudflare.com`**).
3. No `frontend/.env` defina **`DEV_TUNNEL_HOST=algo.trycloudflare.com`** (sem `https://`).
4. **Reinicie** o `npm run dev` do Vite (ele lê o `.env` na subida).

Cada execução rápida do cloudflared costuma mudar o hostname; atualize `DEV_TUNNEL_HOST` e reinicie o Vite quando mudar.

### Login com "Credenciais inválidas"

- Ao rodar o seed, confira no final: **`[seed] Verificação admin ... -> OK`**.
- Logs: `docker compose logs -f backend` ou o terminal do `npm run dev` — evento **`auth_login_failed`** com `reason`: `user_not_found`, `user_blocked` ou `invalid_password`.
- E-mail do admin: **`admin@imperioacai.com.br`** / senha **`Admin@123`**.

## Desenvolvimento local (sem Docker)

### Banco

Suba um PostgreSQL e defina `DATABASE_URL` em `backend/.env` (veja `backend/.env.example`).

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

- API: http://localhost:4000  
- Swagger: http://localhost:4000/api/docs  
- Health: http://localhost:4000/api/health  

### Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev
```

O `vite.config.ts` faz proxy de `/api` e `/uploads` para o backend em desenvolvimento.

## Scripts úteis

| Onde     | Comando        | Descrição        |
|----------|----------------|------------------|
| backend  | `npm run dev`  | API com hot reload (`tsx`) |
| backend  | `npm run dev:debug` | API com `--inspect` na porta **9229** (VS Code: anexar) |
| backend  | `npm run build` / `npm start` | Produção |
| backend  | `npm run prisma:studio` | Prisma Studio |
| frontend | `npm run dev`  | Vite             |
| frontend | `npm run build`| Build produção   |
| raiz     | `npm run lint` | ESLint backend + frontend (requer `npm install` na raiz) |

## Funcionalidades principais

- **Cliente:** cadastro, login, logout, refresh token, recuperação simples de senha (link em log no modo dev), catálogo com categorias, busca, montagem de açaí (tamanhos 300ml–1L, complementos com limite grátis + extras), carrinho persistido (Zustand), checkout (endereço, pagamento PIX/Cartão/Dinheiro, cupom), histórico e detalhe de pedido com **atualização periódica** (React Query).
- **Admin (JWT + role ADMIN):** dashboard com totais e gráficos, listagens de produtos/categorias/pedidos/usuários/cupons, alteração de status de pedido, impressão HTML do pedido (via botão no painel).
- **API:** camadas controllers / services / repositories, validação Zod nos controllers, tratamento global de erros, logs JSON, upload Multer servindo `/uploads`.

## Husky / Prettier (raiz)

Na raiz do repositório:

```bash
npm install
```

O script `prepare` tenta inicializar o Husky de forma tolerante a ambientes sem CLI instalada.

## Segurança em produção

Altere `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, credenciais do Postgres e URLs em `.env` / variáveis do Compose **antes** de expor publicamente.

## Licença

Projeto de exemplo — adapte políticas e integrações (pagamento, e-mail, etc.) antes de produção.
