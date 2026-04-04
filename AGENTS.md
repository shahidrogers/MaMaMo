# AGENTS.md — MaMaMo Development Guide

## Project Overview

MaMaMo (Malaysia Macro Model) is a structural quarterly macroeconomic model for Malaysia. Pure JavaScript, zero dependencies, Node.js 18+.

## Commands

### Running the Model

```bash
node bin/run-model.mjs                          # Baseline scenario
node bin/run-model.mjs --brent 150 --fx 4.20    # Custom scenario
node bin/run-model.mjs --help                   # All options
```

### Data & Validation

```bash
node bin/fetch-opendosm.mjs                     # Fetch latest DOSM data
node bin/build-inputs.mjs                       # Build input packs
node scripts/validate_model_inputs.mjs --schema docs/model_input_schema.json  # Validate
```

### Local Development

```bash
npx serve .                                     # Serve playground locally
```

### Testing

No test framework is configured. Validate changes by:
1. Running `node scripts/validate_model_inputs.mjs` for input changes
2. Running `node bin/run-model.mjs` and verifying JSON output is sensible
3. Opening `studies/playground/index.html` to check interactive UI

### CI

GitHub Actions runs `validate_model_inputs.mjs` on push/PR when input files change.

## Code Style

### Language & Modules

- **Plain JavaScript** — no TypeScript, no build step
- **ES Modules only** — use `import`/`export`, never `require()`
- CLI entry points use `.mjs` extension; library code uses `.js`

### Formatting

- **4-space indentation** (no tabs)
- **Semicolons** required at statement ends
- **Single quotes** for strings
- **Trailing commas** in multi-line objects/arrays

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Constants | UPPER_SNAKE_CASE | `DEFAULTS`, `PARAMS` |
| Variables/functions | camelCase | `runModel`, `parseQuarter` |
| Classes | PascalCase | `StructuralModelEngine` |
| Model variables | UPPERCASE (economics convention) | `GDP`, `CPI`, `OPR` |
| Files | kebab-case | `model-solver.js`, `fetch-opendosm.mjs` |

### Imports

```javascript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runModel } from '../src/model-solver.js';
```

- Group `node:` builtins first, then local imports
- Always include file extensions in relative imports

### Functions

- Prefer `function` declarations for named functions
- Use arrow functions for callbacks and short expressions
- Export public APIs; keep helpers internal (not exported)

```javascript
export function runModel(runPack, options = {}) {
    // implementation
}

function r1(v) { return Math.round(v * 10) / 10; }  // internal helper
```

### Error Handling

- Throw `Error` with descriptive messages for invalid state
- Use try/catch with fallbacks for optional data access
- Validate inputs early and fail fast

```javascript
if (!match) throw new Error(`Invalid quarter: ${quarter}`);
try { return lagFn(name, periods); }
catch { return fallback; }
```

### Rounding Helpers

Use the existing rounding functions for model outputs:
- `r1(v)` — 1 decimal place
- `r2(v)` — 2 decimal places  
- `r3(v)` — 3 decimal places

## Architecture

```
bin/              — CLI entry points (.mjs)
src/              — Core library (.js)
  model-engine.js   — Quarter iteration, state management, lag utilities
  model-solver.js   — 17-block equation implementations
model/            — Model documentation (EViews-style equations)
docs/             — User-facing documentation
studies/          — Interactive HTML/JSON scenario dashboards
scripts/          — Utility scripts (validation)
```

## Key Patterns

- **Run Pack**: Object with `quarters`, `historical`, `scenario`, `policy`, `demographic`, `calibration`, `preprocess` layers
- **Engine**: `StructuralModelEngine` iterates quarters, calling a step function with `getInput`, `lag`, `prevQuarter`
- **Input layering**: scenario → policy → demographic → calibration → preprocess (first match wins)

## Contributing

- Cite sources (BNM, IMF, DOSM) for equation changes
- Ensure variables are defined in the model glossary
- Run validation before opening PRs
- New scenarios go in `studies/simulations/` with `index.html` + `scenario-data.json`