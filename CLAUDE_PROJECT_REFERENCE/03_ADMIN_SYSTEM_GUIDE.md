# 🔐 ADMIN SYSTEM REFERENCE GUIDE

## 👑 SUPER ADMIN ACCESS (mrdarrenbuckner@gmail.com)

### Full Permissions:
✅ **User Management**: View, edit, delete all users across all countries
✅ **Pricing Control**: Edit global pricing for all user types and countries  
✅ **Payment Authority**: View, approve, reject, and issue refunds for all payments
✅ **Property Oversight**: Approve/reject properties globally
✅ **System Access**: Diagnostics, system settings, core configuration
✅ **Admin Creation**: Create and manage other admin accounts
✅ **Trial Extensions**: Extend trial periods for any user
✅ **Multi-Country**: Access data from all countries without restrictions

### Navigation Access:
- 👥 **Users** - Full user management
- 💰 **Pricing** - Global pricing control  
- ⚙️ **Settings** - All settings access
- 🔍 **Diagnostic** - System health monitoring
- 🛠️ **System Settings** - Core system configuration

## 🏴 OWNER ADMIN ACCESS (Country-Level)

### Permissions:
✅ **User Management**: View/edit users in assigned country only
✅ **Pricing Control**: Edit pricing for assigned country only
✅ **Payment Authority**: Approve/reject payments (NO refunds)
✅ **Property Oversight**: Approve/reject properties in assigned country
❌ **System Access**: NO diagnostics or system settings
❌ **Admin Creation**: Cannot create other admins
✅ **Trial Extensions**: Can extend trials for users in their country
🏴 **Country Restricted**: Can only see data from assigned country

### Navigation Access:
- 👥 **Users** - Country-filtered user management
- 💰 **Pricing** - Country-specific pricing
- ⚙️ **Settings** - Basic settings only
- ❌ **Diagnostic** - No access
- ❌ **System Settings** - No access

**Example**: Jamaica Owner Admin can only manage Jamaica users, Jamaica pricing, Jamaica properties.

## 🛡️ BASIC ADMIN ACCESS (Front-line Support)

### Permissions:
✅ **Property Management**: Approve/reject properties
✅ **Payment Processing**: Accept payments (NO refunds)
✅ **Escalation**: Can escalate issues to higher admins
❌ **User Management**: Cannot edit users
❌ **Pricing Control**: No pricing access
❌ **System Access**: No system settings or diagnostics
🏴 **Country Restricted**: Limited to assigned country

### Navigation Access:
- ⚙️ **Settings** - Basic settings only
- ❌ All other navigation restricted

## 🔒 SECURITY FEATURES

### Row Level Security (RLS):
- All database queries automatically filtered by user permissions
- Country-based data isolation
- Admin level inheritance

### Permission Inheritance:
```
Super Admin > Owner Admin > Basic Admin > Regular Users
```

### Email-Based Overrides:
- `mrdarrenbuckner@gmail.com` - Always Super Admin
- `qumar@guyanahomehub.com` - Admin privileges
- Hardcoded bypasses for development/emergency access

## 🌍 COUNTRY ASSIGNMENTS

### Configured Countries:
1. **Guyana** (ID: 1) - GYD currency - Primary market
2. **Jamaica** (ID: 2) - JMD currency - Future expansion
3. **Trinidad & Tobago** (ID: 3) - TTD currency - Future expansion  
4. **Barbados** (ID: 4) - BBD currency - Future expansion
5. **United States** (ID: 5) - USD currency - Future expansion
6. **Canada** (ID: 6) - CAD currency - Future expansion

### Admin Assignment Examples:
- **Super Admin**: Access all countries
- **Guyana Owner Admin**: Only Guyana data (ID: 1)
- **Jamaica Owner Admin**: Only Jamaica data (ID: 2)

## 🎯 PROPERTY LIMITS BY ROLE

### User Property Limits:
- **FSBO**: 1 property, 60-day trial, upgrade required
- **Landlord**: 1 rental, 60-day trial, upgrade required
- **Agent**: 10 properties, 60-day trial, upgrade required
- **Admin**: 20 sale + 5 rental, no upgrade required
- **Super Admin**: Unlimited

### Admin Override Capabilities:
- **Super Admin**: Can extend any user's trial
- **Owner Admin**: Can extend trials in their country
- **Basic Admin**: Cannot extend trials

## 🔧 ADMIN FUNCTIONS

### User Management:
- View user profiles and activity
- Edit user information and types
- Extend trial periods
- Change user roles (Super Admin only)

### Property Management:  
- Approve pending properties
- Reject unsuitable properties
- Edit property information
- Remove properties if needed

### Payment Management:
- View payment history
- Approve pending payments
- Reject invalid payments  
- Issue refunds (Super Admin only)

### Pricing Management:
- Edit subscription prices
- Set country-specific pricing
- Manage user tier pricing
- Configure trial periods

## 🚨 ADMIN ESCALATION PROCESS

### Basic Admin → Owner Admin:
- Property approval issues
- Payment processing problems
- User management requests

### Owner Admin → Super Admin:
- Refund requests
- System configuration needs
- Cross-country issues
- Admin account creation

### Emergency Contacts:
- **WhatsApp**: +592 762-9797
- **Email**: mrdarrenbuckner@gmail.com
- **System**: Built-in escalation buttons

---
*Admin System Status: Production Ready ✅*
*Last Updated: October 2, 2025*