import { JSDOM } from 'jsdom';
import { cleanup } from '@testing-library/react';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
	url: 'http://localhost',
	pretendToBeVisual: true,
	resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;

// Add other globals from window, but be careful with read-only properties
Object.keys(dom.window).forEach(property => {
	if (typeof global[property] === 'undefined') {
		try {
			global[property] = dom.window[property];
		} catch (error) {
			// Ignore read-only properties
		}
	}
});

// Cleanup after each test (Ava doesn't have built-in afterEach like Vitest)
// We'll need to call cleanup manually in tests or use a different approach
export { cleanup };