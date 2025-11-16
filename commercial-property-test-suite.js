#!/usr/bin/env node

/**
 * COMMERCIAL PROPERTY AUTOMATED TEST SUITE
 * For Original Assistant Verification
 * 
 * This script performs automated testing of the commercial property
 * implementation to verify all components work together properly.
 * 
 * Usage: node commercial-property-test-suite.js
 */

const fs = require('fs');
const path = require('path');

console.log('🏢 COMMERCIAL PROPERTY AUTOMATED TEST SUITE');
console.log('==========================================');
console.log('Testing commercial property implementation...\n');

// Test Results Tracking
const testResults = {
  critical: [],
  integration: [],
  performance: [],
  overall: { passed: 0, failed: 0, skipped: 0 }
};

function logResult(category, testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const message = `${status}: ${testName}`;
  
  console.log(message);
  if (details) console.log(`   ${details}`);
  
  testResults[category].push({
    name: testName,
    passed,
    details
  });
  
  if (passed) {
    testResults.overall.passed++;
  } else {
    testResults.overall.failed++;
  }
}

function logSkipped(category, testName, reason) {
  const message = `⏭️  SKIP: ${testName} - ${reason}`;
  console.log(message);
  
  testResults[category].push({
    name: testName,
    passed: null,
    details: reason
  });
  
  testResults.overall.skipped++;
}

// 1. FILE STRUCTURE VERIFICATION
console.log('📁 Testing File Structure...');
const requiredFiles = [
  'src/app/dashboard/agent/create-property/page.tsx',
  'src/app/api/properties/create/route.ts',
  '../guyana-home-hub/src/components/Navbar.tsx',
  '../guyana-home-hub/src/app/properties/commercial/lease/page.tsx',
  '../guyana-home-hub/src/app/properties/commercial/sale/page.tsx'
];

requiredFiles.forEach(file => {
  try {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
      logResult('critical', `File exists: ${file}`, true);
    } else {
      logResult('critical', `File exists: ${file}`, false, 'File not found');
    }
  } catch (error) {
    logResult('critical', `File exists: ${file}`, false, error.message);
  }
});

// 2. FORM COMPONENT ANALYSIS
console.log('\n🎨 Testing Form Component Implementation...');

try {
  const formFile = path.resolve(__dirname, 'src/app/dashboard/agent/create-property/page.tsx');
  if (fs.existsSync(formFile)) {
    const formContent = fs.readFileSync(formFile, 'utf8');
    
    // Check for commercial fields in FormData interface
    const hasCommercialFields = [
      'property_category',
      'commercial_type',
      'floor_size_sqft',
      'building_floor',
      'parking_spaces',
      'loading_dock',
      'elevator_access',
      'climate_controlled'
    ].every(field => formContent.includes(field));
    
    logResult('critical', 'FormData interface includes commercial fields', hasCommercialFields);
    
    // Check for property category selector
    const hasCategorySelector = formContent.includes('property_category') && 
                               formContent.includes('residential') && 
                               formContent.includes('commercial');
    logResult('critical', 'Property category selector implemented', hasCategorySelector);
    
    // Check for commercial features section
    const hasCommercialSection = formContent.includes('Commercial Features') ||
                                formContent.includes('commercial_type');
    logResult('critical', 'Commercial features section implemented', hasCommercialSection);
    
    // Check for conditional rendering
    const hasConditionalRendering = formContent.includes('property_category === \'commercial\'');
    logResult('critical', 'Conditional rendering for commercial fields', hasConditionalRendering);
    
  } else {
    logSkipped('critical', 'Form component analysis', 'Form file not found');
  }
} catch (error) {
  logResult('critical', 'Form component analysis', false, error.message);
}

// 3. API INTEGRATION ANALYSIS
console.log('\n🔌 Testing API Integration...');

try {
  const apiFile = path.resolve(__dirname, 'src/app/api/properties/create/route.ts');
  if (fs.existsSync(apiFile)) {
    const apiContent = fs.readFileSync(apiFile, 'utf8');
    
    // Check for commercial fields in property data structure
    const hasCommercialInAPI = [
      'property_category',
      'commercial_type',
      'floor_size_sqft',
      'building_floor',
      'parking_spaces',
      'loading_dock',
      'elevator_access',
      'climate_controlled'
    ].every(field => apiContent.includes(field));
    
    logResult('critical', 'API includes commercial fields in data structure', hasCommercialInAPI);
    
    // Check for commercial validation
    const hasCommercialValidation = apiContent.includes('commercial_type') && 
                                   apiContent.includes('required');
    logResult('critical', 'API includes commercial field validation', hasCommercialValidation);
    
    // Check for property category handling
    const hasCategoryHandling = apiContent.includes('property_category');
    logResult('integration', 'API handles property category', hasCategoryHandling);
    
  } else {
    logSkipped('critical', 'API integration analysis', 'API file not found');
  }
} catch (error) {
  logResult('critical', 'API integration analysis', false, error.message);
}

// 4. FRONTEND NAVIGATION ANALYSIS
console.log('\n🧭 Testing Frontend Navigation...');

try {
  const navFile = path.resolve(__dirname, '../guyana-home-hub/src/components/Navbar.tsx');
  if (fs.existsSync(navFile)) {
    const navContent = fs.readFileSync(navFile, 'utf8');
    
    // Check for commercial dropdown
    const hasCommercialDropdown = navContent.includes('Commercial') && 
                                 navContent.includes('dropdown');
    logResult('critical', 'Navigation includes commercial dropdown', hasCommercialDropdown);
    
    // Check for commercial routes
    const hasCommercialRoutes = navContent.includes('/properties/commercial/lease') &&
                               navContent.includes('/properties/commercial/sale');
    logResult('critical', 'Navigation includes commercial routes', hasCommercialRoutes);
    
    // Check for accessibility features
    const hasAccessibility = navContent.includes('aria-') || navContent.includes('role=');
    logResult('integration', 'Navigation includes accessibility features', hasAccessibility);
    
  } else {
    logSkipped('critical', 'Frontend navigation analysis', 'Navigation file not found');
  }
} catch (error) {
  logResult('critical', 'Frontend navigation analysis', false, error.message);
}

// 5. COMMERCIAL PAGES ANALYSIS
console.log('\n📄 Testing Commercial Pages...');

const commercialPages = [
  '../guyana-home-hub/src/app/properties/commercial/lease/page.tsx',
  '../guyana-home-hub/src/app/properties/commercial/sale/page.tsx'
];

commercialPages.forEach(page => {
  try {
    const fullPath = path.resolve(__dirname, page);
    if (fs.existsSync(fullPath)) {
      const pageContent = fs.readFileSync(fullPath, 'utf8');
      
      // Check for PropertiesListingFixed component
      const hasListingComponent = pageContent.includes('PropertiesListingFixed');
      const pageType = page.includes('lease') ? 'lease' : 'sale';
      logResult('critical', `${pageType} page uses PropertiesListingFixed`, hasListingComponent);
      
      // Check for commercial category prop
      const hasCommercialProp = pageContent.includes('propertyCategory="commercial"');
      logResult('critical', `${pageType} page sets commercial category`, hasCommercialProp);
      
      // Check for proper filter type
      const hasFilterType = pageContent.includes(`filterType="${pageType}"`);
      logResult('integration', `${pageType} page sets correct filter type`, hasFilterType);
      
    } else {
      logSkipped('critical', `Commercial ${page.includes('lease') ? 'lease' : 'sale'} page exists`, 'File not found');
    }
  } catch (error) {
    logResult('critical', `Commercial ${page.includes('lease') ? 'lease' : 'sale'} page analysis`, false, error.message);
  }
});

// 6. CONFIGURATION ANALYSIS
console.log('\n⚙️  Testing Configuration Files...');

// Check for TypeScript errors (basic syntax check)
const tsFiles = [
  'src/app/dashboard/agent/create-property/page.tsx',
  'src/app/api/properties/create/route.ts'
];

tsFiles.forEach(file => {
  try {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic syntax checks
      const hasValidImports = !content.includes('import from') && // Incomplete imports
                             !content.includes('import {,') &&  // Malformed imports
                             !content.includes('import }');     // Malformed imports
      
      const hasValidBraces = (content.match(/\{/g) || []).length === (content.match(/\}/g) || []).length;
      
      const hasValidParens = (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length;
      
      logResult('integration', `${file} has valid syntax`, hasValidImports && hasValidBraces && hasValidParens);
      
    } else {
      logSkipped('integration', `${file} syntax check`, 'File not found');
    }
  } catch (error) {
    logResult('integration', `${file} syntax check`, false, error.message);
  }
});

// 7. GENERATE TEST SUMMARY
console.log('\n📊 TEST SUMMARY');
console.log('================');

const criticalPassed = testResults.critical.filter(t => t.passed === true).length;
const criticalFailed = testResults.critical.filter(t => t.passed === false).length;
const criticalSkipped = testResults.critical.filter(t => t.passed === null).length;

const integrationPassed = testResults.integration.filter(t => t.passed === true).length;
const integrationFailed = testResults.integration.filter(t => t.passed === false).length;
const integrationSkipped = testResults.integration.filter(t => t.passed === null).length;

console.log(`🚨 CRITICAL TESTS: ${criticalPassed} passed, ${criticalFailed} failed, ${criticalSkipped} skipped`);
console.log(`🔗 INTEGRATION TESTS: ${integrationPassed} passed, ${integrationFailed} failed, ${integrationSkipped} skipped`);
console.log(`📈 OVERALL: ${testResults.overall.passed} passed, ${testResults.overall.failed} failed, ${testResults.overall.skipped} skipped`);

// 8. GENERATE RECOMMENDATIONS
console.log('\n💡 RECOMMENDATIONS');
console.log('===================');

if (criticalFailed > 0) {
  console.log('🚫 CRITICAL ISSUES FOUND - DO NOT DEPLOY TO PRODUCTION');
  console.log('   The following critical tests failed:');
  testResults.critical
    .filter(t => t.passed === false)
    .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
} else if (criticalPassed >= 8) {
  console.log('✅ CRITICAL TESTS MOSTLY PASSING - PROCEED WITH MANUAL VERIFICATION');
  console.log('   Complete the manual testing checklist for final verification');
} else {
  console.log('⚠️  INSUFFICIENT CRITICAL TEST COVERAGE - NEED MORE VERIFICATION');
}

if (integrationFailed > 0) {
  console.log('\n⚠️  Integration issues found (non-blocking but should be addressed):');
  testResults.integration
    .filter(t => t.passed === false)
    .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
}

// 9. GENERATE NEXT STEPS
console.log('\n🎯 NEXT STEPS FOR ORIGINAL ASSISTANT');
console.log('====================================');

if (criticalFailed === 0) {
  console.log('1. ✅ Static analysis passed - proceed with runtime testing');
  console.log('2. 🧪 Run manual end-to-end test with actual property creation');
  console.log('3. 🗄️  Verify database schema and test data persistence');
  console.log('4. 🌐 Test frontend commercial pages with real data');
  console.log('5. 👥 Test user permission restrictions');
  console.log('6. 🚀 If all manual tests pass - ready for production deployment');
} else {
  console.log('1. 🚨 Fix critical issues identified in static analysis');
  console.log('2. 🔄 Re-run this automated test suite');
  console.log('3. 🧪 Only proceed to manual testing after all critical tests pass');
}

console.log('\n📋 See COMMERCIAL_PROPERTY_TESTING_CHECKLIST.md for detailed manual testing instructions');

// 10. SAVE RESULTS TO FILE
const resultsFile = path.join(__dirname, 'commercial-property-test-results.json');
fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
console.log(`\n💾 Test results saved to: ${resultsFile}`);

process.exit(criticalFailed > 0 ? 1 : 0);