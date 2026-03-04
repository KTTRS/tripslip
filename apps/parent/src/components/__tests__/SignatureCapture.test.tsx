import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureCapture } from '../permission-slip/SignatureCapture';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'permissionSlip.signature': 'Signature',
        'permissionSlip.signatureInstruction': 'Please sign above',
        'permissionSlip.clearSignature': 'Clear',
      };
      return translations[key] || key;
    }
  })
}));

// Mock canvas methods globally
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
  })),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: vi.fn(() => 'data:image/png;base64,test-signature'),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    left: 0,
    top: 0,
    right: 400,
    bottom: 200,
    width: 400,
    height: 200,
  })),
});

describe('SignatureCapture', () => {
  const mockOnSignatureChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements FR-9.5**
   * Test signature capture rendering
   */
  it('should render signature canvas', () => {
    render(
      <SignatureCapture onSignatureChange={mockOnSignatureChange} />
    );

    expect(screen.getByText('Signature')).toBeInTheDocument();
    expect(screen.getByText('Please sign above')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument(); // Canvas
  });

  /**
   * **Validates: Requirements FR-9.5**
   * Test mouse drawing functionality
   */
  it('should handle mouse drawing events', async () => {
    render(
      <SignatureCapture onSignatureChange={mockOnSignatureChange} />
    );

    const canvas = screen.getByRole('img', { hidden: true });

    // Start drawing
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    
    // Draw line
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    
    // Stop drawing
    fireEvent.mouseUp(canvas);

    await waitFor(() => {
      expect(mockOnSignatureChange).toHaveBeenCalledWith('data:image/png;base64,test-signature');
    });
  });

  /**
   * **Validates: Requirements FR-9.5**
   * Test touch drawing functionality
   */
  it('should handle touch drawing events', async () => {
    render(
      <SignatureCapture onSignatureChange={mockOnSignatureChange} />
    );

    const canvas = screen.getByRole('img', { hidden: true });

    // Start drawing with touch
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 10, clientY: 10 }]
    });
    
    // Draw line with touch
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 20, clientY: 20 }]
    });
    
    // Stop drawing
    fireEvent.touchEnd(canvas);

    await waitFor(() => {
      expect(mockOnSignatureChange).toHaveBeenCalledWith('data:image/png;base64,test-signature');
    });
  });

  /**
   * **Validates: Requirements FR-9.5**
   * Test signature clearing functionality
   */
  it('should clear signature when clear button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <SignatureCapture onSignatureChange={mockOnSignatureChange} />
    );

    const canvas = screen.getByRole('img', { hidden: true });

    // Draw signature first
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);

    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    // Clear signature
    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(mockOnSignatureChange).toHaveBeenCalledWith(null);
  });

  /**
   * **Validates: Requirements FR-9.5**
   * Test loading existing signature
   */
  it('should load existing signature value', () => {
    const existingSignature = 'data:image/png;base64,existing-signature';

    render(
      <SignatureCapture 
        onSignatureChange={mockOnSignatureChange} 
        value={existingSignature}
      />
    );

    // Should show clear button for existing signature
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  /**
   * **Validates: Requirements FR-9.5**
   * Test drawing state management
   */
  it('should not draw when mouse is not down', () => {
    render(
      <SignatureCapture onSignatureChange={mockOnSignatureChange} />
    );

    const canvas = screen.getByRole('img', { hidden: true });

    // Try to draw without mouse down
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });

    // Should not call onSignatureChange
    expect(mockOnSignatureChange).not.toHaveBeenCalled();
  });
});