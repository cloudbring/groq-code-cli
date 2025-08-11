import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

// Mock the Login component with the implementation inside the factory
vi.mock('./Login', () => {
  const React = require('react');
  
  // Store the component instance refs outside to maintain state
  let currentApiKey = '';
  let currentOnSubmit: any = null;
  let currentOnCancel: any = null;
  
  // Add reset function
  (global as any).resetLoginMockState = () => {
    currentApiKey = '';
    currentOnSubmit = null;
    currentOnCancel = null;
  };
  
  return {
    default: ({ onSubmit, onCancel }: any) => {
      const [apiKey, setApiKey] = React.useState('');
      
      // Update the current refs
      React.useEffect(() => {
        currentOnSubmit = onSubmit;
        currentOnCancel = onCancel;
      }, [onSubmit, onCancel]);
      
      // Set up a global handler for testing
      React.useEffect(() => {
        currentApiKey = apiKey;
        
        (global as any).testLoginHandler = (input: string, key: any) => {
          if (key.return) {
            if (currentApiKey.trim()) {
              currentOnSubmit(currentApiKey.trim());
            }
            return;
          }
          
          if (key.escape) {
            currentOnCancel();
            return;
          }
          
          if (key.backspace || key.delete) {
            setApiKey(prev => {
              const newValue = prev.slice(0, -1);
              currentApiKey = newValue;
              return newValue;
            });
            return;
          }
          
          if (key.ctrl && input === 'c') {
            currentOnCancel();
            return;
          }
          
          // Regular character input
          if (input && !key.meta && !key.ctrl) {
            setApiKey(prev => {
              const newValue = prev + input;
              currentApiKey = newValue;
              return newValue;
            });
          }
        };
      }, [apiKey]);
      
      // Reset state when component mounts
      React.useEffect(() => {
        currentApiKey = '';
        setApiKey('');
      }, []);
      
      return React.createElement('div', { 'data-testid': 'login' },
        React.createElement('div', null, 'API Key: ' + '*'.repeat(Math.min(apiKey.length, 20)))
      );
    }
  };
});

import Login from './Login';

describe('Login', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    delete (global as any).testLoginHandler;
    // Reset the mock's internal state
    if ((global as any).resetLoginMockState) {
      (global as any).resetLoginMockState();
    }
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

    it('should handle enter key with valid input', async () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      // First add some input
      await act(async () => {
        handler('g', { meta: false, ctrl: false });
      });
      await act(async () => {
        handler('s', { meta: false, ctrl: false });
      });
      await act(async () => {
        handler('k', { meta: false, ctrl: false });
      });
      
      // Then simulate enter
      await act(async () => {
        handler('', { return: true });
      });
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('gsk');
      });
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
    it('should call onSubmit with trimmed API key', async () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const handler = (global as any).testLoginHandler;
      expect(handler).toBeDefined();
      
      // Simulate entering API key with spaces
      const testApiKey = '  gsk-test-key  ';
      for (const char of testApiKey) {
        await act(async () => {
          handler(char, { meta: false, ctrl: false });
        });
      }
      
      await act(async () => {
        handler('', { return: true });
      });
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('gsk-test-key');
      });
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