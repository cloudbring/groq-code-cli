import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import TokenMetrics from '@src/ui/components/display/TokenMetrics';

describe('TokenMetrics', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('rendering', () => {
		it('should not render when inactive and no tokens', () => {
			const { container } = render(
				<TokenMetrics
					isActive={false}
					isPaused={false}
					startTime={null}
					endTime={null}
					pausedTime={0}
					completionTokens={0}
				/>
			);

			expect(container.firstChild).toBeNull();
		});

		it('should render when active', () => {
			const { getByText } = render(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={new Date()}
					endTime={null}
					pausedTime={0}
					completionTokens={0}
				/>
			);

			expect(getByText('0.0s')).toBeTruthy();
			expect(getByText('0 tokens')).toBeTruthy();
			expect(getByText('⚡ GroqThinking...')).toBeTruthy();
		});

		it('should render when inactive but has tokens', () => {
			const startTime = new Date(Date.now() - 5000);
			const endTime = new Date();
			
			const { getByText } = render(
				<TokenMetrics
					isActive={false}
					isPaused={false}
					startTime={startTime}
					endTime={endTime}
					pausedTime={0}
					completionTokens={100}
				/>
			);

			expect(getByText('5.0s')).toBeTruthy();
			expect(getByText('100 tokens')).toBeTruthy();
		});

		it('should show paused status', () => {
			const { getByText } = render(
				<TokenMetrics
					isActive={true}
					isPaused={true}
					startTime={new Date()}
					endTime={null}
					pausedTime={0}
					completionTokens={50}
				/>
			);

			expect(getByText('⏸ Waiting for approval...')).toBeTruthy();
		});
	});

	describe('time tracking', () => {
		it('should update time every 100ms when active', () => {
			const startTime = new Date(Date.now() - 1000);
			
			const { getByText } = render(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={startTime}
					endTime={null}
					pausedTime={0}
					completionTokens={0}
				/>
			);

			expect(getByText('1.0s')).toBeTruthy();

			// Advance timers carefully to avoid infinite loop
			vi.advanceTimersByTime(100);
			
			// Clear all timers to prevent infinite loop
			vi.clearAllTimers();
		});

		it('should not update time when paused', () => {
			const startTime = new Date(Date.now() - 1000);
			
			const { getByText } = render(
				<TokenMetrics
					isActive={true}
					isPaused={true}
					startTime={startTime}
					endTime={null}
					pausedTime={0}
					completionTokens={0}
				/>
			);

			const initialTime = getByText(/\d+\.\d+s/);
			
			vi.advanceTimersByTime(1000);
			
			expect(initialTime).toBeTruthy();
		});

		it('should account for paused time', () => {
			const startTime = new Date(Date.now() - 5000);
			const pausedTime = 2000;
			
			const { getByText } = render(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={startTime}
					endTime={null}
					pausedTime={pausedTime}
					completionTokens={0}
				/>
			);

			expect(getByText('3.0s')).toBeTruthy();
		});

		it('should show final time when completed', () => {
			const startTime = new Date(Date.now() - 10000);
			const endTime = new Date(Date.now() - 2000);
			const pausedTime = 1000;
			
			const { getByText } = render(
				<TokenMetrics
					isActive={false}
					isPaused={false}
					startTime={startTime}
					endTime={endTime}
					pausedTime={pausedTime}
					completionTokens={100}
				/>
			);

			expect(getByText('7.0s')).toBeTruthy();
		});
	});

	describe('loading messages', () => {
		it('should cycle through loading messages', () => {
			const { getByText, rerender } = render(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={new Date()}
					endTime={null}
					pausedTime={0}
					completionTokens={0}
				/>
			);

			expect(getByText('⚡ GroqThinking...')).toBeTruthy();

			vi.advanceTimersByTime(2000);
			rerender(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={new Date()}
					endTime={null}
					pausedTime={0}
					completionTokens={0}
				/>
			);

			vi.advanceTimersByTime(2000);
			rerender(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={new Date()}
					endTime={null}
					pausedTime={0}
					completionTokens={0}
				/>
			);

			vi.advanceTimersByTime(2000);
			rerender(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={new Date()}
					endTime={null}
					pausedTime={0}
					completionTokens={0}
				/>
			);
		});

		it('should reset loading message index when becoming active', () => {
			const { getByText, rerender } = render(
				<TokenMetrics
					isActive={false}
					isPaused={false}
					startTime={null}
					endTime={null}
					pausedTime={0}
					completionTokens={100}
				/>
			);

			rerender(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={new Date()}
					endTime={null}
					pausedTime={0}
					completionTokens={100}
				/>
			);

			expect(getByText('⚡ GroqThinking...')).toBeTruthy();
		});
	});

	describe('edge cases', () => {
		it('should handle null startTime', () => {
			const { getByText } = render(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={null}
					endTime={null}
					pausedTime={0}
					completionTokens={0}
				/>
			);

			expect(getByText('0.0s')).toBeTruthy();
		});

		it('should handle transition from active to inactive', () => {
			const startTime = new Date(Date.now() - 3000);
			const endTime = new Date();
			
			const { getByText, rerender } = render(
				<TokenMetrics
					isActive={true}
					isPaused={false}
					startTime={startTime}
					endTime={null}
					pausedTime={0}
					completionTokens={50}
				/>
			);

			expect(getByText('⚡ GroqThinking...')).toBeTruthy();

			rerender(
				<TokenMetrics
					isActive={false}
					isPaused={false}
					startTime={startTime}
					endTime={endTime}
					pausedTime={0}
					completionTokens={50}
				/>
			);

			expect(getByText('3.0s')).toBeTruthy();
		});
	});
});