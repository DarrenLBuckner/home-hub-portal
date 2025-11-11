#!/usr/bin/env node

/**
 * Draft System Status Checker
 * 
 * Quick verification that all components are properly deployed
 */

const fs = require('fs');
const path = require('path');

class SystemStatusChecker {
  constructor() {
    this.status = {
      database: false,
      api: false,
      frontend: false,
      utils: false
    };
    this.issues = [];
  }

  checkFile(filePath, component) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${component}: ${filePath}`);
      return true;
    } else {
      console.log(`❌ ${component}: Missing ${filePath}`);
      this.issues.push(`Missing: ${filePath}`);
      return false;
    }
  }

  checkDatabaseFiles() {
    console.log('\n📊 Checking Database Files:');
    this.status.database = this.checkFile('supabase/create_property_drafts_simple.sql', 'Database Schema');
  }

  checkApiFiles() {
    console.log('\n🚀 Checking API Files:');
    const apiFiles = [
      'src/app/api/properties/drafts/route.ts',
      'src/app/api/properties/drafts/[id]/route.ts',
      'src/app/api/properties/drafts/[id]/publish/route.ts'
    ];

    let allPresent = true;
    apiFiles.forEach(file => {
      if (!this.checkFile(file, 'API')) {
        allPresent = false;
      }
    });

    this.status.api = allPresent;
  }

  checkFrontendFiles() {
    console.log('\n🎨 Checking Frontend Files:');
    const frontendFiles = [
      'src/lib/draftManager.ts',
      'src/app/dashboard/agent/create-property/page.tsx',
      'src/app/dashboard/owner/create-property/page.tsx'
    ];

    let allPresent = true;
    frontendFiles.forEach(file => {
      if (!this.checkFile(file, 'Frontend')) {
        allPresent = false;
      }
    });

    this.status.frontend = allPresent;
  }

  checkUtilFiles() {
    console.log('\n🔧 Checking Utility Files:');
    this.status.utils = this.checkFile('draft-verification-test.js', 'Test Utils');
  }

  async checkApiEndpoints() {
    console.log('\n🌐 Checking API Content:');
    
    try {
      const draftManagerPath = path.join(__dirname, 'src/lib/draftManager.ts');
      const draftManagerContent = fs.readFileSync(draftManagerPath, 'utf8');
      
      if (draftManagerContent.includes('/api/properties/drafts')) {
        console.log('✅ draftManager.ts uses new draft API endpoints');
      } else {
        console.log('❌ draftManager.ts still using old properties endpoint');
        this.issues.push('draftManager.ts needs update to use /api/properties/drafts');
      }

      const agentFormPath = path.join(__dirname, 'src/app/dashboard/agent/create-property/page.tsx');
      const agentFormContent = fs.readFileSync(agentFormPath, 'utf8');
      
      if (agentFormContent.includes('currentDraftId')) {
        console.log('✅ Agent form has duplicate prevention (currentDraftId tracking)');
      } else {
        console.log('❌ Agent form missing duplicate prevention');
        this.issues.push('Agent form needs currentDraftId tracking');
      }

    } catch (error) {
      console.log(`❌ Error checking file contents: ${error.message}`);
      this.issues.push(`File read error: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 DRAFT SYSTEM STATUS SUMMARY');
    console.log('='.repeat(50));
    
    const components = [
      { name: 'Database Schema', status: this.status.database },
      { name: 'API Endpoints', status: this.status.api },
      { name: 'Frontend Integration', status: this.status.frontend },
      { name: 'Utility Scripts', status: this.status.utils }
    ];

    components.forEach(comp => {
      const emoji = comp.status ? '✅' : '❌';
      console.log(`${emoji} ${comp.name}: ${comp.status ? 'Ready' : 'Issues Found'}`);
    });

    const allReady = Object.values(this.status).every(s => s);
    
    console.log('\n' + '='.repeat(50));
    if (allReady && this.issues.length === 0) {
      console.log('🎉 SYSTEM STATUS: READY FOR TESTING');
      console.log('✅ All components deployed successfully');
      console.log('\nNext steps:');
      console.log('1. Run: node draft-verification-test.js');
      console.log('2. Test in browser with ?run-draft-test parameter');
    } else {
      console.log('⚠️  SYSTEM STATUS: NEEDS ATTENTION');
      console.log(`❌ ${this.issues.length} issues found:`);
      this.issues.forEach(issue => console.log(`   • ${issue}`));
    }
    console.log('='.repeat(50));
  }

  async runCheck() {
    console.log('🔍 Draft System Status Check Starting...\n');
    
    this.checkDatabaseFiles();
    this.checkApiFiles();
    this.checkFrontendFiles();
    this.checkUtilFiles();
    await this.checkApiEndpoints();
    
    this.printSummary();
  }
}

// Run the check
if (require.main === module) {
  const checker = new SystemStatusChecker();
  checker.runCheck();
}

module.exports = SystemStatusChecker;