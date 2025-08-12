import { describe, it, expect } from 'vitest';
import {
  ToolSchema,
  READ_FILE_SCHEMA,
  CREATE_FILE_SCHEMA,
  EDIT_FILE_SCHEMA,
  DELETE_FILE_SCHEMA,
  EXECUTE_COMMAND_SCHEMA,
  SEARCH_FILES_SCHEMA,
  LIST_FILES_SCHEMA,
  CREATE_TASKS_SCHEMA,
  UPDATE_TASKS_SCHEMA,
  ALL_TOOL_SCHEMAS,
  SAFE_TOOLS,
  APPROVAL_REQUIRED_TOOLS,
  DANGEROUS_TOOLS
} from '../../../src/tools/tool-schemas.js';

describe('ToolSchema Interface', () => {
  it('should define correct structure', () => {
    const schema: ToolSchema = {
      type: 'function',
      function: {
        name: 'test_function',
        description: 'Test function',
        parameters: {
          type: 'object',
          properties: {
            param1: { type: 'string' }
          },
          required: ['param1']
        }
      }
    };

    expect(schema.type).toBe('function');
    expect(schema.function.name).toBe('test_function');
    expect(schema.function.description).toBe('Test function');
    expect(schema.function.parameters.type).toBe('object');
  });
});

describe('READ_FILE_SCHEMA', () => {
  it('should have correct structure and properties', () => {
    expect(READ_FILE_SCHEMA.type).toBe('function');
    expect(READ_FILE_SCHEMA.function.name).toBe('read_file');
    expect(READ_FILE_SCHEMA.function.description).toContain('Read file contents');
    expect(READ_FILE_SCHEMA.function.parameters.type).toBe('object');
    expect(READ_FILE_SCHEMA.function.parameters.required).toEqual(['file_path']);
  });

  it('should have correct parameter definitions', () => {
    const props = READ_FILE_SCHEMA.function.parameters.properties;
    expect(props.file_path).toEqual({
      type: 'string',
      description: expect.stringContaining('Path to file')
    });
    expect(props.start_line).toEqual({
      type: 'integer',
      description: expect.stringContaining('Starting line number'),
      minimum: 1
    });
    expect(props.end_line).toEqual({
      type: 'integer',
      description: expect.stringContaining('Ending line number'),
      minimum: 1
    });
  });

  it('should include usage guidelines', () => {
    expect(READ_FILE_SCHEMA.function.description).toContain('REQUIRED before edit_file');
    expect(READ_FILE_SCHEMA.function.description).toContain('Example:');
  });
});

describe('CREATE_FILE_SCHEMA', () => {
  it('should have correct structure and properties', () => {
    expect(CREATE_FILE_SCHEMA.type).toBe('function');
    expect(CREATE_FILE_SCHEMA.function.name).toBe('create_file');
    expect(CREATE_FILE_SCHEMA.function.description).toContain('Create NEW files');
    expect(CREATE_FILE_SCHEMA.function.parameters.required).toEqual(['file_path', 'content']);
  });

  it('should have file type enumeration', () => {
    const props = CREATE_FILE_SCHEMA.function.parameters.properties;
    expect(props.file_type.enum).toEqual(['file', 'directory']);
    expect(props.file_type.default).toBe('file');
  });

  it('should have overwrite option', () => {
    const props = CREATE_FILE_SCHEMA.function.parameters.properties;
    expect(props.overwrite.type).toBe('boolean');
    expect(props.overwrite.default).toBe(false);
  });

  it('should include safety warnings', () => {
    expect(CREATE_FILE_SCHEMA.function.description).toContain('CRITICAL');
    expect(CREATE_FILE_SCHEMA.function.description).toContain('check if file exists first');
  });
});

describe('EDIT_FILE_SCHEMA', () => {
  it('should have correct structure and properties', () => {
    expect(EDIT_FILE_SCHEMA.type).toBe('function');
    expect(EDIT_FILE_SCHEMA.function.name).toBe('edit_file');
    expect(EDIT_FILE_SCHEMA.function.description).toContain('Modify EXISTING files');
    expect(EDIT_FILE_SCHEMA.function.parameters.required).toEqual(['file_path', 'old_text', 'new_text']);
  });

  it('should have replace_all option', () => {
    const props = EDIT_FILE_SCHEMA.function.parameters.properties;
    expect(props.replace_all.type).toBe('boolean');
    expect(props.replace_all.default).toBe(false);
  });

  it('should include mandatory requirements', () => {
    expect(EDIT_FILE_SCHEMA.function.description).toContain('MANDATORY: Always read_file first');
    expect(EDIT_FILE_SCHEMA.function.description).toContain('exact text replacement');
  });
});

describe('DELETE_FILE_SCHEMA', () => {
  it('should have correct structure and properties', () => {
    expect(DELETE_FILE_SCHEMA.type).toBe('function');
    expect(DELETE_FILE_SCHEMA.function.name).toBe('delete_file');
    expect(DELETE_FILE_SCHEMA.function.description).toContain('Remove files or directories');
    expect(DELETE_FILE_SCHEMA.function.parameters.required).toEqual(['file_path']);
  });

  it('should have recursive option', () => {
    const props = DELETE_FILE_SCHEMA.function.parameters.properties;
    expect(props.recursive.type).toBe('boolean');
    expect(props.recursive.default).toBe(false);
  });

  it('should include caution warning', () => {
    expect(DELETE_FILE_SCHEMA.function.description).toContain('Use with caution');
  });
});

describe('EXECUTE_COMMAND_SCHEMA', () => {
  it('should have correct structure and properties', () => {
    expect(EXECUTE_COMMAND_SCHEMA.type).toBe('function');
    expect(EXECUTE_COMMAND_SCHEMA.function.name).toBe('execute_command');
    expect(EXECUTE_COMMAND_SCHEMA.function.description).toContain('Run shell commands');
    expect(EXECUTE_COMMAND_SCHEMA.function.parameters.required).toEqual(['command', 'command_type']);
  });

  it('should have command type enumeration', () => {
    const props = EXECUTE_COMMAND_SCHEMA.function.parameters.properties;
    expect(props.command_type.enum).toEqual(['bash', 'python', 'setup', 'run']);
  });

  it('should have timeout constraints', () => {
    const props = EXECUTE_COMMAND_SCHEMA.function.parameters.properties;
    expect(props.timeout.minimum).toBe(1);
    expect(props.timeout.maximum).toBe(300);
  });

  it('should include safety warnings', () => {
    expect(EXECUTE_COMMAND_SCHEMA.function.description).toContain('SAFETY WARNING');
    expect(EXECUTE_COMMAND_SCHEMA.function.description).toContain('NEVER use for commands that run indefinitely');
  });
});

describe('SEARCH_FILES_SCHEMA', () => {
  it('should have correct structure and properties', () => {
    expect(SEARCH_FILES_SCHEMA.type).toBe('function');
    expect(SEARCH_FILES_SCHEMA.function.name).toBe('search_files');
    expect(SEARCH_FILES_SCHEMA.function.description).toContain('Find text patterns');
    expect(SEARCH_FILES_SCHEMA.function.parameters.required).toEqual(['pattern']);
  });

  it('should have pattern type enumeration', () => {
    const props = SEARCH_FILES_SCHEMA.function.parameters.properties;
    expect(props.pattern_type.enum).toEqual(['substring', 'regex', 'exact', 'fuzzy']);
    expect(props.pattern_type.default).toBe('substring');
  });

  it('should have result limits', () => {
    const props = SEARCH_FILES_SCHEMA.function.parameters.properties;
    expect(props.max_results.minimum).toBe(1);
    expect(props.max_results.maximum).toBe(1000);
    expect(props.max_results.default).toBe(100);
  });

  it('should have context line constraints', () => {
    const props = SEARCH_FILES_SCHEMA.function.parameters.properties;
    expect(props.context_lines.minimum).toBe(0);
    expect(props.context_lines.maximum).toBe(10);
    expect(props.context_lines.default).toBe(0);
  });
});

describe('LIST_FILES_SCHEMA', () => {
  it('should have correct structure and properties', () => {
    expect(LIST_FILES_SCHEMA.type).toBe('function');
    expect(LIST_FILES_SCHEMA.function.name).toBe('list_files');
    expect(LIST_FILES_SCHEMA.function.description).toContain('Browse directory contents');
    expect(LIST_FILES_SCHEMA.function.parameters.required).toEqual([]);
  });

  it('should have default values', () => {
    const props = LIST_FILES_SCHEMA.function.parameters.properties;
    expect(props.directory.default).toBe('.');
    expect(props.pattern.default).toBe('*');
    expect(props.recursive.default).toBe(false);
    expect(props.show_hidden.default).toBe(false);
  });

  it('should include file existence check guidance', () => {
    expect(LIST_FILES_SCHEMA.function.description).toContain('CHECK IF FILES EXIST');
    expect(LIST_FILES_SCHEMA.function.description).toContain('create_file vs edit_file');
  });
});

describe('CREATE_TASKS_SCHEMA', () => {
  it('should have correct structure and properties', () => {
    expect(CREATE_TASKS_SCHEMA.type).toBe('function');
    expect(CREATE_TASKS_SCHEMA.function.name).toBe('create_tasks');
    expect(CREATE_TASKS_SCHEMA.function.description).toContain('Break down complex requests');
    expect(CREATE_TASKS_SCHEMA.function.parameters.required).toEqual(['user_query', 'tasks']);
  });

  it('should have task structure definition', () => {
    const props = CREATE_TASKS_SCHEMA.function.parameters.properties;
    const taskItems = props.tasks.items;
    expect(taskItems.properties.id).toEqual({
      type: 'string',
      description: expect.stringContaining('Unique task identifier')
    });
    expect(taskItems.properties.status.enum).toEqual(['pending', 'in_progress', 'completed']);
    expect(taskItems.required).toEqual(['id', 'description']);
  });
});

describe('UPDATE_TASKS_SCHEMA', () => {
  it('should have correct structure and properties', () => {
    expect(UPDATE_TASKS_SCHEMA.type).toBe('function');
    expect(UPDATE_TASKS_SCHEMA.function.name).toBe('update_tasks');
    expect(UPDATE_TASKS_SCHEMA.function.description).toContain('Update task progress');
    expect(UPDATE_TASKS_SCHEMA.function.parameters.required).toEqual(['task_updates']);
  });

  it('should have update structure definition', () => {
    const props = UPDATE_TASKS_SCHEMA.function.parameters.properties;
    const updateItems = props.task_updates.items;
    expect(updateItems.properties.status.enum).toEqual(['pending', 'in_progress', 'completed']);
    expect(updateItems.required).toEqual(['id', 'status']);
  });
});

describe('ALL_TOOL_SCHEMAS', () => {
  it('should contain all defined schemas', () => {
    const expectedSchemas = [
      READ_FILE_SCHEMA,
      CREATE_FILE_SCHEMA,
      EDIT_FILE_SCHEMA,
      DELETE_FILE_SCHEMA,
      SEARCH_FILES_SCHEMA,
      LIST_FILES_SCHEMA,
      CREATE_TASKS_SCHEMA,
      UPDATE_TASKS_SCHEMA,
      EXECUTE_COMMAND_SCHEMA
    ];
    
    expect(ALL_TOOL_SCHEMAS).toHaveLength(expectedSchemas.length);
    expect(ALL_TOOL_SCHEMAS).toEqual(expect.arrayContaining(expectedSchemas));
  });

  it('should have unique tool names', () => {
    const toolNames = ALL_TOOL_SCHEMAS.map(schema => schema.function.name);
    const uniqueNames = [...new Set(toolNames)];
    expect(toolNames).toHaveLength(uniqueNames.length);
  });

  it('should all be function type', () => {
    ALL_TOOL_SCHEMAS.forEach(schema => {
      expect(schema.type).toBe('function');
    });
  });

  it('should all have descriptions and parameters', () => {
    ALL_TOOL_SCHEMAS.forEach(schema => {
      expect(schema.function.name).toBeTruthy();
      expect(schema.function.description).toBeTruthy();
      expect(schema.function.parameters).toBeDefined();
      expect(schema.function.parameters.type).toBe('object');
    });
  });
});

describe('Tool Categories', () => {
  describe('SAFE_TOOLS', () => {
    it('should contain read-only and task management tools', () => {
      expect(SAFE_TOOLS).toEqual([
        'read_file',
        'list_files',
        'search_files',
        'create_tasks',
        'update_tasks'
      ]);
    });

    it('should be a subset of all tools', () => {
      const allToolNames = ALL_TOOL_SCHEMAS.map(schema => schema.function.name);
      SAFE_TOOLS.forEach(toolName => {
        expect(allToolNames).toContain(toolName);
      });
    });
  });

  describe('APPROVAL_REQUIRED_TOOLS', () => {
    it('should contain file modification tools', () => {
      expect(APPROVAL_REQUIRED_TOOLS).toEqual([
        'create_file',
        'edit_file'
      ]);
    });

    it('should be a subset of all tools', () => {
      const allToolNames = ALL_TOOL_SCHEMAS.map(schema => schema.function.name);
      APPROVAL_REQUIRED_TOOLS.forEach(toolName => {
        expect(allToolNames).toContain(toolName);
      });
    });
  });

  describe('DANGEROUS_TOOLS', () => {
    it('should contain destructive and execution tools', () => {
      expect(DANGEROUS_TOOLS).toEqual([
        'delete_file',
        'execute_command'
      ]);
    });

    it('should be a subset of all tools', () => {
      const allToolNames = ALL_TOOL_SCHEMAS.map(schema => schema.function.name);
      DANGEROUS_TOOLS.forEach(toolName => {
        expect(allToolNames).toContain(toolName);
      });
    });
  });

  it('should have no overlap between categories', () => {
    const allCategorized = [...SAFE_TOOLS, ...APPROVAL_REQUIRED_TOOLS, ...DANGEROUS_TOOLS];
    const uniqueCategorized = [...new Set(allCategorized)];
    expect(allCategorized).toHaveLength(uniqueCategorized.length);
  });

  it('should categorize all tools', () => {
    const allToolNames = ALL_TOOL_SCHEMAS.map(schema => schema.function.name);
    const allCategorized = [...SAFE_TOOLS, ...APPROVAL_REQUIRED_TOOLS, ...DANGEROUS_TOOLS];
    
    allToolNames.forEach(toolName => {
      expect(allCategorized).toContain(toolName);
    });
  });
});

describe('Schema Validation', () => {
  it('should have consistent parameter descriptions', () => {
    ALL_TOOL_SCHEMAS.forEach(schema => {
      Object.values(schema.function.parameters.properties).forEach((param: any) => {
        if (param.type === 'string' && param.description) {
          expect(param.description).not.toMatch(/^\s*$/); // Not just whitespace
          expect(param.description.length).toBeGreaterThan(5);
        }
      });
    });
  });

  it('should have path parameters with consistent guidance', () => {
    const pathTools = [READ_FILE_SCHEMA, CREATE_FILE_SCHEMA, EDIT_FILE_SCHEMA, DELETE_FILE_SCHEMA];
    pathTools.forEach(schema => {
      const pathParam = schema.function.parameters.properties.file_path;
      expect(pathParam.description).toContain('DO NOT use absolute paths');
      expect(pathParam.description).toContain('leading slash');
    });
  });

  it('should have directory parameters with consistent guidance', () => {
    const dirTools = [SEARCH_FILES_SCHEMA, LIST_FILES_SCHEMA];
    dirTools.forEach(schema => {
      const dirParam = schema.function.parameters.properties.directory;
      if (dirParam) {
        expect(dirParam.description).toContain('DO NOT include leading slash');
      }
    });
  });
});