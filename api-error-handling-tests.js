#!/usr/bin/env node

/**
 * API ERROR HANDLING TEST SUITE
 * Tests commercial property API edge cases and error handling
 * 
 * Usage: node api-error-handling-tests.js
 * 
 * Prerequisites:
 * - Portal server running on localhost:3000
 * - Valid authentication token or session
 */

const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/properties/create';

// Test results tracking
const testResults = {
  validationTests: [],
  edgeCaseTests: [],
  mixedCategoryTests: [],
  overall: { passed: 0, failed: 0, errors: 0 }
};

function logResult(category, testName, passed, details = '', error = null) {
  const status = error ? '💥 ERROR' : (passed ? '✅ PASS' : '❌ FAIL');
  const message = `${status}: ${testName}`;
  
  console.log(message);
  if (details) console.log(`   📄 ${details}`);
  if (error) console.log(`   🚨 ${error.message}`);
  
  testResults[category].push({
    name: testName,
    passed,
    details,
    error: error?.message
  });
  
  if (error) {
    testResults.overall.errors++;
  } else if (passed) {
    testResults.overall.passed++;
  } else {
    testResults.overall.failed++;
  }
}

// Test helper function
async function testAPICall(testName, category, payload, expectedStatus = 400, expectedError = null) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    
    const response = await fetch(`${BASE_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers as needed - you'll need to update this
        // 'Authorization': 'Bearer your-token-here'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    const actualStatus = response.status;
    
    // Check if we got expected error status
    const statusMatches = actualStatus === expectedStatus;
    
    // Check if error message contains expected text
    const errorMatches = expectedError ? 
      (result.error && result.error.toLowerCase().includes(expectedError.toLowerCase())) : 
      true;
    
    const passed = statusMatches && errorMatches;
    
    const details = `Status: ${actualStatus} (expected ${expectedStatus}), Response: ${JSON.stringify(result).substring(0, 100)}...`;
    
    logResult(category, testName, passed, details);
    
    return { passed, response: result, status: actualStatus };
    
  } catch (error) {
    logResult(category, testName, false, '', error);
    return { passed: false, error };
  }
}

// Main test runner
async function runErrorHandlingTests() {
  console.log('🏢 COMMERCIAL PROPERTY API ERROR HANDLING TESTS');
  console.log('===============================================');
  console.log('Testing API robustness with invalid data...\n');
  
  // TEST 1: Required Field Validation
  console.log('📋 REQUIRED FIELD VALIDATION TESTS');
  console.log('==================================');
  
  await testAPICall(
    'Missing commercial_type (required field)',
    'validationTests',
    {
      property_category: 'commercial',
      commercial_type: '', // Invalid - empty required field
      property_type: 'Office',
      listing_type: 'lease',
      title: 'Test Property',
      description: 'Test description',
      price: 100000,
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    400,
    'commercial type'
  );
  
  await testAPICall(
    'Missing title (global required field)',
    'validationTests',
    {
      property_category: 'commercial',
      commercial_type: 'Office',
      property_type: 'Office',
      listing_type: 'lease',
      title: '', // Invalid - empty required field
      description: 'Test description',
      price: 100000
    },
    400,
    'title'
  );
  
  // TEST 2: Data Type Validation
  console.log('\n🔢 DATA TYPE VALIDATION TESTS');
  console.log('=============================');
  
  await testAPICall(
    'Invalid floor_size_sqft data type',
    'validationTests',
    {
      property_category: 'commercial',
      commercial_type: 'Office',
      property_type: 'Office',
      listing_type: 'lease',
      title: 'Test Property',
      price: 100000,
      floor_size_sqft: 'not-a-number', // Invalid data type
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    400,
    'floor_size'
  );
  
  await testAPICall(
    'Negative parking_spaces',
    'validationTests',
    {
      property_category: 'commercial',
      commercial_type: 'Warehouse',
      property_type: 'Warehouse',
      listing_type: 'sale',
      title: 'Test Warehouse',
      price: 500000,
      parking_spaces: -5, // Invalid negative number
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    400,
    'parking'
  );
  
  await testAPICall(
    'Invalid price data type',
    'validationTests',
    {
      property_category: 'commercial',
      commercial_type: 'Retail',
      property_type: 'Retail',
      listing_type: 'lease',
      title: 'Test Retail Space',
      price: 'expensive', // Invalid - should be numeric
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    400,
    'price'
  );
  
  // TEST 3: Mixed Category Edge Cases
  console.log('\n🔀 MIXED CATEGORY EDGE CASES');
  console.log('============================');
  
  await testAPICall(
    'Commercial category with residential property_type',
    'mixedCategoryTests',
    {
      property_category: 'commercial',
      commercial_type: 'Office',
      property_type: 'House', // Mismatch - residential type with commercial category
      listing_type: 'sale',
      title: 'Mixed Category Test',
      price: 200000,
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    400,
    'property type'
  );
  
  await testAPICall(
    'Residential category with commercial fields filled',
    'mixedCategoryTests',
    {
      property_category: 'residential',
      property_type: 'House',
      listing_type: 'sale',
      title: 'Residential with Commercial Fields',
      price: 150000,
      // These commercial fields should be ignored for residential
      commercial_type: 'Office',
      floor_size_sqft: 2000,
      loading_dock: true,
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    200, // Should succeed but ignore commercial fields
    null
  );
  
  // TEST 4: Boundary Value Testing
  console.log('\n📏 BOUNDARY VALUE TESTS');
  console.log('=======================');
  
  await testAPICall(
    'Extremely large floor_size_sqft',
    'edgeCaseTests',
    {
      property_category: 'commercial',
      commercial_type: 'Warehouse',
      property_type: 'Warehouse',
      listing_type: 'sale',
      title: 'Huge Warehouse',
      price: 1000000,
      floor_size_sqft: 99999999, // Very large number
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    200 // Should accept large but reasonable values
  );
  
  await testAPICall(
    'Zero parking spaces',
    'edgeCaseTests',
    {
      property_category: 'commercial',
      commercial_type: 'Office',
      property_type: 'Office',
      listing_type: 'lease',
      title: 'No Parking Office',
      price: 80000,
      parking_spaces: 0, // Edge case - zero parking
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    200 // Should accept zero parking
  );
  
  // TEST 5: Special Character and Injection Testing
  console.log('\n🛡️  SECURITY & INJECTION TESTS');
  console.log('==============================');
  
  await testAPICall(
    'SQL injection attempt in title',
    'edgeCaseTests',
    {
      property_category: 'commercial',
      commercial_type: 'Office',
      property_type: 'Office',
      listing_type: 'lease',
      title: "'; DROP TABLE properties; --", // SQL injection attempt
      price: 100000,
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    400, // Should reject malicious input
    'invalid'
  );
  
  await testAPICall(
    'XSS attempt in description',
    'edgeCaseTests',
    {
      property_category: 'commercial',
      commercial_type: 'Retail',
      property_type: 'Retail',
      listing_type: 'sale',
      title: 'XSS Test Property',
      description: '<script>alert("xss")</script>', // XSS attempt
      price: 120000,
      region: 'Demerara-Mahaica',
      city: 'Georgetown'
    },
    200 // Might accept but should sanitize
  );
  
  // Generate test summary
  console.log('\n📊 ERROR HANDLING TEST SUMMARY');
  console.log('===============================');
  
  const validationPassed = testResults.validationTests.filter(t => t.passed).length;
  const validationFailed = testResults.validationTests.filter(t => !t.passed).length;
  
  const edgeCasePassed = testResults.edgeCaseTests.filter(t => t.passed).length;
  const edgeCaseFailed = testResults.edgeCaseTests.filter(t => !t.passed).length;
  
  const mixedCategoryPassed = testResults.mixedCategoryTests.filter(t => t.passed).length;
  const mixedCategoryFailed = testResults.mixedCategoryTests.filter(t => !t.passed).length;
  
  console.log(`✅ VALIDATION TESTS: ${validationPassed} passed, ${validationFailed} failed`);
  console.log(`🔢 EDGE CASE TESTS: ${edgeCasePassed} passed, ${edgeCaseFailed} failed`);
  console.log(`🔀 MIXED CATEGORY TESTS: ${mixedCategoryPassed} passed, ${mixedCategoryFailed} failed`);
  console.log(`📈 OVERALL: ${testResults.overall.passed} passed, ${testResults.overall.failed} failed, ${testResults.overall.errors} errors`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (testResults.overall.errors > 0) {
    console.log('🚫 CONNECTION/SERVER ERRORS - Fix server connectivity issues');
  } else if (testResults.overall.failed > 0) {
    console.log('⚠️  Some validation tests failed - Review API error handling');
    console.log('   Failed tests indicate areas where error handling could be improved');
  } else {
    console.log('✅ API ERROR HANDLING IS ROBUST - All tests passed');
  }
  
  // Save results
  const resultsFile = 'api-error-handling-results.json';
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Test results saved to: ${resultsFile}`);
  
  return testResults.overall.errors === 0 && testResults.overall.failed < 2;
}

// Run tests if called directly
if (require.main === module) {
  runErrorHandlingTests()
    .then(success => {
      if (success) {
        console.log('\n🎉 API ERROR HANDLING TESTS COMPLETED SUCCESSFULLY');
        process.exit(0);
      } else {
        console.log('\n🚨 API ERROR HANDLING TESTS FOUND ISSUES');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runErrorHandlingTests, testAPICall };