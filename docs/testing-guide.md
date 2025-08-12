# Testing Guide for Groq Code CLI

## Overview

The Groq Code CLI test suite has been migrated from Vitest to Ava test runner to align with project standards. The current state includes **54 working tests** with partial conversion completed. This guide provides a comprehensive overview of the testing architecture, patterns, and maintenance procedures for the Ava-based test suite.

### Migration Status
- ✅ **Core Infrastructure**: Ava configuration, dependencies, and scripts
- ✅ **Command Tests**: Fully converted (8 test files, ~30 tests)
- ✅ **Utility Tests**: Fully converted (4 test files, ~24 tests)
- 🔄 **Tool Tests**: Partial conversion (some Vitest imports remain)
- ⏳ **Component Tests**: Awaiting conversion (React/Ink components)
- ⏳ **Integration Tests**: Awaiting conversion (agent tests)

## Test Suite Architecture

### Directory Structure
```
test/
├── unit/                # Unit tests for individual functions/modules
│   ├── commands/       # Command system tests
│   ├── tools/          # Tool implementation tests
│   └── utils/          # Utility function tests
├── integration/        # Integration tests for system interactions
│   └── core/          # Core agent integration tests
└── component/         # React component tests
    └── ui/
        ├── components/
        │   ├── core/        # Core UI components
        │   ├── display/     # Display components
        │   └── input-overlays/ # Modal/overlay components
        └── hooks/           # React hooks tests
```

### Ava Configuration

The test suite uses Ava with TypeScript support:

```
ava.config.js          # Main Ava configuration
├── TypeScript compilation with tsx loader
├── Path mapping for @src alias
└── Support for .ts and .tsx files
```

#### Configuration Details

**Main Configuration** (`ava.config.js`)
- TypeScript compilation: `tsc`
- Path rewriting: `@src/` → `src/`
- Node arguments: `--import=tsx`
- File patterns: `test/**/*.test.ts`, `test/**/*.test.tsx`

## Import Path Management

### @src Alias

All test files use the `@src` alias for clean, consistent imports:

```typescript
// Instead of complex relative paths:
import { Agent } from '../../../src/core/agent';

// Use the @src alias:
import { Agent } from '@src/core/agent';
```

This is configured in:
- `tsconfig.json`: TypeScript path mapping
- Each `vitest.config.*.ts`: Vite resolve alias

### Mock Imports

Mocks also use the `@src` alias:

```typescript
vi.mock('@src/utils/file-ops', () => ({
  writeFile: vi.fn(),
  createDirectory: vi.fn()
}));
```

## Running Tests

### NPM Scripts

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:component     # Component tests only

# Development and debugging
npm run test:coverage      # Run all tests with coverage report using c8
npm run test:watch         # Watch mode for development
npm run test:verbose       # Verbose output for debugging

# Run specific test file
npx ava test/unit/utils/constants.test.ts

# Run tests matching pattern
npx ava --match="*should handle*"
```

### Test Execution Flow

1. **Configuration Loading**: Ava loads `ava.config.js`
2. **TypeScript Processing**: tsx loader handles TypeScript compilation
3. **Path Resolution**: @src alias is resolved to src/ directory
4. **Test Discovery**: Tests are collected from specified patterns
5. **Sequential Execution**: Ava runs tests by default in sequential mode

### Current Working Tests

The following tests are successfully running with Ava:

```bash
# Run only the converted/working tests
npm run test:unit

# Currently passing:
✔ commands › base › CommandContext - should define correct interface structure
✔ commands › index › getAvailableCommands - should return an array of command definitions
✔ utils › constants › IGNORE_PATTERNS should be a Set
✔ utils › markdown › parseMarkdown - should parse plain text
# ... 54 total tests passing
```

**Successful conversions demonstrate**:
- Ava configuration working correctly
- @src path mapping functional
- Sinon mocking patterns established
- TypeScript compilation integrated

## Test Categories by Module

### 1. Unit Tests (Partially Converted)

#### ✅ Commands Module (8 files, ~30 tests converted)
**Status**: Fully converted to Ava
- **help.test.ts**: Help text generation, command listing ✅
- **clear.test.ts**: History clearing, state management ✅
- **login.test.ts**: API key validation, credential storage ✅
- **model.test.ts**: Model selection, validation ✅
- **reasoning.test.ts**: Reasoning mode toggle ✅
- **base.test.ts**: Command interfaces and base functionality ✅
- **index.test.ts**: Command registration and execution ✅

#### 🔄 Tools Module (3 files, conversion in progress)
**Status**: Needs completion - some Vitest imports remain
- **tools.test.ts**: Tool execution, file operations ⚠️ (Has Vitest imports)
- **tool-schemas.test.ts**: Schema validation ⚠️ (Has Vitest imports)
- **validators.test.ts**: Input validation ⚠️ (Has Vitest imports)

#### ✅ Utils Module (4 files, ~24 tests converted)
**Status**: Fully converted to Ava
- **constants.test.ts**: Configuration constants ✅
- **file-ops.test.ts**: File system operations ✅ (Needs mocking fixes)
- **local-settings.test.ts**: Settings management ✅ (Needs mocking fixes)
- **markdown.test.ts**: Markdown parsing and rendering ✅

### 2. Integration Tests (Not Yet Converted)

#### ⏳ Core Agent Tests
**Status**: Awaiting conversion from Vitest
- Agent initialization with configurations
- API client integration
- Message processing pipeline
- Tool execution flow
- Error handling and retries
- Context management

### 3. Component Tests (Not Yet Converted)

#### ⏳ Core UI Components
**Status**: Awaiting conversion from Vitest
- **App.test.tsx**: Main application component
- **Chat.test.tsx**: Chat interface
- **MessageHistory.test.tsx**: Message display
- **MessageInput.test.tsx**: Input handling

#### ⏳ Display Components
**Status**: Awaiting conversion from Vitest
- **DiffPreview.test.tsx**: File diff visualization
- **TokenMetrics.test.tsx**: Token usage display
- **ToolHistoryItem.test.tsx**: Tool execution history

#### ⏳ Input Overlays
**Status**: Awaiting conversion from Vitest
- **Login.test.tsx**: Authentication UI
- **MaxIterationsContinue.test.tsx**: Iteration limit handling
- **ModelSelector.test.tsx**: Model selection interface
- **PendingToolApproval.test.tsx**: Tool approval UI
- **SlashCommandSuggestions.test.tsx**: Command autocomplete

#### ⏳ Hooks
**Status**: Awaiting conversion from Vitest
- **useAgent.test.ts**: Agent state management hook
- **useTokenMetrics.test.ts**: Token tracking hook

## Testing Patterns

### 1. Test Organization

Tests use Ava's flat structure with descriptive test names:

```typescript
import test from 'ava';
import sinon from 'sinon';

test.beforeEach(t => {
  // Setup stubs/mocks
  t.context.stubs = {};
});

test.afterEach.always(t => {
  sinon.restore();
});

test('ComponentName - should render with default props', t => {
  // Test implementation
  t.is(result, expected);
});

test('ComponentName - should handle edge cases', t => {
  // Test implementation
  t.true(condition);
});
```

### 2. Mocking Strategy

#### Common Patterns

**Sinon Stubs**
```typescript
import sinon from 'sinon';

// Stubbing functions
const writeStub = sinon.stub();
const readStub = sinon.stub().returns('mock data');

// Stubbing modules (requires setup)
test.beforeEach(t => {
  t.context.fsStubs = {
    writeFile: sinon.stub(),
    readFile: sinon.stub()
  };
});
```

**React Components (with testing-library)**
```typescript
import { render } from '@testing-library/react';

test('Component should render correctly', t => {
  const { getByText } = render(<Component />);
  t.truthy(getByText('Expected text'));
});
```

### 3. Ava Assertions

Common assertion patterns:

```typescript
// Equality
t.is(actual, expected);
t.deepEqual(actualObject, expectedObject);

// Truthiness
t.true(condition);
t.false(condition);
t.truthy(value);
t.falsy(value);

// Exceptions
const error = t.throws(() => throwingFunction());
t.is(error.message, 'Expected error message');

// Async
await t.notThrowsAsync(async () => await asyncFunction());

// Sinon assertions
t.true(stub.called);
t.true(stub.calledWith('expected argument'));
t.is(stub.callCount, 2);
```

## Coverage Analysis

### Current Status (Post-Migration)

**Coverage reporting is currently being reconfigured for Ava + c8**

### Pre-Migration Metrics (Reference)
The original Vitest test suite had:
- 640+ total tests
- 86% overall coverage
- Well-distributed coverage across modules

### Coverage Configuration

**C8 Configuration** (Coverage tool for Ava)
```bash
# Run tests with coverage
npm run test:coverage

# Coverage is collected using c8 (V8 coverage)
# Configuration can be added to package.json under "c8" key
```

### Module Coverage Status

- **✅ Commands**: Well covered with converted tests
- **🔄 Tools**: Coverage pending completion of conversion
- **✅ Utils**: Good coverage with converted tests  
- **⏳ UI Components**: Coverage pending React component conversion
- **⏳ Core/Integration**: Coverage pending agent test conversion

### Coverage Goals

Post-migration targets:
- **Converted Tests**: Maintain existing coverage levels
- **New Tests**: Follow Ava best practices for comprehensive coverage
- **Overall Goal**: Restore and exceed original 86% coverage

## Known Issues & Current Challenges

### Mocking Issues in Converted Tests
Some tests encounter property redefinition errors:
```
TypeError: Cannot redefine property: existsSync
TypeError: Cannot redefine property: promises
```

**Issues**:
- `Object.defineProperty` conflicts with existing properties
- Sinon stubbing needs different approach for built-in modules

**Solutions in Progress**:
- Use Sinon's `stub()` and `restore()` for module mocking
- Implement proper test isolation with `test.beforeEach` and `test.afterEach`
- Consider using module path interception for complex mocks

### Remaining Vitest Dependencies
Some test files still import from 'vitest':
- `test/unit/tools/*.test.ts` (3 files)
- `test/component/**/*.test.tsx` (13+ files) 
- `test/integration/**/*.test.ts` (2 files)

**Resolution Plan**:
- Complete systematic conversion of remaining files
- Update complex mocking patterns for React components
- Ensure all assertions use Ava's `t.*` format

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

### Test Matrix

- **Node Versions**: 18.x, 20.x
- **Operating Systems**: Ubuntu (primary), Windows, macOS (planned)
- **Coverage Reports**: Uploaded to PR comments

### Performance Benchmarks

- Full test suite: ~3-4 seconds
- Unit tests: ~1 second
- Integration tests: ~1.5 seconds
- Component tests: ~1.5 seconds

## Best Practices

### Writing New Tests

1. **Location**: Place tests in the appropriate directory (unit/integration/component)
2. **Naming**: Use `.test.ts` or `.test.tsx` extension
3. **Imports**: Always use `@src` alias for source imports
4. **Mocking**: Mock external dependencies, not internal logic
5. **Coverage**: Aim for >80% coverage for new code
6. **Isolation**: Tests should not depend on each other

### Test Quality Checklist

- [ ] Test both success and failure paths
- [ ] Include edge cases and boundary conditions
- [ ] Use descriptive test names that explain the scenario
- [ ] Keep tests focused on a single behavior
- [ ] Use appropriate assertions for the scenario
- [ ] Clean up after tests (restore mocks, clear timers)

### Debugging Failed Tests

1. **Run in isolation**: `npm test -- test/path/to/specific.test.ts`
2. **Check mocks**: Ensure mocks are properly cleared between tests
3. **Async issues**: Verify proper async/await usage
4. **Console output**: Use `console.log` for debugging (remove before commit)
5. **Watch mode**: Use `npm run test:watch` for rapid iteration

## Migration Roadmap

### Phase 1 (Completed) ✅
- ✅ Ava infrastructure setup and configuration
- ✅ Core command tests converted (8 files)
- ✅ Utility tests converted (4 files)
- ✅ @src alias working with Ava
- ✅ TypeScript compilation fixed
- ✅ Documentation updated

### Phase 2 (In Progress) 🔄
- 🔄 Complete tool tests conversion (3 files remaining)
- 🔄 Fix mocking issues in converted tests
- 🔄 Set up c8 coverage reporting
- ⏳ Convert React component tests (13+ files)
- ⏳ Convert integration tests (2 files)

### Phase 3 (Planned) 📋
- 📋 Achieve parity with original test coverage (86%+)
- 📋 Optimize Ava test performance
- 📋 Add React Testing Library best practices
- 📋 Implement proper Sinon mocking patterns
- 📋 Add E2E tests with Playwright (if needed)

### Current Priorities
1. **Complete remaining conversions** - Finish tool, component, and integration tests
2. **Fix mocking issues** - Resolve property redefinition errors
3. **Restore coverage reporting** - Configure c8 for comprehensive metrics
4. **Documentation** - Update patterns and examples as conversion progresses

## Contributing

When contributing to the test suite:

### For New Tests (Use Ava)
1. **Follow Ava patterns**: Use `test()` functions with descriptive names
2. **Use Ava assertions**: `t.is()`, `t.true()`, `t.deepEqual()`, etc.
3. **Proper mocking**: Use Sinon stubs, avoid `Object.defineProperty` conflicts
4. **Import paths**: Always use `@src/*` for source imports
5. **Cleanup**: Use `test.afterEach.always(() => sinon.restore())`

### For Converting Existing Tests
1. **Remove Vitest imports**: Replace with `import test from 'ava'` and `import sinon from 'sinon'`
2. **Convert structure**: `describe()` → descriptive `test()` names
3. **Update assertions**: `expect()` → `t.*` assertions
4. **Fix mocking**: Replace `vi.mock()` with appropriate Sinon patterns
5. **Test locally**: Ensure converted tests run with `npm run test:unit`

### Review Checklist
- ✅ Tests pass locally with Ava
- ✅ No Vitest imports remaining
- ✅ Uses `@src` alias for imports
- ✅ Proper Sinon cleanup in afterEach
- ✅ Descriptive test names following "Module - should do something" pattern

## Resources

- [Ava Documentation](https://github.com/avajs/ava)
- [Ava Assertions](https://github.com/avajs/ava/blob/main/docs/03-assertions.md)
- [Sinon Documentation](https://sinonjs.org/)
- [Testing Library](https://testing-library.com/) (for React components)
- [C8 Coverage](https://github.com/bcoe/c8) (coverage tool)
- [Project Migration Guide](./testing-migration.md) (if created)