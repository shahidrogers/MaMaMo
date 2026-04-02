const OPENDOSM_RAW_BASE = '../../data/raw';

const SERIES_MAP = {
    gdp: {
        'gdp': { target: 'GDPM_LEVEL', scale: 1 },
        'gdp_pc': null,
    },
    cpi: {
        'cpi': { target: 'CPI_INDEX', scale: 1 },
        'cpi_yoy': null,
    },
    labour: {
        'unemployment': null,
        'lfpr': null,
        'employment': { target: 'EMS_LEVEL', scale: 1 },
    },
    trade: {
        'exports': null,
        'imports': null,
        'trade_balance': null,
    },
};

function dateToQuarter(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length < 2) return null;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (isNaN(year) || isNaN(month)) return null;
    return `${year}Q${Math.ceil(month / 3)}`;
}

async function fetchJson(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
        return response.json();
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

async function loadDataset(name) {
    try {
        const data = await fetchJson(`${OPENDOSM_RAW_BASE}/${name}.json`);
        return data;
    } catch {
        return null;
    }
}

function extractQuarterlySeries(rawData, column) {
    if (!rawData) return {};
    const result = {};
    for (const [seriesName, values] of Object.entries(rawData)) {
        if (seriesName === column) {
            for (const [dateStr, value] of Object.entries(values)) {
                const quarter = dateToQuarter(dateStr);
                if (quarter && value !== null && value !== undefined) {
                    result[quarter] = Number(value);
                }
            }
        }
    }
    return result;
}

function getLatestQuarter(series) {
    const quarters = Object.keys(series).sort();
    return quarters[quarters.length - 1] || null;
}

function getLastNQuarters(series, n) {
    const quarters = Object.keys(series).sort();
    const lastN = quarters.slice(-n);
    const result = {};
    for (const q of lastN) result[q] = series[q];
    return result;
}

function projectForward(series, startQuarter, length) {
    const quarters = Object.keys(series).sort();
    if (quarters.length < 2) return {};

    const values = quarters.map(q => series[q]);
    const lastValue = values[values.length - 1];
    const secondLast = values[values.length - 2];
    const growthRate = secondLast !== 0 ? (lastValue - secondLast) / Math.abs(secondLast) : 0;

    const result = {};
    let currentQuarter = startQuarter;
    let currentValue = lastValue;

    for (let i = 0; i < length; i++) {
        currentValue = currentValue * (1 + growthRate);
        result[currentQuarter] = currentValue;

        const match = /^(\d{4})Q([1-4])$/.exec(currentQuarter);
        if (match) {
            const year = Number(match[1]);
            const q = Number(match[2]);
            currentQuarter = q === 4 ? `${year + 1}Q1` : `${year}Q${q + 1}`;
        }
    }

    return result;
}

export async function loadOpenDOSMData(options = {}) {
    const {
        historicalQuarters = 4,
        forecastQuarters = 8,
        startForecastQuarter = '2026Q2',
    } = options;

    const [gdpRaw, cpiRaw, labourRaw, tradeRaw] = await Promise.all([
        loadDataset('gdp'),
        loadDataset('cpi'),
        loadDataset('labour'),
        loadDataset('trade'),
    ]);

    const data = { gdp: gdpRaw, cpi: cpiRaw, labour: labourRaw, trade: tradeRaw };

    const historical = {};

    const gdpSeries = extractQuarterlySeries(gdpRaw, 'gdp');
    if (Object.keys(gdpSeries).length > 0) {
        historical.GDPM_LEVEL = getLastNQuarters(gdpSeries, historicalQuarters);
        historical.GDPMPS = Object.fromEntries(
            Object.entries(historical.GDPM_LEVEL).map(([q, v]) => [q, v * 1.01])
        );
    }

    const cpiSeries = extractQuarterlySeries(cpiRaw, 'cpi');
    if (Object.keys(cpiSeries).length > 0) {
        historical.CPI_INDEX = getLastNQuarters(cpiSeries, historicalQuarters);
        historical.PCPI_INDEX = { ...historical.CPI_INDEX };
        historical.CPIX_INDEX = Object.fromEntries(
            Object.entries(historical.CPI_INDEX).map(([q, v]) => [q, v * 0.995])
        );
    }

    const empSeries = extractQuarterlySeries(labourRaw, 'employment');
    if (Object.keys(empSeries).length > 0) {
        historical.EMS_LEVEL = getLastNQuarters(empSeries, historicalQuarters);
    }

    const hasData = Object.keys(historical).length > 0;
    if (!hasData) return { source: 'defaults', historical: {}, data };

    const scenario = {};
    const forecastGDP = projectForward(gdpSeries, startForecastQuarter, forecastQuarters);
    if (Object.keys(forecastGDP).length > 0) scenario.GDPM_LEVEL = forecastGDP;

    const forecastCPI = projectForward(cpiSeries, startForecastQuarter, forecastQuarters);
    if (Object.keys(forecastCPI).length > 0) {
        scenario.CPI_INDEX = forecastCPI;
        scenario.PCPI_INDEX = { ...forecastCPI };
    }

    return {
        source: 'opendosm',
        historical,
        scenario,
        data,
        metadata: {
            gdp_quarters: Object.keys(gdpSeries).length,
            cpi_quarters: Object.keys(cpiSeries).length,
            labour_quarters: Object.keys(empSeries).length,
            latest_gdp: getLatestQuarter(gdpSeries),
            latest_cpi: getLatestQuarter(cpiSeries),
        },
    };
}

export function mergeWithDefaults(defaults, liveData) {
    const merged = JSON.parse(JSON.stringify(defaults));
    if (!liveData || liveData.source !== 'opendosm') return merged;

    for (const [seriesName, values] of Object.entries(liveData.historical)) {
        if (Object.keys(values).length > 0) {
            merged.historical[seriesName] = {
                ...(merged.historical[seriesName] || {}),
                ...values,
            };
        }
    }

    return merged;
}
