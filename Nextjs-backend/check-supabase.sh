#!/bin/bash

# Check Supabase configuration script

echo "Checking Supabase configuration..."
echo "=================================="

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo "Please create a .env file based on .env.example"
  exit 1
fi

# Source env variables
set -a
source .env
set +a

# Check required variables
if [ -z "$SUPABASE_URL" ]; then
  echo "❌ SUPABASE_URL is not set in .env file"
  MISSING=1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_KEY is not set in .env file"
  MISSING=1
fi

if [ -z "$SUPABASE_STORAGE_BUCKET" ]; then
  echo "❌ SUPABASE_STORAGE_BUCKET is not set in .env file"
  MISSING=1
fi

if [ ! -z "$MISSING" ]; then
  echo "Please set the missing environment variables in your .env file"
  exit 1
fi

echo "✅ Supabase environment variables are set"
echo "Supabase URL: $SUPABASE_URL"
echo "Supabase Bucket: $SUPABASE_STORAGE_BUCKET"
echo "Service Key is set: Yes"

# Run the test script
echo -e "\nRunning Supabase connection test with Node.js..."
node src/test-document.js

echo "Configuration check complete" 