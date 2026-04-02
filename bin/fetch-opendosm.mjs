import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const API_BASE = 'https://api.data.gov.my/data-catalogue';

const DATASETS = {
    gdp: {
        id: 'gdp_qtr_nominal',
        name: 'Quarterly Nominal GDP',
        columns: ['date', 'gdp', 'gdp_pc'],
    },
    cpi: {
        id: 'cpi_headline',
        name: 'Monthly CPI Headline',
        columns: ['date', 'cpi', 'cpi_yoy'],
    },
    labour: {
        id: 'lfs_qtr',
        name: 'Quarterly Labour Force Statistics',
        columns: ['date', 'unemployment', 'lfpr', 'employment'],
    },
    trade: {
        id: 'trade_sitc_1d',
        name: 'Monthly Trade by SITC Section',
        columns: ['date', 'exports', 'imports', 'trade_balance'],
    },
};

function parseArgs(argv) {
    const args = argv.slice(2);
    const opts = {
        output: 'data/raw',
        datasets: Object.keys(DATASETS),
        start: null,
        end: null,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--output': case '-o': opts.output = args[++i]; break;
            case '--dataset': opts.datasets = [args[++i]]; break;
            case '--start': opts.start = args[++i]; break;
            case '--end': opts.end = args[++i]; break;
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
MaMaMo OpenDOSM Data Pipeline — Fetch data from Malaysia's open data platform.

USAGE:
  node bin/fetch-opendosm.mjs [options]

OPTIONS:
  -o, --output <dir>     Output directory for raw data (default: data/raw)
  --dataset <name>       Fetch specific dataset: gdp, cpi, labour, trade
  --start <YYYY-MM>      Start date (default: last 10 years)
  --end <YYYY-MM>        End date (default: latest available)

EXAMPLES:
  # Fetch all datasets
  node bin/fetch-opendosm.mjs

  # Fetch only GDP data
  node bin/fetch-opendosm.mjs --dataset gdp

  # Fetch with date range
  node bin/fetch-opendosm.mjs --start 2015-01 --end 2025-12
`);
}

function dateToQuarter(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length < 2) return null;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (isNaN(year) || isNaN(month)) return null;
    const q = Math.ceil(month / 3);
    return `${year}Q${q}`;
}

async function fetchWithRedirect(url, options = {}, maxRedirects = 5) {
    for (let i = 0; i < maxRedirects; i++) {
        const response = await fetch(url, {
            ...options,
            redirect: 'manual',
            signal: AbortSignal.timeout(30000),
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (!location) throw new Error(`Redirect with no Location header: ${response.status}`);
            url = location.startsWith('http') ? location : new URL(location, url).href;
            continue;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
    }
    throw new Error('Too many redirects');
}

async function fetchDataset(datasetKey, opts) {
    const dataset = DATASETS[datasetKey];
    if (!dataset) throw new Error(`Unknown dataset: ${datasetKey}`);

    console.log(`Fetching ${dataset.name} (${dataset.id})...`);

    const params = new URLSearchParams({ id: dataset.id, limit: '10000' });
    if (opts.start) params.set('start', opts.start);
    if (opts.end) params.set('end', opts.end);

    const url = `${API_BASE}?${params.toString()}`;

    const response = await fetchWithRedirect(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'MaMaMo/0.4.0' },
    });
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
        console.warn(`  No data returned for ${dataset.id}`);
        return { dataset: datasetKey, series: {}, count: 0 };
    }

    // Convert API response to quarterly series
    const seriesData = {};
    for (const col of dataset.columns) {
        seriesData[col] = {};
    }

    for (const row of data) {
        const date = row.date;
        if (!date) continue;
        const quarter = dateToQuarter(date);
        if (!quarter) continue;

        for (const col of dataset.columns) {
            const value = row[col];
            if (value !== null && value !== undefined && value !== '') {
                seriesData[col][quarter] = Number(value);
            }
        }
    }

    const count = Object.keys(seriesData[dataset.columns[0]] || {}).length;
    console.log(`  Retrieved ${count} quarterly observations (${data.length} total rows)`);

    return { dataset: datasetKey, series: seriesData, count };
}

async function fetchAllDatasets(opts) {
    const results = [];
    for (const key of opts.datasets) {
        try {
            const result = await fetchDataset(key, opts);
            results.push(result);
        } catch (err) {
            console.error(`  Failed to fetch ${key}: ${err.message}`);
            results.push({ dataset: key, series: {}, count: 0, error: err.message });
        }
    }
    return results;
}

function saveResults(results, outputDir) {
    const outPath = resolve(rootDir, outputDir);
    if (!existsSync(outPath)) {
        mkdirSync(outPath, { recursive: true });
    }

    for (const result of results) {
        if (result.error) continue;
        const filePath = resolve(outPath, `${result.dataset}.json`);
        writeFileSync(filePath, JSON.stringify(result.series, null, 2));
        console.log(`Saved ${filePath}`);
    }

    const summary = {
        fetched_at: new Date().toISOString(),
        datasets: results.map(r => ({
            name: r.dataset,
            observations: r.count,
            error: r.error || null,
        })),
    };
    writeFileSync(resolve(outPath, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(`Saved ${resolve(outPath, 'summary.json')}`);
}

async function main() {
    const opts = parseArgs(process.argv);

    console.log('MaMaMo OpenDOSM Data Pipeline');
    console.log(`Datasets: ${opts.datasets.join(', ')}`);
    console.log(`Output: ${opts.output}`);
    if (opts.start) console.log(`Start: ${opts.start}`);
    if (opts.end) console.log(`End: ${opts.end}`);
    console.log('');

    const results = await fetchAllDatasets(opts);
    saveResults(results, opts.output);

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
        console.log(`\n${errors.length} dataset(s) failed to fetch.`);
        process.exit(1);
    }

    console.log('\nDone.');
}

main();
