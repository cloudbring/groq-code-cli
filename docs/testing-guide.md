# Testing Guide for Groq Code CLI

## Overview

The Groq Code CLI test suite consists of **640 tests** (629 passing, 11 skipped) organized using Vitest workspace configuration with separate projects for unit, integration, and component tests. This guide provides a comprehensive overview of the testing architecture, patterns, and maintenance procedures.

**Current Coverage**: 86% statements, 89% branches, 87% functions, 86% lines

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

### Vitest Workspace Configuration

The test suite uses a Vitest workspace with three distinct projects:

```
vitest.workspace.ts     # Main workspace configuration
├── vitest.config.unit.ts        # Unit test configuration
├── vitest.config.integration.ts # Integration test configuration
└── vitest.config.component.ts   # Component test configuration
```

#### Project-Specific Configurations

**Unit Tests** (`vitest.config.unit.ts`)
- Environment: `node`
- Coverage thresholds: 80% (lines, functions, branches, statements)
- Focus: Individual functions and modules in isolation

**Integration Tests** (`vitest.config.integration.ts`)
- Environment: `node`
- Test timeout: 20 seconds
- Coverage thresholds: 70% (more lenient for integration tests)
- Single-threaded execution to avoid conflicts

**Component Tests** (`vitest.config.component.ts`)
- Environment: `happy-dom`
- React plugin enabled
- Setup file for React Testing Library
- Coverage thresholds: 75% for UI components

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
# Run all tests with workspace configuration
npm test

# Run specific test projects
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:component     # Component tests only

# Coverage and development
npm run test:coverage      # Run all tests with coverage report
npm run test:watch        # Watch mode for all tests
npm run test:ui           # Interactive UI for test exploration

# Run specific test file
npm test -- test/unit/tools/tools.test.ts

# Run tests matching pattern
npm test -- --grep "should handle"
```

### Test Execution Flow

1. **Workspace Discovery**: Vitest loads `vitest.workspace.ts`
2. **Project Configuration**: Each project loads its specific config
3. **Test Collection**: Tests are collected based on include patterns
4. **Parallel Execution**: Unit and component tests run in parallel
5. **Coverage Aggregation**: Coverage is collected across all projects

## Test Categories by Module

### 1. Unit Tests (15 test files)

#### Commands Module (5 files, ~70 tests)
Tests individual command implementations:

- **help.test.ts**: Help text generation, command listing
- **clear.test.ts**: History clearing, state management
- **login.test.ts**: API key validation, credential storage
- **model.test.ts**: Model selection, validation
- **reasoning.test.ts**: Reasoning mode toggle

#### Tools Module (3 files, ~90 tests)
Tests tool system functionality:

- **tools.test.ts**: Tool execution, file operations, command execution
- **tool-schemas.test.ts**: Schema validation, generation
- **validators.test.ts**: Input validation, security checks

#### Utils Module (4 files, ~80 tests)
Tests utility functions:

- **constants.test.ts**: Configuration constants
- **file-ops.test.ts**: File system operations
- **local-settings.test.ts**: Settings management
- **markdown.test.ts**: Markdown parsing and rendering

### 2. Integration Tests (2 test files)

#### Core Agent Tests (33 tests)
Integration tests for the agent system:

- Agent initialization with configurations
- API client integration
- Message processing pipeline
- Tool execution flow
- Error handling and retries
- Context management

### 3. Component Tests (15 test files)

#### Core UI Components (4 files, ~120 tests)
- **App.test.tsx**: Main application component
- **Chat.test.tsx**: Chat interface
- **MessageHistory.test.tsx**: Message display
- **MessageInput.test.tsx**: Input handling

#### Display Components (3 files, ~100 tests)
- **DiffPreview.test.tsx**: File diff visualization (25 tests)
- **TokenMetrics.test.tsx**: Token usage display
- **ToolHistoryItem.test.tsx**: Tool execution history (43 tests)

#### Input Overlays (5 files, ~130 tests)
- **Login.test.tsx**: Authentication UI (28 tests, 11 skipped)
- **MaxIterationsContinue.test.tsx**: Iteration limit handling (24 tests)
- **ModelSelector.test.tsx**: Model selection interface
- **PendingToolApproval.test.tsx**: Tool approval UI (30+ tests)
- **SlashCommandSuggestions.test.tsx**: Command autocomplete (27 tests)

#### Hooks (2 files, ~40 tests)
- **useAgent.test.ts**: Agent state management hook
- **useTokenMetrics.test.ts**: Token tracking hook

## Testing Patterns

### 1. Test Organization

Tests follow a consistent structure using `describe` blocks:

```typescript
describe('ComponentName', () => {
  // Setup and mocks
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default props', () => {});
    it('should handle edge cases', () => {});
  });
  
  describe('interaction', () => {
    it('should handle user input', () => {});
    it('should validate input', () => {});
  });
  
  describe('error handling', () => {
    it('should display error messages', () => {});
    it('should recover gracefully', () => {});
  });
});
```

### 2. Mocking Strategy

#### Common Mocks

**File System Operations**
```typescript
vi.mock('@src/utils/file-ops', () => ({
  writeFile: vi.fn(),
  createDirectory: vi.fn(),
  deleteFile: vi.fn()
}));
```

**React Components (Ink)**
```typescript
vi.mock('ink', () => ({
  Box: ({ children }: any) => <div data-testid="box">{children}</div>,
  Text: ({ children }: any) => <span data-testid="text">{children}</span>,
  useInput: vi.fn()
}));
```

**External Libraries**
```typescript
vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));
```

### 3. Concurrent Testing

Many tests use `test.concurrent` for parallel execution:

```typescript
describe('Button Component', () => {
  test.concurrent('should render button with text', async () => {
    // Test implementation
  });

  test.concurrent('should handle click events', async () => {
    // Test implementation
  });
});
```

## Coverage Analysis

### Current Coverage Metrics

| Category | Statements | Branches | Functions | Lines |
|----------|------------|----------|-----------|-------|
| Overall  | 86.08%     | 89.17%   | 87.27%    | 86.08% |

### Coverage by Module

- **Commands**: ~95% coverage - Well tested command implementations
- **Core**: ~88% coverage - Complex agent logic with good coverage
- **Tools**: ~92% coverage - Comprehensive tool testing
- **Utils**: ~100% coverage - Excellent utility function coverage
- **UI Components**: ~82% coverage - Good component coverage with room for improvement

### Coverage Thresholds

Different thresholds for different test types:
- **Unit Tests**: 80% minimum (strict)
- **Integration Tests**: 70% minimum (more lenient)
- **Component Tests**: 75% minimum (balanced)

## Known Issues & Skipped Tests

### Login Component (11 skipped tests)
Tests skipped due to React act() warnings with Ink v6:
- Character input handling edge cases
- Asterisk display limiting
- Complex input scenarios
- Control character handling

**Resolution Plan**: 
- Implement proper act() wrapping for state updates
- Consider alternative testing approach for Ink components
- Potentially migrate to React Testing Library's waitFor patterns

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

## Future Improvements

### Phase 1 (Completed) ✅
- Unit test coverage >80%
- Workspace configuration for test organization
- @src alias implementation
- GitHub Actions integration

### Phase 2 (In Progress)
- Fix skipped Login component tests
- Add E2E tests with Playwright
- Performance benchmarking suite
- Visual regression testing for UI components

### Phase 3 (Planned)
- Mutation testing with Stryker
- Contract testing for API interactions
- Security testing automation
- Load testing for concurrent operations
- Snapshot testing for complex outputs

## Contributing

When contributing tests:

1. **Follow conventions**: Use existing patterns and structures
2. **Update documentation**: Add new test categories to this guide
3. **Maintain coverage**: Don't reduce overall coverage
4. **Review checklist**:
   - Tests pass locally
   - Coverage meets thresholds
   - No console.log statements
   - Mocks are properly cleaned up
   - Uses @src alias for imports

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Ink Testing Guide](https://github.com/vadimdemedes/ink#testing)
- [Project Test Plan](./testplan.md)
- [Detailed Testing Guide](./testing-guide-detailed.md)