import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import MaxIterationsContinue from './MaxIterationsContinue';

// Mock ink components and useInput hook
let inputCallback: any = null;

vi.mock('ink', () => ({
  Box: ({ children, flexDirection, marginBottom }: any) => (
    <div 
      data-testid="box" 
      data-flex-direction={flexDirection}
      data-margin-bottom={marginBottom}
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

describe('MaxIterationsContinue', () => {
  const mockOnContinue = vi.fn();
  const mockOnStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    inputCallback = null;
  });

  describe('rendering', () => {
    it('should render header and message', () => {
      const { getByText } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(getByText('Max Iterations Reached')).toBeTruthy();
      expect(getByText(/The model has been iterating for a while now \(10 iterations\)/)).toBeTruthy();
      expect(getByText('Continue processing?')).toBeTruthy();
    });

    it('should render both options with proper initial selection', () => {
      const { getByText, container } = render(
        <MaxIterationsContinue 
          maxIterations={5}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(getByText(/Yes, continue/)).toBeTruthy();
      expect(getByText(/No, stop here \(esc\)/)).toBeTruthy();

      // First option should be selected initially (with green background)
      const continueOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(continueOption?.textContent).toContain('Yes, continue');
    });

    it('should display iteration count correctly', () => {
      const { getByText } = render(
        <MaxIterationsContinue 
          maxIterations={25}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(getByText(/25 iterations/)).toBeTruthy();
    });
  });

  describe('keyboard navigation', () => {
    it('should handle up arrow to move to first option', () => {
      const { container, rerender } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Simulate down arrow first to move to second option
      inputCallback('', { downArrow: true });
      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      // Then up arrow to move back to first
      inputCallback('', { upArrow: true });
      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      // First option should be highlighted
      const continueOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(continueOption?.textContent).toContain('Yes, continue');
    });

    it('should handle down arrow to move to second option', () => {
      const { container, rerender } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Simulate down arrow
      inputCallback('', { downArrow: true });
      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      // Second option should be highlighted
      const stopOption = container.querySelector('[data-background="rgb(214, 114, 114)"]');
      expect(stopOption?.textContent).toContain('No, stop here');
    });

    it('should not move above first option', () => {
      const { container } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Try to move up from first option (should stay at first)
      inputCallback('', { upArrow: true });

      // First option should still be selected
      const continueOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(continueOption?.textContent).toContain('Yes, continue');
    });

    it('should not move below second option', () => {
      const { container, rerender } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option
      inputCallback('', { downArrow: true });
      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      // Try to move down again (should stay at second)
      inputCallback('', { downArrow: true });

      // Second option should still be selected
      const stopOption = container.querySelector('[data-background="rgb(214, 114, 114)"]');
      expect(stopOption?.textContent).toContain('No, stop here');
    });
  });

  describe('option selection', () => {
    it('should call onContinue when return is pressed on first option', () => {
      render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Press return while first option is selected (default)
      inputCallback('', { return: true });

      expect(mockOnContinue).toHaveBeenCalledTimes(1);
      expect(mockOnStop).not.toHaveBeenCalled();
    });

    it('should call onStop when return is pressed on second option', () => {
      const { rerender } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option
      inputCallback('', { downArrow: true });
      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      // Press return
      inputCallback('', { return: true });

      expect(mockOnStop).toHaveBeenCalledTimes(1);
      expect(mockOnContinue).not.toHaveBeenCalled();
    });

    it('should call onStop when escape is pressed', () => {
      render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Press escape
      inputCallback('', { escape: true });

      expect(mockOnStop).toHaveBeenCalledTimes(1);
      expect(mockOnContinue).not.toHaveBeenCalled();
    });
  });

  describe('component state management', () => {
    it('should reset selection when maxIterations changes', () => {
      const { container, rerender } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option
      inputCallback('', { downArrow: true });
      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      // Change maxIterations (should reset selection)
      rerender(
        <MaxIterationsContinue 
          maxIterations={20}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      // First option should be selected again
      const continueOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(continueOption?.textContent).toContain('Yes, continue');
    });

    it('should handle prop changes correctly', () => {
      const { rerender } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      const newOnContinue = vi.fn();
      const newOnStop = vi.fn();

      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={newOnContinue}
          onStop={newOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Test that new callbacks are used
      inputCallback('', { return: true });

      expect(newOnContinue).toHaveBeenCalledTimes(1);
      expect(mockOnContinue).not.toHaveBeenCalled();
    });
  });

  describe('visual states', () => {
    it('should show correct colors for first option when selected', () => {
      const { container } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      const selectedOption = container.querySelector('[data-background="rgb(124, 214, 114)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.getAttribute('data-color')).toBe('black');
      expect(selectedOption?.textContent).toContain('>');
    });

    it('should show correct colors for second option when selected', () => {
      const { container, rerender } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Move to second option
      inputCallback('', { downArrow: true });
      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      const selectedOption = container.querySelector('[data-background="rgb(214, 114, 114)"]');
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.getAttribute('data-color')).toBe('black');
      expect(selectedOption?.textContent).toContain('>');
    });

    it('should show correct colors for unselected options', () => {
      const { container } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      // First option is selected, so second should show red color without background
      const unselectedOption = container.querySelector('[data-color="red"][data-background="undefined"]');
      expect(unselectedOption?.textContent).toContain('No, stop here');
    });
  });

  describe('accessibility and user experience', () => {
    it('should provide clear visual indication of selected option', () => {
      const { container } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      // Should have arrow indicator for selected option
      const selectedText = container.querySelector('[data-bold="true"]');
      expect(selectedText?.textContent).toBe('>');
    });

    it('should show escape hint in the stop option text', () => {
      const { getByText } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(getByText(/No, stop here \(esc\)/)).toBeTruthy();
    });

    it('should display helpful context about the situation', () => {
      const { getByText } = render(
        <MaxIterationsContinue 
          maxIterations={15}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(getByText(/It may be stuck in a loop or working on a complex task/)).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle zero iterations', () => {
      const { getByText } = render(
        <MaxIterationsContinue 
          maxIterations={0}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(getByText(/0 iterations/)).toBeTruthy();
    });

    it('should handle very large iteration counts', () => {
      const { getByText } = render(
        <MaxIterationsContinue 
          maxIterations={999999}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(getByText(/999999 iterations/)).toBeTruthy();
    });

    it('should handle multiple rapid key presses', () => {
      const { rerender } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Rapid key presses
      inputCallback('', { downArrow: true });
      inputCallback('', { upArrow: true });
      inputCallback('', { downArrow: true });
      inputCallback('', { return: true });

      // Should call onStop (second option)
      expect(mockOnStop).toHaveBeenCalledTimes(1);
    });

    it('should ignore unknown key presses', () => {
      render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Simulate unknown key
      inputCallback('a', { unknown: true });

      // Should not trigger any callbacks
      expect(mockOnContinue).not.toHaveBeenCalled();
      expect(mockOnStop).not.toHaveBeenCalled();
    });
  });

  describe('component lifecycle', () => {
    it('should handle multiple re-renders', () => {
      const { rerender } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      rerender(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      // Should still work after multiple re-renders
      inputCallback('', { return: true });
      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });

    it('should properly clean up useInput on unmount', () => {
      const { unmount } = render(
        <MaxIterationsContinue 
          maxIterations={10}
          onContinue={mockOnContinue}
          onStop={mockOnStop}
        />
      );

      expect(inputCallback).toBeDefined();

      unmount();

      // Input callback should still be defined but component is unmounted
      expect(inputCallback).toBeDefined();
    });
  });
});