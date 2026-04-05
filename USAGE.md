## Real-World Use Cases

### 1. API Version Gate
```bash
npx schema-diff diff api/v1.json api/v2.json
# Exit 1 if breaking changes detected — blocks deploy
```

### 2. PR Review
Run on every PR that modifies API schemas to catch breaking changes before merge.
