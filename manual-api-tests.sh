#!/bin/bash

# MANUAL API ERROR HANDLING TESTS
# Simple curl commands to test commercial property API error handling
#
# Usage: chmod +x manual-api-tests.sh && ./manual-api-tests.sh
#
# Prerequisites: Portal server running on localhost:3000

echo "🏢 COMMERCIAL PROPERTY API ERROR HANDLING TESTS"
echo "==============================================="
echo "Testing API error handling with curl commands..."
echo ""

API_URL="http://localhost:3000/api/properties/create"

# Test 1: Missing required commercial_type field
echo "📋 Test 1: Missing commercial_type (required field)"
echo "Expected: 400 error with validation message"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "property_category": "commercial",
    "commercial_type": "",
    "property_type": "Office",
    "listing_type": "lease",
    "title": "Test Property Missing Type",
    "description": "Test description",
    "price": 100000,
    "region": "Demerara-Mahaica",
    "city": "Georgetown"
  }' \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null
echo ""
echo "----------------------------------------"

# Test 2: Invalid floor_size_sqft data type
echo "📋 Test 2: Invalid floor_size_sqft data type"
echo "Expected: 400 error or type conversion handling"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "property_category": "commercial",
    "commercial_type": "Office",
    "property_type": "Office",
    "listing_type": "lease",
    "title": "Test Invalid Floor Size",
    "price": 100000,
    "floor_size_sqft": "not-a-number",
    "region": "Demerara-Mahaica",
    "city": "Georgetown"
  }' \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null
echo ""
echo "----------------------------------------"

# Test 3: Negative parking spaces
echo "📋 Test 3: Negative parking spaces"
echo "Expected: 400 error or validation handling"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "property_category": "commercial",
    "commercial_type": "Warehouse",
    "property_type": "Warehouse",
    "listing_type": "sale",
    "title": "Test Negative Parking",
    "price": 500000,
    "parking_spaces": -5,
    "region": "Demerara-Mahaica",
    "city": "Georgetown"
  }' \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null
echo ""
echo "----------------------------------------"

# Test 4: Mixed category - commercial with residential property_type
echo "📋 Test 4: Mixed category (commercial + residential type)"
echo "Expected: 400 error or category validation"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "property_category": "commercial",
    "commercial_type": "Office",
    "property_type": "House",
    "listing_type": "sale",
    "title": "Mixed Category Test",
    "price": 200000,
    "region": "Demerara-Mahaica",
    "city": "Georgetown"
  }' \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null
echo ""
echo "----------------------------------------"

# Test 5: Missing required title field
echo "📋 Test 5: Missing title (global required field)"
echo "Expected: 400 error with validation message"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "property_category": "commercial",
    "commercial_type": "Office",
    "property_type": "Office",
    "listing_type": "lease",
    "title": "",
    "description": "Test description",
    "price": 100000
  }' \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null
echo ""
echo "----------------------------------------"

# Test 6: Boundary test - very large floor size
echo "📋 Test 6: Boundary test - very large floor size"
echo "Expected: 200 success or reasonable limit handling"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "property_category": "commercial",
    "commercial_type": "Warehouse",
    "property_type": "Warehouse",
    "listing_type": "sale",
    "title": "Huge Warehouse Test",
    "price": 1000000,
    "floor_size_sqft": 99999999,
    "region": "Demerara-Mahaica",
    "city": "Georgetown"
  }' \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null
echo ""
echo "----------------------------------------"

# Test 7: Zero parking spaces (boundary case)
echo "📋 Test 7: Zero parking spaces (boundary case)"
echo "Expected: 200 success (zero should be valid)"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "property_category": "commercial",
    "commercial_type": "Office",
    "property_type": "Office",
    "listing_type": "lease",
    "title": "No Parking Office",
    "price": 80000,
    "parking_spaces": 0,
    "region": "Demerara-Mahaica",
    "city": "Georgetown"
  }' \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null
echo ""
echo "=========================================="

echo ""
echo "🎯 MANUAL TESTING SUMMARY:"
echo "• Most tests will return 401 (Unauthorized) due to missing authentication"
echo "• Look for validation errors (400 status) vs auth errors (401 status)"
echo "• 400 errors with validation messages indicate good error handling"
echo "• 500 errors indicate server-side issues that need fixing"
echo ""
echo "✅ GOOD RESPONSES: 400 with clear error messages, 401 for auth"
echo "❌ BAD RESPONSES: 500 server errors, unclear error messages"