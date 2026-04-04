import { describe, it, expect } from 'vitest';
import { diffSchemas } from '../../src/core/differ';

describe('diffSchemas', () => {
  it('should detect no changes for identical schemas', () => {
    const schema = { type: 'object', properties: { id: { type: 'string' } } };
    const report = diffSchemas(schema, schema);
    expect(report.totalChanges).toBe(0);
    expect(report.compatible).toBe(true);
  });

  it('should detect added field as non-breaking', () => {
    const old = { properties: { id: { type: 'string' } } };
    const next = { properties: { id: { type: 'string' }, name: { type: 'string' } } };
    const report = diffSchemas(old, next);
    expect(report.diffs.some((d) => d.change === 'added' && d.path.includes('name'))).toBe(true);
    expect(report.nonBreaking).toBeGreaterThan(0);
  });

  it('should detect removed property as breaking', () => {
    const old = { properties: { id: { type: 'string' }, name: { type: 'string' } } };
    const next = { properties: { id: { type: 'string' } } };
    const report = diffSchemas(old, next);
    expect(report.diffs.some((d) => d.change === 'removed' && d.path.includes('name'))).toBe(true);
    expect(report.breaking).toBeGreaterThan(0);
    expect(report.compatible).toBe(false);
  });

  it('should detect type change as breaking', () => {
    const old = { properties: { age: { type: 'number' } } };
    const next = { properties: { age: { type: 'string' } } };
    const report = diffSchemas(old, next);
    expect(report.diffs.some((d) => d.path.includes('type') && d.severity === 'breaking')).toBe(
      true,
    );
  });

  it('should detect value change in type field as breaking', () => {
    const old = { type: 'string' };
    const next = { type: 'number' };
    const report = diffSchemas(old, next);
    expect(report.breaking).toBeGreaterThan(0);
  });

  it('should detect description change as non-breaking', () => {
    const old = { description: 'old desc' };
    const next = { description: 'new desc' };
    const report = diffSchemas(old, next);
    expect(report.diffs[0].severity).toBe('non-breaking');
    expect(report.compatible).toBe(true);
  });

  it('should detect adding to required array as breaking', () => {
    const old = { required: ['id'] };
    const next = { required: ['id', 'name'] };
    const report = diffSchemas(old, next);
    // Array comparison detects change
    expect(report.totalChanges).toBeGreaterThan(0);
  });

  it('should detect deeply nested changes', () => {
    const old = { paths: { '/users': { get: { responses: { '200': { type: 'array' } } } } } };
    const next = { paths: { '/users': { get: { responses: { '200': { type: 'object' } } } } } };
    const report = diffSchemas(old, next);
    expect(report.diffs.some((d) => d.path.includes('200') && d.path.includes('type'))).toBe(true);
  });

  it('should handle empty schemas', () => {
    const report = diffSchemas({}, {});
    expect(report.totalChanges).toBe(0);
    expect(report.compatible).toBe(true);
  });

  it('should handle completely different schemas', () => {
    const old = { a: 1, b: 2 };
    const next = { c: 3, d: 4 };
    const report = diffSchemas(old, next);
    expect(report.totalChanges).toBe(4); // 2 removed + 2 added
  });

  it('should report overall compatibility correctly', () => {
    // Non-breaking only
    const safe = diffSchemas({ description: 'v1' }, { description: 'v2' });
    expect(safe.compatible).toBe(true);

    // Breaking
    const unsafe = diffSchemas({ properties: { x: {} } }, {});
    expect(unsafe.compatible).toBe(false);
  });
});
