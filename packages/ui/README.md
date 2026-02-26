# @tripslip/ui

Shared UI component library for TripSlip platform applications.

## Overview

This package contains all shared Radix UI components and custom TripSlip components following the TripSlip design system.

## Design System

### Colors
- **Primary Yellow**: `#F5C518` - Brand color for CTAs and highlights
- **Black**: `#0A0A0A` - Text, borders, shadows
- **White**: `#FFFFFF` - Backgrounds

### Typography
- **Display**: Fraunces (700, 900) - Headlines and hero text
- **Body**: Plus Jakarta Sans (300-700) - UI and body text
- **Mono**: Space Mono (400, 700) - Labels and data

### Component Patterns
- **Offset Shadow**: 4px/8px offset shadows with hover interactions
- **Claymorphic 3D**: Layered shadows for depth
- **Bounce Animation**: `cubic-bezier(0.34, 1.56, 0.64, 1)` for interactions

## Components

### Core Components (Radix UI)
- Button, Input, Select, Checkbox, Radio
- Card, Dialog, Sheet, Popover
- Table, Pagination
- Calendar, DatePicker
- Avatar, Badge, Tooltip
- Alert, Toast

### Custom Components
- `SignaturePad` - Digital signature capture
- `DocumentViewer` - PDF preview
- `MetricCard` - Dashboard statistics
- `ProgressBar` - Status indicators

## Usage

```tsx
import { Button, Card, Input } from '@tripslip/ui';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  );
}
```

## Development

```bash
# Install dependencies
npm install

# Lint
npm run lint

# Clean
npm run clean
```

## Tailwind Configuration

This package includes a Tailwind config with TripSlip design tokens. Import it in your app:

```ts
import baseConfig from '@tripslip/ui/tailwind.config';

export default {
  ...baseConfig,
  content: [
    ...baseConfig.content,
    './src/**/*.{ts,tsx}',
  ],
};
```
