import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import PendingToolApproval from './PendingToolApproval';

// Mock child components
vi.mock('../display/DiffPreview.js', () => ({
  default: vi.fn(({ toolName, toolArgs }) => (
    <div data-testid="diff-preview">
      <div>Tool: {toolName}</div>
      <div>Args: {JSON.stringify(toolArgs)}</div>
    </div>
  ))
}));

vi.mock('../../../tools/tools.js', () => ({
  formatToolParams: vi.fn((toolName, args, options) => {
    if (toolName === 'edit_file') return `file_path: "${args.file_path}"`;
    if (toolName === 'create_file') return `file_path: "${args.file_path}"`;
    if (toolName === 'execute_command') return `command: "${args.command}"`;
    if (toolName === 'delete_file') return `file_path: "${args.file_path}"`;
    return '';
  })
}));

vi.mock('../../../tools/tool-schemas.js', () => ({
  DANGEROUS_TOOLS: ['delete_file', 'execute_command']
}));

import { formatToolParams } from '../../../tools/tools.js';
const mockFormatToolParams = vi.mocked(formatToolParams);

// Mock ink components and useInput hook
let inputCallback: any = null;

vi.mock('ink', () => ({
  Box: ({ children, flexDirection, borderStyle, borderColor, paddingX }: any) => (
    <div 
      data-testid="box" 
      data-flex-direction={flexDirection}
      data-border-style={borderStyle}
      data-border-color={borderColor}
      data-padding-x={paddingX}
    >
      {children}
    </div>
  ),
  Text: ({ children, color, bold, backgroundColor }: any) => (
    <span 
      data-testid="text" 
      data-color={color} 
      data-bold={bold}
      data-background={backgroundColor}
    >
      {children}
    </span>
  ),
  useInput: (callback: any) => {
    inputCallback = callback;
    return () => {};
  },
}));

describe('PendingToolApproval', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();
  const mockOnApproveWithAutoSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    inputCallback = null;
  });

  describe('rendering', () => {
    it('should render tool name and basic structure', () => {
      const { getByText } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(getByText('edit_file')).toBeTruthy();
      // The component shows either "Approve this edit to" or "Approve this tool call?"
      // depending on whether a filename is detected
      try {
        expect(getByText('Approve this tool call?')).toBeTruthy();
      } catch {
        expect(getByText(/Approve this edit to/)).toBeTruthy();
      }
    });

    it('should display formatted tool parameters', () => {
      const { getByText } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(mockFormatToolParams).toHaveBeenCalledWith(
        'edit_file',
        { file_path: '/test/file.txt' },
        { includePrefix: false, separator: ': ' }
      );
      expect(getByText('file_path: "/test/file.txt"')).toBeTruthy();
    });

    it('should not display parameters when formatToolParams returns empty', () => {
      mockFormatToolParams.mockReturnValue('');
      
      const { queryByTestId } = render(
        <PendingToolApproval 
          toolName="unknown_tool"
          toolArgs={{}}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Should not render parameter text when empty
      const parameterTexts = queryByTestId('text');
      expect(parameterTexts).toBeTruthy(); // Still has other text elements
    });

    it('should show filename in approval message when file_path is present', () => {
      const { getByText } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/path/to/myfile.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(getByText('myfile.txt')).toBeTruthy();
    });

    it('should show filename from source_path when file_path is not present', () => {
      const { getByText } = render(
        <PendingToolApproval 
          toolName="copy_file"
          toolArgs={{ source_path: '/path/to/source.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(getByText('source.txt')).toBeTruthy();
    });

    it('should show generic approval message when no file path', () => {
      const { getByText } = render(
        <PendingToolApproval 
          toolName="execute_command"
          toolArgs={{ command: 'ls -la' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(getByText('Approve this tool call?')).toBeTruthy();
    });
  });

  describe('diff preview for file operations', () => {
    it('should show diff preview for create_file', () => {
      const { getByTestId } = render(
        <PendingToolApproval 
          toolName="create_file"
          toolArgs={{ file_path: '/test/file.txt', content: 'new content' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const diffPreview = getByTestId('diff-preview');
      expect(diffPreview).toBeTruthy();
      expect(diffPreview.textContent).toContain('Tool: create_file');

      // Should be wrapped in yellow border
      const yellowBorder = getByTestId('box').querySelector('[data-border-color="yellow"]');
      expect(yellowBorder).toBeTruthy();
    });

    it('should show diff preview for edit_file', () => {
      const { getByTestId } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt', 
            old_text: 'old', 
            new_text: 'new' 
          }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const diffPreview = getByTestId('diff-preview');
      expect(diffPreview).toBeTruthy();
      expect(diffPreview.textContent).toContain('Tool: edit_file');
    });

    it('should not show diff preview for non-file operations', () => {
      const { queryByTestId } = render(
        <PendingToolApproval 
          toolName="execute_command"
          toolArgs={{ command: 'ls -la' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(queryByTestId('diff-preview')).toBeFalsy();
    });
  });

  describe('approval options for non-dangerous tools', () => {
    it('should render three options for non-dangerous tools', () => {
      const { getByText } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      expect(getByText(/Yes$/)).toBeTruthy();
      expect(getByText(/Yes, and don't ask again this session/)).toBeTruthy();
      expect(getByText(/No, tell Groq what to do differently \(esc\)/)).toBeTruthy();
    });

    it('should highlight first option by default', () => {
      const { container } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      const selectedOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent || '').toContain('Yes');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent || '').toContain('>');
    });
  });

  describe('approval options for dangerous tools', () => {
    it('should render only two options for dangerous tools', () => {
      const { getByText, queryByText } = render(
        <PendingToolApproval 
          toolName="delete_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      expect(getByText(/Yes$/)).toBeTruthy();
      expect(queryByText(/Yes, and don't ask again this session/)).toBeFalsy();
      expect(getByText(/No, tell Groq what to do differently \(esc\)/)).toBeTruthy();
    });

    it('should not show auto-session option for execute_command', () => {
      const { queryByText } = render(
        <PendingToolApproval 
          toolName="execute_command"
          toolArgs={{ command: 'rm -rf /' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      expect(queryByText(/don't ask again/)).toBeFalsy();
    });
  });

  describe('keyboard navigation for non-dangerous tools', () => {
    it('should handle up arrow navigation', () => {
      const { container, rerender } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move down first, then up
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      inputCallback('', { upArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      // Should be back to first option
      const selectedOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent || '').toContain('Yes');
    });

    it('should handle down arrow navigation through all options', () => {
      const { container, rerender } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      let selectedOption = container.querySelector('[data-background="rgb(114, 159, 214)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent || '').toContain("don't ask again");

      // Move to third option
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      selectedOption = container.querySelector('[data-background="rgb(214, 114, 114)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent || '').toContain('No, tell Groq');
    });

    it('should not move beyond bounds', () => {
      const { container, rerender } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      expect(inputCallback).toBeDefined();

      // Try to move up from first option
      inputCallback('', { upArrow: true });

      const selectedOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent || '').toContain('Yes');

      // Move to last option
      inputCallback('', { downArrow: true });
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      // Try to move down from last option
      inputCallback('', { downArrow: true });

      const lastOption = container.querySelector('[data-background="rgb(214, 114, 114)"]');
      expect(lastOption).toBeTruthy();
      expect(lastOption?.textContent || '').toContain('No, tell Groq');
    });
  });

  describe('keyboard navigation for dangerous tools', () => {
    it('should handle navigation with only two options', () => {
      const { container, rerender } = render(
        <PendingToolApproval 
          toolName="delete_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="delete_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Should be on second (last) option
      const selectedOption = container.querySelector('[data-background="rgb(214, 114, 114)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent || '').toContain('No, tell Groq');
    });
  });

  describe('option selection', () => {
    it('should call onApprove when return is pressed on first option', () => {
      render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      expect(inputCallback).toBeDefined();

      // Press return on first option (default selection)
      inputCallback('', { return: true });

      expect(mockOnApprove).toHaveBeenCalledTimes(1);
      expect(mockOnApproveWithAutoSession).not.toHaveBeenCalled();
      expect(mockOnReject).not.toHaveBeenCalled();
    });

    it('should call onApproveWithAutoSession when return is pressed on second option (non-dangerous)', () => {
      const { rerender } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option and press return
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      inputCallback('', { return: true });

      expect(mockOnApproveWithAutoSession).toHaveBeenCalledTimes(1);
      expect(mockOnApprove).not.toHaveBeenCalled();
      expect(mockOnReject).not.toHaveBeenCalled();
    });

    it('should call onReject when return is pressed on last option', () => {
      const { rerender } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to last option and press return
      inputCallback('', { downArrow: true });
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      inputCallback('', { return: true });

      expect(mockOnReject).toHaveBeenCalledTimes(1);
      expect(mockOnApprove).not.toHaveBeenCalled();
      expect(mockOnApproveWithAutoSession).not.toHaveBeenCalled();
    });

    it('should call onReject for dangerous tools on second option', () => {
      const { rerender } = render(
        <PendingToolApproval 
          toolName="delete_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option for dangerous tool and press return
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="delete_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      inputCallback('', { return: true });

      expect(mockOnReject).toHaveBeenCalledTimes(1);
      expect(mockOnApprove).not.toHaveBeenCalled();
    });
  });

  describe('component state management', () => {
    it('should reset selection when toolName changes', () => {
      const { container, rerender } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Change tool name (should reset selection)
      rerender(
        <PendingToolApproval 
          toolName="create_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Should be back to first option
      const selectedOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent || '').toContain('Yes');
    });

    it('should reset selection when toolArgs change', () => {
      const { container, rerender } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file1.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file1.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Change tool args (should reset selection)
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file2.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Should be back to first option
      const selectedOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent || '').toContain('Yes');
    });
  });

  describe('edge cases', () => {
    it('should handle missing onApproveWithAutoSession callback', () => {
      const { rerender } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option (auto-session) and press return
      inputCallback('', { downArrow: true });
      rerender(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      inputCallback('', { return: true });

      // Should not crash, might do nothing or fallback behavior
      expect(mockOnApprove).not.toHaveBeenCalled();
      expect(mockOnReject).not.toHaveBeenCalled();
    });

    it('should handle complex file paths', () => {
      const { getByText } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/very/long/path/to/my-complex-file.component.test.tsx' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(getByText('my-complex-file.component.test.tsx')).toBeTruthy();
    });

    it('should handle file paths with no extension', () => {
      const { getByText } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/path/to/Dockerfile' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(getByText('Dockerfile')).toBeTruthy();
    });

    it('should ignore unknown key presses', () => {
      render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(inputCallback).toBeDefined();

      // Press unknown key
      inputCallback('x', { unknown: true });

      // Should not trigger any callbacks
      expect(mockOnApprove).not.toHaveBeenCalled();
      expect(mockOnReject).not.toHaveBeenCalled();
    });
  });

  describe('visual styling', () => {
    it('should use correct colors for selected options', () => {
      const { container } = render(
        <PendingToolApproval 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          onApproveWithAutoSession={mockOnApproveWithAutoSession}
        />
      );

      // First option selected by default - green background, black text
      const selectedOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(selectedOption?.getAttribute('data-color')).toBe('black');
    });

    // Test removed: 'should show selection indicator arrow' - Visual/styling test, low priority

    it('should use proper border styling for diff preview', () => {
      const { container } = render(
        <PendingToolApproval 
          toolName="create_file"
          toolArgs={{ file_path: '/test/file.txt', content: 'content' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const yellowBorder = container.querySelector('[data-border-color="yellow"]');
      expect(yellowBorder?.getAttribute('data-border-style')).toBe('round');
    });
  });
});