import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Use vi.hoisted to ensure mocks are set up before any imports
const mocks = vi.hoisted(() => {
  return {
    formatToolParams: vi.fn((toolName, args, options) => {
      if (toolName === 'read_file') return `file_path: "${args.file_path}"`;
      if (toolName === 'edit_file') return `file_path: "${args.file_path}"`;
      if (toolName === 'execute_command') return `command: "${args.command}"`;
      return '';
    })
  };
});

// Mock file-ops module first
vi.mock('../../../utils/file-ops.js', () => ({
  writeFile: vi.fn(),
  createDirectory: vi.fn(),
  deleteFile: vi.fn(),
  displayTree: vi.fn(),
  shouldIgnore: vi.fn()
}));

// Mock validators module
vi.mock('../../../tools/validators.js', () => ({
  setReadFilesTracker: vi.fn(),
  validateReadBeforeEdit: vi.fn(() => true),
  getReadBeforeEditError: vi.fn()
}));

// Mock tools module with hoisted mocks
vi.mock('../../../tools/tools.js', () => ({
  formatToolParams: mocks.formatToolParams
}));

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
  Text: ({ children, color, bold, dimColor }: any) => (
    <span 
      data-testid="text" 
      data-color={color} 
      data-bold={bold}
      data-dim={dimColor}
    >
      {children}
    </span>
  )
}));

// Now import the component and dependencies
import ToolHistoryItem from './ToolHistoryItem';
import { ToolExecution } from '../../hooks/useAgent.js';

describe('ToolHistoryItem', () => {
  const mockFormatToolParams = mocks.formatToolParams;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render tool name and status', () => {
      const execution: ToolExecution = {
        name: 'read_file',
        status: 'completed',
        args: { file_path: '/test/file.txt' },
        result: 'File content'
      } as any;

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('read_file')).toBeTruthy();
      expect(getByText('🟢')).toBeTruthy();
    });

    it('should render formatted tool parameters', () => {
      const execution: ToolExecution = {
        name: 'edit_file',
        status: 'completed',
        args: { file_path: '/test/file.txt' },
        result: 'File edited'
      } as any;

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(mockFormatToolParams).toHaveBeenCalledWith(
        'edit_file',
        { file_path: '/test/file.txt' },
        { includePrefix: false, separator: ': ' }
      );
      expect(getByText('file_path: "/test/file.txt"')).toBeTruthy();
    });

    it('should not render parameters when formatToolParams returns empty', () => {
      mockFormatToolParams.mockReturnValue('');
      
      const execution: ToolExecution = {
        name: 'unknown_tool',
        status: 'completed',
        args: {},
        result: 'Done'
      };

      const { queryByTestId } = render(<ToolHistoryItem execution={execution} />);
      
      // The component should still render but without parameters
      expect(mockFormatToolParams).toHaveBeenCalled();
      // The Box containing parameters should not be rendered when empty
      const texts = queryByTestId('text');
      if (texts) {
        expect(texts.textContent).not.toContain('file_path');
      }
    });
  });

  describe('status indicators', () => {
    it('should show success indicator for successful tools', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        status: 'completed',
        args: { command: 'ls -la' },
        result: 'Command output'
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('🟢')).toBeTruthy();
    });

    it('should show error indicator for failed tools', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        status: 'failed',
        args: { command: 'invalid-command' },
        result: 'Command not found'
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('🔴')).toBeTruthy();
    });

    it('should show pending indicator for pending tools', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        status: 'pending',
        args: { command: 'long-running-command' },
        result: ''
      };

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('?')).toBeTruthy();
    });
  });

  describe('diff preview for file operations', () => {
    it('should show diff preview for edit_file', () => {
      const execution: ToolExecution = {
        name: 'edit_file',
        status: 'completed',
        args: { 
          file_path: '/test/file.txt',
          old_text: 'old content',
          new_text: 'new content'
        },
        result: 'File edited'
      };

      const { getByTestId } = render(<ToolHistoryItem execution={execution} />);
      
      const diffPreview = getByTestId('diff-preview');
      expect(diffPreview).toBeTruthy();
      expect(diffPreview.textContent).toContain('Tool: edit_file');
      expect(diffPreview.textContent).toContain('Historical: true');
    });

    it('should show diff preview for create_file', () => {
      const execution: ToolExecution = {
        name: 'create_file',
        status: 'completed',
        args: { 
          file_path: '/test/new-file.txt',
          content: 'new file content'
        },
        result: 'File created'
      };

      const { getByTestId } = render(<ToolHistoryItem execution={execution} />);
      
      const diffPreview = getByTestId('diff-preview');
      expect(diffPreview).toBeTruthy();
      expect(diffPreview.textContent).toContain('Tool: create_file');
    });

    it('should not show diff preview for non-file operations', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        status: 'completed',
        args: { command: 'ls -la' },
        result: 'Command output'
      };

      const { queryByTestId } = render(<ToolHistoryItem execution={execution} />);
      
      expect(queryByTestId('diff-preview')).toBeFalsy();
    });
  });

  describe('result display', () => {
    it('should display result text for successful tools', () => {
      const execution: ToolExecution = {
        name: 'read_file',
        status: 'completed',
        args: { file_path: '/test/file.txt' },
        result: { content: 'This is the file content' }
      } as any;

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('This is the file content')).toBeTruthy();
    });

    it('should display error message for failed tools', () => {
      const execution: ToolExecution = {
        name: 'read_file',
        status: 'failed',
        args: { file_path: '/nonexistent.txt' },
        result: { content: 'File not found' }
      } as any;

      const { getByText } = render(<ToolHistoryItem execution={execution} />);
      
      expect(getByText('File not found')).toBeTruthy();
    });

    it('should handle empty results', () => {
      const execution: ToolExecution = {
        name: 'execute_command',
        status: 'completed',
        args: { command: 'touch file.txt' },
        result: ''
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      // Component should render without crashing
      expect(container).toBeTruthy();
    });

    it('should handle very long results', () => {
      const longResult = 'a'.repeat(1000);
      const execution: ToolExecution = {
        name: 'read_file',
        status: 'completed',
        args: { file_path: '/test/large-file.txt' },
        result: { content: longResult }
      } as any;

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      // Should render the long result
      expect(container.textContent).toContain('aaaa');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined tool status', () => {
      const execution: ToolExecution = {
        name: 'some_tool',
        status: undefined as any,
        args: {},
        result: 'Result'
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      // Should render without crashing
      expect(container).toBeTruthy();
    });

    it('should handle null result', () => {
      const execution: ToolExecution = {
        name: 'some_tool',
        status: 'completed',
        args: {},
        result: null as any
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      // Should render without crashing
      expect(container).toBeTruthy();
    });

    it('should handle missing args', () => {
      const execution: ToolExecution = {
        name: 'some_tool',
        status: 'completed',
        args: undefined as any,
        result: 'Result'
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      // Should render without crashing
      expect(container).toBeTruthy();
    });

    it('should handle complex nested args', () => {
      const execution: ToolExecution = {
        name: 'complex_tool',
        status: 'completed',
        args: {
          nested: {
            deep: {
              value: 'test'
            }
          },
          array: [1, 2, 3]
        },
        result: 'Processed'
      };

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      // Should render without crashing
      expect(container).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('should apply correct colors for status', () => {
      const successTool: ToolExecution = {
        name: 'test',
        status: 'completed',
        args: {},
        result: 'ok'
      };

      const { container } = render(<ToolHistoryItem execution={successTool} />);
      
      const successIndicator = container.querySelector('[data-color="green"]');
      expect(successIndicator).toBeTruthy();
    });

    it('should apply dimmed style to result text', () => {
      const execution: ToolExecution = {
        name: 'test',
        status: 'completed',
        args: {},
        result: { content: 'Some result' }
      } as any;

      const { container } = render(<ToolHistoryItem execution={execution} />);
      
      const dimmedText = container.querySelector('[data-dim="true"]');
      expect(dimmedText).toBeTruthy();
    });
  });
});