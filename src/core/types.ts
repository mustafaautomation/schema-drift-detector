export type ChangeType = 'added' | 'removed' | 'changed' | 'type_changed';
export type Severity = 'breaking' | 'non-breaking' | 'warning';

export interface SchemaDiff {
  path: string;
  change: ChangeType;
  severity: Severity;
  oldValue?: unknown;
  newValue?: unknown;
  message: string;
}

export interface DiffReport {
  timestamp: string;
  totalChanges: number;
  breaking: number;
  nonBreaking: number;
  warnings: number;
  diffs: SchemaDiff[];
  compatible: boolean;
}
