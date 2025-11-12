# GeoSafe Setup Guide

This guide will help you resolve common setup issues and get the project running.

## Quick Setup

### 1. Install Dependencies

```bash
pnpm install
```

If you don't have `pnpm`, install it first:
```bash
npm install -g pnpm
```

### 2. Create Environment File

Create a `.env.local` file in the root directory with the following content:

```env
# Database Configuration
# For PostgreSQL (recommended):
DATABASE_URL="postgresql://username:password@localhost:5432/geosafe?schema=public"

# For SQLite (easier for local development):
# First, update prisma/schema.prisma to use: provider = "sqlite"
# Then use: DATABASE_URL="file:./dev.db"

# NextAuth.js Configuration
NEXTAUTH_SECRET="c980b96491fb4b9d79be69f558d5eb82052d9b50c8a0035436367c6b51e142ee"
NEXTAUTH_URL="http://localhost:3000"

# Encryption Configuration (32 characters)
ENCRYPTION_KEY="c980b96491fb4b9d79be69f558d5eb8"

# Admin User Configuration
ADMIN_EMAIL="admin@geosafe.com"
ADMIN_PASSWORD="admin123"

# Environment
NODE_ENV="development"
```

**Important:** 
- Replace `username` and `password` in `DATABASE_URL` with your PostgreSQL credentials
- Or use SQLite for easier local development (see below)

### 3. Database Setup Options

#### Option A: PostgreSQL (Production-ready)

1. Install PostgreSQL on your system
2. Create a database:
   ```sql
   CREATE DATABASE geosafe;
   ```
3. Update `DATABASE_URL` in `.env.local` with your credentials
4. Run:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

#### Option B: SQLite (Easier for Development)

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env.local`:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. Run:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### 4. Install tsx (if not already installed)

The project uses `tsx` to run TypeScript scripts. Install it globally or as a dev dependency:

```bash
pnpm add -D tsx
```

Or globally:
```bash
npm install -g tsx
```

### 5. Create Admin User

```bash
npx tsx scripts/create-admin.ts
```

### 6. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Common Issues and Solutions

### Issue 1: Missing .env.local file

**Error:** `Environment variable not found` or `DATABASE_URL is not defined`

**Solution:** Create `.env.local` file as described in step 2 above.

### Issue 2: Database Connection Error

**Error:** `Can't reach database server` or `Connection refused`

**Solutions:**
- Verify PostgreSQL is running: `pg_isready` or check service status
- Check `DATABASE_URL` format is correct
- Try using SQLite for local development (see Option B above)
- For Docker: `docker-compose up -d postgres`

### Issue 3: Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
npx prisma generate
```

### Issue 4: tsx Command Not Found

**Error:** `tsx: command not found`

**Solution:**
```bash
pnpm add -D tsx
# or
npm install -g tsx
```

### Issue 5: Module Not Found Errors

**Error:** `Cannot find module` or `Module not found`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue 6: NextAuth Secret Missing

**Error:** `NEXTAUTH_SECRET is not set`

**Solution:** Add `NEXTAUTH_SECRET` to `.env.local` (see step 2)

### Issue 7: Encryption Key Issues

**Error:** `ENCRYPTION_KEY must be 32 characters`

**Solution:** Ensure `ENCRYPTION_KEY` in `.env.local` is exactly 32 characters

### Issue 8: Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
- Kill the process using port 3000
- Or change the port: `pnpm dev -- -p 3001`

## Using Docker (Alternative Setup)

If you prefer Docker:

```bash
# Start PostgreSQL and app
docker-compose up -d

# Create admin user
docker-compose exec app npx tsx scripts/create-admin.ts
```

## Verification

After setup, verify everything works:

1. **Check database connection:**
   ```bash
   npx prisma studio
   ```
   This opens Prisma Studio where you can view your database.

2. **Test API endpoints:**
   - Visit `http://localhost:3000/api/test/database` (if available)
   - Check browser console for errors

3. **Login:**
   - Go to `http://localhost:3000/auth/signin`
   - Use admin credentials from `.env.local`

## Next Steps

- Review the [README.md](./README.md) for more details
- Check API endpoints in `src/app/api/`
- Explore admin dashboard at `/admin`
- Explore user dashboard at `/user`

## Getting Help

If you encounter issues not covered here:
1. Check the [GitHub Issues](https://github.com/Abdullah-222/Geosafe/issues)
2. Review error messages in the terminal
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly

