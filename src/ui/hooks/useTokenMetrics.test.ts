import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTokenMetrics } from './useTokenMetrics';

describe('useTokenMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useTokenMetrics());

      expect(result.current.completionTokens).toBe(0);
      expect(result.current.startTime).toBeNull();
      expect(result.current.endTime).toBeNull();
      expect(result.current.pausedTime).toBe(0);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isActive).toBe(false);
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useTokenMetrics());

      expect(typeof result.current.startRequest).toBe('function');
      expect(typeof result.current.addApiTokens).toBe('function');
      expect(typeof result.current.pauseMetrics).toBe('function');
      expect(typeof result.current.resumeMetrics).toBe('function');
      expect(typeof result.current.completeRequest).toBe('function');
      expect(typeof result.current.resetMetrics).toBe('function');
    });
  });

  describe('startRequest', () => {
    it('should start a new request with correct initial state', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.completionTokens).toBe(0);
      expect(result.current.startTime).toBeInstanceOf(Date);
      expect(result.current.endTime).toBeNull();
      expect(result.current.pausedTime).toBe(0);
    });

    it('should reset previous request data', () => {
      const { result } = renderHook(() => useTokenMetrics());

      // Start and add tokens to first request
      act(() => {
        result.current.startRequest();
        result.current.addApiTokens({
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        });
      });

      expect(result.current.completionTokens).toBe(20);

      // Start new request
      act(() => {
        result.current.startRequest();
      });

      expect(result.current.completionTokens).toBe(0);
      expect(result.current.isActive).toBe(true);
      expect(result.current.pausedTime).toBe(0);
    });

    it('should set start time to current time', () => {
      const mockDate = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(mockDate);

      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      expect(result.current.startTime?.getTime()).toBe(mockDate.getTime());
    });
  });

  describe('addApiTokens', () => {
    it('should accumulate completion tokens', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      act(() => {
        result.current.addApiTokens({
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        });
      });

      expect(result.current.completionTokens).toBe(20);

      act(() => {
        result.current.addApiTokens({
          prompt_tokens: 15,
          completion_tokens: 30,
          total_tokens: 45
        });
      });

      expect(result.current.completionTokens).toBe(50);
    });

    it('should handle zero token usage', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      act(() => {
        result.current.addApiTokens({
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        });
      });

      expect(result.current.completionTokens).toBe(0);
    });

    it('should work without starting a request', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.addApiTokens({
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        });
      });

      expect(result.current.completionTokens).toBe(20);
    });

    it('should only use completion_tokens from usage', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      act(() => {
        result.current.addApiTokens({
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        });
      });

      expect(result.current.completionTokens).toBe(50);
    });
  });

  describe('pauseMetrics', () => {
    it('should pause metrics correctly', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      act(() => {
        result.current.pauseMetrics();
      });

      expect(result.current.isPaused).toBe(true);
      expect(result.current.isActive).toBe(true);
    });

    it('should not pause if already paused', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.pauseMetrics();
      });

      const firstPauseTime = result.current.isPaused;

      act(() => {
        result.current.pauseMetrics();
      });

      expect(result.current.isPaused).toBe(firstPauseTime);
    });

    it('should work without starting a request', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.pauseMetrics();
      });

      expect(result.current.isPaused).toBe(true);
      expect(result.current.isActive).toBe(false);
    });

    it('should set pause start time', () => {
      const mockDate = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(mockDate);

      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.pauseMetrics();
      });

      expect(result.current.isPaused).toBe(true);
    });
  });

  describe('resumeMetrics', () => {
    it('should resume from pause correctly', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.pauseMetrics();
      });

      // Advance time by 1000ms during pause
      act(() => {
        vi.advanceTimersByTime(1000);
        result.current.resumeMetrics();
      });

      expect(result.current.isPaused).toBe(false);
      expect(result.current.isActive).toBe(true);
      expect(result.current.pausedTime).toBe(1000);
    });

    it('should not resume if not paused', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      const initialPausedTime = result.current.pausedTime;

      act(() => {
        result.current.resumeMetrics();
      });

      expect(result.current.pausedTime).toBe(initialPausedTime);
      expect(result.current.isPaused).toBe(false);
    });

    it('should accumulate multiple pause durations', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      // First pause
      act(() => {
        result.current.pauseMetrics();
        vi.advanceTimersByTime(500);
        result.current.resumeMetrics();
      });

      expect(result.current.pausedTime).toBe(500);

      // Second pause
      act(() => {
        result.current.pauseMetrics();
        vi.advanceTimersByTime(300);
        result.current.resumeMetrics();
      });

      expect(result.current.pausedTime).toBe(800);
    });

    it('should calculate pause duration correctly', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(startTime);

      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.pauseMetrics();
      });

      const resumeTime = new Date('2024-01-01T10:00:02.500Z');
      vi.setSystemTime(resumeTime);

      act(() => {
        result.current.resumeMetrics();
      });

      expect(result.current.pausedTime).toBe(2500);
    });
  });

  describe('completeRequest', () => {
    it('should complete request correctly', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      act(() => {
        result.current.completeRequest();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.endTime).toBeInstanceOf(Date);
    });

    it('should handle completion while paused', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.pauseMetrics();
        vi.advanceTimersByTime(1000);
        result.current.completeRequest();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.pausedTime).toBe(1000);
      expect(result.current.endTime).toBeInstanceOf(Date);
    });

    it('should work without starting a request', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.completeRequest();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.endTime).toBeInstanceOf(Date);
    });

    it('should set end time to current time', () => {
      const mockDate = new Date('2024-01-01T10:00:05Z');
      vi.setSystemTime(mockDate);

      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.completeRequest();
      });

      expect(result.current.endTime?.getTime()).toBe(mockDate.getTime());
    });

    it('should handle multiple completions', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.completeRequest();
      });

      const firstEndTime = result.current.endTime;

      act(() => {
        vi.advanceTimersByTime(1000);
        result.current.completeRequest();
      });

      expect(result.current.endTime?.getTime()).toBeGreaterThan(firstEndTime!.getTime());
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to initial state', () => {
      const { result } = renderHook(() => useTokenMetrics());

      // Set up some state
      act(() => {
        result.current.startRequest();
        result.current.addApiTokens({
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        });
        result.current.pauseMetrics();
        vi.advanceTimersByTime(1000);
        result.current.resumeMetrics();
        result.current.completeRequest();
      });

      // Verify state is set
      expect(result.current.completionTokens).toBe(20);
      expect(result.current.pausedTime).toBe(1000);

      // Reset
      act(() => {
        result.current.resetMetrics();
      });

      // Verify reset to initial state
      expect(result.current.completionTokens).toBe(0);
      expect(result.current.startTime).toBeNull();
      expect(result.current.endTime).toBeNull();
      expect(result.current.pausedTime).toBe(0);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isActive).toBe(false);
    });

    it('should reset while request is active', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.addApiTokens({
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        });
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.resetMetrics();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.completionTokens).toBe(0);
    });

    it('should reset while paused', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.pauseMetrics();
      });

      expect(result.current.isPaused).toBe(true);

      act(() => {
        result.current.resetMetrics();
      });

      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('complex workflows', () => {
    it('should handle full request lifecycle', () => {
      const { result } = renderHook(() => useTokenMetrics());

      const startTime = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(startTime);

      // Start request
      act(() => {
        result.current.startRequest();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.startTime?.getTime()).toBe(startTime.getTime());

      // Add tokens
      act(() => {
        result.current.addApiTokens({
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25
        });
      });

      // Pause for approval
      act(() => {
        result.current.pauseMetrics();
        vi.advanceTimersByTime(2000); // 2 seconds pause
        result.current.resumeMetrics();
      });

      // Add more tokens
      act(() => {
        result.current.addApiTokens({
          prompt_tokens: 5,
          completion_tokens: 10,
          total_tokens: 15
        });
      });

      const endTime = new Date('2024-01-01T10:00:10Z');
      vi.setSystemTime(endTime);

      // Complete request
      act(() => {
        result.current.completeRequest();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.completionTokens).toBe(25);
      expect(result.current.pausedTime).toBe(2000);
      expect(result.current.endTime?.getTime()).toBe(endTime.getTime());
    });

    it('should handle multiple pause/resume cycles', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
      });

      // Multiple pause/resume cycles
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.pauseMetrics();
          vi.advanceTimersByTime(1000);
          result.current.resumeMetrics();
        });
      }

      expect(result.current.pausedTime).toBe(3000);
    });

    it('should handle token accumulation across pauses', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        
        result.current.addApiTokens({
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        });
        
        result.current.pauseMetrics();
        vi.advanceTimersByTime(1000);
        result.current.resumeMetrics();
        
        result.current.addApiTokens({
          prompt_tokens: 5,
          completion_tokens: 10,
          total_tokens: 15
        });
      });

      expect(result.current.completionTokens).toBe(30);
      expect(result.current.pausedTime).toBe(1000);
    });

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.pauseMetrics();
        result.current.resumeMetrics();
        result.current.pauseMetrics();
        result.current.completeRequest();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration pauses', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.pauseMetrics();
        result.current.resumeMetrics();
      });

      expect(result.current.pausedTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative token values', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.addApiTokens({
          prompt_tokens: -5,
          completion_tokens: -10,
          total_tokens: -15
        });
      });

      expect(result.current.completionTokens).toBe(-10);
    });

    it('should handle very large token values', () => {
      const { result } = renderHook(() => useTokenMetrics());

      act(() => {
        result.current.startRequest();
        result.current.addApiTokens({
          prompt_tokens: 1000000,
          completion_tokens: 999999,
          total_tokens: 1999999
        });
      });

      expect(result.current.completionTokens).toBe(999999);
    });

    it('should maintain state consistency across many operations', () => {
      const { result } = renderHook(() => useTokenMetrics());

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        act(() => {
          if (i % 10 === 0) {
            result.current.startRequest();
          } else if (i % 5 === 0) {
            result.current.pauseMetrics();
          } else if (i % 3 === 0) {
            result.current.resumeMetrics();
          } else {
            result.current.addApiTokens({
              prompt_tokens: 1,
              completion_tokens: 2,
              total_tokens: 3
            });
          }
        });
      }

      // State should still be consistent
      expect(typeof result.current.completionTokens).toBe('number');
      expect(typeof result.current.pausedTime).toBe('number');
      expect(typeof result.current.isActive).toBe('boolean');
      expect(typeof result.current.isPaused).toBe('boolean');
    });
  });
});