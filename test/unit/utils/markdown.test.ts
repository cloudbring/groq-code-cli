import { describe, it, expect } from 'vitest';
import { parseMarkdown, parseInlineElements, type MarkdownElement, type InlineElement } from '@src/utils/markdown';

describe('markdown', () => {
	describe('parseMarkdown', () => {
		it('should parse plain text', () => {
			const result = parseMarkdown('This is plain text');
			expect(result).toEqual([
				{ type: 'text', content: 'This is plain text' }
			]);
		});

		it('should parse headings with correct levels', () => {
			const markdown = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`;

			const result = parseMarkdown(markdown);
			expect(result).toEqual([
				{ type: 'heading', content: 'Heading 1', level: 1 },
				{ type: 'heading', content: 'Heading 2', level: 2 },
				{ type: 'heading', content: 'Heading 3', level: 3 },
				{ type: 'heading', content: 'Heading 4', level: 4 },
				{ type: 'heading', content: 'Heading 5', level: 5 },
				{ type: 'heading', content: 'Heading 6', level: 6 },
			]);
		});

		it('should parse code blocks', () => {
			const markdown = `\`\`\`
const x = 1;
const y = 2;
\`\`\``;

			const result = parseMarkdown(markdown);
			expect(result).toEqual([
				{ type: 'code-block', content: 'const x = 1;\nconst y = 2;' }
			]);
		});

		it('should parse mixed content with inline code', () => {
			const markdown = 'This line has `inline code` in it';
			const result = parseMarkdown(markdown);
			expect(result).toEqual([
				{ type: 'mixed-line', content: 'This line has `inline code` in it' }
			]);
		});

		it('should parse mixed content with bold text', () => {
			const markdown = 'This line has **bold text** in it';
			const result = parseMarkdown(markdown);
			expect(result).toEqual([
				{ type: 'mixed-line', content: 'This line has **bold text** in it' }
			]);
		});

		it('should parse mixed content with italic text', () => {
			const markdown = 'This line has *italic text* in it';
			const result = parseMarkdown(markdown);
			expect(result).toEqual([
				{ type: 'mixed-line', content: 'This line has *italic text* in it' }
			]);
		});

		it('should handle empty lines', () => {
			const markdown = `Line 1

Line 3`;
			const result = parseMarkdown(markdown);
			expect(result).toEqual([
				{ type: 'text', content: 'Line 1' },
				{ type: 'text', content: ' ' },
				{ type: 'text', content: 'Line 3' }
			]);
		});

		it('should handle complex markdown document', () => {
			const markdown = `# Main Title

This is a paragraph with **bold** and *italic* text.

## Subsection

Here's some \`inline code\`.

\`\`\`
function example() {
  return true;
}
\`\`\`

Regular text after code block.`;

			const result = parseMarkdown(markdown);
			expect(result).toHaveLength(11);
			expect(result[0].type).toBe('heading');
			expect(result[1].type).toBe('text');
			expect(result[2].type).toBe('mixed-line');
			expect(result[3].type).toBe('text');
			expect(result[4].type).toBe('heading');
			expect(result[5].type).toBe('text');
			expect(result[6].type).toBe('mixed-line');
			expect(result[7].type).toBe('text');
			expect(result[8].type).toBe('code-block');
			expect(result[9].type).toBe('text');
			expect(result[10].type).toBe('text');
		});

		it('should handle code block at end of content', () => {
			const markdown = `Text before
\`\`\`
code content
\`\`\``;

			const result = parseMarkdown(markdown);
			expect(result).toEqual([
				{ type: 'text', content: 'Text before' },
				{ type: 'code-block', content: 'code content' }
			]);
		});

		it('should handle unclosed code block', () => {
			const markdown = `\`\`\`
code without closing`;

			const result = parseMarkdown(markdown);
			expect(result).toEqual([
				{ type: 'code-block', content: 'code without closing' }
			]);
		});
	});

	describe('parseInlineElements', () => {
		it('should parse plain text', () => {
			const result = parseInlineElements('Plain text only');
			expect(result).toEqual([
				{ type: 'text', content: 'Plain text only' }
			]);
		});

		it('should parse inline code', () => {
			const result = parseInlineElements('Text with `code` in it');
			expect(result).toEqual([
				{ type: 'text', content: 'Text with ' },
				{ type: 'code', content: 'code' },
				{ type: 'text', content: ' in it' }
			]);
		});

		it('should parse bold text', () => {
			const result = parseInlineElements('Text with **bold** in it');
			expect(result).toEqual([
				{ type: 'text', content: 'Text with ' },
				{ type: 'bold', content: 'bold' },
				{ type: 'text', content: ' in it' }
			]);
		});

		it('should parse italic text', () => {
			const result = parseInlineElements('Text with *italic* in it');
			expect(result).toEqual([
				{ type: 'text', content: 'Text with ' },
				{ type: 'italic', content: 'italic' },
				{ type: 'text', content: ' in it' }
			]);
		});

		it('should parse multiple inline elements', () => {
			const result = parseInlineElements('Text with `code`, **bold**, and *italic*');
			expect(result).toEqual([
				{ type: 'text', content: 'Text with ' },
				{ type: 'code', content: 'code' },
				{ type: 'text', content: ', ' },
				{ type: 'bold', content: 'bold' },
				{ type: 'text', content: ', and ' },
				{ type: 'italic', content: 'italic' }
			]);
		});

		it('should handle text starting with inline element', () => {
			const result = parseInlineElements('`code` at start');
			expect(result).toEqual([
				{ type: 'code', content: 'code' },
				{ type: 'text', content: ' at start' }
			]);
		});

		it('should handle text ending with inline element', () => {
			const result = parseInlineElements('text ends with `code`');
			expect(result).toEqual([
				{ type: 'text', content: 'text ends with ' },
				{ type: 'code', content: 'code' }
			]);
		});

		it('should handle adjacent inline elements', () => {
			const result = parseInlineElements('`code`**bold**');
			expect(result).toEqual([
				{ type: 'code', content: 'code' },
				{ type: 'bold', content: 'bold' }
			]);
		});

		it('should handle empty string', () => {
			const result = parseInlineElements('');
			expect(result).toEqual([]);
		});

		it('should prioritize inline code over other elements', () => {
			const result = parseInlineElements('`code with * and **`');
			expect(result).toEqual([
				{ type: 'code', content: 'code with * and **' }
			]);
		});

		it('should handle unmatched markdown symbols', () => {
			const result = parseInlineElements('Text with single * asterisk');
			expect(result).toEqual([
				{ type: 'text', content: 'Text with single * asterisk' }
			]);
		});

		it('should handle unmatched backticks', () => {
			const result = parseInlineElements('Text with single ` backtick');
			expect(result).toEqual([
				{ type: 'text', content: 'Text with single ` backtick' }
			]);
		});
	});
});