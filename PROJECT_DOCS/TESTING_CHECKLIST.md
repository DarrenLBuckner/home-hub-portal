# ✅ COMPREHENSIVE TESTING CHECKLIST
## Portal Home Hub ↔ Guyana Home Hub Integration

**Last Updated**: Day 1  
**Testing Phase**: Pre-Development Baseline  
**Total Test Cases**: 45  
**Automation Target**: 80% of test cases  

---

## 🏠 PROPERTY CREATION FLOW TESTING

### Portal Property Creation (Backend)
**Test Environment**: Portal Admin Dashboard  
**User Roles**: Admin, Agent, FSBO, Landlord  

#### Test Case PC-001: FSBO Property Creation
- [ ] **Setup**: Login as FSBO user
- [ ] **Action**: Create property with all required fields
- [ ] **Verify**: Property saved with `listed_by_type: 'fsbo'`
- [ ] **Verify**: Property has `listing_type: 'sale'`
- [ ] **Verify**: Property has `site_id: 'GY'`
- [ ] **Expected**: Property appears in admin approval queue

#### Test Case PC-002: Landlord Rental Creation  
- [ ] **Setup**: Login as landlord user
- [ ] **Action**: Create rental property with amenities
- [ ] **Verify**: Property saved with `listed_by_type: 'landlord'`
- [ ] **Verify**: Property has `listing_type: 'rent'`
- [ ] **Verify**: Amenities stored as TEXT[] array
- [ ] **Expected**: Property appears in rental approval queue

#### Test Case PC-003: Agent Property Creation
- [ ] **Setup**: Login as agent user
- [ ] **Action**: Create both sale and rental properties
- [ ] **Verify**: Agent can create both listing types
- [ ] **Verify**: Property has `listed_by_type: 'agent'`
- [ ] **Verify**: Commission tracking enabled
- [ ] **Expected**: Properties appear in agent dashboard

#### Test Case PC-004: Image Upload Testing
- [ ] **Setup**: Any user role creating property
- [ ] **Action**: Upload 5 images (JPEG, PNG formats)
- [ ] **Verify**: Images stored in Supabase storage
- [ ] **Verify**: Image URLs generated correctly
- [ ] **Verify**: Primary image selection works
- [ ] **Expected**: Images display in property listing

#### Test Case PC-005: Property Validation
- [ ] **Setup**: Any user creating property
- [ ] **Action**: Submit form with missing required fields
- [ ] **Verify**: Validation errors displayed
- [ ] **Verify**: Form does not submit
- [ ] **Action**: Add required fields and resubmit
- [ ] **Expected**: Property creation succeeds

### Property Status Workflow
#### Test Case PC-006: Property Approval Flow
- [ ] **Setup**: Admin user, property in pending status
- [ ] **Action**: Admin approves property
- [ ] **Verify**: Property status changes to 'active'
- [ ] **Verify**: Property appears on Guyana frontend
- [ ] **Verify**: Email notification sent to property owner
- [ ] **Expected**: Property visible to public

#### Test Case PC-007: Property Rejection Flow
- [ ] **Setup**: Admin user, property in pending status
- [ ] **Action**: Admin rejects property with reason
- [ ] **Verify**: Property status changes to 'rejected'
- [ ] **Verify**: Property not visible on Guyana frontend
- [ ] **Verify**: Rejection email sent with reason
- [ ] **Expected**: Owner can edit and resubmit

---

## 🔍 FILTERING & SEARCH TESTING

### Guyana Frontend Filtering
**Test Environment**: Guyana Home Hub public site  
**User**: Anonymous public users  

#### Test Case FS-001: Basic Property Search
- [ ] **Setup**: Guyana homepage
- [ ] **Action**: Search for "apartment" in search box
- [ ] **Verify**: Results contain only apartments
- [ ] **Verify**: Search works with partial matches
- [ ] **Verify**: Case-insensitive search
- [ ] **Expected**: Relevant properties displayed

#### Test Case FS-002: Listing Type Filtering
- [ ] **Setup**: Guyana properties page
- [ ] **Action**: Navigate to /properties/buy
- [ ] **Verify**: Only sale properties displayed
- [ ] **Verify**: URL parameter `filterType="sale"`
- [ ] **Action**: Navigate to /properties/rent
- [ ] **Verify**: Only rental properties displayed
- [ ] **Expected**: Proper listing type separation

#### Test Case FS-003: Property Type Filtering
- [ ] **Setup**: Properties page with type filter
- [ ] **Action**: Select "House" filter
- [ ] **Verify**: Only house properties displayed
- [ ] **Action**: Select multiple types (House + Apartment)
- [ ] **Verify**: Properties matching either type shown
- [ ] **Expected**: Multi-select type filtering works

#### Test Case FS-004: Price Range Filtering
- [ ] **Setup**: Properties page with price filters
- [ ] **Action**: Set minimum price to 50,000,000 GYD
- [ ] **Verify**: Only properties above price shown
- [ ] **Action**: Set price range 50M-100M GYD
- [ ] **Verify**: Properties within range displayed
- [ ] **Expected**: Price filtering accurate

#### Test Case FS-005: Bedroom/Bathroom Filtering
- [ ] **Setup**: Properties page with room filters
- [ ] **Action**: Select "2+ bedrooms"
- [ ] **Verify**: Only properties with 2+ bedrooms shown
- [ ] **Action**: Combine with "2+ bathrooms"
- [ ] **Verify**: Properties meet both criteria
- [ ] **Expected**: Combined room filtering works

#### Test Case FS-006: Amenity Filtering (Critical)
- [ ] **Setup**: Properties page with amenity filters
- [ ] **Action**: Select "Pool" amenity
- [ ] **Verify**: Only properties with pools displayed
- [ ] **Action**: Select multiple amenities (Pool + Garage)
- [ ] **Verify**: Properties have all selected amenities
- [ ] **Expected**: Amenity filtering functional
- [ ] **Status**: ❌ **FAILING** - Not implemented yet

#### Test Case FS-007: Region Filtering
- [ ] **Setup**: Properties page with location filter
- [ ] **Action**: Select "Region 4" from dropdown
- [ ] **Verify**: Only Region 4 properties displayed
- [ ] **Verify**: Hardcoded Guyana regions work
- [ ] **Expected**: Geographic filtering accurate

#### Test Case FS-008: Combined Filter Testing
- [ ] **Setup**: Properties page
- [ ] **Action**: Apply multiple filters (Region + Type + Price)
- [ ] **Verify**: Properties match ALL selected criteria
- [ ] **Action**: Clear filters one by one
- [ ] **Verify**: Results update correctly
- [ ] **Expected**: Complex filtering logic works

---

## 👥 USER ROLE TESTING

### Authentication & Authorization
**Test Environment**: Both Portal and Guyana  
**Focus**: Role-based access control  

#### Test Case UR-001: FSBO User Journey
- [ ] **Setup**: Register as FSBO user
- [ ] **Action**: Login to Portal dashboard
- [ ] **Verify**: Can access property creation form
- [ ] **Verify**: Limited to 1 property (free tier)
- [ ] **Action**: Create sale property
- [ ] **Verify**: Property requires approval
- [ ] **Expected**: Full FSBO workflow functional

#### Test Case UR-002: Agent User Journey
- [ ] **Setup**: Register as agent user
- [ ] **Action**: Login to Portal dashboard
- [ ] **Verify**: Can create multiple properties
- [ ] **Verify**: Access to both sale and rental forms
- [ ] **Action**: Create properties of both types
- [ ] **Verify**: Commission tracking available
- [ ] **Expected**: Agent features working

#### Test Case UR-003: Landlord User Journey
- [ ] **Setup**: Register as landlord user
- [ ] **Action**: Login to Portal dashboard
- [ ] **Verify**: Can access rental property form only
- [ ] **Verify**: Limited to 1 rental property (free tier)
- [ ] **Action**: Create rental property
- [ ] **Verify**: Rental-specific fields present
- [ ] **Expected**: Landlord workflow functional

#### Test Case UR-004: Admin User Journey
- [ ] **Setup**: Login as admin user
- [ ] **Action**: Access admin dashboard
- [ ] **Verify**: Can view all pending properties
- [ ] **Verify**: Can approve/reject properties
- [ ] **Action**: Test property approval
- [ ] **Verify**: Property appears on Guyana site
- [ ] **Expected**: Admin controls working

#### Test Case UR-005: Unauthorized Access Testing
- [ ] **Setup**: No authentication
- [ ] **Action**: Try to access Portal admin pages
- [ ] **Verify**: Redirected to login
- [ ] **Setup**: FSBO user
- [ ] **Action**: Try to access admin features
- [ ] **Verify**: Access denied
- [ ] **Expected**: Proper access control

---

## 💳 PAYMENT FLOW TESTING

### Stripe Integration Testing
**Test Environment**: Portal payment system  
**Focus**: Subscription and property payment flows  

#### Test Case PF-001: Agent Subscription Payment
- [ ] **Setup**: Agent user needing subscription
- [ ] **Action**: Select monthly pro plan ($199)
- [ ] **Verify**: Stripe checkout opens
- [ ] **Action**: Complete payment with test card
- [ ] **Verify**: Subscription activated
- [ ] **Verify**: Property limits increased
- [ ] **Expected**: Subscription workflow complete

#### Test Case PF-002: FSBO Property Payment
- [ ] **Setup**: FSBO user creating second property
- [ ] **Action**: Attempt to create property (limit exceeded)
- [ ] **Verify**: Payment prompt displayed
- [ ] **Action**: Pay for property listing ($99)
- [ ] **Verify**: Payment processed via Stripe
- [ ] **Verify**: Property creation enabled
- [ ] **Expected**: Per-property payment works

#### Test Case PF-003: Landlord Rental Payment
- [ ] **Setup**: Landlord user creating second rental
- [ ] **Action**: Attempt to create rental (limit exceeded)
- [ ] **Verify**: Payment prompt for rental plan
- [ ] **Action**: Pay for rental listing ($79)
- [ ] **Verify**: Payment processed
- [ ] **Verify**: Rental creation enabled
- [ ] **Expected**: Rental payment works

#### Test Case PF-004: Payment Failure Handling
- [ ] **Setup**: User attempting payment
- [ ] **Action**: Use declined test card number
- [ ] **Verify**: Payment failure message shown
- [ ] **Verify**: User can retry with different card
- [ ] **Verify**: No partial charges created
- [ ] **Expected**: Graceful payment failure handling

#### Test Case PF-005: Subscription Cancellation
- [ ] **Setup**: Active agent subscription
- [ ] **Action**: Cancel subscription from dashboard
- [ ] **Verify**: Stripe subscription cancelled
- [ ] **Verify**: Access maintained until period end
- [ ] **Verify**: Auto-renewal disabled
- [ ] **Expected**: Clean cancellation process

---

## 🌐 CROSS-SYSTEM INTEGRATION TESTING

### Portal ↔ Guyana Data Flow
**Test Environment**: Both systems  
**Focus**: Data consistency and synchronization  

#### Test Case CS-001: Property Creation to Display
- [ ] **Setup**: Portal admin dashboard
- [ ] **Action**: Create and approve property
- [ ] **Verify**: Property appears in Portal API response
- [ ] **Action**: Check Guyana frontend
- [ ] **Verify**: Property visible on Guyana site
- [ ] **Verify**: All data fields transferred correctly
- [ ] **Expected**: End-to-end data flow works

#### Test Case CS-002: Site-Based Filtering
- [ ] **Setup**: Properties with different site_ids
- [ ] **Action**: Access Guyana frontend
- [ ] **Verify**: Only site_id='GY' properties shown
- [ ] **Action**: Direct API call with different site
- [ ] **Verify**: Other site properties not returned
- [ ] **Expected**: Multi-tenant filtering works

#### Test Case CS-003: Real-time Updates
- [ ] **Setup**: Guyana page open, Portal admin
- [ ] **Action**: Approve property in Portal
- [ ] **Action**: Refresh Guyana page
- [ ] **Verify**: New property appears
- [ ] **Action**: Reject property in Portal
- [ ] **Action**: Refresh Guyana page
- [ ] **Verify**: Property disappears
- [ ] **Expected**: Status changes reflect quickly

#### Test Case CS-004: API Error Handling
- [ ] **Setup**: Guyana frontend
- [ ] **Action**: Simulate Portal API downtime
- [ ] **Verify**: Graceful error message displayed
- [ ] **Verify**: Page doesn't crash
- [ ] **Action**: Restore Portal API
- [ ] **Verify**: Data loads normally
- [ ] **Expected**: Resilient error handling

#### Test Case CS-005: Image URL Consistency
- [ ] **Setup**: Property with images in Portal
- [ ] **Action**: View property on Guyana site
- [ ] **Verify**: All images load correctly
- [ ] **Verify**: Primary image displays first
- [ ] **Action**: Test image URLs directly
- [ ] **Verify**: Proper CORS headers
- [ ] **Expected**: Image delivery works

---

## 📱 MOBILE & RESPONSIVE TESTING

### Mobile User Experience
**Test Environment**: Various devices and browsers  
**Focus**: Mobile-first design validation  

#### Test Case MR-001: Mobile Property Browsing
- [ ] **Device**: iPhone 12 (Safari)
- [ ] **Action**: Browse properties on Guyana site
- [ ] **Verify**: Grid layout adapts to mobile
- [ ] **Verify**: Touch interactions work
- [ ] **Verify**: Images load and display properly
- [ ] **Expected**: Smooth mobile browsing

#### Test Case MR-002: Mobile Property Creation
- [ ] **Device**: Android tablet (Chrome)
- [ ] **Action**: Create property via Portal
- [ ] **Verify**: Form fields properly sized
- [ ] **Verify**: Image upload works
- [ ] **Verify**: Keyboard doesn't overlap inputs
- [ ] **Expected**: Mobile property creation works

#### Test Case MR-003: Mobile Filtering
- [ ] **Device**: iPhone SE (smallest screen)
- [ ] **Action**: Use property filters
- [ ] **Verify**: Filter drawer/modal opens
- [ ] **Verify**: All filter options accessible
- [ ] **Verify**: Filter results update correctly
- [ ] **Expected**: Mobile filtering functional

#### Test Case MR-004: Cross-Browser Mobile
- [ ] **Test**: Same tests across iOS Safari, Android Chrome, Mobile Firefox
- [ ] **Verify**: Consistent behavior across browsers
- [ ] **Verify**: No mobile-specific JavaScript errors
- [ ] **Expected**: Cross-browser compatibility

---

## ⚡ PERFORMANCE TESTING

### Load & Speed Testing
**Test Environment**: Production-like setup  
**Focus**: Response times and scalability  

#### Test Case PT-001: API Response Times
- [ ] **Setup**: 100 properties in database
- [ ] **Action**: GET /api/public/properties
- [ ] **Verify**: Response time < 500ms
- [ ] **Action**: Add filters to request
- [ ] **Verify**: Filtered response time < 750ms
- [ ] **Expected**: Fast API responses

#### Test Case PT-002: Image Loading Performance
- [ ] **Setup**: Property with 10 images
- [ ] **Action**: Load property page
- [ ] **Verify**: Hero image loads < 2 seconds
- [ ] **Verify**: Subsequent images lazy load
- [ ] **Verify**: Total page load < 5 seconds
- [ ] **Expected**: Acceptable image performance

#### Test Case PT-003: Concurrent User Testing
- [ ] **Setup**: Simulate 50 concurrent users
- [ ] **Action**: Browse properties simultaneously
- [ ] **Verify**: No degradation in response times
- [ ] **Verify**: No database connection errors
- [ ] **Expected**: Handles concurrent load

#### Test Case PT-004: Large Dataset Performance
- [ ] **Setup**: 1000+ properties in database
- [ ] **Action**: Search and filter operations
- [ ] **Verify**: Response times remain acceptable
- [ ] **Verify**: Pagination works correctly
- [ ] **Expected**: Scales with data growth

---

## 🔒 SECURITY TESTING

### Security Validation
**Test Environment**: Both Portal and Guyana  
**Focus**: Authentication, authorization, data protection  

#### Test Case ST-001: SQL Injection Testing
- [ ] **Setup**: Property search interface
- [ ] **Action**: Input SQL injection attempts
- [ ] **Verify**: Parameterized queries prevent injection
- [ ] **Verify**: No database errors exposed
- [ ] **Expected**: SQL injection prevented

#### Test Case ST-002: CORS Policy Testing
- [ ] **Setup**: External website trying to call Portal API
- [ ] **Action**: Make cross-origin requests
- [ ] **Verify**: Requests blocked by CORS policy
- [ ] **Action**: Request from Guyana domain
- [ ] **Verify**: Requests allowed
- [ ] **Expected**: Proper CORS restrictions

#### Test Case ST-003: Rate Limiting Testing
- [ ] **Setup**: Automated script calling API
- [ ] **Action**: Make 200 requests in 1 minute
- [ ] **Verify**: Rate limiting kicks in after 100 requests
- [ ] **Verify**: 429 Too Many Requests response
- [ ] **Expected**: Rate limiting prevents abuse

#### Test Case ST-004: Authentication Testing
- [ ] **Setup**: Various user roles
- [ ] **Action**: Attempt to access unauthorized resources
- [ ] **Verify**: Proper authentication required
- [ ] **Verify**: Role-based access enforced
- [ ] **Expected**: Security boundaries maintained

---

## 📊 TESTING METRICS & AUTOMATION

### Test Automation Status
- **Unit Tests**: 🔄 Planned (Day 15-16)
- **Integration Tests**: 🔄 Planned (Day 17-18)
- **E2E Tests**: 🔄 Planned (Day 19-20)
- **Performance Tests**: 🔄 Planned (Day 21-22)

### Current Test Coverage
- **Manual Tests Ready**: 45 test cases defined
- **Automated Tests**: 0% (baseline)
- **Critical Path Coverage**: 100% planned
- **Target Automation**: 80% by Day 20

### Test Environment Setup
- [ ] **Local Development**: Portal + Guyana running locally
- [ ] **Staging Environment**: Production-like setup
- [ ] **Test Data**: Sample properties for each user type
- [ ] **Test Users**: One account for each user role

### Daily Testing Schedule
- **Day 2-8**: Manual testing of implemented features
- **Day 9-16**: Regression testing of completed features
- **Day 17-23**: Comprehensive testing with automation
- **Day 24-30**: Production testing and monitoring

*Update test results daily and track automation progress*