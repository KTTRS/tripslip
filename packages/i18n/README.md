# @tripslip/i18n

Internationalization (i18n) package for TripSlip platform applications.

## Overview

Provides translation infrastructure supporting:
- **English (en)** - Default language
- **Spanish (es)** - Full translation
- **Arabic (ar)** - Full translation with RTL support

## Usage

### Initialize i18n

```tsx
import { initI18n } from '@tripslip/i18n';

// Initialize in your app entry point
initI18n();
```

### Using Translations

```tsx
import { useTranslation } from '@tripslip/i18n';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('permissionSlipFor')}</h1>
      <p>{t('iAmGuardianOf', { name: 'John' })}</p>
    </div>
  );
}
```

### RTL Support

```tsx
import { useRTL } from '@tripslip/i18n';

function App() {
  // Automatically handles RTL layout for Arabic
  useRTL();
  
  return <div>Content</div>;
}
```

### Language Selector

```tsx
import { LanguageSelector } from '@tripslip/i18n';

function Header() {
  return (
    <header>
      <LanguageSelector />
    </header>
  );
}
```

### Changing Language Programmatically

```tsx
import { useTranslation } from '@tripslip/i18n';

function MyComponent() {
  const { i18n } = useTranslation();
  
  const switchToSpanish = () => {
    i18n.changeLanguage('es');
  };
  
  return <button onClick={switchToSpanish}>Español</button>;
}
```

### Checking Current Language

```tsx
import { useTranslation, isRTL } from '@tripslip/i18n';

function MyComponent() {
  const { i18n } = useTranslation();
  
  const isArabic = isRTL(i18n.language);
  
  return (
    <div className={isArabic ? 'text-right' : 'text-left'}>
      Content
    </div>
  );
}
```

## Translation Keys

### Common
- `back` - Back button
- `save` - Save button
- `submit` - Submit button
- `required` - Required field indicator
- `select` - Select dropdown placeholder

### Permission Slips
- `permissionSlipFor` - Permission slip for
- `signPermissionSlip` - Sign Permission Slip
- `yourSignature` - Your Signature
- `continueToSignature` - Continue to Signature
- `continueToPayment` - Continue to Payment

### Payment
- `payment` - Payment
- `payInFull` - Pay in full
- `cardNumber` - Card Number
- `expiry` - Expiry
- `pay` - Pay button

### Confirmation
- `youreAllSet` - You're all set!
- `permissionGrantedFor` - Permission granted for
- `paymentConfirmed` - Payment confirmed
- `confirmationSentTo` - Confirmation sent to

## Adding New Translations

1. Add key to `src/locales/en.json`
2. Add Spanish translation to `src/locales/es.json`
3. Add Arabic translation to `src/locales/ar.json`

```json
// en.json
{
  "newKey": "New translation"
}

// es.json
{
  "newKey": "Nueva traducción"
}

// ar.json
{
  "newKey": "ترجمة جديدة"
}
```

## RTL Styling

When Arabic is selected, the following changes automatically:
- `document.documentElement.dir = 'rtl'`
- `document.documentElement.lang = 'ar'`
- `.rtl` class added to `<html>`

Use Tailwind's logical properties for RTL support:
```tsx
// ✅ Good - Uses logical properties
<div className="ms-4 me-2">  // margin-inline-start, margin-inline-end

// ❌ Bad - Fixed direction
<div className="ml-4 mr-2">  // margin-left, margin-right
```

## Language Detection

Language is detected in this order:
1. localStorage (`tripslip_language`)
2. Browser language
3. HTML lang attribute
4. Fallback to English

## Features

- Automatic language detection
- Persistent language preference (localStorage)
- RTL layout support for Arabic
- Interpolation for dynamic values
- Pluralization support
- Date/time formatting per locale
- Number formatting per locale
