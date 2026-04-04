# Schema Drift Detector

[![CI](https://github.com/mustafaautomation/schema-drift-detector/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/schema-drift-detector/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

Detect breaking changes between API schema versions. Compares JSON/OpenAPI schemas, classifies diffs as breaking/non-breaking/warning, and blocks deployment on incompatible changes.

---

## Change Classification

| Change | Example | Severity |
|--------|---------|----------|
| Remove field | Delete a property from response | **Breaking** |
| Change type | `number` → `string` | **Breaking** |
| Change enum values | Remove allowed value | **Breaking** |
| Add required field | New required request field | **Breaking** |
| Add optional field | New optional response field | Non-breaking |
| Change description | Update docs | Non-breaking |
| Rename field | Old name gone, new added | **Breaking** (remove + add) |

---

## Quick Start

```bash
# CLI
npx schema-diff diff old-schema.json new-schema.json

# Library
import { diffSchemas } from 'schema-drift-detector';

const report = diffSchemas(oldSchema, newSchema);
if (!report.compatible) {
  console.log('Breaking changes detected!');
}
```

---

## CI Integration

```yaml
- name: Check schema compatibility
  run: npx schema-diff diff api/v1-schema.json api/v2-schema.json
  # Exits 1 if breaking changes detected
```

---

## Project Structure

```
schema-drift-detector/
├── src/
│   ├── core/
│   │   ├── types.ts       # SchemaDiff, DiffReport types
│   │   └── differ.ts      # Deep comparison with severity classification
│   ├── reporters/
│   │   └── console.ts     # Colored terminal output
│   ├── cli.ts
│   └── index.ts
├── tests/unit/
│   └── differ.test.ts     # 11 tests — all change types + edge cases
└── .github/workflows/ci.yml
```

---

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
