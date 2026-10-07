#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBaselineRunPack, applyOverrides, INPUTS } from '../src/run-pack.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function parseArgs(argv) {
    const args = argv.slice(2);
    const opts = {
        scenario: null,
        output: 'data/run-packs/baseline.json',
        endQuarter: undefined,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--scenario': opts.scenario = args[++i]; break;
            case '--output': case '-o': opts.output = args[++i]; break;
            case '--end': opts.endQuarter = args[++i]; break;
            case '--help': case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                console.error(`Unknown option: ${args[i]} (see --help)`);
                process.exit(1);
        }
    }
    return opts;
}

function printHelp() {
    console.log(`
MaMaMo Run Pack Builder — write the baseline run pack (optionally with a scenario) to JSON.

The baseline itself is defined in src/baseline-data.js. Refresh the data there
(node bin/fetch-opendosm.mjs pulls the latest OpenDOSM releases) and rebuild.

USAGE:
  node bin/build-inputs.mjs [options]

OPTIONS:
  --scenario <path>      JSON of overrides: { "INPUT": value | { "YYYYQn": value } }
  --end <YYYYQn>         Last quarter to include (default: 2028Q4)
  -o, --output <path>    Output path (default: data/run-packs/baseline.json)

SCENARIO INPUTS:
${Object.entries(INPUTS).map(([k, v]) => `  ${k.padEnd(12)} ${v}`).join('\n')}

EXAMPLE:
  echo '{"PBRENT": 120, "CASHAID": 5}' > oil.json
  node bin/build-inputs.mjs --scenario oil.json -o data/run-packs/oil.json
  node bin/run-model.mjs --run-pack data/run-packs/oil.json --annual
`);
}

function main() {
    const opts = parseArgs(process.argv);
    const runPack = createBaselineRunPack({ endQuarter: opts.endQuarter });

    if (opts.scenario) {
        const path = resolve(rootDir, opts.scenario);
        if (!existsSync(path)) {
            console.error(`Scenario file not found: ${path}`);
            process.exit(1);
        }
        applyOverrides(runPack, JSON.parse(readFileSync(path, 'utf8')));
    }

    const outPath = resolve(rootDir, opts.output);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(runPack, null, 2));
    console.log(`Run pack written to ${outPath}`);
    console.log(`  Vintage: ${runPack.meta.vintage}`);
    console.log(`  Quarters: ${runPack.quarters[0]}-${runPack.quarters.at(-1)} (forecast from ${runPack.meta.firstForecastQuarter})`);
    console.log(`  Scenario overrides: ${Object.keys(runPack.scenario).join(', ') || 'none'}`);
}

main();
