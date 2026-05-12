# Quadrados — Sistema de agendamento (barbearia)

Monorepo simples: aplicação **Next.js** na pasta [`web`](./web).

Repositório sugerido no GitHub: [Monzini93/Quadrados](https://github.com/Monzini93/Quadrados.git)

## O que está incluído

- **Cliente:** landing, lista de serviços, fluxo de agendamento (serviços → data → horário → nome/telefone), sem login.
- **Disponibilidade:** respeita dias da semana, fechamentos, bloqueios manuais, horários especiais por data, intervalo entre slots e conflitos com agendamentos confirmados; transação no banco para reduzir corrida entre dois clientes no mesmo horário.
- **WhatsApp:** após confirmar, abre `wa.me` com mensagem formatada para o número configurado no painel (integração via link — não exige API oficial da Meta).
- **Admin:** login, agendamentos (cancelar), grade semanal, fechamentos por data, bloqueios por intervalo, dias especiais de expediente, CRUD de serviços, número do WhatsApp e intervalo entre horários.

## Requisitos

- Node.js 20+
- Conta [Neon](https://neon.tech) (PostgreSQL) ou outro Postgres

## Configuração local (`web`)

1. Copie o exemplo de variáveis:

   ```bash
   cd web
   cp .env.example .env
   ```

2. Edite `.env`:

   - `DATABASE_URL` — string de conexão Postgres (Neon: use a URL com **SSL** e pooler se preferir).
   - `JWT_SECRET` — string longa e aleatória (mínimo 16 caracteres).
   - `SEED_ADMIN_PASSWORD` (opcional) — senha do usuário `admin` no seed; padrão `admin123` se omitido.

3. Aplicar schema e popular dados iniciais:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

4. Subir o servidor:

   ```bash
   npm run dev
   ```

5. Acessos:

   - Site: `http://localhost:3000`
   - Agendar: `/agendar`
   - Admin: `/admin/login` (usuário `admin`, senha conforme seed)

## Deploy na Vercel

1. Crie o projeto importando este repositório.
2. Defina o **Root Directory** como `web`.
3. Em **Environment Variables**, adicione pelo menos:

   - `DATABASE_URL`
   - `JWT_SECRET`

4. **Build Command** (recomendado para aplicar migrações no deploy):

   ```bash
   npm run build:vercel
   ```

5. Após o primeiro deploy, rode o seed **uma vez** (localmente apontando para o mesmo `DATABASE_URL` de produção, ou via `vercel env pull` + `npm run db:seed`), ou crie o admin manualmente no banco.

**Importante:** não commite `.env` nem cole senhas de banco em issues ou chats públicos. Para produção final do cliente, use um banco dedicado e credenciais novas.

## Push para o GitHub

Na pasta raiz do repositório (onde está este `README.md`):

```bash
git remote add origin https://github.com/Monzini93/Quadrados.git
git branch -M main
git push -u origin main
```

(Se o remoto já existir, use `git remote set-url origin ...`.)
