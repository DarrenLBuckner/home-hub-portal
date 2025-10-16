# 🇯🇲 JAMAICA THEME & BRANDING SETUP

**Generated:** October 16, 2025  
**Phase:** 2 of 7 - Theme & Branding Setup  
**Status:** In Progress  
**Dependencies:** Phase 1 Database Configuration ✅

---

## 🎨 JAMAICA BRAND COLORS

### **Primary Palette (Jamaica Flag Inspired)**
```css
--jamaica-green: #009639;      /* Flag green - Primary brand */
--jamaica-yellow: #FFD700;     /* Flag yellow - Accent */
--jamaica-black: #000000;      /* Flag black - Text/Headers */
```

### **Extended Brand Palette**
```css
--jamaica-green-light: #00B945;   /* Hover states */
--jamaica-green-dark: #007A2E;    /* Active states */
--jamaica-gold: #F4D03F;          /* Secondary accent */
--jamaica-blue: #0077BE;          /* Caribbean blue for CTAs */
--jamaica-coral: #FF6B6B;         /* Error/attention states */
```

### **Neutral Palette**
```css
--jamaica-gray-50: #F8F9FA;
--jamaica-gray-100: #F1F3F4;
--jamaica-gray-200: #E8EAED;
--jamaica-gray-300: #DADCE0;
--jamaica-gray-400: #BDC1C6;
--jamaica-gray-500: #9AA0A6;
--jamaica-gray-600: #80868B;
--jamaica-gray-700: #5F6368;
--jamaica-gray-800: #3C4043;
--jamaica-gray-900: #202124;
```

---

## 🏗️ THEME SYSTEM ARCHITECTURE

### **1. Country-Based Theme Detection**
```typescript
// src/lib/country-theme.ts
export type CountryCode = 'GY' | 'JM';

export interface CountryTheme {
  code: CountryCode;
  name: string;
  currency: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  assets: {
    logo: string;
    favicon: string;
    hero: string;
  };
}

export const countryThemes: Record<CountryCode, CountryTheme> = {
  GY: {
    code: 'GY',
    name: 'Guyana Home Hub',
    currency: 'GYD',
    colors: {
      primary: '#2563eb',     // Current blue
      secondary: '#059669',   // Current green  
      accent: '#dc2626',      // Current red
      background: '#ffffff',
      text: '#171717'
    },
    assets: {
      logo: '/logos/guyana-logo.png',
      favicon: '/favicons/guyana-favicon.ico',
      hero: '/images/guyana-hero.jpg'
    }
  },
  JM: {
    code: 'JM',
    name: 'Jamaica Home Hub',
    currency: 'JMD', 
    colors: {
      primary: '#009639',     // Jamaica green
      secondary: '#FFD700',   // Jamaica yellow
      accent: '#0077BE',      // Caribbean blue
      background: '#ffffff',
      text: '#000000'
    },
    assets: {
      logo: '/logos/jamaica-logo.png',
      favicon: '/favicons/jamaica-favicon.ico', 
      hero: '/images/jamaica-hero.jpg'
    }
  }
};
```

### **2. Dynamic CSS Variables**
```css
/* src/app/globals.css - Enhanced */
:root {
  /* Default (Guyana) theme */
  --background: #ffffff;
  --foreground: #171717;
  --primary: #2563eb;
  --secondary: #059669;
  --accent: #dc2626;
}

/* Jamaica theme override */
:root[data-country="JM"] {
  --primary: #009639;
  --secondary: #FFD700;
  --accent: #0077BE;
  --foreground: #000000;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### **3. Theme Provider Component**
```typescript
// src/components/CountryThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { CountryCode, CountryTheme, countryThemes } from '@/lib/country-theme';

interface CountryThemeContextType {
  country: CountryCode;
  theme: CountryTheme;
  setCountry: (country: CountryCode) => void;
}

const CountryThemeContext = createContext<CountryThemeContextType | null>(null);

export function CountryThemeProvider({ 
  children, 
  initialCountry 
}: { 
  children: React.ReactNode;
  initialCountry: CountryCode;
}) {
  const [country, setCountry] = useState<CountryCode>(initialCountry);
  const theme = countryThemes[country];

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-country', country);
    
    // Update CSS variables
    const root = document.documentElement.style;
    root.setProperty('--primary', theme.colors.primary);
    root.setProperty('--secondary', theme.colors.secondary);
    root.setProperty('--accent', theme.colors.accent);
    root.setProperty('--background', theme.colors.background);
    root.setProperty('--foreground', theme.colors.text);
  }, [country, theme]);

  return (
    <CountryThemeContext.Provider value={{ country, theme, setCountry }}>
      {children}
    </CountryThemeContext.Provider>
  );
}

export const useCountryTheme = () => {
  const context = useContext(CountryThemeContext);
  if (!context) {
    throw new Error('useCountryTheme must be used within CountryThemeProvider');
  }
  return context;
};
```

---

## 🔄 IMPLEMENTATION STEPS

### **Step 1: Create Theme System**
- [ ] Create `src/lib/country-theme.ts`
- [ ] Create `src/components/CountryThemeProvider.tsx`
- [ ] Update `src/app/globals.css` with theme variables
- [ ] Add theme detection middleware

### **Step 2: Update Components**
- [ ] Replace hardcoded colors with theme variables
- [ ] Update navigation components
- [ ] Update hero sections
- [ ] Update pricing display components

### **Step 3: Asset Management**
- [ ] Create country-specific asset folders
- [ ] Design Jamaica logo variants
- [ ] Create Jamaica favicon
- [ ] Source Jamaica hero images

### **Step 4: Typography & Branding**
- [ ] Define Jamaica-specific font weights
- [ ] Update brand messaging
- [ ] Create Jamaica-specific copy
- [ ] Implement dynamic meta tags

---

## 📁 REQUIRED ASSETS

### **Jamaica Logo Requirements**
- **Primary Logo**: Jamaica Home Hub wordmark
- **Icon**: Simplified JHH monogram  
- **Favicon**: 16x16, 32x32, 192x192 PNG + ICO
- **Colors**: Green (#009639) and Yellow (#FFD700) variants

### **Hero Images**
- **Landscape**: 1920x1080 Jamaica property scene
- **Mobile**: 768x1024 vertical crop
- **Compressed**: WebP format for performance

### **Brand Elements**
- **Color swatches**: SVG format
- **Pattern library**: Jamaica-inspired patterns
- **Icon set**: Country-specific icons

---

## 🧪 TESTING PLAN

### **Visual Regression Testing**
- [ ] Screenshot comparison: Guyana vs Jamaica themes
- [ ] Component isolation testing
- [ ] Mobile responsive verification
- [ ] Accessibility contrast checking

### **Theme Switching Testing**
- [ ] Manual theme toggle functionality
- [ ] URL-based theme detection
- [ ] Session persistence testing
- [ ] Performance impact assessment

---

## 🚨 ROLLBACK PLAN

**If theme system causes issues:**
1. **Immediate**: Revert `globals.css` changes
2. **Component**: Remove theme provider from layout
3. **Assets**: Fall back to default Guyana assets
4. **Database**: Theme preferences are non-destructive

**Safe Implementation:**
- Feature flagging for theme system
- Gradual component migration
- A/B testing capability
- User preference storage

---

## 📊 SUCCESS CRITERIA

**Technical Goals:**
- [ ] Theme switching works without page reload
- [ ] No visual breaking changes to Guyana site
- [ ] Performance impact < 50ms
- [ ] Accessibility standards maintained

**Design Goals:**
- [ ] Jamaica brand identity clearly differentiated
- [ ] Professional appearance matching Guyana quality
- [ ] Caribbean aesthetic without being overwhelming
- [ ] Mobile-first responsive design

**Business Goals:**
- [ ] Jamaica market brand recognition
- [ ] Seamless user experience
- [ ] SEO-friendly implementation
- [ ] Scalable for additional countries

---

**Next Phase:** Phase 3 - Domain & Middleware Setup  
**Estimated Time:** 8-12 hours  
**Risk Level:** 🟡 Medium (requires careful CSS management)

---

**Status:** Ready for implementation  
**Dependencies:** All database requirements met ✅  
**Blockers:** None identified