# Render Deployment Setup Guide

## Important: SQLite on Render

⚠️ **Warning**: Render's filesystem is **ephemeral**, meaning your SQLite database will be **lost on every redeploy**. 

### Recommended: Use PostgreSQL
For production, use PostgreSQL instead of SQLite. Render provides managed PostgreSQL databases.

### If You Must Use SQLite

For SQLite on Render, you need to:

1. **Use an absolute path** in your `DATABASE_URL`:
   ```
   DATABASE_URL="file:/tmp/geosafe.db"
   ```
   Or use the project directory:
   ```
   DATABASE_URL="file:/opt/render/project/src/prisma/dev.db"
   ```

2. **Create the database directory** in your build command:
   ```bash
   mkdir -p prisma && pnpm install --frozen-lockfile && pnpm run build
   ```

3. **Initialize database** in Pre-Deploy Command:
   ```bash
   npx prisma generate && npx prisma db push
   ```

## Environment Variables for Render

Set these in your Render dashboard:

```
DATABASE_URL="file:/tmp/geosafe.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-app.onrender.com"
ENCRYPTION_KEY="your-32-character-encryption-key"
ADMIN_EMAIL="admin@geosafe.com"
ADMIN_PASSWORD="admin123"
NODE_ENV="production"
PORT=10000
```

**Important**: 
- Replace `https://your-app.onrender.com` with your actual Render URL
- Generate new secure keys for production (don't use the example values)
- The database file will be lost on redeploy with SQLite

## Build Configuration

- **Build Command**: `pnpm install --frozen-lockfile; pnpm run build`
- **Start Command**: `pnpm run start`
- **Pre-Deploy Command** (optional): `npx prisma generate && npx prisma db push && npx tsx scripts/create-admin.ts`

## PostgreSQL Setup (Recommended)

If you switch to PostgreSQL:

1. Create a PostgreSQL database in Render
2. Get the connection string
3. Update `DATABASE_URL` to: `postgresql://user:password@host:port/database`
4. Update `prisma/schema.prisma` to use `provider = "postgres"`
5. Run migrations: `npx prisma db push`

