import { describe, it, expect, vi } from 'vitest';
import { printReport } from '../../src/reporters/console';
import { DiffReport } from '../../src/core/types';

describe('Console reporter', () => {
  it('should print compatible report', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const report: DiffReport = {
      timestamp: '2026-04-06T10:00:00Z',
      totalChanges: 1,
      breaking: 0,
      nonBreaking: 1,
      warnings: 0,
      diffs: [
        {
          path: 'info.description',
          change: 'changed',
          severity: 'non-breaking',
          oldValue: 'v1',
          newValue: 'v2',
          message: 'Field "info.description" value changed',
        },
      ],
      compatible: true,
    };

    printReport(report);

    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('Schema Drift Report');
    expect(output).toContain('COMPATIBLE');
    expect(output).toContain('1 total');
    expect(output).toContain('0 breaking');
    expect(output).toContain('info.description');

    spy.mockRestore();
  });

  it('should print breaking changes report', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const report: DiffReport = {
      timestamp: '2026-04-06T10:00:00Z',
      totalChanges: 2,
      breaking: 1,
      nonBreaking: 1,
      warnings: 0,
      diffs: [
        {
          path: 'paths./users.get.responses.200.type',
          change: 'changed',
          severity: 'breaking',
          oldValue: 'array',
          newValue: 'object',
          message: 'Response type changed',
        },
        {
          path: 'info.version',
          change: 'changed',
          severity: 'non-breaking',
          oldValue: '1.0.0',
          newValue: '2.0.0',
          message: 'Version updated',
        },
      ],
      compatible: false,
    };

    printReport(report);

    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('BREAKING');
    expect(output).toContain('1 breaking');
    expect(output).toContain('paths./users');
    expect(output).toContain('"array"');
    expect(output).toContain('"object"');

    spy.mockRestore();
  });

  it('should handle empty report', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const report: DiffReport = {
      timestamp: '2026-04-06T10:00:00Z',
      totalChanges: 0,
      breaking: 0,
      nonBreaking: 0,
      warnings: 0,
      diffs: [],
      compatible: true,
    };

    printReport(report);

    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('COMPATIBLE');
    expect(output).toContain('0 total');

    spy.mockRestore();
  });

  it('should show all change icons', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const report: DiffReport = {
      timestamp: '',
      totalChanges: 4,
      breaking: 2,
      nonBreaking: 1,
      warnings: 1,
      diffs: [
        { path: 'a', change: 'added', severity: 'non-breaking', newValue: 'x', message: 'Added' },
        { path: 'b', change: 'removed', severity: 'breaking', oldValue: 'y', message: 'Removed' },
        {
          path: 'c',
          change: 'changed',
          severity: 'warning',
          oldValue: 1,
          newValue: 2,
          message: 'Changed',
        },
        {
          path: 'd',
          change: 'type_changed',
          severity: 'breaking',
          oldValue: 'string',
          newValue: 'number',
          message: 'Type changed',
        },
      ],
      compatible: false,
    };

    printReport(report);

    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('[+]'); // added
    expect(output).toContain('[-]'); // removed
    expect(output).toContain('[~]'); // changed
    expect(output).toContain('[!]'); // type_changed

    spy.mockRestore();
  });
});
