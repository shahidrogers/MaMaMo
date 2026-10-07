import { quarterRange, parseQuarter } from './model-engine.js';
import {
    VINTAGE, START_QUARTER, END_QUARTER, FIRST_FORECAST_QUARTER,
    NATIONAL_ACCOUNTS, MACRO_PATH, EXOGENOUS_PATH, EXOGENOUS_HISTORY,
    POLICY, FISCAL_PLAN, FISCAL_ANCHORS,
} from './baseline-data.js';

/**
 * Scenario inputs a user can override, with their baseline series name.
 * Fiscal levers are RM bn per year relative to the baseline plan
 * (positive = more spending / more tax). EPFWDRAW is RM bn released in the quarter.
 */
export const INPUTS = Object.freeze({
    PBRENT: 'Brent crude, USD/bbl',
    CRACK: 'Gasoline refining margin over Brent, USD/bbl',
    USDMYR: 'USD/MYR exchange rate',
    PCPO: 'Crude palm oil price, RM/tonne',
    OPR: 'BNM Overnight Policy Rate, %',
    UST10: 'US 10-year Treasury yield, %',
    WSTD: 'World semiconductor demand index (baseline = 100)',
    WTOUR: 'World tourism demand index (baseline = 100)',
    WPG: 'World goods price index (baseline = 100)',
    WEQPR: 'World equity price index (baseline = 100)',
    ELNINO: 'El Nino in force (0/1)',
    SSTRATE: 'Service tax rate, %',
    CPODRATE: 'CPO export duty rate, %',
    BUDI95: 'BUDI95 targeted RON95 subsidy in force (0/1)',
    BUDI95PRICE: 'BUDI95 subsidised RON95 price, RM/litre',
    BUDI95QUOTA: 'BUDI95 monthly quota, litres',
    PETDIV: 'Petronas dividend to government, RM bn per year',
    EPFWDRAW: 'EPF special withdrawal paid out this quarter, RM bn',
    CASHAID: 'Extra cash transfers to households (STR/SARA etc.), RM bn per year',
    GOVCONS: 'Extra government consumption (salaries, supplies), RM bn per year',
    DEVEXP: 'Extra development expenditure, RM bn per year',
    HHTAX: 'Extra household direct taxes, RM bn per year',
    CORPTAX: 'Extra corporate taxes, RM bn per year',
    INDTAX: 'Extra indirect taxes (excl. service tax rate), RM bn per year',
    CPIADJ: 'Direct CPI level effect of administered-price measures, %',
});

function addQuarters(quarter, n) {
    let { year, quarter: q } = parseQuarter(quarter);
    let idx = year * 4 + (q - 1) + n;
    year = Math.floor(idx / 4);
    q = (idx % 4) + 1;
    return `${year}Q${q}`;
}

function quartersBetween(start, end) {
    const out = [start];
    while (out[out.length - 1] !== end) out.push(addQuarters(out[out.length - 1], 1));
    return out;
}

/** Path value for a quarter, holding the last available value beyond the data. */
function pathValue(path, quarter, key) {
    if (path[quarter]) return path[quarter][key];
    const keys = Object.keys(path).sort();
    return path[keys[keys.length - 1]][key];
}

function series(quarters, fn) {
    return Object.fromEntries(quarters.map(q => [q, fn(q)]));
}

/**
 * Build the baseline run pack. Simulation always starts at 2026Q1 so that
 * lags and calendar-year totals are complete; `endQuarter` extends the
 * horizon (paths are held flat beyond 2028Q4).
 *
 * @param {Object} [options]
 * @param {string} [options.endQuarter='2028Q4'] - Last quarter to simulate
 * @returns {Object} Run pack with a populated `baseline` layer and empty override layers
 */
export function createBaselineRunPack({ endQuarter = END_QUARTER } = {}) {
    const quarters = quartersBetween(START_QUARTER, endQuarter);
    const na = NATIONAL_ACCOUNTS;
    const levels = {};

    // Baseline demand levels: actual where published, otherwise last year's
    // level grown at the baseline rate (keeps the NSA seasonal pattern), with
    // expenditure shares taken from the same quarter a year earlier.
    const allQuarters = [...Object.keys(na.real), ...quarters.filter(q => !na.real[q])];
    for (const q of allQuarters) {
        if (na.real[q]) {
            levels[q] = { real: { ...na.real[q] }, nominal: { ...na.nominal[q] } };
            continue;
        }
        const prior = levels[addQuarters(q, -4)];
        const g = pathValue(MACRO_PATH, q, 'gdpGrowth') / 100;
        const d = pathValue(MACRO_PATH, q, 'deflatorGrowth') / 100;
        const realGdp = prior.real.gdp * (1 + g);
        const nomGdp = prior.nominal.gdp * (1 + g) * (1 + d);
        const scale = (obj, total) => Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, k === 'gdp' ? total : v / obj.gdp * total]));
        levels[q] = { real: scale(prior.real, realGdp), nominal: scale(prior.nominal, nomGdp) };
    }

    // Fiscal plan: years without a stated non-petroleum revenue grow with
    // baseline nominal GDP (buoyancy 0.9).
    const yearNominal = {};
    for (const q of allQuarters) {
        const y = parseQuarter(q).year;
        yearNominal[y] = (yearNominal[y] ?? 0) + levels[q].nominal.gdp;
    }
    const plan = {};
    const planYears = Object.keys(FISCAL_PLAN).map(Number).sort();
    for (const y of [...new Set(quarters.map(q => parseQuarter(q).year))]) {
        const src = FISCAL_PLAN[y] ?? FISCAL_PLAN[planYears[planYears.length - 1]];
        const prev = plan[y - 1];
        // Budget 2026 revenue was set against nominal GDP of RM2,128bn; rescale
        // to the baseline nominal path.
        const nonPet = src.nonPetroleumRevenue !== null && y === 2026
            ? src.nonPetroleumRevenue * Math.pow(yearNominal[y] / FISCAL_ANCHORS.budgetNominalGdp2026, 0.9)
            : src.nonPetroleumRevenue
                ?? prev.nonPetroleumRevenue * Math.pow(yearNominal[y] / yearNominal[y - 1], 0.9);
        plan[y] = { ...src, nonPetroleumRevenue: nonPet };
        if (!FISCAL_PLAN[y]) {
            plan[y].otherOperating = prev.otherOperating * 1.045;
            plan[y].development = prev.development * 1.035;
        }
    }
    const planValue = (q, key) => plan[parseQuarter(q).year][key];
    const exo = (key) => series(quarters, q => pathValue(EXOGENOUS_PATH, q, key));
    const macro = (key) => series(quarters, q => pathValue(MACRO_PATH, q, key));
    const level = (kind, key) => series(quarters, q => levels[q][kind][key]);
    const constant = (value) => series(quarters, () => value);

    const historyQuarters = Object.keys(EXOGENOUS_HISTORY);
    const historical = {
        YR: Object.fromEntries(historyQuarters.map(q => [q, na.real[q].gdp])),
        YN: Object.fromEntries(historyQuarters.map(q => [q, na.nominal[q].gdp])),
        CR: Object.fromEntries(historyQuarters.map(q => [q, na.real[q].c])),
        OILRM: Object.fromEntries(historyQuarters.map(q => [q, EXOGENOUS_HISTORY[q].brent * EXOGENOUS_HISTORY[q].fx])),
        OILRM_REF: Object.fromEntries(historyQuarters.map(q => [q, EXOGENOUS_HISTORY[q].brent * EXOGENOUS_HISTORY[q].fx])),
        GOVDEBT: { [addQuarters(START_QUARTER, -1)]: FISCAL_ANCHORS.debtEnd2025 },
        GOVDEBT_REF: { [addQuarters(START_QUARTER, -1)]: FISCAL_ANCHORS.debtEnd2025 },
    };

    return {
        meta: {
            vintage: VINTAGE,
            firstForecastQuarter: FIRST_FORECAST_QUARTER,
            annualHistory: {
                2025: {
                    gdpReal: historyQuarters.reduce((s, q) => s + na.real[q].gdp, 0),
                    gdpNominal: historyQuarters.reduce((s, q) => s + na.nominal[q].gdp, 0),
                },
            },
        },
        quarters,
        historical,
        scenario: {},
        policy: {},
        demographic: {},
        calibration: {},
        preprocess: {},
        baseline: {
            // Exogenous drivers
            PBRENT: exo('brent'),
            CRACK: exo('crack'),
            USDMYR: exo('fx'),
            PCPO: exo('cpo'),
            OPR: exo('opr'),
            UST10: exo('ust10'),
            BUDI95QUOTA: exo('budi95Quota'),
            WSTD: constant(100),
            WTOUR: constant(100),
            WPG: constant(100),
            WEQPR: constant(100),
            ELNINO: constant(0),
            // Policy
            SSTRATE: constant(POLICY.sstRate),
            CPODRATE: constant(POLICY.cpoDutyRate),
            BUDI95: constant(POLICY.budi95On),
            BUDI95PRICE: constant(POLICY.budi95Price),
            PETDIV: series(quarters, q => planValue(q, 'petronasDividend')),
            EPFWDRAW: constant(0),
            CASHAID: constant(0),
            GOVCONS: constant(0),
            DEVEXP: constant(0),
            HHTAX: constant(0),
            CORPTAX: constant(0),
            INDTAX: constant(0),
            CPIADJ: constant(0),
            // Baseline macro paths
            BASE_GDPG: macro('gdpGrowth'),
            BASE_CPI: macro('cpi'),
            BASE_CORE: macro('core'),
            BASE_UNEMP: macro('unemp'),
            BASE_YR: level('real', 'gdp'),
            BASE_YN: level('nominal', 'gdp'),
            BASE_C: level('real', 'c'),
            BASE_G: level('real', 'g'),
            BASE_I: level('real', 'i'),
            BASE_X: level('real', 'x'),
            BASE_M: level('real', 'm'),
            BASE_XN: level('nominal', 'x'),
            BASE_MN: level('nominal', 'm'),
            // Fiscal plan (RM bn per year)
            PLAN_NONPET: series(quarters, q => planValue(q, 'nonPetroleumRevenue')),
            PLAN_OEX: series(quarters, q => planValue(q, 'otherOperating')),
            PLAN_DE: series(quarters, q => planValue(q, 'development')),
        },
    };
}

/**
 * Apply scenario overrides to a run pack (mutates and returns it).
 *
 * Each override value may be:
 * - a number: applied to every quarter from `fromQuarter`
 * - an object keyed by quarter: applied to those quarters
 * - a function (baselineValue, quarter) => value
 *
 * Overrides go into the `scenario` layer, so the `baseline` layer stays the
 * reference that shocks are measured against.
 *
 * @param {Object} runPack - Run pack from createBaselineRunPack
 * @param {Object} overrides - Map of input name to override
 * @param {Object} [options]
 * @param {string} [options.fromQuarter] - First quarter to shock (default: first forecast quarter)
 * @returns {Object} The run pack
 */
export function applyOverrides(runPack, overrides, { fromQuarter } = {}) {
    const start = fromQuarter ?? runPack.meta?.firstForecastQuarter ?? runPack.quarters[0];
    for (const [name, value] of Object.entries(overrides)) {
        if (value === undefined || value === null) continue;
        if (!(name in INPUTS)) throw new Error(`Unknown scenario input "${name}"`);
        const base = runPack.baseline?.[name] ?? {};
        const target = (runPack.scenario[name] ??= {});
        for (const q of runPack.quarters) {
            if (typeof value === 'object') {
                if (q in value) target[q] = value[q];
            } else if (q >= start) {
                target[q] = typeof value === 'function' ? value(base[q], q) : value;
            }
        }
    }
    return runPack;
}

export { quarterRange };
