import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignatureCanvas } from '../SignatureCanvas';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'signature.instructions': 'Please sign in the box below',
        'signature.clear': 'Clear',
        'signature.save': 'Save',
        'signature.emptyError': 'Please provide a signature before saving',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock canvas context
const mockContext = {
  strokeStyle: '',
  lineWidth: 0,
  lineCap: '',
  lineJoin: '',
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
};

const mockToDataURL = vi.fn();

// Mock canvas methods
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => mockContext),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: mockToDataURL,
});

// Mock getBoundingClientRect
Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 600,
    height: 200,
  })),
});

// Mock alert
global.alert = vi.fn();

describe('SignatureCanvas', () => {
  const mockOnSave = vi.fn();
  const mockOnClear = vi.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onClear: mockOnClear,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockToDataURL.mockReturnValue('data:image/png;base64,mock-signature-data');
  });

  it('renders canvas and buttons', () => {
    render(<SignatureCanvas {...defaultProps} />);

    expect(screen.getByText('Please sign in the box below')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    const canvas = screen.getByRole('img', { hidden: true }) || document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('initializes canvas context with correct settings', () => {
    render(<SignatureCanvas {...defaultProps} />);

    expect(mockContext.strokeStyle).toBe('#000000');
    expect(mockContext.lineWidth).toBe(2);
    expect(mockContext.lineCap).toBe('round');
    expect(mockContext.lineJoin).toBe('round');
  });

  it('starts drawing on mouse down', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 50 });

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalledWith(100, 50);
    }
  });

  it('draws lines on mouse move when drawing', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 50 });
      
      // Move mouse
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 75 });

      expect(mockContext.lineTo).toHaveBeenCalledWith(150, 75);
      expect(mockContext.stroke).toHaveBeenCalled();
    }
  });

  it('does not draw when not in drawing state', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Move mouse without starting to draw
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 75 });

      expect(mockContext.lineTo).not.toHaveBeenCalled();
      expect(mockContext.stroke).not.toHaveBeenCalled();
    }
  });

  it('stops drawing on mouse up', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 50 });
      
      // Stop drawing
      fireEvent.mouseUp(canvas);
      
      // Try to move mouse - should not draw
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 75 });

      expect(mockContext.lineTo).not.toHaveBeenCalled();
    }
  });

  it('stops drawing on mouse leave', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Start drawing
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 50 });
      
      // Leave canvas
      fireEvent.mouseLeave(canvas);
      
      // Try to move mouse - should not draw
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 75 });

      expect(mockContext.lineTo).not.toHaveBeenCalled();
    }
  });

  it('handles touch events for mobile', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      const touchEvent = {
        touches: [{ clientX: 100, clientY: 50 }],
        preventDefault: vi.fn(),
      };

      fireEvent.touchStart(canvas, touchEvent);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalledWith(100, 50);
      expect(touchEvent.preventDefault).toHaveBeenCalled();
    }
  });

  it('clears canvas and calls onClear', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearButton);

    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 600, 200);
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('saves signature when canvas is not empty', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Draw something to make canvas not empty
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 50 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 75 });
      fireEvent.mouseUp(canvas);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      expect(mockToDataURL).toHaveBeenCalledWith('image/png');
      expect(mockOnSave).toHaveBeenCalledWith('data:image/png;base64,mock-signature-data');
    }
  });

  it('shows alert when trying to save empty canvas', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    expect(global.alert).toHaveBeenCalledWith('Please provide a signature before saving');
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('disables save button when canvas is empty', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();
  });

  it('enables save button after drawing', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Draw something
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 50 });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    }
  });

  it('resets to empty state after clearing', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Draw something
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 50 });

      let saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();

      // Clear canvas
      const clearButton = screen.getByRole('button', { name: 'Clear' });
      fireEvent.click(clearButton);

      saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    }
  });

  it('handles touch move events', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Start touch drawing
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 50 }],
        preventDefault: vi.fn(),
      };
      fireEvent.touchStart(canvas, touchStartEvent);

      // Move touch
      const touchMoveEvent = {
        touches: [{ clientX: 150, clientY: 75 }],
        preventDefault: vi.fn(),
      };
      fireEvent.touchMove(canvas, touchMoveEvent);

      expect(mockContext.lineTo).toHaveBeenCalledWith(150, 75);
      expect(mockContext.stroke).toHaveBeenCalled();
      expect(touchMoveEvent.preventDefault).toHaveBeenCalled();
    }
  });

  it('stops drawing on touch end', () => {
    render(<SignatureCanvas {...defaultProps} />);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Start touch drawing
      fireEvent.touchStart(canvas, {
        touches: [{ clientX: 100, clientY: 50 }],
        preventDefault: vi.fn(),
      });

      // End touch
      fireEvent.touchEnd(canvas);

      // Try to move - should not draw
      fireEvent.touchMove(canvas, {
        touches: [{ clientX: 150, clientY: 75 }],
        preventDefault: vi.fn(),
      });

      expect(mockContext.lineTo).not.toHaveBeenCalledWith(150, 75);
    }
  });
});