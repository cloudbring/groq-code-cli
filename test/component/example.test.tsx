import React from 'react';
import { describe, it, expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const ExampleButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
	<button onClick={onClick}>{children}</button>
);

const ExampleCounter = () => {
	const [count, setCount] = React.useState(0);
	return (
		<div>
			<span data-testid="count">{count}</span>
			<button onClick={() => setCount(count + 1)}>Increment</button>
		</div>
	);
};

describe('Example Component Tests', () => {
	describe('Button Component', () => {
		test.concurrent('should render button with text', async () => {
			const { container } = render(<ExampleButton onClick={() => {}}>Click me</ExampleButton>);
			const button = container.querySelector('button');
			expect(button).toBeTruthy();
			expect(button?.textContent).toBe('Click me');
		});

		test.concurrent('should handle click events', async () => {
			let clicked = false;
			const handleClick = () => { clicked = true; };
			
			const { container } = render(<ExampleButton onClick={handleClick}>Test</ExampleButton>);
			const button = container.querySelector('button');
			
			fireEvent.click(button!);
			expect(clicked).toBe(true);
		});
	});

	describe('Counter Component', () => {
		test('should increment counter on click', async () => {
			// This test modifies component state, so it shouldn't be concurrent
			render(<ExampleCounter />);
			
			const count = screen.getByTestId('count');
			const button = screen.getByText('Increment');
			
			expect(count.textContent).toBe('0');
			
			fireEvent.click(button);
			expect(count.textContent).toBe('1');
			
			fireEvent.click(button);
			expect(count.textContent).toBe('2');
		});
	});
});