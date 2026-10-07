#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runModel, summariseYears } from '../src/model-solver.js';
import { createBaselineRunPack, applyOverrides } from '../src/run-pack.js';
import { EXOGENOUS_PATH, FIRST_FORECAST_QUARTER, POLICY, VINTAGE, START_QUARTER } from '../src/baseline-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const firstPath = EXOGENOUS_PATH[FIRST_FORECAST_QUARTER];

// CLI flag → [run pack input, parser]. Price and rate flags set a level for
// every forecast quarter; fiscal levers are RM bn per year versus baseline.
const FLAGS = {
    '--brent': ['PBRENT', parseFloat],
    '--crack': ['CRACK', parseFloat],
    '--fx': ['USDMYR', parseFloat],
    '--cpo': ['PCPO', parseFloat],
    '--opr': ['OPR', parseFloat],
    '--ust10': ['UST10', parseFloat],
    '--semi': ['WSTD', parseFloat],
    '--tour': ['WTOUR', parseFloat],
    '--wpg': ['WPG', parseFloat],
    '--equity': ['WEQPR', parseFloat],
    '--sst': ['SSTRATE', parseFloat],
    '--cpoduty': ['CPODRATE', parseFloat],
    '--budi95-price': ['BUDI95PRICE', parseFloat],
    '--budi95-quota': ['BUDI95QUOTA', parseFloat],
    '--petdiv': ['PETDIV', parseFloat],
    '--cash-aid': ['CASHAID', parseFloat],
    '--gov-cons': ['GOVCONS', parseFloat],
    '--dev-exp': ['DEVEXP', parseFloat],
    '--hh-tax': ['HHTAX', parseFloat],
    '--corp-tax': ['CORPTAX', parseFloat],
    '--ind-tax': ['INDTAX', parseFloat],
    '--cpi-adj': ['CPIADJ', parseFloat],
};

function parseArgs(argv) {
    const args = argv.slice(2);
    const opts = {
        runPack: null,
        output: null,
        startQuarter: null,
        length: null,
        annual: false,
        overrides: {},
        epf: null,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg in FLAGS) {
            const [input, parse] = FLAGS[arg];
            const value = parse(args[++i]);
            if (Number.isNaN(value)) throw new Error(`${arg} needs a number`);
            opts.overrides[input] = value;
            continue;
        }
        switch (arg) {
            case '--run-pack': opts.runPack = args[++i]; break;
            case '--output': case '-o': opts.output = args[++i]; break;
            case '--start': opts.startQuarter = args[++i]; break;
            case '--length': case '-n': opts.length = parseInt(args[++i], 10); break;
            case '--annual': opts.annual = true; break;
            case '--epf': opts.epf = parseFloat(args[++i]); break;
            case '--devgr': throw new Error('--devgr was replaced by --dev-exp (RM bn per year versus baseline)');
            case '--elnino': opts.overrides.ELNINO = 1; break;
            case '--no-budi95': opts.overrides.BUDI95 = 0; break;
            case '--help': case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                throw new Error(`Unknown option: ${arg} (see --help)`);
        }
    }
    return opts;
}

function printHelp() {
    console.log(`
MaMaMo Model Solver — Run Malaysia macro scenarios from the command line.
Baseline vintage ${VINTAGE}; forecast starts ${FIRST_FORECAST_QUARTER}. Shocks apply to forecast quarters only.

USAGE:
  node bin/run-model.mjs [options]

OUTPUT:
  --annual             Print calendar-year summary instead of quarterly results
  -o, --output <path>  Write results to file instead of stdout
  --start <YYYYQn>     First quarter to show (simulation always starts ${START_QUARTER})
  -n, --length <N>     Number of quarters to show from --start (default: through 2028Q4)
  --run-pack <path>    JSON run pack (must include a baseline layer)

EXTERNAL (defaults are the ${FIRST_FORECAST_QUARTER} baseline; the baseline path varies by quarter):
  --brent <USD/bbl>    Brent crude (baseline ${firstPath.brent}, easing to 75 by 2028)
  --crack <USD/bbl>    Gasoline refining margin over Brent (baseline ${firstPath.crack}, easing to 20)
  --fx <rate>          USD/MYR (baseline ${firstPath.fx})
  --cpo <RM/tonne>     Crude palm oil price (baseline ${firstPath.cpo})
  --ust10 <%>          US 10-year Treasury yield (baseline ${firstPath.ust10})
  --semi <index>       World semiconductor demand (baseline 100)
  --tour <index>       World tourism demand (baseline 100)
  --wpg <index>        World goods prices (baseline 100)
  --equity <index>     World equity prices (baseline 100)
  --elnino             El Nino from ${FIRST_FORECAST_QUARTER}

MONETARY AND TAX POLICY:
  --opr <%>            BNM Overnight Policy Rate (baseline ${firstPath.opr})
  --sst <%>            Service tax rate (baseline ${POLICY.sstRate})
  --cpoduty <%>        CPO export duty (baseline ${POLICY.cpoDutyRate})
  --no-budi95          Remove the BUDI95 RON95 subsidy
  --budi95-price <RM>  BUDI95 subsidised price (baseline ${POLICY.budi95Price})
  --budi95-quota <L>   BUDI95 monthly quota in litres (baseline 300)
  --petdiv <RM bn>     Petronas dividend per year (baseline 2026: 20, 2027: 25, 2028: 25)

FISCAL LEVERS (RM bn per year versus baseline; positive = more spending or more tax):
  --cash-aid <bn>      Cash transfers to households (STR, SARA)
  --gov-cons <bn>      Government consumption (salaries, supplies)
  --dev-exp <bn>       Development expenditure
  --hh-tax <bn>        Household direct taxes
  --corp-tax <bn>      Corporate taxes
  --ind-tax <bn>       Other indirect taxes
  --cpi-adj <%>        Direct CPI level effect of administered prices
  --epf <bn>           One-off EPF special withdrawal paid in ${FIRST_FORECAST_QUARTER}

EXAMPLES:
  node bin/run-model.mjs --annual
  node bin/run-model.mjs --brent 120 --crack 70 --annual
  node bin/run-model.mjs --no-budi95 --cash-aid 8 --annual
  node bin/run-model.mjs --semi 85 --start 2027Q1 -n 4
`);
}

function main() {
    let opts;
    try {
        opts = parseArgs(process.argv);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }

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

    try {
        applyOverrides(runPack, opts.overrides);
        if (opts.epf !== null) applyOverrides(runPack, { EPFWDRAW: { [FIRST_FORECAST_QUARTER]: opts.epf } });

        const results = runModel(runPack);
        let output;
        if (opts.annual) {
            output = summariseYears(results, runPack);
        } else {
            const start = opts.startQuarter ?? runPack.quarters[0];
            if (!runPack.quarters.includes(start)) {
                throw new Error(`--start ${start} is outside the simulated range ${runPack.quarters[0]}-${runPack.quarters.at(-1)}`);
            }
            const shown = results.filter(r => r.quarter >= start);
            output = opts.length ? shown.slice(0, opts.length) : shown;
            // Drop internal state and quarterly fiscal flows from CLI output
            output = output.map(r => Object.fromEntries(
                Object.entries(r).filter(([k]) => !/^[A-Z_]+$/.test(k) && k !== 'fq' && k !== 'fqRef')));
        }
        const text = JSON.stringify(output, null, 2);

        if (opts.output) {
            const outPath = resolve(rootDir, opts.output);
            writeFileSync(outPath, text);
            console.log(`Results written to ${outPath}`);
        } else {
            console.log(text);
        }
    } catch (err) {
        console.error(`Model run failed: ${err.message}`);
        process.exit(1);
    }
}

main();
