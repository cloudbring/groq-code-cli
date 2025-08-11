import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import App from './App';
import { Agent } from '../core/agent';

// Mock the Chat component
vi.mock('./components/core/Chat.js', () => ({
  default: vi.fn(({ agent }) => <div data-testid="chat">Chat Component</div>)
}));

// Mock ink components
vi.mock('ink', () => ({
  Box: ({ children, ...props }: any) => <div data-testid="box" {...props}>{children}</div>,
  Text: ({ children }: any) => <span data-testid="text">{children}</span>
}));

describe('App', () => {
  let mockAgent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a mock agent
    mockAgent = {
      setApiKey: vi.fn(),
      chat: vi.fn(),
      interrupt: vi.fn(),
      toggleAutoApprove: vi.fn(),
      setReasoningDisplay: vi.fn(),
    } as any;
  });

  describe('initialization', () => {
    it('should show loading state initially', () => {
      const { getByText } = render(<App agent={mockAgent} />);
      expect(getByText('Initializing agent...')).toBeTruthy();
    });

    it('should show Chat component after initialization', async () => {
      const { getByTestId, queryByText } = render(<App agent={mockAgent} />);
      
      await waitFor(() => {
        expect(getByTestId('chat')).toBeTruthy();
        expect(queryByText('Initializing agent...')).toBeFalsy();
      });
    });
  });

  describe('rendering', () => {
    it('should render with correct layout structure', () => {
      const { container } = render(<App agent={mockAgent} />);
      const boxes = container.querySelectorAll('[data-testid="box"]');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('should pass agent prop to Chat component', async () => {
      const { getByTestId } = render(<App agent={mockAgent} />);
      
      await waitFor(() => {
        expect(getByTestId('chat')).toBeTruthy();
      });
      
      // Verify Chat was called with the agent prop
      const ChatMock = vi.mocked((await import('./components/core/Chat.js')).default);
      expect(ChatMock).toHaveBeenCalledWith(
        expect.objectContaining({ agent: mockAgent }),
        expect.anything()
      );
    });
  });

  describe('state management', () => {
    it('should properly manage isReady state', async () => {
      const { getByText, queryByText, getByTestId } = render(<App agent={mockAgent} />);
      
      // Initially shows loading
      expect(getByText('Initializing agent...')).toBeTruthy();
      
      // After effect runs, shows Chat
      await waitFor(() => {
        expect(queryByText('Initializing agent...')).toBeFalsy();
        expect(getByTestId('chat')).toBeTruthy();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null agent gracefully', () => {
      const { getByText } = render(<App agent={null as any} />);
      expect(getByText('Initializing agent...')).toBeTruthy();
    });

    it('should handle undefined agent gracefully', () => {
      const { getByText } = render(<App agent={undefined as any} />);
      expect(getByText('Initializing agent...')).toBeTruthy();
    });

    it('should handle re-renders with different agent', async () => {
      const { rerender, getByTestId } = render(<App agent={mockAgent} />);
      
      await waitFor(() => {
        expect(getByTestId('chat')).toBeTruthy();
      });

      const newAgent = {
        setApiKey: vi.fn(),
        chat: vi.fn(),
        interrupt: vi.fn(),
        toggleAutoApprove: vi.fn(),
        setReasoningDisplay: vi.fn(),
      } as any;

      rerender(<App agent={newAgent} />);
      
      // Should still show Chat with new agent
      expect(getByTestId('chat')).toBeTruthy();
    });
  });

  describe('layout', () => {
    it('should use column flex direction', () => {
      const { container } = render(<App agent={mockAgent} />);
      const mainBox = container.querySelector('[data-testid="box"]');
      expect(mainBox).toHaveAttribute('flexDirection', 'column');
    });

    it('should set height to 100%', () => {
      const { container } = render(<App agent={mockAgent} />);
      const mainBox = container.querySelector('[data-testid="box"]');
      expect(mainBox).toHaveAttribute('height', '100%');
    });

    it('should center loading message', () => {
      const { container } = render(<App agent={mockAgent} />);
      const loadingBoxes = Array.from(container.querySelectorAll('[data-testid="box"]'));
      const centerBox = loadingBoxes.find(box => 
        box.getAttribute('justifyContent') === 'center' &&
        box.getAttribute('alignItems') === 'center'
      );
      expect(centerBox).toBeTruthy();
    });
  });
});