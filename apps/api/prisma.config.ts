import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
    // Optional: only needed if your DB user cannot create a shadow DB/schema during migrations
    // shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
