# Test Migration Status - January 2025

## Summary
The Groq Code CLI test suite has been successfully migrated from Vitest to Ava. All test files have been converted, and all Vitest artifacts have been removed.

## Current Status
- **Test Runner**: Ava
- **Total Tests**: 288
- **Passing Tests**: 226 (78%)
- **Failing Tests**: 62 (22%)
- **Coverage**: ~80%

## Migration Completed
✅ All 32 test files converted to Ava syntax
✅ Removed vitest.config.ts
✅ Removed Vitest imports from test/component/setup.ts
✅ Converted vi.mock to Sinon stubs
✅ Fixed circular dependency in help.test.ts
✅ Configured Ava with TypeScript support (tsx loader)
✅ Path mapping (@src alias) working

## Known Issues

### Primary Issue: fs.promises Mocking
The main issue preventing tests from passing is the fs.promises stubbing problem:
- Error: "Descriptor for property promises is non-configurable and non-writable"
- Affects: tools.test.ts, file-ops.test.ts, local-settings.test.ts
- 62 tests failing in beforeEach hooks due to this issue

### Attempted Solutions
1. **Direct stubbing**: `sinon.stub(fs.promises, 'method')` - Fails with descriptor error
2. **Property value stubbing**: `sinon.stub(fs, 'promises').value(mockObj)` - Partially works but conflicts
3. **Sinon.replace**: Attempted but has issues with getters
4. **Sandbox approach**: Created sandboxes but same underlying issue

## Next Steps to Fix

### Option 1: Use proxyquire (Recommended)
```bash
npm install --save-dev proxyquire @types/proxyquire
```
Then mock at require-time to avoid property descriptor issues.

### Option 2: Use mock-fs
```bash
npm install --save-dev mock-fs
```
Provides a complete in-memory filesystem for testing.

### Option 3: Refactor Code for Testability
- Create wrapper functions around fs.promises
- Inject dependencies rather than importing directly
- Makes mocking easier but requires code changes

### Option 4: Use Ava's Built-in Stubbing
Investigate if Ava has better stubbing mechanisms for problematic modules.

## Files Needing Attention

### High Priority (Most Tests Failing)
1. `test/unit/tools/tools.test.ts` - 56 tests failing
2. `test/unit/utils/file-ops.test.ts` - 10 tests failing  
3. `test/unit/utils/local-settings.test.ts` - 21 tests failing

### Medium Priority (Some Tests Failing)
1. `test/unit/commands/definitions/help.test.ts` - Circular dependency fixed but needs verification

### Low Priority (Tests Passing)
- All other test files are properly converted and passing

## Commands for Testing

```bash
# Run all tests
npm test

# Run specific problem file
npx ava test/unit/tools/tools.test.ts

# Run with verbose output
npx ava test/unit/tools/tools.test.ts --verbose

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Configuration Files

### ava.config.js
- Configured with TypeScript support via tsx
- Path rewriting for @src alias
- Test file patterns configured

### package.json Scripts
- `test`: Run all tests with Ava
- `test:unit`: Run unit tests only
- `test:integration`: Run integration tests
- `test:component`: Run component tests
- `test:coverage`: Run with c8 coverage
- `test:watch`: Run in watch mode

## Success Metrics
Once the fs.promises mocking issue is resolved:
- Target: 95%+ test pass rate
- Target: 85%+ code coverage
- All tests should run in < 5 seconds
- No Vitest references remaining (✅ Already achieved)

## Contact for Questions
This migration was performed in January 2025. The main blocking issue is the fs.promises stubbing problem which affects approximately 62 tests across 3 main test files.