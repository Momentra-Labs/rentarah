# Models

PostgreSQL tables and relations are defined in **`prisma/schema.prisma`** at the backend root. Prisma CLI expects that path; this folder is the logical “models” layer for the codebase.

- Run `npm run db:migrate` after editing the schema to create/apply migrations (similar to `php artisan migrate`).
- Import the generated client from `@prisma/client` or use the singleton in `src/lib/prisma.ts`.

Optional: add `index.ts` here to re-export Prisma model types for your domain layer.
