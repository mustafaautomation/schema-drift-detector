import { SchemaDiff, Severity, DiffReport } from './types';

export function diffSchemas(
  oldSchema: Record<string, unknown>,
  newSchema: Record<string, unknown>,
): DiffReport {
  const diffs: SchemaDiff[] = [];
  compareObjects(oldSchema, newSchema, '', diffs);

  return {
    timestamp: new Date().toISOString(),
    totalChanges: diffs.length,
    breaking: diffs.filter((d) => d.severity === 'breaking').length,
    nonBreaking: diffs.filter((d) => d.severity === 'non-breaking').length,
    warnings: diffs.filter((d) => d.severity === 'warning').length,
    diffs,
    compatible: diffs.filter((d) => d.severity === 'breaking').length === 0,
  };
}

function compareObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  basePath: string,
  diffs: SchemaDiff[],
): void {
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const path = basePath ? `${basePath}.${key}` : key;
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Removed field
    if (oldVal !== undefined && newVal === undefined) {
      const severity = classifyRemoval(path, oldVal);
      diffs.push({
        path,
        change: 'removed',
        severity,
        oldValue: oldVal,
        message: `Field "${path}" was removed`,
      });
      continue;
    }

    // Added field
    if (oldVal === undefined && newVal !== undefined) {
      const severity = classifyAddition(path, newVal);
      diffs.push({
        path,
        change: 'added',
        severity,
        newValue: newVal,
        message: `Field "${path}" was added`,
      });
      continue;
    }

    // Type changed
    if (typeof oldVal !== typeof newVal) {
      diffs.push({
        path,
        change: 'type_changed',
        severity: 'breaking',
        oldValue: typeof oldVal,
        newValue: typeof newVal,
        message: `Field "${path}" type changed from ${typeof oldVal} to ${typeof newVal}`,
      });
      continue;
    }

    // Both objects — recurse
    if (
      typeof oldVal === 'object' &&
      oldVal !== null &&
      typeof newVal === 'object' &&
      newVal !== null &&
      !Array.isArray(oldVal) &&
      !Array.isArray(newVal)
    ) {
      compareObjects(
        oldVal as Record<string, unknown>,
        newVal as Record<string, unknown>,
        path,
        diffs,
      );
      continue;
    }

    // Value changed
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      const severity = classifyChange(path, oldVal, newVal);
      diffs.push({
        path,
        change: 'changed',
        severity,
        oldValue: oldVal,
        newValue: newVal,
        message: `Field "${path}" value changed`,
      });
    }
  }
}

function classifyRemoval(path: string, _value: unknown): Severity {
  // Removing required fields or endpoints is breaking
  if (path.includes('required') || path.match(/^paths\./)) return 'breaking';
  if (path.includes('properties')) return 'breaking';
  return 'warning';
}

function classifyAddition(path: string, value: unknown): Severity {
  // Adding to required array is breaking (consumers must now provide it)
  if (path.includes('required') && Array.isArray(value)) return 'breaking';
  // Adding new optional fields is non-breaking
  return 'non-breaking';
}

function classifyChange(path: string, _oldVal: unknown, _newVal: unknown): Severity {
  // Changing types, required status, or enum values is breaking
  if (path.includes('type') || path.includes('required')) return 'breaking';
  if (path.includes('enum')) return 'breaking';
  // Changing descriptions, examples is non-breaking
  if (path.includes('description') || path.includes('example')) return 'non-breaking';
  return 'warning';
}
