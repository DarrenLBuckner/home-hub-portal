# COMMERCIAL PROPERTY TESTING CHECKLIST
**For Original Assistant Review & Verification**  
**Date:** November 14, 2025  
**Implementation Status:** 100% Complete - Needs Verification  
**Priority:** CRITICAL - Production Blocker Items Must Be Verified

---

## 🚨 **CRITICAL VERIFICATION TASKS** (Must Complete Before Production)

### **1. DATABASE SCHEMA VALIDATION** ⚠️ BLOCKING
```sql
-- Run these queries to verify database schema
DESCRIBE properties;

-- Check for commercial fields existence
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN (
  'property_category', 'commercial_type', 'floor_size_sqft', 
  'building_floor', 'parking_spaces', 'loading_dock', 
  'elevator_access', 'climate_controlled'
);

-- Check current data types
SELECT 
  property_category,
  commercial_type,
  floor_size_sqft,
  building_floor,
  parking_spaces,
  loading_dock,
  elevator_access,
  climate_controlled
FROM properties 
LIMIT 1;
```

**Expected Results:**
- [ ] All 8 commercial fields exist in properties table
- [ ] Data types match implementation (TEXT, INTEGER, BOOLEAN)
- [ ] No foreign key constraint errors
- [ ] Fields accept NULL values for residential properties

**If Failed:** Database migration required before commercial properties can work

---

### **2. END-TO-END COMMERCIAL PROPERTY CREATION TEST** ⚠️ BLOCKING

#### **Test Environment Setup:**
- Portal Home Hub: http://localhost:3000
- Guyana Home Hub: http://localhost:3001
- Test User: Agent account with valid permissions

#### **Step-by-Step Test Protocol:**

**Phase A: Form Functionality**
1. [ ] Navigate to `/dashboard/agent/create-property`
2. [ ] **Property Category Toggle Test:**
   - [ ] Select "Commercial" - verify Property Type options change
   - [ ] Options should be: Office, Retail, Warehouse, Industrial, Commercial Land
   - [ ] Switch back to "Residential" - verify it resets to House, Apartment, Land
   - [ ] Switch to "Commercial" again - verify form state is preserved

3. [ ] **Commercial Fields Visibility Test:**
   - [ ] Verify "Commercial Features" section appears only when Commercial selected
   - [ ] All fields visible: Commercial Type*, Floor Size, Building Floor, Parking Spaces
   - [ ] All checkboxes visible: Loading Dock, Elevator Access, Climate Controlled

4. [ ] **Listing Type Test:**
   - [ ] With Commercial selected, verify "For Lease" option appears in Listing Type
   - [ ] With Residential selected, verify "For Lease" option is hidden

**Phase B: Form Validation**
5. [ ] **Required Field Test:**
   - [ ] Set Property Category to "Commercial"
   - [ ] Leave Commercial Type empty
   - [ ] Attempt to submit - should fail with validation error
   - [ ] Fill Commercial Type - should pass validation

6. [ ] **Commercial Type Selection Test:**
   - [ ] Test all options: Office, Retail, Warehouse, Industrial, Mixed Use
   - [ ] Verify each selection saves properly

**Phase C: Complete Property Creation**
7. [ ] **Create Test Commercial Property:**
   ```
   Property Category: Commercial
   Commercial Type: Office  
   Property Type: Office
   Listing Type: For Lease
   Title: "Test Commercial Office Space - Downtown Georgetown"
   Description: "Modern office space perfect for businesses"
   Price: 150000
   Floor Size: 2500
   Building Floor: 3rd
   Parking Spaces: 10
   Loading Dock: ✓ Checked
   Elevator Access: ✓ Checked  
   Climate Controlled: ✓ Checked
   Location: Georgetown, Demerara-Mahaica, Guyana
   Images: Upload 3 test images
   ```

8. [ ] **Verify Form Submission:**
   - [ ] Form submits without errors
   - [ ] Success message displays
   - [ ] Property ID returned in response

**Phase D: Database Verification**
9. [ ] **Check Database Record:**
   ```sql
   SELECT 
     id, title, property_category, commercial_type, 
     floor_size_sqft, building_floor, parking_spaces,
     loading_dock, elevator_access, climate_controlled,
     status, created_at
   FROM properties 
   WHERE title = 'Test Commercial Office Space - Downtown Georgetown'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

   **Expected Results:**
   - [ ] property_category = 'commercial'
   - [ ] commercial_type = 'Office'
   - [ ] floor_size_sqft = 2500
   - [ ] building_floor = '3rd'
   - [ ] parking_spaces = 10
   - [ ] loading_dock = true
   - [ ] elevator_access = true
   - [ ] climate_controlled = true
   - [ ] status = 'pending' (for review)

**If Any Phase Fails:** Critical implementation gap - DO NOT PROCEED TO PRODUCTION

---

### **3. FRONTEND DISPLAY VERIFICATION** ⚠️ BLOCKING

#### **Consumer Site Testing (Guyana Home Hub):**

**Navigation Test:**
10. [ ] Go to http://localhost:3001
11. [ ] **Commercial Dropdown Test:**
    - [ ] Hover over "Commercial" - dropdown appears
    - [ ] Move mouse to "For Lease" - dropdown stays open
    - [ ] Click "For Lease" - navigates to `/properties/commercial/lease`
    - [ ] Go back, test "For Sale" - navigates to `/properties/commercial/sale`

**Property Display Test:**
12. [ ] **Commercial Lease Page:**
    - [ ] Page loads without errors
    - [ ] If test property exists and is approved, it should appear
    - [ ] Check browser console - no JavaScript errors
    - [ ] Test on mobile view - navigation works

13. [ ] **Commercial Sale Page:**
    - [ ] Page loads without errors  
    - [ ] PropertiesListingFixed component renders
    - [ ] Filters work properly
    - [ ] No console errors

**If Frontend Fails:** UI/UX issues need resolution before launch

---

## 🔍 **INTEGRATION VERIFICATION TASKS** (High Priority)

### **4. USER PERMISSIONS & LIMITS TESTING**

**Agent Limit Test:**
14. [ ] **Check Agent Property Limits:**
    ```sql
    -- Test the property limit function with commercial
    SELECT can_user_create_property_enhanced(
      '[agent-user-uuid]'::uuid,
      'lease'::text,
      'commercial'::text
    );
    ```
    - [ ] Verify commercial properties count toward agent's 10-property limit
    - [ ] Test with agent at 9 properties - should allow 1 more commercial
    - [ ] Test with agent at 10 properties - should block commercial creation

**FSBO Restriction Test:**
15. [ ] **Verify FSBO Cannot Create Commercial:**
    - [ ] Login as FSBO user
    - [ ] Navigate to create property form
    - [ ] Commercial option should not be available OR should be blocked
    - [ ] Document actual behavior

**Landlord Commercial Test:**
16. [ ] **Test Landlord Commercial Lease:**
    - [ ] Login as Landlord user
    - [ ] Can they create commercial lease properties?
    - [ ] Does it count toward their 1-rental limit?
    - [ ] Document actual behavior

### **5. MULTI-TENANT ARCHITECTURE VERIFICATION**

**Site Filtering Test:**
17. [ ] **Check Site ID Handling:**
    ```sql
    -- Verify site_id is properly set
    SELECT title, site_id, country_code, property_category 
    FROM properties 
    WHERE property_category = 'commercial'
    ORDER BY created_at DESC;
    ```
    - [ ] site_id should be 'guyana' for properties created on Portal
    - [ ] Properties should appear on Guyana Home Hub only

**Currency Test:**
18. [ ] **Verify Currency Handling:**
    - [ ] Commercial properties show GYD currency
    - [ ] Price formatting works correctly
    - [ ] Multi-currency support if needed

### **6. API ERROR HANDLING VERIFICATION**

**Edge Case Testing:**
19. [ ] **Test Invalid Data Submission:**
    ```javascript
    // Test API with malformed commercial data
    POST /api/properties/create
    {
      "property_category": "commercial",
      "commercial_type": "", // Invalid - empty required field
      "floor_size_sqft": "not-a-number", // Invalid data type
      "parking_spaces": -5 // Invalid negative number
    }
    ```
    - [ ] API should return proper error messages
    - [ ] No database corruption
    - [ ] Graceful error handling

20. [ ] **Test Mixed Property Categories:**
    - [ ] Submit with property_category="commercial" but residential property_type
    - [ ] Submit with property_category="residential" but commercial fields filled
    - [ ] Verify API handles these edge cases properly

### **7. ADMIN DASHBOARD INTEGRATION**

**Admin Workflow Test:**
21. [ ] **Check Admin Dashboard:**
    - [ ] Login as admin user
    - [ ] Navigate to property management
    - [ ] Verify commercial properties appear in pending list
    - [ ] Test approval workflow for commercial properties
    - [ ] Verify all commercial fields display correctly

22. [ ] **Commercial Property Approval:**
    - [ ] Approve the test commercial property
    - [ ] Verify status changes to 'active'
    - [ ] Check it appears on Guyana Home Hub commercial pages

---

## 📋 **PERFORMANCE & SCALABILITY CHECKS** (Medium Priority)

### **8. DATABASE PERFORMANCE**

23. [ ] **Query Performance Test:**
    ```sql
    -- Test commercial property queries
    EXPLAIN ANALYZE 
    SELECT * FROM properties 
    WHERE property_category = 'commercial' 
    AND listing_type = 'lease'
    AND country_code = 'GY'
    LIMIT 10;
    ```
    - [ ] Query execution time < 100ms
    - [ ] Proper index usage
    - [ ] No full table scans

### **9. FORM PERFORMANCE**

24. [ ] **Browser Performance Test:**
    - [ ] Form loads in < 2 seconds
    - [ ] Category switching is instant
    - [ ] No memory leaks on form interactions
    - [ ] Mobile performance acceptable

### **10. IMAGE INTEGRATION TEST**

25. [ ] **Commercial Property Images:**
    - [ ] Upload 5 images to commercial property
    - [ ] Verify images save to Supabase storage
    - [ ] Check images display on Guyana Home Hub
    - [ ] Test image optimization and loading

---

## 🧪 **AUTOMATED TEST SCRIPT** (For Original Assistant)

```javascript
// Save as: test-commercial-properties.js
// Run with: node test-commercial-properties.js

const testCommercialPropertyCreation = async () => {
  console.log('🧪 Starting Commercial Property Integration Test...');
  
  try {
    // Test 1: API Endpoint Test
    const response = await fetch('http://localhost:3000/api/properties/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers as needed
      },
      body: JSON.stringify({
        title: 'Automated Test Commercial Property',
        property_category: 'commercial',
        commercial_type: 'Office',
        property_type: 'Office',
        listing_type: 'lease',
        description: 'Test commercial property for automation',
        price: 100000,
        floor_size_sqft: 2000,
        building_floor: '2nd',
        parking_spaces: 5,
        loading_dock: true,
        elevator_access: false,
        climate_controlled: true,
        region: 'Demerara-Mahaica',
        city: 'Georgetown',
        images: []
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Commercial property creation successful');
      console.log('Property ID:', result.id);
      return { success: true, propertyId: result.id };
    } else {
      console.log('❌ Commercial property creation failed');
      console.log('Error:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.log('🚨 Test failed with exception:', error);
    return { success: false, error: error.message };
  }
};

// Run the test
testCommercialPropertyCreation()
  .then(result => {
    if (result.success) {
      console.log('🎉 Commercial property system is working!');
    } else {
      console.log('🚫 Commercial property system has issues that need fixing');
    }
  });
```

---

## 📊 **TEST RESULTS TRACKING**

### **Critical Tests Results:**
- [ ] Database Schema: ✅ Pass / ❌ Fail
- [ ] End-to-End Creation: ✅ Pass / ❌ Fail  
- [ ] Frontend Display: ✅ Pass / ❌ Fail
- [ ] User Permissions: ✅ Pass / ❌ Fail
- [ ] Multi-Tenant: ✅ Pass / ❌ Fail

### **Integration Tests Results:**
- [ ] API Error Handling: ✅ Pass / ❌ Fail
- [ ] Admin Dashboard: ✅ Pass / ❌ Fail
- [ ] Performance: ✅ Pass / ❌ Fail
- [ ] Image Integration: ✅ Pass / ❌ Fail

### **Overall Status:**
- [ ] 🟢 **READY FOR PRODUCTION** - All critical tests pass
- [ ] 🟡 **NEEDS FIXES** - Some issues found, fixable
- [ ] 🔴 **MAJOR ISSUES** - Significant problems, do not deploy

---

## 🚨 **PRODUCTION DEPLOYMENT CHECKLIST**

**Only proceed if ALL critical tests pass:**

- [ ] Database schema verified and ready
- [ ] Commercial property creation works end-to-end
- [ ] Frontend navigation and pages functional
- [ ] User permissions properly enforced
- [ ] Multi-tenant architecture working
- [ ] No critical API errors
- [ ] Admin workflow functional

**Deployment Steps:**
1. [ ] Deploy Portal Home Hub with commercial API changes
2. [ ] Verify Guyana Home Hub commercial pages work with new properties
3. [ ] Test commercial property creation in production
4. [ ] Monitor for errors in first 24 hours
5. [ ] Document any issues found

---

## 📞 **ESCALATION CONTACTS**

**If Critical Tests Fail:**
- **Database Issues:** Database administrator
- **API Errors:** Backend developer (original assistant)
- **Frontend Issues:** Frontend developer
- **Production Deployment:** DevOps team

**Testing Timeline:**
- **Critical Tests:** 2-3 hours
- **Integration Tests:** 1-2 hours  
- **Performance Tests:** 30 minutes
- **Total Time:** ~4-6 hours for complete verification

---

*This checklist ensures the commercial property implementation is production-ready and identifies any gaps that need addressing before launch.*