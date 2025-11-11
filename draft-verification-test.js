/**
 * Draft System Verification Test
 * 
 * Run this test after deployment to verify the draft system works correctly.
 * This tests the complete autosave flow to ensure no duplicates are created.
 */

// Test configuration
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://portalhomehub.com' 
  : 'http://localhost:3000';

// Mock form data for testing
const mockFormData = {
  title: 'Test Property - Autosave Verification',
  description: 'This is a test property to verify autosave functionality',
  property_type: 'House',
  listing_type: 'sale',
  price: 250000,
  bedrooms: 3,
  bathrooms: 2,
  city: 'Georgetown',
  region: 'Demerara-Mahaica',
  images: [] // No images for testing
};

class DraftSystemTester {
  constructor() {
    this.testResults = [];
    this.currentDraftId = null;
  }

  async log(message, status = 'info') {
    const timestamp = new Date().toISOString();
    const result = { timestamp, message, status };
    this.testResults.push(result);
    
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : 'ℹ️';
    console.log(`${emoji} ${timestamp}: ${message}`);
  }

  async createInitialDraft() {
    try {
      await this.log('🧪 Test 1: Creating initial draft (should create NEW record)');
      
      const response = await fetch(`${API_BASE}/api/properties/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draft_type: 'sale',
          ...mockFormData
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.currentDraftId = result.draft_id;
        await this.log(`Initial draft created: ${this.currentDraftId}`, 'pass');
        return true;
      } else {
        await this.log(`Failed to create initial draft: ${result.error}`, 'fail');
        return false;
      }
    } catch (error) {
      await this.log(`Error creating initial draft: ${error.message}`, 'fail');
      return false;
    }
  }

  async updateExistingDraft(updateNumber) {
    try {
      await this.log(`🧪 Test ${updateNumber + 1}: Updating existing draft (should UPDATE same record)`);
      
      const updatedData = {
        ...mockFormData,
        title: `${mockFormData.title} - Update ${updateNumber}`,
        description: `${mockFormData.description} - Updated ${updateNumber} times`
      };

      const response = await fetch(`${API_BASE}/api/properties/drafts/${this.currentDraftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draft_type: 'sale',
          ...updatedData
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await this.log(`Draft updated successfully. ID: ${result.draft_id}`, 'pass');
        return result.draft_id === this.currentDraftId;
      } else {
        await this.log(`Failed to update draft: ${result.error}`, 'fail');
        return false;
      }
    } catch (error) {
      await this.log(`Error updating draft: ${error.message}`, 'fail');
      return false;
    }
  }

  async checkForDuplicates() {
    try {
      await this.log('🧪 Final Test: Checking for duplicate drafts');
      
      const response = await fetch(`${API_BASE}/api/properties/drafts`);
      const result = await response.json();

      if (response.ok && result.success) {
        const drafts = result.drafts || [];
        const testDrafts = drafts.filter(draft => 
          draft.title.includes('Test Property - Autosave Verification')
        );

        if (testDrafts.length === 1) {
          await this.log(`✅ SUCCESS: Only 1 test draft found (no duplicates)`, 'pass');
          return true;
        } else {
          await this.log(`❌ FAILURE: ${testDrafts.length} test drafts found (duplicates detected!)`, 'fail');
          return false;
        }
      } else {
        await this.log(`Failed to check drafts: ${result.error}`, 'fail');
        return false;
      }
    } catch (error) {
      await this.log(`Error checking drafts: ${error.message}`, 'fail');
      return false;
    }
  }

  async cleanup() {
    try {
      if (this.currentDraftId) {
        await this.log('🧹 Cleaning up test draft');
        
        const response = await fetch(`${API_BASE}/api/properties/drafts/${this.currentDraftId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await this.log('Test draft cleaned up successfully', 'pass');
        } else {
          await this.log('Failed to clean up test draft', 'fail');
        }
      }
    } catch (error) {
      await this.log(`Error during cleanup: ${error.message}`, 'fail');
    }
  }

  async runFullTest() {
    await this.log('🚀 Starting Draft System Verification Test');
    
    // Test 1: Create initial draft
    const created = await this.createInitialDraft();
    if (!created) {
      await this.log('❌ Test failed at creation step', 'fail');
      return this.getResults();
    }

    // Test 2-6: Simulate 5 autosave updates (like 2.5 minutes of editing)
    let allUpdatesSucceeded = true;
    for (let i = 0; i < 5; i++) {
      const updated = await this.updateExistingDraft(i);
      if (!updated) {
        allUpdatesSucceeded = false;
        break;
      }
      
      // Small delay to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!allUpdatesSucceeded) {
      await this.log('❌ Test failed during updates', 'fail');
      await this.cleanup();
      return this.getResults();
    }

    // Test 7: Check for duplicates
    const noDuplicates = await this.checkForDuplicates();
    
    // Cleanup
    await this.cleanup();

    // Final result
    if (noDuplicates) {
      await this.log('🎉 ALL TESTS PASSED - Draft system working correctly!', 'pass');
    } else {
      await this.log('💥 TEST FAILED - Duplicates detected in draft system!', 'fail');
    }

    return this.getResults();
  }

  getResults() {
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    
    return {
      summary: {
        total: this.testResults.length,
        passed,
        failed,
        success: failed === 0
      },
      details: this.testResults
    };
  }
}

// Export for use in testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DraftSystemTester;
}

// Browser usage example
if (typeof window !== 'undefined') {
  window.DraftSystemTester = DraftSystemTester;
  
  // Auto-run test if explicitly requested
  if (window.location.search.includes('run-draft-test')) {
    const tester = new DraftSystemTester();
    tester.runFullTest().then(results => {
      console.log('📊 Test Results:', results);
    });
  }
}

console.log(`
🧪 Draft System Verification Test Ready!

To run the test:

1. Browser: Add ?run-draft-test to URL
2. Node.js: 
   const DraftSystemTester = require('./draft-verification-test.js');
   const tester = new DraftSystemTester();
   tester.runFullTest();

This test will:
✅ Create 1 initial draft
✅ Update it 5 times (simulating autosave)
✅ Verify only 1 draft exists (no duplicates)
✅ Clean up test data
`);