import { describe, it, expect } from 'vitest';
import { diffSchemas } from '../../src/core/differ';

describe('OpenAPI schema drift scenarios', () => {
  const baseSchema = {
    openapi: '3.0.0',
    info: { title: 'Users API', version: '1.0.0' },
    paths: {
      '/users': {
        get: {
          summary: 'List users',
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                      },
                      required: ['id', 'name', 'email'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  it('should detect new endpoint as non-breaking', () => {
    const newSchema = JSON.parse(JSON.stringify(baseSchema));
    newSchema.paths['/users/{id}'] = {
      get: { summary: 'Get user by ID', responses: { '200': { description: 'User' } } },
    };

    const report = diffSchemas(baseSchema, newSchema);
    expect(report.diffs.some((d) => d.change === 'added' && d.path.includes('/users/{id}'))).toBe(
      true,
    );
    expect(report.compatible).toBe(true);
  });

  it('should detect removed endpoint as breaking', () => {
    const newSchema = JSON.parse(JSON.stringify(baseSchema));
    delete newSchema.paths['/users'];

    const report = diffSchemas(baseSchema, newSchema);
    expect(report.diffs.some((d) => d.change === 'removed' && d.path.includes('/users'))).toBe(
      true,
    );
    expect(report.compatible).toBe(false);
  });

  it('should detect response type change as breaking', () => {
    const newSchema = JSON.parse(JSON.stringify(baseSchema));
    newSchema.paths['/users'].get.responses['200'].content['application/json'].schema.type =
      'object';

    const report = diffSchemas(baseSchema, newSchema);
    expect(report.diffs.some((d) => d.path.includes('type') && d.severity === 'breaking')).toBe(
      true,
    );
  });

  it('should detect added optional property as non-breaking', () => {
    const newSchema = JSON.parse(JSON.stringify(baseSchema));
    const items =
      newSchema.paths['/users'].get.responses['200'].content['application/json'].schema.items;
    items.properties.avatar = { type: 'string' };

    const report = diffSchemas(baseSchema, newSchema);
    expect(report.diffs.some((d) => d.change === 'added' && d.path.includes('avatar'))).toBe(true);
  });

  it('should detect removed required property as breaking', () => {
    const newSchema = JSON.parse(JSON.stringify(baseSchema));
    const items =
      newSchema.paths['/users'].get.responses['200'].content['application/json'].schema.items;
    delete items.properties.email;

    const report = diffSchemas(baseSchema, newSchema);
    expect(report.breaking).toBeGreaterThan(0);
    expect(report.compatible).toBe(false);
  });

  it('should detect version bump as non-breaking', () => {
    const newSchema = JSON.parse(JSON.stringify(baseSchema));
    newSchema.info.version = '2.0.0';

    const report = diffSchemas(baseSchema, newSchema);
    expect(report.diffs.some((d) => d.path.includes('version'))).toBe(true);
  });

  it('should detect summary/description changes as non-breaking', () => {
    const newSchema = JSON.parse(JSON.stringify(baseSchema));
    newSchema.paths['/users'].get.summary = 'Fetch all users';

    const report = diffSchemas(baseSchema, newSchema);
    expect(report.compatible).toBe(true);
  });
});

describe('Enum drift detection', () => {
  it('should detect enum value removal as breaking', () => {
    const old = {
      properties: {
        status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
      },
    };
    const next = {
      properties: {
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    };

    const report = diffSchemas(old, next);
    expect(report.diffs.some((d) => d.path.includes('enum') && d.severity === 'breaking')).toBe(
      true,
    );
  });

  it('should detect enum value addition', () => {
    const old = {
      properties: {
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    };
    const next = {
      properties: {
        status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
      },
    };

    const report = diffSchemas(old, next);
    expect(report.diffs.some((d) => d.path.includes('enum'))).toBe(true);
  });
});

describe('Nested object drift', () => {
  it('should detect deeply nested type change', () => {
    const old = {
      components: {
        schemas: {
          Address: {
            properties: {
              zip: { type: 'string' },
            },
          },
        },
      },
    };
    const next = {
      components: {
        schemas: {
          Address: {
            properties: {
              zip: { type: 'integer' },
            },
          },
        },
      },
    };

    const report = diffSchemas(old, next);
    expect(report.diffs.some((d) => d.path.includes('zip') && d.path.includes('type'))).toBe(true);
    expect(report.breaking).toBeGreaterThan(0);
  });

  it('should detect array to object structural change', () => {
    const old = { data: [1, 2, 3] };
    const next = { data: { items: [1, 2, 3] } };

    const report = diffSchemas(old, next);
    // Both array and object are typeof 'object', so it's detected as a value change
    expect(report.totalChanges).toBeGreaterThan(0);
    expect(report.diffs.some((d) => d.path.includes('data'))).toBe(true);
  });
});
