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
        aggregation: 'last',
        series: {
            gdp: {
                field: 'value',
                filter: row => row.series === 'abs',
            },
            gdp_yoy: {
                field: 'value',
                filter: row => row.series === 'growth_yoy',
            },
            gdp_qoq: {
                field: 'value',
                filter: row => row.series === 'growth_qoq',
            },
        },
    },
    cpi: {
        id: 'cpi_headline',
        name: 'Monthly CPI Headline',
        aggregation: 'last',
        series: {
            cpi: {
                field: 'index',
                filter: row => row.division === 'overall',
            },
        },
        derive(seriesData) {
            seriesData.cpi_yoy = deriveYearOnYear(seriesData.cpi);
        },
    },
    labour: {
        id: 'lfs_qtr',
        name: 'Quarterly Labour Force Statistics',
        aggregation: 'last',
        series: {
            unemployment: { field: 'u_rate' },
            lfpr: { field: 'p_rate' },
            employment: { field: 'lf_employed' },
            labour_force: { field: 'lf' },
            unemployment_persons: { field: 'lf_unemployed' },
        },
    },
    trade: {
        id: 'trade_sitc_1d',
        name: 'Monthly Trade by SITC Section',
        aggregation: 'sum',
        series: {
            exports: {
                field: 'exports',
                filter: row => row.section === 'overall',
            },
            imports: {
                field: 'imports',
                filter: row => row.section === 'overall',
            },
        },
        derive(seriesData) {
            const quarters = new Set([
                ...Object.keys(seriesData.exports || {}),
                ...Object.keys(seriesData.imports || {}),
            ]);
            seriesData.trade_balance = {};
            for (const quarter of quarters) {
                const exports = seriesData.exports?.[quarter];
                const imports = seriesData.imports?.[quarter];
                if (exports !== undefined && imports !== undefined) {
                    seriesData.trade_balance[quarter] = exports - imports;
                }
            }
        },
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

function quarterToIndex(quarter) {
    const match = /^(\d{4})Q([1-4])$/.exec(quarter);
    if (!match) return Number.NEGATIVE_INFINITY;
    return Number(match[1]) * 4 + Number(match[2]);
}

function deriveYearOnYear(series) {
    const out = {};
    const quarters = Object.keys(series || {}).sort((a, b) => quarterToIndex(a) - quarterToIndex(b));

    for (let i = 4; i < quarters.length; i++) {
        const quarter = quarters[i];
        const prevYearQuarter = quarters[i - 4];
        const current = series[quarter];
        const previous = series[prevYearQuarter];

        if (current !== undefined && previous !== undefined && previous !== 0) {
            out[quarter] = ((current / previous) - 1) * 100;
        }
    }

    return out;
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

    const groupedRows = new Map();
    for (const row of data) {
        if (!row.date) continue;
        const quarter = dateToQuarter(row.date);
        if (!quarter) continue;
        if (!groupedRows.has(quarter)) {
            groupedRows.set(quarter, []);
        }
        groupedRows.get(quarter).push(row);
    }

    const seriesData = Object.fromEntries(
        Object.keys(dataset.series).map(name => [name, {}]),
    );

    for (const [quarter, rows] of groupedRows.entries()) {
        rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));

        for (const [seriesName, config] of Object.entries(dataset.series)) {
            const matchingRows = rows.filter(row => (config.filter ? config.filter(row) : true));
            if (matchingRows.length === 0) continue;

            let value;
            if (dataset.aggregation === 'sum') {
                value = matchingRows.reduce((sum, row) => {
                    const number = Number(row[config.field]);
                    return Number.isFinite(number) ? sum + number : sum;
                }, 0);
            } else {
                const lastRow = matchingRows[matchingRows.length - 1];
                value = Number(lastRow[config.field]);
            }

            if (Number.isFinite(value)) {
                seriesData[seriesName][quarter] = value;
            }
        }
    }

    if (typeof dataset.derive === 'function') {
        dataset.derive(seriesData);
    }

    const primarySeries = Object.keys(seriesData)[0];
    const count = Object.keys(seriesData[primarySeries] || {}).length;
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
