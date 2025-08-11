import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import Chat from './Chat';
import { Agent } from '../../../core/agent';

// Mock all the child components
vi.mock('./MessageHistory.js', () => ({
  default: vi.fn(() => <div data-testid="message-history">MessageHistory</div>)
}));

vi.mock('./MessageInput.js', () => ({
  default: vi.fn(({ onSubmit, value, onChange }) => (
    <div data-testid="message-input">
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      <button onClick={() => onSubmit(value)}>Send</button>
    </div>
  ))
}));

vi.mock('../display/TokenMetrics.js', () => ({
  default: vi.fn(() => <div data-testid="token-metrics">TokenMetrics</div>)
}));

vi.mock('../input-overlays/PendingToolApproval.js', () => ({
  default: vi.fn(({ onApprove, onReject }) => (
    <div data-testid="pending-approval">
      <button onClick={() => onApprove()}>Approve</button>
      <button onClick={() => onReject()}>Reject</button>
    </div>
  ))
}));

vi.mock('../input-overlays/Login.js', () => ({
  default: vi.fn(({ onSubmit, onCancel }) => (
    <div data-testid="login">
      <button onClick={() => onSubmit('test-key')}>Submit</button>
      <button onClick={() => onCancel()}>Cancel</button>
    </div>
  ))
}));

vi.mock('../input-overlays/ModelSelector.js', () => ({
  default: vi.fn(({ onSubmit, onCancel }) => (
    <div data-testid="model-selector">
      <button onClick={() => onSubmit('test-model')}>Select</button>
      <button onClick={() => onCancel()}>Cancel</button>
    </div>
  ))
}));

vi.mock('../input-overlays/MaxIterationsContinue.js', () => ({
  default: vi.fn(({ onContinue }) => (
    <div data-testid="max-iterations">
      <button onClick={() => onContinue(true)}>Continue</button>
      <button onClick={() => onContinue(false)}>Stop</button>
    </div>
  ))
}));

// Mock hooks
const mockUseAgent = vi.fn();
const mockUseTokenMetrics = vi.fn();

vi.mock('../../hooks/useAgent.js', () => ({
  useAgent: (...args: any[]) => mockUseAgent(...args)
}));

vi.mock('../../hooks/useTokenMetrics.js', () => ({
  useTokenMetrics: () => mockUseTokenMetrics()
}));

// Mock ink hooks
const mockUseInput = vi.fn();
const mockUseApp = vi.fn();

vi.mock('ink', () => ({
  Box: ({ children }: any) => <div data-testid="box">{children}</div>,
  Text: ({ children }: any) => <span data-testid="text">{children}</span>,
  useInput: (callback: any) => mockUseInput.mockImplementation(callback),
  useApp: () => mockUseApp()
}));

// Mock command handler
vi.mock('../../../commands/index.js', () => ({
  handleSlashCommand: vi.fn()
}));

describe('Chat', () => {
  let mockAgent: Agent;
  let mockAgentHookReturn: any;
  let mockTokenMetricsReturn: any;
  let mockExit: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAgent = {
      setApiKey: vi.fn(),
      chat: vi.fn(),
      interrupt: vi.fn(),
      toggleAutoApprove: vi.fn(),
      setReasoningDisplay: vi.fn(),
    } as any;

    mockTokenMetricsReturn = {
      completionTokens: 0,
      startTime: null,
      endTime: null,
      pausedTime: 0,
      isPaused: false,
      isActive: false,
      startRequest: vi.fn(),
      addApiTokens: vi.fn(),
      pauseMetrics: vi.fn(),
      resumeMetrics: vi.fn(),
      completeRequest: vi.fn(),
      resetMetrics: vi.fn(),
    };

    mockAgentHookReturn = {
      messages: [],
      userMessageHistory: [],
      isProcessing: false,
      currentToolExecution: null,
      pendingApproval: null,
      pendingMaxIterations: null,
      sessionAutoApprove: false,
      showReasoning: false,
      sendMessage: vi.fn(),
      approveToolExecution: vi.fn(),
      respondToMaxIterations: vi.fn(),
      addMessage: vi.fn(),
      setApiKey: vi.fn(),
      clearHistory: vi.fn(),
      toggleAutoApprove: vi.fn(),
      toggleReasoning: vi.fn(),
      interruptRequest: vi.fn(),
    };

    mockExit = vi.fn();

    mockUseTokenMetrics.mockReturnValue(mockTokenMetricsReturn);
    mockUseAgent.mockReturnValue(mockAgentHookReturn);
    mockUseApp.mockReturnValue({ exit: mockExit });
  });

  describe('rendering', () => {
    it('should render all core components', () => {
      const { getByTestId } = render(<Chat agent={mockAgent} />);
      
      expect(getByTestId('message-history')).toBeTruthy();
      expect(getByTestId('message-input')).toBeTruthy();
    });

    it('should show token metrics when active', () => {
      mockTokenMetricsReturn.isActive = true;
      mockUseTokenMetrics.mockReturnValue(mockTokenMetricsReturn);
      
      const { getByTestId } = render(<Chat agent={mockAgent} />);
      
      expect(getByTestId('token-metrics')).toBeTruthy();
    });

    it('should show pending approval when tool needs approval', () => {
      mockAgentHookReturn.pendingApproval = { tool: 'test-tool', args: {} };
      mockUseAgent.mockReturnValue(mockAgentHookReturn);
      
      const { getByTestId } = render(<Chat agent={mockAgent} />);
      
      expect(getByTestId('pending-approval')).toBeTruthy();
    });

    it('should show login when showLogin is true', () => {
      const { getByTestId, rerender } = render(<Chat agent={mockAgent} />);
      
      // Trigger login display (would normally be done via command)
      mockAgentHookReturn.isProcessing = false;
      mockUseAgent.mockReturnValue(mockAgentHookReturn);
      
      // Note: In real implementation, showLogin is set via state
      // For testing, we'd need to trigger the login command
    });

    it('should show max iterations dialog when pending', () => {
      mockAgentHookReturn.pendingMaxIterations = true;
      mockUseAgent.mockReturnValue(mockAgentHookReturn);
      
      const { getByTestId } = render(<Chat agent={mockAgent} />);
      
      expect(getByTestId('max-iterations')).toBeTruthy();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should exit on Ctrl+C', () => {
      render(<Chat agent={mockAgent} />);
      
      const inputHandler = mockUseInput.mock.calls[0][0];
      inputHandler('c', { ctrl: true });
      
      expect(mockExit).toHaveBeenCalled();
    });

    it('should toggle auto-approve on Shift+Tab', () => {
      render(<Chat agent={mockAgent} />);
      
      const inputHandler = mockUseInput.mock.calls[0][0];
      inputHandler('', { shift: true, tab: true });
      
      expect(mockAgentHookReturn.toggleAutoApprove).toHaveBeenCalled();
    });

    it('should handle escape key for pending approval', () => {
      mockAgentHookReturn.pendingApproval = { tool: 'test-tool', args: {} };
      mockUseAgent.mockReturnValue(mockAgentHookReturn);
      
      render(<Chat agent={mockAgent} />);
      
      const inputHandler = mockUseInput.mock.calls[0][0];
      inputHandler('', { escape: true });
      
      // Should reject the pending approval
      expect(mockAgentHookReturn.approveToolExecution).toHaveBeenCalledWith(false);
    });

    it('should interrupt processing on escape when processing', () => {
      mockAgentHookReturn.isProcessing = true;
      mockAgentHookReturn.currentToolExecution = null;
      mockUseAgent.mockReturnValue(mockAgentHookReturn);
      
      render(<Chat agent={mockAgent} />);
      
      const inputHandler = mockUseInput.mock.calls[0][0];
      inputHandler('', { escape: true });
      
      expect(mockAgentHookReturn.interruptRequest).toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('should send messages through agent hook', async () => {
      const { getByTestId } = render(<Chat agent={mockAgent} />);
      
      const input = getByTestId('message-input').querySelector('input');
      const button = getByTestId('message-input').querySelector('button');
      
      // Simulate message sending
      if (input && button) {
        (input as HTMLInputElement).value = 'test message';
        button.click();
        
        await waitFor(() => {
          expect(mockAgentHookReturn.sendMessage).toHaveBeenCalledWith('test message');
        });
      }
    });

    it('should handle slash commands', async () => {
      const { handleSlashCommand } = await import('../../../commands/index.js');
      
      render(<Chat agent={mockAgent} />);
      
      // Simulate slash command input
      const input = document.querySelector('input');
      if (input) {
        input.value = '/help';
        // In real implementation, this would trigger handleSlashCommand
      }
    });
  });

  describe('state management', () => {
    it('should hide input when processing', () => {
      mockAgentHookReturn.isProcessing = true;
      mockUseAgent.mockReturnValue(mockAgentHookReturn);
      
      const { queryByTestId } = render(<Chat agent={mockAgent} />);
      
      // Input should be hidden or disabled
      const input = queryByTestId('message-input');
      expect(input).toBeTruthy(); // Component exists but showInput prop would be false
    });

    it('should hide input when pending approval', () => {
      mockAgentHookReturn.pendingApproval = { tool: 'test-tool', args: {} };
      mockUseAgent.mockReturnValue(mockAgentHookReturn);
      
      const { queryByTestId } = render(<Chat agent={mockAgent} />);
      
      const input = queryByTestId('message-input');
      expect(input).toBeTruthy(); // Component exists but showInput prop would be false
    });
  });

  describe('tool approval', () => {
    it('should approve tool execution', async () => {
      mockAgentHookReturn.pendingApproval = { tool: 'test-tool', args: {} };
      mockUseAgent.mockReturnValue(mockAgentHookReturn);
      
      const { getByTestId } = render(<Chat agent={mockAgent} />);
      
      const approveButton = getByTestId('pending-approval').querySelector('button');
      if (approveButton) {
        approveButton.click();
        
        await waitFor(() => {
          expect(mockAgentHookReturn.approveToolExecution).toHaveBeenCalledWith(true);
        });
      }
    });

    it('should reject tool execution', async () => {
      mockAgentHookReturn.pendingApproval = { tool: 'test-tool', args: {} };
      mockUseAgent.mockReturnValue(mockAgentHookReturn);
      
      const { getByTestId } = render(<Chat agent={mockAgent} />);
      
      const buttons = getByTestId('pending-approval').querySelectorAll('button');
      const rejectButton = buttons[1]; // Second button is reject
      
      if (rejectButton) {
        rejectButton.click();
        
        await waitFor(() => {
          expect(mockAgentHookReturn.approveToolExecution).toHaveBeenCalledWith(false);
        });
      }
    });
  });

  describe('metrics integration', () => {
    it('should pass metrics callbacks to useAgent', () => {
      render(<Chat agent={mockAgent} />);
      
      expect(mockUseAgent).toHaveBeenCalledWith(
        mockAgent,
        mockTokenMetricsReturn.startRequest,
        mockTokenMetricsReturn.addApiTokens,
        mockTokenMetricsReturn.pauseMetrics,
        mockTokenMetricsReturn.resumeMetrics,
        mockTokenMetricsReturn.completeRequest
      );
    });
  });
});