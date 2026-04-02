#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function parseArgs(argv) {
    const args = argv.slice(2);
    const opts = {
        historical: null,
        scenario: null,
        raw: 'data/raw',
        output: 'data/run-packs/baseline.json',
        startQuarter: '2026Q2',
        length: 8,
        config: null,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--historical': opts.historical = args[++i]; break;
            case '--scenario': opts.scenario = args[++i]; break;
            case '--raw': opts.raw = args[++i]; break;
            case '--output': case '-o': opts.output = args[++i]; break;
            case '--start': opts.startQuarter = args[++i]; break;
            case '--length': case '-n': opts.length = parseInt(args[++i], 10); break;
            case '--config': opts.config = args[++i]; break;
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
MaMaMo Input Pack Builder — Assemble a run pack from data sources.

USAGE:
  node bin/build-inputs.mjs [options]

OPTIONS:
  --historical <path>    Path to historical data (CSV or JSON)
  --scenario <path>      Path to scenario overrides (CSV or JSON)
  --raw <dir>            Directory with raw OpenDOSM data (default: data/raw)
  -o, --output <path>    Output run pack path (default: data/run-packs/baseline.json)
  --start <YYYYQn>       Scenario start quarter (default: 2026Q2)
  -n, --length <N>       Number of scenario quarters (default: 8)
  --config <path>        Run config JSON (optional metadata)

EXAMPLES:
  # Build from raw OpenDOSM data only (uses built-in defaults for missing series)
  node bin/build-inputs.mjs

  # Build with historical CSV
  node bin/build-inputs.mjs --historical historical_inputs.csv

  # Build with scenario overrides
  node bin/build-inputs.mjs --scenario oil_shock_scenario.json
`);
}

function parseQuarter(quarter) {
    const match = /^(\d{4})Q([1-4])$/.exec(quarter);
    if (!match) throw new Error(`Invalid quarter: ${quarter}`);
    return { year: Number(match[1]), quarter: Number(match[2]) };
}

function nextQuarter(quarter) {
    const { year, quarter: q } = parseQuarter(quarter);
    return q === 4 ? `${year + 1}Q1` : `${year}Q${q + 1}`;
}

function quarterRange(startQuarter, length) {
    const out = [startQuarter];
    while (out.length < length) out.push(nextQuarter(out[out.length - 1]));
    return out;
}

function constantSeries(quarters, value) {
    return Object.fromEntries(quarters.map(q => [q, value]));
}

function loadJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function loadCsv(path) {
    const text = readFileSync(path, 'utf8').trim();
    const lines = text.split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim());

    const quarterIdx = headers.indexOf('quarter');
    const seriesIdx = headers.indexOf('series');
    const valueIdx = headers.indexOf('value');

    if (quarterIdx === -1 || seriesIdx === -1 || valueIdx === -1) {
        throw new Error(`CSV must have columns: quarter, series, value. Found: ${headers.join(', ')}`);
    }

    const data = {};
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const quarter = values[quarterIdx];
        const series = values[seriesIdx];
        const value = Number(values[valueIdx]);

        if (!data[series]) data[series] = {};
        data[series][quarter] = value;
    }
    return data;
}

function loadDataFile(path) {
    if (!existsSync(path)) return null;
    const ext = extname(path).toLowerCase();
    if (ext === '.json') return loadJson(path);
    if (ext === '.csv') return loadCsv(path);
    throw new Error(`Unsupported file format: ${ext}. Use .json or .csv`);
}

function loadRawData(rawDir) {
    const rawData = {};
    const files = ['gdp.json', 'cpi.json', 'labour.json', 'trade.json'];

    for (const file of files) {
        const path = resolve(rootDir, rawDir, file);
        if (existsSync(path)) {
            const data = loadJson(path);
            Object.assign(rawData, data);
        }
    }
    return rawData;
}

function getFromSources(seriesName, historicalData, scenarioData, rawData) {
    if (historicalData && historicalData[seriesName]) return historicalData[seriesName];
    if (rawData && rawData[seriesName]) return rawData[seriesName];
    if (scenarioData && scenarioData[seriesName]) return scenarioData[seriesName];
    return null;
}

function buildRunPack(opts) {
    const quarters = quarterRange(opts.startQuarter, opts.length);
    const scenarioQuarters = quarters;

    const historicalData = opts.historical ? loadDataFile(opts.historical) : null;
    const scenarioData = opts.scenario ? loadDataFile(opts.scenario) : null;
    const rawData = loadRawData(opts.raw);

    // Historical layer — last 4 quarters before scenario start
    const histQuarters = [];
    let q = opts.startQuarter;
    for (let i = 0; i < 4; i++) {
        q = prevQuarter(q);
        histQuarters.unshift(q);
    }

    // Build historical layer
    const historical = {};
    const histSeries = [
        'PCONS', 'RHHDI', 'NFWPE', 'CREDIT', 'CREDIT_LEVEL', 'PCPI_INDEX',
        'PRP', 'XEE_LEVEL', 'XS_LEVEL', 'CIPD', 'DIPD', 'PETDIV', 'PETPROF',
        'MGS10', 'PSAVEI_INDEX', 'PMSGVA_INDEX', 'EMS_LEVEL', 'EFOR_LEVEL',
        'MSGVA_LEVEL', 'NEER_INDEX', 'REMITOUT', 'REMITIN', 'GOVTRAN',
        'PADMIN_INDEX', 'PMNOG_INDEX', 'PPI_INDEX', 'CPIX_INDEX', 'CPI_INDEX',
        'WPG_LEVEL', 'GOVWS', 'GOVSUP', 'GOVSUB_BASE', 'GOVDSC', 'GOVGRANT',
        'GOVPEN', 'GOVOTR', 'GOVDEVPS', 'GOVDEBT', 'AVGBR', 'TYIND', 'FYCORP',
        'TRPGT', 'TSTAMP', 'TEXCISE', 'TIMPORT', 'GOVINVI', 'GOVFEES', 'GOVOREV',
        'BSHTRF', 'GCEPS', 'GCE_REAL', 'GDPM_LEVEL', 'DINV', 'GDPMPS', 'PGDP_INDEX',
    ];

    for (const seriesName of histSeries) {
        const source = getFromSources(seriesName, historicalData, scenarioData, rawData);
        if (source) {
            historical[seriesName] = {};
            for (const quarter of histQuarters) {
                if (source[quarter] !== undefined) {
                    historical[seriesName][quarter] = source[quarter];
                }
            }
        }
    }

    // Use built-in defaults for any missing historical data
    const defaults = createDefaultHistorical(histQuarters);
    for (const [seriesName, values] of Object.entries(defaults)) {
        if (!historical[seriesName]) {
            historical[seriesName] = values;
        } else {
            for (const [quarter, value] of Object.entries(values)) {
                if (historical[seriesName][quarter] === undefined) {
                    historical[seriesName][quarter] = value;
                }
            }
        }
    }

    // Scenario layer — exogenous inputs
    const scenario = {
        PBRENT: constantSeries(scenarioQuarters, 82),
        PCPO: constantSeries(scenarioQuarters, 4000),
        WEQPR: constantSeries(scenarioQuarters, 100),
        WSTD: constantSeries(scenarioQuarters, 100),
        WTOUR: constantSeries(scenarioQuarters, 100),
        WPG: constantSeries(scenarioQuarters, 100),
        WCPI: constantSeries(scenarioQuarters, 100),
        UST10: constantSeries(scenarioQuarters, 4.25),
        ELNINO: constantSeries(scenarioQuarters, 0),
        USDMYR: constantSeries(scenarioQuarters, 3.89),
    };

    // Apply scenario overrides
    if (scenarioData) {
        for (const [seriesName, values] of Object.entries(scenarioData)) {
            if (seriesName in scenario) {
                for (const [quarter, value] of Object.entries(values)) {
                    if (scenarioQuarters.includes(quarter)) {
                        scenario[seriesName][quarter] = value;
                    }
                }
            }
        }
    }

    // Policy layer
    const policy = {
        OPR: constantSeries(scenarioQuarters, 3.0),
        REER: constantSeries(scenarioQuarters, 100),
        PADMINPRICE: constantSeries(scenarioQuarters, 1.99),
        SSTRATE: constantSeries(scenarioQuarters, 0.06),
        DEVGR: constantSeries(scenarioQuarters, 0.02),
        CPODRATE: constantSeries(scenarioQuarters, 0.08),
        FUELCONS: constantSeries(scenarioQuarters, 14.0),
        EPFWDRAW: constantSeries(scenarioQuarters, 0),
        BUDI95: constantSeries(scenarioQuarters, 1),
    };

    // Demographic layer
    const demographic = {
        TRGDP: buildTrendSeries(scenarioQuarters, 1760000, 1868000),
        POPAL: buildTrendSeries(scenarioQuarters, 35100000, 35800000),
        WAP: buildTrendSeries(scenarioQuarters, 24400000, 24750000),
    };

    // Calibration layer
    const calibration = {
        ADJW: constantSeries(scenarioQuarters, 1),
        GWADJ: constantSeries(scenarioQuarters, 1),
        ERGOV: constantSeries(scenarioQuarters, 1),
        MCCI: buildTrendSeries(scenarioQuarters, 100, 102),
        IIB: constantSeries(scenarioQuarters, 0.6),
        SIB: constantSeries(scenarioQuarters, 0.14),
        NDIV: constantSeries(scenarioQuarters, 0.04),
        PETMARG: constantSeries(scenarioQuarters, 0.38),
        SSTADJ: constantSeries(scenarioQuarters, 1),
    };

    // Preprocess layer
    const preprocess = {
        TLEVIES: constantSeries(scenarioQuarters, 2.5),
        TOTHER: constantSeries(scenarioQuarters, 3.0),
        GOVOREV: constantSeries(scenarioQuarters, 6.0),
        GOVDEBTADJ: constantSeries(scenarioQuarters, 0),
        GOVGRANT: constantSeries(scenarioQuarters, 4.8),
        GOVPEN: constantSeries(scenarioQuarters, 8.5),
        GOVOTR: constantSeries(scenarioQuarters, 7.2),
        GOVINVI: constantSeries(scenarioQuarters, 4.0),
        GOVFEES: constantSeries(scenarioQuarters, 5.5),
        BSHTRF: constantSeries(scenarioQuarters, 1.2),
        DLFDI: constantSeries(scenarioQuarters, 620),
        FLIAB: constantSeries(scenarioQuarters, 820),
        DAFDI: constantSeries(scenarioQuarters, 430),
        FASSET: constantSeries(scenarioQuarters, 690),
        EQFLI: constantSeries(scenarioQuarters, 140),
        BFLI: constantSeries(scenarioQuarters, 180),
        OTFLI: constantSeries(scenarioQuarters, 60),
        EQFA: constantSeries(scenarioQuarters, 120),
        BFA: constantSeries(scenarioQuarters, 160),
        OTFA: constantSeries(scenarioQuarters, 50),
        M3BUS: constantSeries(scenarioQuarters, 850),
        M3OFI: constantSeries(scenarioQuarters, 320),
        OSB: constantSeries(scenarioQuarters, 180),
        KGHH: constantSeries(scenarioQuarters, 640),
        VALHH: constantSeries(scenarioQuarters, 18),
        IHHPS: constantSeries(scenarioQuarters, 75),
        OAHH: constantSeries(scenarioQuarters, 4),
        HARAREA: constantSeries(scenarioQuarters, 5.7),
        NNOILGVA: constantSeries(scenarioQuarters, 1460),
        SDI: constantSeries(scenarioQuarters, 0),
        CREDIT: buildTrendSeries(scenarioQuarters, 2090000, 2255000),
    };

    return { quarters, historical, scenario, policy, demographic, calibration, preprocess };
}

function prevQuarter(quarter) {
    const { year, quarter: q } = parseQuarter(quarter);
    return q === 1 ? `${year - 1}Q4` : `${year}Q${q - 1}`;
}

function buildTrendSeries(quarters, startValue, endValue) {
    const result = {};
    for (let i = 0; i < quarters.length; i++) {
        const t = quarters.length === 1 ? 0 : i / (quarters.length - 1);
        result[quarters[i]] = startValue + (endValue - startValue) * t;
    }
    return result;
}

function createDefaultHistorical(quarters) {
    return {
        PCONS: { '2025Q2': 458000, '2025Q3': 462200, '2025Q4': 466800, '2026Q1': 471300 },
        RHHDI: { '2025Q2': 432000, '2025Q3': 435200, '2025Q4': 438600, '2026Q1': 442100 },
        NFWPE: { '2025Q2': 865000, '2025Q3': 872000, '2025Q4': 879500, '2026Q1': 887000 },
        CREDIT: { '2025Q2': 1980000, '2025Q3': 2006000, '2025Q4': 2035000, '2026Q1': 2064000 },
        CREDIT_LEVEL: { '2025Q2': 1980000, '2025Q3': 2006000, '2025Q4': 2035000, '2026Q1': 2064000 },
        PCPI_INDEX: { '2025Q2': 129.2, '2025Q3': 129.8, '2025Q4': 130.5, '2026Q1': 131.2 },
        PRP: { '2025Q2': 138.2, '2025Q3': 139.4, '2025Q4': 140.7, '2026Q1': 142.0 },
        XEE_LEVEL: { '2025Q2': 362.5, '2025Q3': 365.3, '2025Q4': 368.4, '2026Q1': 370.8 },
        XS_LEVEL: { '2025Q2': 57.2, '2025Q3': 57.8, '2025Q4': 58.2, '2026Q1': 58.5 },
        CIPD: { '2025Q2': 19.0, '2025Q3': 19.1, '2025Q4': 19.2, '2026Q1': 19.3 },
        DIPD: { '2025Q2': 96.4, '2025Q3': 97.0, '2025Q4': 97.6, '2026Q1': 98.2 },
        PETDIV: { '2025Q2': 28.0, '2025Q3': 28.2, '2025Q4': 28.4, '2026Q1': 28.5 },
        PETPROF: { '2025Q2': 93.0, '2025Q3': 94.0, '2025Q4': 94.5, '2026Q1': 95.0 },
        MGS10: { '2025Q2': 5.00, '2025Q3': 5.01, '2025Q4': 5.03, '2026Q1': 5.04 },
        PSAVEI_INDEX: { '2025Q2': 116.2, '2025Q3': 116.9, '2025Q4': 117.5, '2026Q1': 118.0 },
        PMSGVA_INDEX: { '2025Q2': 119.2, '2025Q3': 119.8, '2025Q4': 120.4, '2026Q1': 121.0 },
        EMS_LEVEL: { '2025Q2': 12480, '2025Q3': 12520, '2025Q4': 12570, '2026Q1': 12600 },
        EFOR_LEVEL: { '2025Q2': 1950, '2025Q3': 1970, '2025Q4': 1985, '2026Q1': 2000 },
        MSGVA_LEVEL: { '2025Q2': 1412000, '2025Q3': 1420000, '2025Q4': 1429000, '2026Q1': 1438000 },
        NEER_INDEX: { '2025Q2': 99.2, '2025Q3': 99.5, '2025Q4': 99.8, '2026Q1': 100.0 },
        REMITOUT: { '2025Q2': 7.2, '2025Q3': 7.3, '2025Q4': 7.4, '2026Q1': 7.5 },
        REMITIN: { '2025Q2': 2.9, '2025Q3': 2.95, '2025Q4': 2.98, '2026Q1': 3.0 },
        GOVTRAN: { '2025Q2': 0.75, '2025Q3': 0.77, '2025Q4': 0.79, '2026Q1': 0.8 },
        PADMIN_INDEX: { '2025Q2': 121.1, '2025Q3': 121.4, '2025Q4': 121.7, '2026Q1': 122.0 },
        PMNOG_INDEX: { '2025Q2': 117.8, '2025Q3': 118.3, '2025Q4': 118.7, '2026Q1': 119.0 },
        PPI_INDEX: { '2025Q2': 118.7, '2025Q3': 119.2, '2025Q4': 119.6, '2026Q1': 120.0 },
        CPIX_INDEX: { '2025Q2': 129.8, '2025Q3': 130.2, '2025Q4': 130.6, '2026Q1': 131.0 },
        CPI_INDEX: { '2025Q2': 129.2, '2025Q3': 129.8, '2025Q4': 130.5, '2026Q1': 131.2 },
        WPG_LEVEL: { '2025Q2': 98.8, '2025Q3': 99.2, '2025Q4': 99.6, '2026Q1': 100.0 },
        GOVWS: { '2025Q2': 88.4, '2025Q3': 88.9, '2025Q4': 89.5, '2026Q1': 90.0 },
        GOVSUP: { '2025Q2': 31.0, '2025Q3': 31.3, '2025Q4': 31.6, '2026Q1': 32.0 },
        GOVSUB_BASE: { '2025Q2': 17.3, '2025Q3': 17.5, '2025Q4': 17.7, '2026Q1': 18.0 },
        GOVDSC: { '2025Q2': 22.2, '2025Q3': 22.5, '2025Q4': 22.8, '2026Q1': 23.0 },
        GOVGRANT: { '2025Q2': 4.6, '2025Q3': 4.7, '2025Q4': 4.75, '2026Q1': 4.8 },
        GOVPEN: { '2025Q2': 8.2, '2025Q3': 8.3, '2025Q4': 8.4, '2026Q1': 8.5 },
        GOVOTR: { '2025Q2': 6.9, '2025Q3': 7.0, '2025Q4': 7.1, '2026Q1': 7.2 },
        GOVDEVPS: { '2025Q2': 74.6, '2025Q3': 75.1, '2025Q4': 75.6, '2026Q1': 76.0 },
        GOVDEBT: { '2025Q2': 1152, '2025Q3': 1161, '2025Q4': 1171, '2026Q1': 1180 },
        AVGBR: { '2025Q2': 4.78, '2025Q3': 4.81, '2025Q4': 4.84, '2026Q1': 4.86 },
        TYIND: { '2025Q2': 29.1, '2025Q3': 29.4, '2025Q4': 29.7, '2026Q1': 30.0 },
        FYCORP: { '2025Q2': 63.0, '2025Q3': 63.8, '2025Q4': 64.4, '2026Q1': 65.0 },
        TRPGT: { '2025Q2': 2.8, '2025Q3': 2.85, '2025Q4': 2.92, '2026Q1': 3.0 },
        TSTAMP: { '2025Q2': 5.7, '2025Q3': 5.8, '2025Q4': 5.9, '2026Q1': 6.0 },
        TEXCISE: { '2025Q2': 10.5, '2025Q3': 10.7, '2025Q4': 10.8, '2026Q1': 11.0 },
        TIMPORT: { '2025Q2': 3.7, '2025Q3': 3.8, '2025Q4': 3.9, '2026Q1': 4.0 },
        GOVINVI: { '2025Q2': 3.8, '2025Q3': 3.9, '2025Q4': 3.95, '2026Q1': 4.0 },
        GOVFEES: { '2025Q2': 5.2, '2025Q3': 5.3, '2025Q4': 5.4, '2026Q1': 5.5 },
        GOVOREV: { '2025Q2': 5.7, '2025Q3': 5.8, '2025Q4': 5.9, '2026Q1': 6.0 },
        BSHTRF: { '2025Q2': 1.1, '2025Q3': 1.15, '2025Q4': 1.18, '2026Q1': 1.2 },
        GCEPS: { '2025Q2': 119.4, '2025Q3': 120.2, '2025Q4': 121.0, '2026Q1': 122.0 },
        GCE_REAL: { '2025Q2': 268.5, '2025Q3': 270.6, '2025Q4': 272.8, '2026Q1': 275.0 },
        GDPM_LEVEL: { '2025Q2': 1792000, '2025Q3': 1806000, '2025Q4': 1821000, '2026Q1': 1835000 },
        DINV: { '2025Q2': 8.2, '2025Q3': 8.5, '2025Q4': 8.8, '2026Q1': 9.0 },
        GDPMPS: { '2025Q2': 1810000, '2025Q3': 1824000, '2025Q4': 1839000, '2026Q1': 1853000 },
        PGDP_INDEX: { '2025Q2': 115.6, '2025Q3': 116.0, '2025Q4': 116.5, '2026Q1': 117.0 },
    };
}

function main() {
    const opts = parseArgs(process.argv);

    console.log('MaMaMo Input Pack Builder');
    console.log(`Start: ${opts.startQuarter}, Length: ${opts.length} quarters`);
    if (opts.historical) console.log(`Historical: ${opts.historical}`);
    if (opts.scenario) console.log(`Scenario: ${opts.scenario}`);
    console.log(`Raw data: ${opts.raw}`);
    console.log('');

    const runPack = buildRunPack(opts);

    const outPath = resolve(rootDir, opts.output);
    const outDir = dirname(outPath);
    if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
    }

    writeFileSync(outPath, JSON.stringify(runPack, null, 2));
    console.log(`Run pack written to ${outPath}`);
    console.log(`  Quarters: ${runPack.quarters.length}`);
    console.log(`  Historical series: ${Object.keys(runPack.historical).length}`);
    console.log(`  Scenario series: ${Object.keys(runPack.scenario).length}`);
    console.log(`  Policy series: ${Object.keys(runPack.policy).length}`);
}

main();
