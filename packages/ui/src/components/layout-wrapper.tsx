import { ReactNode } from 'react';

interface LayoutWrapperProps {
  children: ReactNode;
  variant?: 'default' | 'yellow' | 'black';
}

/**
 * TripSlip Layout Wrapper
 * Applies the geometric design system with proper depth and shadows
 * Never use plain white backgrounds - always add depth
 */
export function LayoutWrapper({ children, variant = 'default' }: LayoutWrapperProps) {
  const getBackgroundClass = () => {
    switch (variant) {
      case 'yellow':
        return 'bg-ts-yellow';
      case 'black':
        return 'bg-ts-black';
      default:
        return 'bg-[#FAFAFA]'; // Gray-50 - never pure white
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()} relative`}>
      {/* Subtle texture overlay for depth */}
      {variant === 'default' && (
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(10, 10, 10, 0.08) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
      )}
      
      {children}
    </div>
  );
}

interface PageHeaderProps {
  children: ReactNode;
  variant?: 'default' | 'yellow';
}

/**
 * TripSlip Page Header
 * Sticky header with proper depth and shadow
 */
export function PageHeader({ children, variant = 'default' }: PageHeaderProps) {
  return (
    <div className={`
      sticky top-0 z-40
      ${variant === 'yellow' ? 'bg-ts-yellow' : 'bg-white'}
      border-b-[2.5px] border-ts-black
      shadow-ts-flat
    `}>
      {children}
    </div>
  );
}

interface ContentSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * TripSlip Content Section
 * Main content container with proper spacing
 */
export function ContentSection({ children, className = '' }: ContentSectionProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  );
}
