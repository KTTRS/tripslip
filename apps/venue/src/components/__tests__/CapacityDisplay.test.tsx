import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapacityDisplay } from '../CapacityDisplay';

describe('CapacityDisplay', () => {
  it('should display capacity numbers correctly', () => {
    render(<CapacityDisplay totalCapacity={100} bookedCount={30} />);
    
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });

  it('should show "Available" status when capacity is good', () => {
    render(<CapacityDisplay totalCapacity={100} bookedCount={30} />);
    
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('should show "Limited Availability" when 60-79% booked', () => {
    render(<CapacityDisplay totalCapacity={100} bookedCount={65} />);
    
    expect(screen.getByText('Limited Availability')).toBeInTheDocument();
  });

  it('should show "Low Availability" when 80%+ booked', () => {
    render(<CapacityDisplay totalCapacity={100} bookedCount={85} />);
    
    expect(screen.getByText('Low Availability')).toBeInTheDocument();
  });

  it('should show "Fully Booked" when no capacity remaining', () => {
    render(<CapacityDisplay totalCapacity={100} bookedCount={100} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Fully Booked')).toBeInTheDocument();
  });

  it('should handle zero capacity', () => {
    render(<CapacityDisplay totalCapacity={0} bookedCount={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('/ 0')).toBeInTheDocument();
    expect(screen.getByText('Fully Booked')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CapacityDisplay totalCapacity={100} bookedCount={30} className="custom-class" />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
