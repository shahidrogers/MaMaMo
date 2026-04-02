#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBaselineRunPack } from '../studies/playground/baseline-run-pack.js';
import { runModel } from '../src/model-solver.js';
import { quarterRange } from '../src/model-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function parseArgs(argv) {
    const args = argv.slice(2);
    const opts = {
        runPack: null,
        output: null,
        startQuarter: null,
        length: 8,
        brent: null,
        cpo: null,
        opr: null,
        fx: null,
        semi: null,
        tour: null,
        devgr: null,
        wpg: null,
        equity: null,
        ust10: null,
        sst: null,
        cpoduty: null,
        epf: null,
        elnino: false,
        budi95: true,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--run-pack': opts.runPack = args[++i]; break;
            case '--output': case '-o': opts.output = args[++i]; break;
            case '--start': opts.startQuarter = args[++i]; break;
            case '--length': case '-n': opts.length = parseInt(args[++i], 10); break;
            case '--brent': opts.brent = parseFloat(args[++i]); break;
            case '--cpo': opts.cpo = parseFloat(args[++i]); break;
            case '--opr': opts.opr = parseFloat(args[++i]); break;
            case '--fx': opts.fx = parseFloat(args[++i]); break;
            case '--semi': opts.semi = parseFloat(args[++i]); break;
            case '--tour': opts.tour = parseFloat(args[++i]); break;
            case '--devgr': opts.devgr = parseFloat(args[++i]); break;
            case '--wpg': opts.wpg = parseFloat(args[++i]); break;
            case '--equity': opts.equity = parseFloat(args[++i]); break;
            case '--ust10': opts.ust10 = parseFloat(args[++i]); break;
            case '--sst': opts.sst = parseFloat(args[++i]); break;
            case '--cpoduty': opts.cpoduty = parseFloat(args[++i]); break;
            case '--epf': opts.epf = parseFloat(args[++i]); break;
            case '--elnino': opts.elnino = true; break;
            case '--no-budi95': opts.budi95 = false; break;
            case '--help': case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                console.error(`Unknown option: ${args[i]}`);
                process.exit(1);
        }
    }
    return opts;
}

function printHelp() {
    console.log(`
MaMaMo Model Solver — Run Malaysia macro scenarios from the command line.

USAGE:
  node bin/run-model.mjs [options]

OPTIONS:
  --run-pack <path>    Path to a JSON run pack file (overrides baseline)
  -o, --output <path>  Write results to file instead of stdout
  --start <YYYYQn>     Start quarter (default: 2026Q2)
  -n, --length <N>     Number of quarters to simulate (default: 8)

  Scenario inputs:
  --brent <price>      Brent crude oil price USD/bbl (default: 82)
  --cpo <price>        CPO price RM/tonne (default: 4000)
  --semi <index>       World semiconductor demand index (default: 100)
  --tour <index>       World tourism demand index (default: 100)
  --wpg <index>        World goods price index (default: 100)
  --equity <index>     World equity price index (default: 100)
  --ust10 <rate>       US 10-year Treasury yield % (default: 4.25)
  --elnino             Enable El Nino shock

  Policy inputs:
  --opr <rate>         BNM Overnight Policy Rate % (default: 3.0)
  --fx <rate>          USD/MYR exchange rate (default: 3.89)
  --devgr <rate>       Development expenditure growth % (default: 2.0)
  --sst <rate>         SST rate % (default: 6)
  --cpoduty <rate>     CPO export duty rate % (default: 8)
  --epf <bln>          EPF withdrawal RM billion (default: 0)
  --no-budi95          Disable BUDI95 fuel subsidy scheme

EXAMPLES:
  # Baseline run
  node bin/run-model.mjs

  # Oil shock scenario
  node bin/run-model.mjs --brent 150 --fx 4.20

  # Iran war scenario
  node bin/run-model.mjs --brent 200 --fx 4.50 --opr 4.0 --elnino

  # Save to file
  node bin/run-model.mjs --brent 150 -o results/oil-shock.json
`);
}

function applyShocksToRunPack(runPack, opts) {
    const { quarters, scenario, policy } = runPack;

    const shockMap = {
        brent: { layer: scenario, key: 'PBRENT' },
        cpo: { layer: scenario, key: 'PCPO' },
        semi: { layer: scenario, key: 'WSTD' },
        tour: { layer: scenario, key: 'WTOUR' },
        wpg: { layer: scenario, key: 'WPG' },
        equity: { layer: scenario, key: 'WEQPR' },
        ust10: { layer: scenario, key: 'UST10' },
        elnino: { layer: scenario, key: 'ELNINO' },
        opr: { layer: policy, key: 'OPR' },
        fx: { layer: scenario, key: 'USDMYR' },
        devgr: { layer: policy, key: 'DEVGR' },
        sst: { layer: policy, key: 'SSTRATE' },
        cpoduty: { layer: policy, key: 'CPODRATE' },
        epf: { layer: policy, key: 'EPFWDRAW' },
        budi95: { layer: policy, key: 'BUDI95' },
    };

    for (const [optName, { layer, key }] of Object.entries(shockMap)) {
        if (opts[optName] !== undefined && opts[optName] !== null) {
            let value = opts[optName];
            if (key === 'DEVGR') value = value / 100;
            if (key === 'SSTRATE') value = value / 100;
            if (key === 'CPODRATE') value = value / 100;
            if (key === 'EPFWDRAW') value = value * 1000;
            if (key === 'ELNINO') value = value ? 1 : 0;
            if (key === 'BUDI95') value = value ? 1 : 0;
            if (key === 'USDMYR') {
                // Also update REER when FX changes
                policy.REER = Object.fromEntries(quarters.map(q => [q, 100 * (3.89 / value)]));
            }
            layer[key] = Object.fromEntries(quarters.map(q => [q, value]));
        }
    }

    return runPack;
}

function main() {
    const opts = parseArgs(process.argv);

    let runPack;
    if (opts.runPack) {
        const path = resolve(rootDir, opts.runPack);
        if (!existsSync(path)) {
            console.error(`Run pack not found: ${path}`);
            process.exit(1);
        }
        runPack = JSON.parse(readFileSync(path, 'utf8'));
    } else {
        runPack = createBaselineRunPack();
    }

    if (opts.startQuarter) {
        runPack.quarters = quarterRange(opts.startQuarter, opts.length);
    }

    runPack = applyShocksToRunPack(runPack, opts);

    try {
        const results = runModel(runPack);
        const output = JSON.stringify(results, null, 2);

        if (opts.output) {
            const outPath = resolve(rootDir, opts.output);
            writeFileSync(outPath, output);
            console.log(`Results written to ${outPath}`);
        } else {
            console.log(output);
        }
    } catch (err) {
        console.error(`Model run failed: ${err.message}`);
        process.exit(1);
    }
}

main();
