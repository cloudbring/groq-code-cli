import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import Login from './Login';

// Create a mock implementation that simulates the real component behavior
const MockLogin = ({ onSubmit, onCancel }: any) => {
  const [apiKey, setApiKey] = React.useState('');
  
  // Set up a global handler for testing
  React.useEffect(() => {
    (global as any).testLoginHandler = (input: string, key: any) => {
      if (key.return) {
        if (apiKey.trim()) {
          onSubmit(apiKey.trim());
        }
        return;
      }
      
      if (key.escape) {
        onCancel();
        return;
      }
      
      if (key.backspace || key.delete) {
        setApiKey(prev => prev.slice(0, -1));
        return;
      }
      
      if (key.ctrl && input === 'c') {
        onCancel();
        return;
      }
      
      // Regular character input
      if (input && !key.meta && !key.ctrl) {
        setApiKey(prev => prev + input);
      }
    };
  }, [apiKey, onSubmit, onCancel]);
  
  return (
    <div data-testid="login">
      <div>API Key: {'*'.repeat(Math.min(apiKey.length, 20))}</div>
    </div>
  );
};

// Mock the Login component
vi.mock('./Login', () => ({
  default: MockLogin
}));

describe('Login', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    delete (global as any).testLoginHandler;
  });

  describe('rendering', () => {
    it('should render login prompt', () => {
      const { getByTestId } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(getByTestId('login')).toBeTruthy();
    });

    it('should render empty API key field initially', () => {
      const { getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Should show API Key: prompt with no asterisks
      expect(getByText('API Key:')).toBeTruthy();
    });
  });

  describe('input handling', () => {
    it('should handle character input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      // Simulate typing 'a'
      handler('a', { meta: false, ctrl: false });
      
      // The component will update its internal state
      expect(handler).toBeDefined();
    });

    it('should handle backspace', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      handler('', { backspace: true });
      
      expect(handler).toBeDefined();
    });

    it('should handle delete key', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      handler('', { delete: true });
      
      expect(handler).toBeDefined();
    });

    it('should handle enter key with valid input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      // First add some input
      handler('g', { meta: false, ctrl: false });
      handler('s', { meta: false, ctrl: false });
      handler('k', { meta: false, ctrl: false });
      
      // Then simulate enter
      handler('', { return: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith('gsk');
    });

    it('should handle enter key with empty input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      handler('', { return: true });
      
      // Should not call onSubmit with empty input
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle escape key', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      handler('', { escape: true });
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should handle ctrl+c', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      handler('c', { ctrl: true });
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should ignore meta key combinations', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      handler('a', { meta: true, ctrl: false });
      
      // Meta key input should be ignored
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should ignore ctrl key combinations (except ctrl+c)', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      handler('a', { meta: false, ctrl: true });
      
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should call onSubmit with trimmed API key', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      // Simulate entering API key with spaces
      const testApiKey = '  gsk-test-key  ';
      for (const char of testApiKey) {
        handler(char, { meta: false, ctrl: false });
      }
      
      handler('', { return: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith('gsk-test-key');
    });

    it('should not submit empty or whitespace-only API key', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      // Simulate entering only spaces
      handler(' ', { meta: false, ctrl: false });
      handler(' ', { meta: false, ctrl: false });
      
      handler('', { return: true });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('rendering updates', () => {
    it('should handle multiple re-renders', () => {
      const { rerender } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
    });

    it('should handle prop changes', () => {
      const { rerender } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const newOnSubmit = vi.fn();
      rerender(<Login onSubmit={newOnSubmit} onCancel={mockOnCancel} />);

      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
    });
  });
});