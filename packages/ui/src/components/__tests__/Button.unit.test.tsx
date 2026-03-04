/**
 * Unit Tests - Button Component
 * 
 * Tests the Button component functionality including:
 * - Rendering variants and sizes
 * - Event handling
 * - Accessibility features
 * - Loading states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-[#F5C518]'); // Default variant
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-[#F5C518]');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-2', 'border-black');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-gray-100');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');

    rerender(<Button variant="success">Success</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-green-600');
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'px-4', 'py-2');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9', 'px-3');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11', 'px-8');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('hides text when loading and loadingText is provided', () => {
    render(<Button loading loadingText="Saving...">Save</Button>);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('renders as different HTML elements', () => {
    const { rerender } = render(<Button asChild><a href="/test">Link</a></Button>);
    expect(screen.getByRole('link')).toBeInTheDocument();

    rerender(<Button asChild><div>Div</div></Button>);
    expect(screen.getByText('Div')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Button</Button>);
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('spreads additional props', () => {
    render(<Button data-testid="custom-button" aria-label="Custom label">Button</Button>);
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
  });

  it('handles keyboard events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Button</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('has proper accessibility attributes', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('supports focus management', () => {
    render(<Button>Focusable</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(button).toHaveFocus();
  });

  it('renders with icons', () => {
    const Icon = () => <span data-testid="icon">🔥</span>;
    
    render(
      <Button>
        <Icon />
        With Icon
      </Button>
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('applies TripSlip design system styles', () => {
    render(<Button>TripSlip Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'border-2',
      'border-black',
      'shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]'
    );
  });

  it('has hover animations', () => {
    render(<Button>Animated</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]');
    expect(button).toHaveClass('hover:translate-x-[-4px]');
    expect(button).toHaveClass('hover:translate-y-[-4px]');
  });

  it('uses correct font family', () => {
    render(<Button>Font Test</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass("font-['Plus_Jakarta_Sans']");
  });

  it('handles form submission', () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    
    render(
      <form onSubmit={handleSubmit}>
        <Button type="submit">Submit</Button>
      </form>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('supports button types', () => {
    const { rerender } = render(<Button type="button">Button</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');

    rerender(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');

    rerender(<Button type="reset">Reset</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
  });

  it('maintains aspect ratio for icon variant', () => {
    render(<Button size="icon">🔥</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'w-10');
  });

  it('handles long text gracefully', () => {
    const longText = 'This is a very long button text that should wrap or truncate appropriately';
    
    render(<Button>{longText}</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(longText);
  });

  it('supports custom loading spinner', () => {
    const CustomSpinner = () => <div data-testid="custom-spinner">Loading...</div>;
    
    render(
      <Button loading loadingSpinner={<CustomSpinner />}>
        Save
      </Button>
    );
    
    expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
  });

  it('maintains button width during loading', () => {
    const { rerender } = render(<Button>Save Changes</Button>);
    const button = screen.getByRole('button');
    const originalWidth = button.getBoundingClientRect().width;
    
    rerender(<Button loading>Save Changes</Button>);
    const loadingWidth = button.getBoundingClientRect().width;
    
    expect(loadingWidth).toBe(originalWidth);
  });
});