# GeoSafe Windows Setup Script
# Run this script in PowerShell to set up the project

Write-Host "🚀 Setting up GeoSafe for development..." -ForegroundColor Cyan

# Check if .env.local exists
if (-Not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    
    # Generate secure keys
    $nextAuthSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    $encryptionKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    $envContent = @"
# Database Configuration
# For PostgreSQL (recommended):
DATABASE_URL="postgresql://username:password@localhost:5432/geosafe?schema=public"

# For SQLite (easier for local development):
# First, update prisma/schema.prisma to use: provider = "sqlite"
# Then use: DATABASE_URL="file:./dev.db"

# NextAuth.js Configuration
NEXTAUTH_SECRET="$nextAuthSecret"
NEXTAUTH_URL="http://localhost:3000"

# Encryption Configuration (32 characters)
ENCRYPTION_KEY="$encryptionKey"

# Admin User Configuration
ADMIN_EMAIL="admin@geosafe.com"
ADMIN_PASSWORD="admin123"

# Environment
NODE_ENV="development"
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding utf8
    Write-Host "✅ .env.local created! Please update DATABASE_URL with your database credentials." -ForegroundColor Green
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Write-Host "✅ pnpm found" -ForegroundColor Green
    pnpm install
} else {
    Write-Host "⚠️  pnpm not found. Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ pnpm installed successfully" -ForegroundColor Green
        pnpm install
    } else {
        Write-Host "❌ Failed to install pnpm. Please install manually: npm install -g pnpm" -ForegroundColor Red
        Write-Host "   Or use npm instead: npm install" -ForegroundColor Yellow
        exit 1
    }
}

# Generate Prisma client
Write-Host "`n🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Check if database is configured
Write-Host "`n🗄️  Database setup..." -ForegroundColor Yellow
Write-Host "⚠️  Please ensure your database is running and DATABASE_URL is correct in .env.local" -ForegroundColor Yellow
Write-Host "   Then run: npx prisma db push" -ForegroundColor Cyan

# Create admin user
Write-Host "`n👤 To create admin user, run:" -ForegroundColor Yellow
Write-Host "   npx tsx scripts/create-admin.ts" -ForegroundColor Cyan

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update DATABASE_URL in .env.local" -ForegroundColor White
Write-Host "   2. Run: npx prisma db push" -ForegroundColor White
Write-Host "   3. Run: npx tsx scripts/create-admin.ts" -ForegroundColor White
Write-Host "   4. Run: pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "👤 Default admin credentials:" -ForegroundColor Cyan
Write-Host "   Email: admin@geosafe.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White

