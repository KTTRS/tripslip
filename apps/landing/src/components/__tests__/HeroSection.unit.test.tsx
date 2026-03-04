/**
 * Unit Tests - HeroSection Component
 * 
 * Tests the HeroSection component functionality including:
 * - Content rendering
 * - CTA buttons
 * - Responsive behavior
 * - Animation triggers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSection } from '../HeroSection';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock intersection observer for animations
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('HeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero content correctly', () => {
    render(<HeroSection />);

    expect(screen.getByText('Simplify Field Trips for Everyone')).toBeInTheDocument();
    expect(screen.getByText(/Connect venues, schools, teachers, and parents/)).toBeInTheDocument();
    expect(screen.getByText(/streamlined platform that makes field trips/)).toBeInTheDocument();
  });

  it('displays main CTA buttons', () => {
    render(<HeroSection />);

    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
  });

  it('displays user type selection buttons', () => {
    render(<HeroSection />);

    expect(screen.getByText('For Venues')).toBeInTheDocument();
    expect(screen.getByText('For Schools')).toBeInTheDocument();
    expect(screen.getByText('For Teachers')).toBeInTheDocument();
    expect(screen.getByText('For Parents')).toBeInTheDocument();
  });

  it('shows key features', () => {
    render(<HeroSection />);

    expect(screen.getByText('Digital Permission Slips')).toBeInTheDocument();
    expect(screen.getByText('Secure Payment Processing')).toBeInTheDocument();
    expect(screen.getByText('Real-time Communication')).toBeInTheDocument();
    expect(screen.getByText('FERPA Compliant')).toBeInTheDocument();
  });

  it('displays statistics', () => {
    render(<HeroSection />);

    expect(screen.getByText('1000+')).toBeInTheDocument();
    expect(screen.getByText('Venues Connected')).toBeInTheDocument();
    expect(screen.getByText('50,000+')).toBeInTheDocument();
    expect(screen.getByText('Students Served')).toBeInTheDocument();
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('Schools Partnered')).toBeInTheDocument();
  });

  it('navigates to venue signup when venue button is clicked', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    const venueButton = screen.getByText('For Venues');
    await user.click(venueButton);

    expect(mockNavigate).toHaveBeenCalledWith('/venue/signup');
  });

  it('navigates to school signup when school button is clicked', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    const schoolButton = screen.getByText('For Schools');
    await user.click(schoolButton);

    expect(mockNavigate).toHaveBeenCalledWith('/school/signup');
  });

  it('navigates to teacher signup when teacher button is clicked', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    const teacherButton = screen.getByText('For Teachers');
    await user.click(teacherButton);

    expect(mockNavigate).toHaveBeenCalledWith('/teacher/signup');
  });

  it('scrolls to features when learn more is clicked', async () => {
    const user = userEvent.setup();
    const mockScrollIntoView = vi.fn();
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = mockScrollIntoView;
    
    render(<HeroSection />);

    const learnMoreButton = screen.getByRole('button', { name: /learn more/i });
    await user.click(learnMoreButton);

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('opens signup modal when get started is clicked', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    await user.click(getStartedButton);

    // Should show signup modal
    await waitFor(() => {
      expect(screen.getByText('Choose Your Role')).toBeInTheDocument();
    });
  });

  it('displays hero image', () => {
    render(<HeroSection />);

    const heroImage = screen.getByAltText('TripSlip Platform Dashboard');
    expect(heroImage).toBeInTheDocument();
    expect(heroImage).toHaveAttribute('src', expect.stringContaining('hero-dashboard'));
  });

  it('shows trust indicators', () => {
    render(<HeroSection />);

    expect(screen.getByText('Trusted by educators nationwide')).toBeInTheDocument();
    expect(screen.getByText('FERPA Compliant')).toBeInTheDocument();
    expect(screen.getByText('SOC 2 Certified')).toBeInTheDocument();
    expect(screen.getByText('256-bit SSL Encryption')).toBeInTheDocument();
  });

  it('displays testimonial quote', () => {
    render(<HeroSection />);

    expect(screen.getByText(/TripSlip has transformed how we manage field trips/)).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Elementary School Principal')).toBeInTheDocument();
  });

  it('shows video play button', () => {
    render(<HeroSection />);

    const playButton = screen.getByRole('button', { name: /watch demo/i });
    expect(playButton).toBeInTheDocument();
  });

  it('opens video modal when play button is clicked', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    const playButton = screen.getByRole('button', { name: /watch demo/i });
    await user.click(playButton);

    await waitFor(() => {
      expect(screen.getByText('Product Demo')).toBeInTheDocument();
    });
  });

  it('handles responsive layout', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<HeroSection />);

    // Should still render main content
    expect(screen.getByText('Simplify Field Trips for Everyone')).toBeInTheDocument();
    
    // Mobile-specific elements
    const mobileMenu = screen.getByRole('button', { name: /menu/i });
    expect(mobileMenu).toBeInTheDocument();
  });

  it('animates elements on scroll', () => {
    render(<HeroSection />);

    // Verify intersection observer was set up
    expect(mockIntersectionObserver).toHaveBeenCalled();
    
    // Simulate intersection
    const observerCallback = mockIntersectionObserver.mock.calls[0][0];
    observerCallback([
      {
        target: document.querySelector('[data-animate="fade-up"]'),
        isIntersecting: true,
      },
    ]);

    // Animation classes should be applied
    const animatedElement = document.querySelector('[data-animate="fade-up"]');
    expect(animatedElement).toHaveClass('animate-fade-up');
  });

  it('displays language selector', () => {
    render(<HeroSection />);

    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument();
  });

  it('changes language when selector is used', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    const languageButton = screen.getByRole('button', { name: /english/i });
    await user.click(languageButton);

    // Should show language options
    await waitFor(() => {
      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(screen.getByText('العربية')).toBeInTheDocument();
    });

    // Click Spanish
    await user.click(screen.getByText('Español'));

    // Content should change to Spanish
    await waitFor(() => {
      expect(screen.getByText('Simplifica los Viajes Escolares para Todos')).toBeInTheDocument();
    });
  });

  it('shows accessibility features', () => {
    render(<HeroSection />);

    // Check for ARIA labels
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveAttribute('aria-label');

    // Check for skip links
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    // Tab through interactive elements
    await user.tab();
    expect(screen.getByText('Skip to main content')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /get started/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /learn more/i })).toHaveFocus();
  });

  it('displays social proof logos', () => {
    render(<HeroSection />);

    expect(screen.getByAltText('Harvard University')).toBeInTheDocument();
    expect(screen.getByAltText('Stanford University')).toBeInTheDocument();
    expect(screen.getByAltText('MIT')).toBeInTheDocument();
    expect(screen.getByAltText('UC Berkeley')).toBeInTheDocument();
  });

  it('shows feature icons', () => {
    render(<HeroSection />);

    // Check for feature icons
    expect(screen.getByTestId('permission-slip-icon')).toBeInTheDocument();
    expect(screen.getByTestId('payment-icon')).toBeInTheDocument();
    expect(screen.getByTestId('communication-icon')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-icon')).toBeInTheDocument();
  });

  it('handles error states gracefully', () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate error in component
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <div>
        <HeroSection />
        <ThrowError />
      </div>
    );

    // Component should still render main content
    expect(screen.getByText('Simplify Field Trips for Everyone')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('preloads critical images', () => {
    render(<HeroSection />);

    // Check for preload links in document head
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    const imagePreloads = Array.from(preloadLinks).filter(link => 
      link.getAttribute('as') === 'image'
    );

    expect(imagePreloads.length).toBeGreaterThan(0);
  });
});