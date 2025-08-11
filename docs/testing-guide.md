# Testing Guide for Groq Code CLI

## Overview

The Groq Code CLI test suite consists of **629 tests** (618 passing, 11 skipped) organized across multiple modules and components. This guide provides a comprehensive overview of what each test category covers, helping developers understand the testing strategy and maintain high code quality.

**Current Coverage**: 86% statements, 89% branches, 87% functions, 86% lines (threshold: 80%)

## Test Suite Organization

```
src/
├── commands/        (7 test files, ~70 tests)
├── core/           (1 test file, 33 tests)
├── tools/          (3 test files, ~90 tests)
├── utils/          (5 test files, ~80 tests)
└── ui/             
    ├── components/
    │   ├── core/        (4 test files, ~120 tests)
    │   ├── display/     (3 test files, ~100 tests)
    │   └── input-overlays/ (5 test files, ~130 tests)
    └── hooks/           (2 test files, ~40 tests)
```

## Module Categories

### 1. Commands Module (~70 tests)
**Purpose**: Tests the CLI command system and individual command implementations

#### Base Command System (`base.test.ts`)
- **Command Registration**: Validates that commands can be registered with the system
- **Command Execution**: Tests the lifecycle of command execution
- **Error Handling**: Ensures commands handle errors gracefully
- **Command Context**: Validates context passing between commands

#### Individual Commands
Each command has comprehensive tests covering:

**Clear Command (`clear.test.ts`)**
- Screen clearing functionality
- Terminal output reset
- State preservation during clear

**Help Command (`help.test.ts`)**
- Help text generation and formatting
- Command listing accuracy
- Dynamic help based on available commands
- Markdown formatting of help content

**Login Command (`login.test.ts`)**
- API key validation (format, length, prefix)
- Credential storage and retrieval
- Error handling for invalid keys
- Session management

**Model Command (`model.test.ts`)**
- Model selection from available options
- Model validation against supported list
- Default model handling
- Model switching during session

**Reasoning Command (`reasoning.test.ts`)**
- Toggle reasoning mode on/off
- Configuration persistence
- Impact on agent behavior
- Status display

### 2. Core Module (33 tests)
**Purpose**: Tests the core agent logic and message processing

#### Agent Tests (`agent.test.ts`)
**Initialization & Configuration**
- Agent creation with various configurations
- API client setup and validation
- Default settings application
- Environment variable handling

**Message Processing**
- Input sanitization and validation
- Message queue management
- Context window handling
- Message history tracking

**Tool Execution**
- Tool selection based on user input
- Parameter extraction and validation
- Tool execution orchestration
- Result processing and formatting

**Response Generation**
- Streaming vs. non-streaming responses
- Token counting and limits
- Response formatting (markdown, code blocks)
- Error message generation

**Rate Limiting & Retries**
- Rate limit detection and handling
- Exponential backoff implementation
- Retry logic for transient failures
- Quota management

**Context Management**
- Context window size enforcement
- Message pruning strategies
- System message preservation
- Token optimization

### 3. Tools Module (~90 tests)
**Purpose**: Tests tool schemas, execution, and validation

#### Tool Schemas (`tool-schemas.test.ts`)
**Schema Validation**
- JSON schema compliance
- Required vs. optional parameters
- Type checking for parameters
- Nested schema validation

**Schema Generation**
- Dynamic schema creation
- Schema inheritance
- Default value handling
- Schema documentation

#### Tools Implementation (`tools.test.ts`)
**Tool Registration**
- Dynamic tool loading
- Tool naming conflicts
- Tool availability checks
- Tool metadata management

**File Operations**
- File reading with encoding detection
- File writing with backup creation
- Directory operations (create, list, delete)
- Path validation and sanitization
- Permission checking

**System Commands**
- Command execution in shell
- Environment variable handling
- Working directory management
- Process output capture
- Error stream handling

**Tool Response Handling**
- Success/failure response formatting
- Streaming output support
- Binary data handling
- Large output truncation

#### Validators (`validators.test.ts`)
**Input Validation**
- Parameter type checking
- Range and length validation
- Format validation (emails, URLs, paths)
- Custom validation rules

**Security Validation**
- Path traversal prevention
- Command injection prevention
- File access restrictions
- Sensitive data detection

### 4. Utils Module (~80 tests)
**Purpose**: Tests utility functions and helper modules

#### Constants (`constants.test.ts`)
- Default value exports
- Configuration constants
- Environment-specific values
- Type definitions

#### File Operations (`file-ops.test.ts`)
**File System Operations**
- Recursive directory creation
- Safe file deletion
- File existence checking
- File stat operations

**Path Handling**
- Path normalization
- Relative to absolute conversion
- Cross-platform compatibility
- Symlink resolution

**Error Handling**
- Permission denied scenarios
- Disk full handling
- Invalid path handling
- Race condition prevention

#### Local Settings (`local-settings.test.ts`)
**Settings Management**
- Settings file creation
- Settings loading and parsing
- Settings validation
- Migration from old formats

**Persistence**
- Atomic writes
- Backup creation
- Corruption recovery
- Default settings fallback

#### Markdown Processing (`markdown.test.ts`)
**Parsing**
- Code block extraction
- Language detection
- Fence style handling
- Nested markdown

**Rendering**
- Syntax highlighting
- Table formatting
- Link processing
- Image handling

### 5. UI Components (~350 tests)

#### Core Components (~120 tests)
**Purpose**: Tests fundamental UI components

**Chat Component (`Chat.test.tsx`)**
- Message rendering with proper formatting
- Auto-scrolling behavior
- Message updates and re-renders
- Loading states
- Error message display
- Empty state handling

**Message History (`MessageHistory.test.tsx`)**
- Message list rendering
- Message filtering (by type, user, time)
- Pagination for long histories
- Message grouping
- Timestamp formatting
- Message selection

**Message Input (`MessageInput.test.tsx`)**
- Text input handling
- Multi-line input support
- Command parsing (slash commands)
- Keyboard shortcuts (Enter, Ctrl+Enter, etc.)
- Input validation
- Paste handling
- Auto-completion

#### Display Components (~100 tests)
**Purpose**: Tests specialized display components

**Diff Preview (`DiffPreview.test.tsx`)** - 25 tests
- Unified diff rendering
- Side-by-side diff display
- Syntax highlighting in diffs
- Line number display
- Addition/deletion highlighting
- Large diff handling
- Binary file detection

**Token Metrics (`TokenMetrics.test.tsx`)**
- Token counting accuracy
- Cost calculation
- Usage display formatting
- Limit warnings
- Progress indicators
- Historical usage tracking

**Tool History Item (`ToolHistoryItem.test.tsx`)** - 43 tests
- Tool execution status display (pending, success, error)
- Parameter rendering
- Result formatting
- Error message display
- Execution time display
- Collapsible details
- Status icons and colors

#### Input Overlay Components (~130 tests)
**Purpose**: Tests modal and overlay components

**Login Component (`Login.test.tsx`)** - 28 tests (11 skipped)
- Login form rendering
- API key input handling
- Password masking
- Validation messages
- Submit/cancel actions
- Keyboard navigation
- Error display

**Max Iterations Continue (`MaxIterationsContinue.test.tsx`)** - 24 tests
- Iteration limit warnings
- Continue/stop prompts
- Progress display
- User choice handling
- Timeout behavior

**Model Selector (`ModelSelector.test.tsx`)**
- Model list display
- Search/filter functionality
- Keyboard navigation
- Model selection
- Popular models highlighting
- Model capabilities display

**Pending Tool Approval (`PendingToolApproval.test.tsx`)** - 30+ tests
- Tool details display
- Approval/rejection UI
- Parameter preview
- Risk warnings
- Keyboard shortcuts
- Batch approval

**Slash Command Suggestions (`SlashCommandSuggestions.test.tsx`)** - 27 tests
- Command suggestion list
- Fuzzy search matching
- Keyboard navigation
- Auto-completion
- Command descriptions
- Recently used commands

### 6. Hooks (~40 tests)
**Purpose**: Tests custom React hooks

#### useAgent Hook (`useAgent.test.ts`)
**State Management**
- Message state updates
- Loading state transitions
- Error state handling
- Tool execution state

**API Integration**
- API call triggering
- Response processing
- Error handling
- Retry logic

**Event Handling**
- Message sending
- Tool approval/rejection
- Cancellation
- Stream handling

#### useTokenMetrics Hook (`useTokenMetrics.test.ts`)
**Token Calculation**
- Input token counting
- Output token counting
- Total usage tracking
- Model-specific calculations

**Cost Estimation**
- Price per token calculations
- Currency formatting
- Budget tracking
- Alert thresholds

**Updates**
- Real-time updates
- Batch updates
- Historical data
- Reset functionality

## Testing Patterns & Best Practices

### 1. Mocking Strategy
- **Ink Components**: Mocked to simple HTML elements for testing
- **File System**: Mocked to prevent actual file operations
- **API Calls**: Mocked to avoid external dependencies
- **Time-based Operations**: Controlled with fake timers

### 2. Test Organization
```typescript
describe('ComponentName', () => {
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

### 3. Coverage Strategy
- **Unit Tests**: Cover individual functions and components
- **Integration Tests**: Test component interactions
- **Edge Cases**: Test boundary conditions and error paths
- **Regression Tests**: Prevent previously fixed bugs

## Known Issues & Skipped Tests

### Login Component (11 skipped tests)
Tests skipped due to React act() warnings and Ink v6 compatibility:
- Character input handling
- Asterisk display limiting
- Enter key with valid input
- Whitespace trimming
- Complex input scenarios
- Control character handling
- Empty input edge cases

**Future Fix Plan**: 
- Wrap state updates in act()
- Implement async state handling
- Consider alternative testing strategies for Ink v6

## Running Tests

### Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Interactive UI
npm run test:ui

# Run specific test file
npm test src/core/agent.test.ts

# Run tests matching pattern
npm test -- --grep "should handle"
```

### CI/CD Integration
Tests automatically run on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

GitHub Actions provides:
- Matrix testing (Node 18.x, 20.x)
- Coverage reports
- PR comments with coverage summary
- Test status badges

## Maintaining Tests

### Adding New Tests
1. Create test file alongside source file
2. Follow existing naming patterns
3. Include all test categories (rendering, interaction, errors)
4. Aim for >80% coverage
5. Update this guide if adding new test categories

### Debugging Failed Tests
1. Run single test in watch mode
2. Check for timing issues (async/await)
3. Verify mocks are properly configured
4. Look for environment-specific issues
5. Check for test interdependencies

### Performance Considerations
- Full test suite runs in ~3-4 seconds
- Keep individual tests under 100ms
- Use `describe.skip()` for slow integration tests
- Parallelize independent tests

## Test Quality Metrics

### Current Status
- **Total Tests**: 629
- **Passing**: 618 (98.3%)
- **Skipped**: 11 (1.7%)
- **Execution Time**: ~3-4 seconds
- **Files Tested**: 29

### Coverage Breakdown
| Module | Statement | Branch | Function | Line |
|--------|-----------|---------|----------|------|
| Commands | 95% | 92% | 94% | 95% |
| Core | 88% | 85% | 90% | 88% |
| Tools | 92% | 90% | 91% | 92% |
| Utils | 100% | 96% | 100% | 100% |
| UI | 82% | 88% | 83% | 82% |

## Future Improvements

### Phase 1 (Current)
- ✅ Unit test coverage >80%
- ✅ GitHub Actions integration
- ✅ Coverage reporting

### Phase 2 (Planned)
- Fix skipped Login component tests
- Add E2E tests with Playwright
- Performance benchmarking
- Visual regression testing

### Phase 3 (Future)
- Mutation testing
- Contract testing for API
- Security testing
- Load testing for concurrent operations

## Contributing

When contributing tests:
1. Follow existing patterns
2. Write descriptive test names
3. Include positive and negative cases
4. Test edge cases
5. Keep tests isolated and independent
6. Update this guide for significant changes

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Ink Testing Challenges](https://github.com/vadimdemedes/ink/issues)
- [Project Test Plan](./testplan.md)