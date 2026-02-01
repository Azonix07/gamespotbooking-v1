# PowerShell script to setup promo codes table
# Run this on Windows: .\setup_promo_codes.ps1

Write-Host "Setting up promo codes table..." -ForegroundColor Cyan

# Database connection details
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "gamespot_booking" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "root" }

Write-Host "Connecting to database: $DB_NAME on ${DB_HOST}:${DB_PORT}" -ForegroundColor Yellow
Write-Host "Running migration script..." -ForegroundColor Yellow

# Get password securely
$DB_PASSWORD = Read-Host "Enter MySQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Run the migration
$migrationPath = Join-Path $PSScriptRoot "database\promo_codes_migration.sql"

try {
    $result = & mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$PlainPassword" $DB_NAME -e "source $migrationPath" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Promo codes table setup successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to setup promo codes table." -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
