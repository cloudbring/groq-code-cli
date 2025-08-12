# Refactor Completion Protocol

## Rule: When Stopping Refactor Work
When doing any refactor work and reaching a stopping point, ALWAYS:

1. **Update testing docs in `docs/`** - Update relevant documentation files
2. **Commit the progress** - Create a git commit with clear message about what was accomplished
3. **Update `docs/MIGRATION_STATUS.md`** - Reflect current status and progress made
4. **Provide continuation context** - Give the user everything they need to continue the refactor after using "/clear" to clear chat history

This ensures continuity and proper documentation of refactor progress for future sessions.