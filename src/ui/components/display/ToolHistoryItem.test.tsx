import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ToolHistoryItem from './ToolHistoryItem';
import { ToolExecution } from '../../hooks/useAgent.js';

// Mock child components
vi.mock('./DiffPreview.js', () => ({
  default: vi.fn(({ toolName, toolArgs, isHistorical }) => (
    <div data-testid="diff-preview">
      <div>Tool: {toolName}</div>
      <div>Args: {JSON.stringify(toolArgs)}</div>
      <div>Historical: {String(isHistorical)}</div>
    </div>
  ))
}));

vi.mock('../../../tools/tools.ts', () => ({
  formatToolParams: vi.fn((toolName, args, options) => {
    if (toolName === 'read_file') return `file_path: "${args.file_path}"`;
    if (toolName === 'edit_file') return `file_path: "${args.file_path}"`;
    if (toolName === 'execute_command') return `command: "${args.command}"`;
    return '';
  })
}));

// Mock ink components
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
  Text: ({ children, color, bold }: any) => (
    <span data-testid="text" data-color={color} data-bold={bold}>
      {children}
    </span>
  ),
}));

describe('ToolHistoryItem', () => {
  const mockFormatToolParams = vi.mocked(require('../../../tools/tools.ts').formatToolParams);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering status indicators', () => {
    it('should render completed status with green indicator', () => {
      const execution: ToolExecution = {
        name: 'read_file',
        args: { file_path: '/test/file.txt' },
        status: 'completed',
        result: { success: true, content: 'file content' }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const statusText = container.querySelector('[data-color="green"]');
      expect(statusText).toBeTruthy();
      expect(statusText?.textContent).toContain('read_file');
    });

    it('should render failed status with red indicator', () => {
      const execution: ToolExecution = {
        name: 'edit_file',
        args: { file_path: '/test/file.txt' },
        status: 'failed',
        result: { success: false, error: 'File not found' }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const statusText = container.querySelector('[data-color="red"]');
      expect(statusText).toBeTruthy();
      expect(statusText?.textContent).toContain('edit_file');
    });

    it('should render canceled status with gray indicator', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        args: { command: 'ls -la' },
        status: 'canceled',
        result: null
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const statusText = container.querySelector('[data-color="gray"]');
      expect(statusText).toBeTruthy();
      expect(statusText?.textContent).toContain('execute_command');
    });

    it('should render unknown status with white indicator', () => {
      const execution: ToolExecution = {
        name: 'custom_tool',
        args: {},
        status: 'unknown' as any,
        result: null
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const statusText = container.querySelector('[data-color="white"]');
      expect(statusText).toBeTruthy();
    });
  });

  describe('tool parameters display', () => {
    it('should display formatted tool parameters', () => {
      const execution: ToolExecution = {
        name: 'read_file',
        args: { file_path: '/test/file.txt' },
        status: 'completed',
        result: { success: true }
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(mockFormatToolParams).toHaveBeenCalledWith(
        'read_file',
        { file_path: '/test/file.txt' },
        { includePrefix: false, separator: ': ' }
      );
      expect(getByText('file_path: "/test/file.txt"')).toBeTruthy();
    });

    it('should not display parameters when formatToolParams returns empty', () => {
      mockFormatToolParams.mockReturnValue('');
      
      const execution: ToolExecution = {
        name: 'unknown_tool',
        args: {},
        status: 'completed',
        result: { success: true }
      };

      const { queryByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(queryByText(/Parameters:/)).toBeFalsy();
    });
  });

  describe('task results display', () => {
    it('should display task list for create_tasks', () => {
      const execution: ToolExecution = {
        name: 'create_tasks',
        args: { user_query: 'Test query' },
        status: 'completed',
        result: {
          success: true,
          content: {
            tasks: [
              { id: '1', description: 'Task 1', status: 'pending' },
              { id: '2', description: 'Task 2', status: 'in_progress' },
              { id: '3', description: 'Task 3', status: 'completed' }
            ]
          }
        }
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('☐ Task 1')).toBeTruthy();
      expect(getByText('🔄 Task 2')).toBeTruthy();
      expect(getByText('✓ Task 3')).toBeTruthy();
    });

    it('should display task list for update_tasks', () => {
      const execution: ToolExecution = {
        name: 'update_tasks',
        args: { task_updates: [{ id: '1', status: 'completed' }] },
        status: 'completed',
        result: {
          success: true,
          content: {
            tasks: [
              { id: '1', description: 'Updated task', status: 'completed' }
            ]
          }
        }
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('✓ Updated task')).toBeTruthy();
    });

    it('should handle tasks without IDs', () => {
      const execution: ToolExecution = {
        name: 'create_tasks',
        args: {},
        status: 'completed',
        result: {
          success: true,
          content: {
            tasks: [
              { description: 'Task without ID', status: 'pending' }
            ]
          }
        }
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('☐ Task without ID')).toBeTruthy();
    });
  });

  describe('diff preview display', () => {
    it('should show diff preview for create_file when completed', () => {
      const execution: ToolExecution = {
        name: 'create_file',
        args: { file_path: '/test/file.txt', content: 'new content' },
        status: 'completed',
        result: { success: true }
      };

      const { getByTestId } = render(<ToolHistoryItem execution={execution} />);
      
      const diffPreview = getByTestId('diff-preview');
      expect(diffPreview).toBeTruthy();
      expect(diffPreview.textContent).toContain('Tool: create_file');
      expect(diffPreview.textContent).toContain('Historical: true');
    });

    it('should show diff preview for edit_file when completed', () => {
      const execution: ToolExecution = {
        name: 'edit_file',
        args: { 
          file_path: '/test/file.txt', 
          old_text: 'old content', 
          new_text: 'new content' 
        },
        status: 'completed',
        result: { success: true }
      };

      const { getByTestId } = render(<ToolHistoryItem execution={execution} />);
      
      const diffPreview = getByTestId('diff-preview');
      expect(diffPreview).toBeTruthy();
      expect(diffPreview.textContent).toContain('Tool: edit_file');
    });

    it('should not show diff preview for non-file operations', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        args: { command: 'ls' },
        status: 'completed',
        result: { success: true }
      };

      const { queryByTestId } = render(<ToolHistoryItem execution={execution} />);
      
      expect(queryByTestId('diff-preview')).toBeFalsy();
    });

    it('should not show diff preview when status is not completed', () => {
      const execution: ToolExecution = {
        name: 'create_file',
        args: { file_path: '/test/file.txt' },
        status: 'failed',
        result: { success: false }
      };

      const { queryByTestId } = render(<ToolHistoryItem execution={execution} />);
      
      expect(queryByTestId('diff-preview')).toBeFalsy();
    });
  });

  describe('result content display', () => {
    it('should render execute_command output with stdout and stderr', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        args: { command: 'ls -la' },
        status: 'completed',
        result: {
          success: true,
          content: 'stdout: file1.txt\nfile2.txt\nstderr: Permission denied for file3.txt'
        }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const whiteText = container.querySelector('[data-color="white"]');
      const yellowText = container.querySelector('[data-color="yellow"]');
      
      expect(whiteText?.textContent).toContain('file1.txt');
      expect(yellowText?.textContent).toContain('Permission denied');
    });

    it('should handle execute_command output with empty stdout', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        args: { command: 'echo' },
        status: 'completed',
        result: {
          success: true,
          content: 'stdout: \nstderr: warning message'
        }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const yellowText = container.querySelector('[data-color="yellow"]');
      expect(yellowText?.textContent).toContain('warning message');
    });

    it('should handle execute_command output with empty stderr', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        args: { command: 'echo hello' },
        status: 'completed',
        result: {
          success: true,
          content: 'stdout: hello\nstderr: '
        }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const whiteText = container.querySelector('[data-color="white"]');
      expect(whiteText?.textContent).toContain('hello');
    });

    it('should render list_files output with cyan color', () => {
      const execution: ToolExecution = {
        name: 'list_files',
        args: { directory: '/test' },
        status: 'completed',
        result: {
          success: true,
          content: 'src/\n  file1.txt\n  file2.txt'
        }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const cyanText = container.querySelector('[data-color="cyan"]');
      expect(cyanText?.textContent).toContain('src/');
    });

    it('should not render content for read_file', () => {
      const execution: ToolExecution = {
        name: 'read_file',
        args: { file_path: '/test/file.txt' },
        status: 'completed',
        result: {
          success: true,
          content: 'file content that should not be shown'
        }
      };

      const { queryByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(queryByText('file content that should not be shown')).toBeFalsy();
    });

    it('should not render content for search_files', () => {
      const execution: ToolExecution = {
        name: 'search_files',
        args: { pattern: '*.txt' },
        status: 'completed',
        result: {
          success: true,
          content: 'search results that should not be shown'
        }
      };

      const { queryByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(queryByText('search results that should not be shown')).toBeFalsy();
    });

    it('should render default content for other tools', () => {
      const execution: ToolExecution = {
        name: 'custom_tool',
        args: {},
        status: 'completed',
        result: {
          success: true,
          content: 'custom tool result'
        }
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('custom tool result')).toBeTruthy();
    });

    it('should render JSON stringified content for objects', () => {
      const execution: ToolExecution = {
        name: 'custom_tool',
        args: {},
        status: 'completed',
        result: {
          success: true,
          content: { key: 'value', number: 42 }
        }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const content = container.textContent;
      expect(content).toContain('key');
      expect(content).toContain('value');
    });

    it('should render message when no content but result has message', () => {
      const execution: ToolExecution = {
        name: 'custom_tool',
        args: {},
        status: 'completed',
        result: {
          success: true,
          message: 'Operation completed successfully'
        }
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('Operation completed successfully')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should display error message for failed tool execution', () => {
      const execution: ToolExecution = {
        name: 'edit_file',
        args: { file_path: '/test/file.txt' },
        status: 'failed',
        result: { success: false, error: 'File not found' }
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('Tool failed: File not found')).toBeTruthy();
    });

    it('should display generic error message when no specific error', () => {
      const execution: ToolExecution = {
        name: 'edit_file',
        args: { file_path: '/test/file.txt' },
        status: 'completed',
        result: { success: false }
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('Tool failed: Unknown error')).toBeTruthy();
    });

    it('should display failure message for failed status', () => {
      const execution: ToolExecution = {
        name: 'edit_file',
        args: { file_path: '/test/file.txt' },
        status: 'failed',
        result: null
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('Tool execution failed')).toBeTruthy();
    });

    it('should display failure message with result error for failed status', () => {
      const execution: ToolExecution = {
        name: 'edit_file',
        args: { file_path: '/test/file.txt' },
        status: 'failed',
        result: { success: false, error: 'Permission denied' }
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('Tool execution failed')).toBeTruthy();
      expect(getByText('(Permission denied)')).toBeTruthy();
    });

    it('should display cancellation message for canceled status', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        args: { command: 'dangerous-command' },
        status: 'canceled',
        result: null
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('Tool execution canceled by user')).toBeTruthy();
    });
  });

  describe('component structure', () => {
    it('should render with proper border styling for completed tools', () => {
      const execution: ToolExecution = {
        name: 'read_file',
        args: { file_path: '/test/file.txt' },
        status: 'completed',
        result: { success: true }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const box = container.querySelector('[data-border-style="round"]');
      expect(box).toBeTruthy();
      expect(box?.getAttribute('data-border-color')).toBe('green');
    });

    it('should render with proper border styling for failed tools', () => {
      const execution: ToolExecution = {
        name: 'read_file',
        args: { file_path: '/test/file.txt' },
        status: 'failed',
        result: { success: false }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const box = container.querySelector('[data-border-color="red"]');
      expect(box).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle execution without result', () => {
      const execution: ToolExecution = {
        name: 'custom_tool',
        args: {},
        status: 'completed',
        result: null
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      expect(container.textContent).toContain('custom_tool');
    });

    it('should handle result without content or message', () => {
      const execution: ToolExecution = {
        name: 'custom_tool',
        args: {},
        status: 'completed',
        result: { success: true }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      expect(container.textContent).toContain('custom_tool');
    });

    it('should handle complex execute_command output format', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        args: { command: 'multi-line-command' },
        status: 'completed',
        result: {
          success: true,
          content: `stdout: line 1
line 2
stderr: warning 1
warning 2`
        }
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const content = container.textContent;
      expect(content).toContain('line 1');
      expect(content).toContain('warning 1');
    });
  });
});