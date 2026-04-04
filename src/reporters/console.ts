import { DiffReport } from '../core/types';

const R = '\x1b[0m',
  B = '\x1b[1m',
  D = '\x1b[2m';
const RED = '\x1b[31m',
  GRN = '\x1b[32m',
  YEL = '\x1b[33m',
  CYN = '\x1b[36m';

const SEV = { breaking: RED, 'non-breaking': GRN, warning: YEL };
const ICONS = { added: '+', removed: '-', changed: '~', type_changed: '!' };

export function printReport(report: DiffReport): void {
  console.log();
  console.log(`${B}${CYN}Schema Drift Report${R}`);
  console.log();

  const status = report.compatible ? `${GRN}COMPATIBLE` : `${RED}BREAKING CHANGES`;
  console.log(`  ${B}Status:${R} ${status}${R}`);
  console.log(
    `  Changes: ${report.totalChanges} total — ${RED}${report.breaking} breaking${R}, ${GRN}${report.nonBreaking} non-breaking${R}, ${YEL}${report.warnings} warnings${R}`,
  );
  console.log();

  for (const diff of report.diffs) {
    const color = SEV[diff.severity];
    const icon = ICONS[diff.change];
    console.log(`  ${color}[${icon}]${R} ${B}${diff.path}${R} ${D}(${diff.severity})${R}`);
    console.log(`      ${diff.message}`);
    if (diff.oldValue !== undefined)
      console.log(`      ${D}old: ${JSON.stringify(diff.oldValue)}${R}`);
    if (diff.newValue !== undefined)
      console.log(`      ${D}new: ${JSON.stringify(diff.newValue)}${R}`);
  }
  console.log();
}
