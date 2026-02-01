#!/bin/bash
# Run this script to setup the promo codes table in the database

echo "Setting up promo codes table..."

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "MySQL client not found. Please install MySQL client."
    exit 1
fi

# Database connection details (update these as needed)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-gamespot_booking}"
DB_USER="${DB_USER:-root}"

echo "Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT"
echo "Running migration script..."

# Run the migration
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < database/promo_codes_migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Promo codes table setup successfully!"
else
    echo "❌ Failed to setup promo codes table. Check your database connection."
    exit 1
fi
