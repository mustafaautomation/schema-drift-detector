#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import { diffSchemas } from './core/differ';
import { printReport } from './reporters/console';

const program = new Command();
program
  .name('schema-diff')
  .description('Detect breaking changes between schema versions')
  .version('1.0.0');

program
  .command('diff')
  .description('Compare two schema files')
  .argument('<old>', 'Old schema (JSON file)')
  .argument('<new>', 'New schema (JSON file)')
  .option('--json', 'Output as JSON')
  .action((oldFile: string, newFile: string, options) => {
    if (!fs.existsSync(oldFile)) {
      console.error(`Not found: ${oldFile}`);
      process.exit(1);
    }
    if (!fs.existsSync(newFile)) {
      console.error(`Not found: ${newFile}`);
      process.exit(1);
    }

    const oldSchema = JSON.parse(fs.readFileSync(oldFile, 'utf-8'));
    const newSchema = JSON.parse(fs.readFileSync(newFile, 'utf-8'));
    const report = diffSchemas(oldSchema, newSchema);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }

    if (!report.compatible) process.exit(1);
  });

program.parse();
