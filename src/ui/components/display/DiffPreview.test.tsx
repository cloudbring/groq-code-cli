import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import DiffPreview from './DiffPreview';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  }
}));

// Mock validators module
vi.mock('../../../tools/validators.ts', () => ({
  validateReadBeforeEdit: vi.fn(),
  getReadBeforeEditError: vi.fn()
}));

// Mock ink components
vi.mock('ink', () => ({
  Box: ({ children }: any) => <div data-testid="box">{children}</div>,
  Text: ({ children, color, bold, dimColor, backgroundColor }: any) => (
    <span 
      data-testid="text"
      data-color={color}
      data-bold={bold}
      data-dim={dimColor}
      data-background={backgroundColor}
    >
      {children}
    </span>
  ),
}));

describe('DiffPreview', () => {
  const mockReadFile = fs.promises.readFile as any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const validators = await import('../../../tools/validators.ts');
    vi.mocked(validators.validateReadBeforeEdit).mockReturnValue(true);
    vi.mocked(validators.getReadBeforeEditError).mockReturnValue('Read before edit error');
    mockReadFile.mockResolvedValue('original content\nline 2\nline 3');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering states', () => {
    it('should render loading state initially', () => {
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt', old_text: 'old', new_text: 'new' }}
        />
      );

      expect(getByText('Generating diff preview...')).toBeTruthy();
    });

    it('should render error state for missing file path', async () => {
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{}}
        />
      );

      await waitFor(() => {
        expect(getByText('Error: No file path provided')).toBeTruthy();
      });
    });

    it('should render read-before-edit error for non-historical edits', async () => {
      const validators = await import('../../../tools/validators.ts');
      vi.mocked(validators.validateReadBeforeEdit).mockReturnValue(false);
      vi.mocked(validators.getReadBeforeEditError).mockReturnValue('Must read file first');

      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt', old_text: 'old', new_text: 'new' }}
          isHistorical={false}
        />
      );

      await waitFor(() => {
        expect(getByText('Error: Must read file first')).toBeTruthy();
      });
    });

    it('should render no changes state when diff is empty', async () => {
      mockReadFile.mockResolvedValue('same content');
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt', 
            old_text: 'same content', 
            new_text: 'same content' 
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('No changes to show')).toBeTruthy();
      });
    });
  });

  describe('edit_file operations', () => {
    it('should generate diff for string-based edit with old_text and new_text', async () => {
      mockReadFile.mockResolvedValue('original text\nsecond line');
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'original text',
            new_text: 'modified text'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });

    it('should handle replace_all option', async () => {
      mockReadFile.mockResolvedValue('test\ntest\nother');
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'test',
            new_text: 'modified',
            replace_all: true
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });

    it('should handle case where old_text is not found in current file', async () => {
      mockReadFile.mockResolvedValue('different content');
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'missing text',
            new_text: 'new text'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('No changes to show')).toBeTruthy();
      });
    });

    it('should reconstruct original when new_text is found in current file', async () => {
      mockReadFile.mockResolvedValue('modified content');
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'original content',
            new_text: 'modified content'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });
  });

  describe('create_file operations', () => {
    it('should generate diff for create_file with content', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));
      
      const { getByText } = render(
        <DiffPreview 
          toolName="create_file"
          toolArgs={{ 
            file_path: '/test/newfile.txt',
            content: 'new file content\nsecond line'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });
  });

  describe('historical edits', () => {
    it('should generate synthetic diff for historical edit_file', async () => {
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'original line',
            new_text: 'modified line'
          }}
          isHistorical={true}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });

    it('should generate synthetic diff for historical create_file', async () => {
      const { getByText } = render(
        <DiffPreview 
          toolName="create_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            content: 'created content'
          }}
          isHistorical={true}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });

    it('should handle historical edit with missing parameters', async () => {
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt'
          }}
          isHistorical={true}
        />
      );

      await waitFor(() => {
        expect(getByText('No changes to show')).toBeTruthy();
      });
    });

    it('should not validate read-before-edit for historical edits', async () => {
      const validators = await import('../../../tools/validators.ts');
      vi.mocked(validators.validateReadBeforeEdit).mockReturnValue(false);
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'old',
            new_text: 'new'
          }}
          isHistorical={true}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });

      expect(vi.mocked(validators.validateReadBeforeEdit)).not.toHaveBeenCalled();
    });
  });

  describe('diff rendering', () => {
    it('should render diff lines with proper colors', async () => {
      mockReadFile.mockResolvedValue('line 1\nold line\nline 3');
      
      const { container } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'old line',
            new_text: 'new line'
          }}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('[data-testid="text"]')).toBeTruthy();
      });
    });

    it('should handle multiple diff chunks', async () => {
      mockReadFile.mockResolvedValue('line 1\nold1\nline 3\nline 4\nold2\nline 6');
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'old1',
            new_text: 'new1'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('Permission denied'));
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            content: 'new content'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });

    it('should handle diff generation errors', async () => {
      // Mock path.resolve to throw an error
      vi.doMock('path', () => ({
        resolve: vi.fn(() => { throw new Error('Path error'); })
      }));
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'old',
            new_text: 'new'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText(/Error generating diff:/)).toBeTruthy();
      });
    });
  });

  describe('LCS algorithm', () => {
    it('should generate proper unified diff with context', async () => {
      mockReadFile.mockResolvedValue(`line 1
line 2
original line
line 4
line 5`);
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'original line',
            new_text: 'modified line'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });

    it('should handle empty files', async () => {
      mockReadFile.mockResolvedValue('');
      
      const { getByText } = render(
        <DiffPreview 
          toolName="create_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            content: 'new content'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });

    it('should handle identical content', async () => {
      mockReadFile.mockResolvedValue('identical content');
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/file.txt',
            old_text: 'other',
            new_text: 'other'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('No changes to show')).toBeTruthy();
      });
    });
  });

  describe('component updates', () => {
    it('should regenerate diff when toolName changes', async () => {
      const { rerender } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt', old_text: 'old', new_text: 'new' }}
        />
      );

      rerender(
        <DiffPreview 
          toolName="create_file"
          toolArgs={{ file_path: '/test/file.txt', content: 'content' }}
        />
      );

      await waitFor(() => {
        expect(mockReadFile).toHaveBeenCalled();
      });
    });

    it('should regenerate diff when toolArgs change', async () => {
      const { rerender } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt', old_text: 'old1', new_text: 'new1' }}
        />
      );

      rerender(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ file_path: '/test/file.txt', old_text: 'old2', new_text: 'new2' }}
        />
      );

      await waitFor(() => {
        expect(mockReadFile).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very long files', async () => {
      const longContent = Array(1000).fill('line').join('\n');
      mockReadFile.mockResolvedValue(longContent);
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/largefile.txt',
            old_text: 'line',
            new_text: 'modified'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });

    it('should handle binary-like content', async () => {
      const binaryContent = '\x00\x01\x02\xFF';
      mockReadFile.mockResolvedValue(binaryContent);
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/binary.dat',
            old_text: '\x00',
            new_text: '\x01'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });

    it('should handle files with only whitespace', async () => {
      mockReadFile.mockResolvedValue('   \n\t\n   ');
      
      const { getByText } = render(
        <DiffPreview 
          toolName="edit_file"
          toolArgs={{ 
            file_path: '/test/whitespace.txt',
            old_text: '   ',
            new_text: '\t'
          }}
        />
      );

      await waitFor(() => {
        expect(getByText('Diff Preview:')).toBeTruthy();
      });
    });
  });
});