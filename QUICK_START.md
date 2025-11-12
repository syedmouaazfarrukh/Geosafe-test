# GeoSafe Quick Start Guide

## 🚀 Fastest Way to Get Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed (or use SQLite for development)
- pnpm installed (`npm install -g pnpm`)

### Step 1: Clone and Navigate
```bash
git clone https://github.com/Abdullah-222/Geosafe.git
cd Geosafe
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Create Environment File

Create `.env.local` in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/geosafe?schema=public"
NEXTAUTH_SECRET="c980b96491fb4b9d79be69f558d5eb82052d9b50c8a0035436367c6b51e142ee"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="c980b96491fb4b9d79be69f558d5eb8"
ADMIN_EMAIL="admin@geosafe.com"
ADMIN_PASSWORD="admin123"
NODE_ENV="development"
```

**⚠️ Important:** Replace `username` and `password` in `DATABASE_URL` with your PostgreSQL credentials!

### Step 4: Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Create admin user
npx tsx scripts/create-admin.ts
```

### Step 5: Start Development Server

```bash
pnpm dev
```

### Step 6: Access Application

1. Open browser: `http://localhost:3000`
2. Go to: `http://localhost:3000/auth/signin`
3. Login with:
   - Email: `admin@geosafe.com`
   - Password: `admin123`

## 🐛 Common Issues

### "Cannot find module 'tsx'"
```bash
pnpm add -D tsx
```

### "DATABASE_URL is not defined"
- Make sure `.env.local` exists in the root directory
- Check that the file name is exactly `.env.local` (not `.env`)

### "Can't reach database server"
- Verify PostgreSQL is running
- Check `DATABASE_URL` credentials
- Try: `pg_isready` (PostgreSQL) or check service status

### Port 3000 already in use
```bash
pnpm dev -- -p 3001
```

## 📚 Need More Help?

- See [SETUP.md](./SETUP.md) for detailed setup instructions
- See [README.md](./README.md) for full documentation
- Check GitHub Issues for known problems

## ✅ Verification Checklist

- [ ] Dependencies installed (`pnpm install`)
- [ ] `.env.local` file created with correct values
- [ ] Database connection working (`npx prisma db push` succeeds)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Admin user created (`npx tsx scripts/create-admin.ts`)
- [ ] Development server starts (`pnpm dev`)
- [ ] Can access `http://localhost:3000`
- [ ] Can login with admin credentials

## 🎯 Next Steps

1. **Explore Admin Dashboard**: `/admin`
   - Create safe zones
   - Upload files
   - Manage users

2. **Explore User Dashboard**: `/user`
   - View accessible files
   - Test location-based access

3. **Read Documentation**: See [README.md](./README.md) for API endpoints and features

