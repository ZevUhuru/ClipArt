#!/bin/bash

# Test script for email signup API
# Usage: ./test-email-signup.sh

echo "🧪 Testing Email Waitlist API..."
echo ""

# Test 1: Valid email signup
echo "Test 1: Valid email submission"
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Invalid email format
echo "Test 2: Invalid email format"
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","source":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: Missing email
echo "Test 3: Missing email"
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"source":"test"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 4: Duplicate email (should update timestamp)
echo "Test 4: Duplicate email"
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"test-duplicate"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ Tests complete!"
echo ""
echo "To run the dev server: npm run dev"
echo "To view collected emails: http://localhost:3000/admin/waitlist"
