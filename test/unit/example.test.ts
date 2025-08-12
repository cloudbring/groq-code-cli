import { describe, it, expect, test } from 'vitest';

describe('Example Unit Tests', () => {
	describe('Pure functions', () => {
		test.concurrent('should add two numbers', async () => {
			const add = (a: number, b: number) => a + b;
			expect(add(2, 3)).toBe(5);
		});

		test.concurrent('should concatenate strings', async () => {
			const concat = (a: string, b: string) => `${a}${b}`;
			expect(concat('hello', 'world')).toBe('helloworld');
		});

		test.concurrent('should filter array', async () => {
			const filterEven = (arr: number[]) => arr.filter(n => n % 2 === 0);
			expect(filterEven([1, 2, 3, 4, 5])).toEqual([2, 4]);
		});
	});

	describe('Object operations', () => {
		test.concurrent('should merge objects', async () => {
			const merge = (a: object, b: object) => ({ ...a, ...b });
			expect(merge({ x: 1 }, { y: 2 })).toEqual({ x: 1, y: 2 });
		});

		test.concurrent('should deep clone object', async () => {
			const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
			const original = { a: 1, b: { c: 2 } };
			const cloned = deepClone(original);
			expect(cloned).toEqual(original);
			expect(cloned).not.toBe(original);
		});
	});
});