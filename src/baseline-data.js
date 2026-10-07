/**
 * MaMaMo baseline data — single source of truth for the reference scenario.
 *
 * Vintage: 2026-10-07. Everything the solver treats as "baseline" lives here,
 * so a scenario is always measured against the same numbers the run pack uses.
 *
 * Units (used consistently across the model):
 * - GDP and demand components: RM billion per quarter (not annualised),
 *   real = constant 2015 prices, nominal = current prices
 * - Fiscal: RM billion per calendar year in this file; the solver works in
 *   quarterly flows (annual / 4) and reports annualised rates
 * - Rates and growth: percent; growth is year-on-year unless stated
 * - Brent and refining margin: USD/bbl; USD/MYR: ringgit per dollar
 *
 * Sources:
 * - National accounts, CPI, labour: OpenDOSM (api.data.gov.my) datasets
 *   gdp_qtr_real_demand, gdp_qtr_nominal_demand, cpi_headline, cpi_core,
 *   lfs_month — pulled 2026-10-07, latest GDP 2026Q2, latest CPI Aug 2026
 * - Budget 2026 (MOF, Oct 2025): revenue RM343.1bn, expenditure RM419.2bn
 *   (OE RM338.2bn, DE RM81bn), deficit 3.5% of GDP; petroleum-related
 *   revenue RM43bn (Petronas dividend RM20bn, PITA RM15.7bn, royalty
 *   RM5.1bn) at an oil assumption of USD60-65/bbl
 * - BNM: OPR 2.75% since Jul 2025, held at every 2026 MPC meeting to Sep
 * - Brent: Q1 2026 avg USD77.8, Q2 USD97.1 (EIA); ~USD96-100 in Q3/early Q4
 * - Unsubsidised RON95: RM4.52/litre week of 1-7 Oct 2026; BUDI95 RM1.99
 *   with a 300-litre monthly quota (200 litres Apr-Aug 2026)
 * - Federal government debt: 65.2% of GDP at end-2025 (MOF)
 *
 * Forecast-period paths below are MaMaMo staff assumptions, informed by
 * consensus where noted. They are inputs, not model outputs: the solver
 * computes deviations from them.
 */

export const VINTAGE = '2026-10-07';
export const FIRST_FORECAST_QUARTER = '2026Q3';
export const START_QUARTER = '2026Q1';
export const END_QUARTER = '2028Q4';

/** OpenDOSM quarterly national accounts, RM bn (e1 C, e2 G, e3 GFCF, e4 inventories, e5 X, e6 M). */
export const NATIONAL_ACCOUNTS = Object.freeze({
    real: {
        '2025Q1': { gdp: 415.441, c: 257.486, g: 51.532, i: 93.537, s: -5.054, x: 282.528, m: 264.589 },
        '2025Q2': { gdp: 420.534, c: 256.873, g: 51.144, i: 99.746, s: 6.903, x: 287.088, m: 281.220 },
        '2025Q3': { gdp: 443.120, c: 271.698, g: 56.386, i: 96.424, s: -2.769, x: 304.494, m: 283.114 },
        '2025Q4': { gdp: 457.859, c: 264.718, g: 71.768, i: 96.669, s: 12.178, x: 308.826, m: 296.301 },
        '2026Q1': { gdp: 437.670, c: 269.487, g: 53.632, i: 100.378, s: -6.184, x: 297.139, m: 276.782 },
        '2026Q2': { gdp: 445.896, c: 269.095, g: 55.052, i: 104.369, s: 1.625, x: 336.011, m: 320.256 },
    },
    nominal: {
        '2025Q1': { gdp: 485.107, c: 301.324, g: 55.205, i: 105.074, s: -7.172, x: 349.888, m: 319.213 },
        '2025Q2': { gdp: 489.742, c: 300.106, g: 54.784, i: 111.434, s: 7.984, x: 351.244, m: 335.809 },
        '2025Q3': { gdp: 517.573, c: 326.718, g: 61.097, i: 107.527, s: -12.816, x: 372.507, m: 337.461 },
        '2025Q4': { gdp: 532.958, c: 319.960, g: 78.053, i: 107.715, s: -2.318, x: 389.141, m: 359.593 },
        '2026Q1': { gdp: 513.326, c: 318.036, g: 58.131, i: 112.538, s: -15.427, x: 372.488, m: 332.441 },
        '2026Q2': { gdp: 544.006, c: 318.862, g: 59.841, i: 117.425, s: 7.815, x: 441.194, m: 401.131 },
    },
});

/**
 * Baseline macro paths by quarter. 2026Q1-Q2 are outturns (OpenDOSM);
 * later quarters are assumptions.
 * - gdpGrowth: real GDP y/y % (H1 2026 outturn 5.7%; 2027 consensus ~4-4.5%)
 * - deflatorGrowth: GDP deflator y/y % (oil spike lifts 2026, base effect drags 2027Q2)
 * - cpi / core: y/y % (Aug 2026 headline 1.9%, core 1.7%)
 * - unemp: % (3.0% Jul 2026)
 */
export const MACRO_PATH = Object.freeze({
    '2026Q1': { gdpGrowth: 5.35, deflatorGrowth: 0.45, cpi: 1.57, core: 2.13, unemp: 2.95 },
    '2026Q2': { gdpGrowth: 6.03, deflatorGrowth: 4.78, cpi: 1.96, core: 1.99, unemp: 3.0 },
    '2026Q3': { gdpGrowth: 4.9, deflatorGrowth: 3.8, cpi: 1.8, core: 1.7, unemp: 3.0 },
    '2026Q4': { gdpGrowth: 4.4, deflatorGrowth: 3.2, cpi: 2.0, core: 1.8, unemp: 3.0 },
    '2027Q1': { gdpGrowth: 4.3, deflatorGrowth: 2.6, cpi: 2.2, core: 1.9, unemp: 3.0 },
    '2027Q2': { gdpGrowth: 4.0, deflatorGrowth: 0.8, cpi: 2.0, core: 1.9, unemp: 3.0 },
    '2027Q3': { gdpGrowth: 4.3, deflatorGrowth: 1.0, cpi: 2.1, core: 2.0, unemp: 3.0 },
    '2027Q4': { gdpGrowth: 4.4, deflatorGrowth: 1.3, cpi: 2.0, core: 2.0, unemp: 3.0 },
    '2028Q1': { gdpGrowth: 4.3, deflatorGrowth: 1.8, cpi: 2.0, core: 2.0, unemp: 3.0 },
    '2028Q2': { gdpGrowth: 4.3, deflatorGrowth: 1.8, cpi: 2.0, core: 2.0, unemp: 3.0 },
    '2028Q3': { gdpGrowth: 4.3, deflatorGrowth: 1.8, cpi: 2.0, core: 2.0, unemp: 3.0 },
    '2028Q4': { gdpGrowth: 4.3, deflatorGrowth: 1.8, cpi: 2.0, core: 2.0, unemp: 3.0 },
});

/**
 * Baseline exogenous paths. 2026Q1-Q3 Brent are outturns/near-outturns;
 * the forward path eases toward ~USD75 by 2028 (in line with BIMB Securities'
 * USD85 for 2027 and USD75 for 2028). The refining margin (gasoline crack,
 * USD/bbl over Brent) is what drives the RON95 market price; it spiked above
 * USD60 with the Hormuz disruption and is assumed to normalise through 2027.
 * USD/MYR ~4.09 (BNM interbank, early Oct 2026). CPO and UST10 are held flat.
 */
export const EXOGENOUS_PATH = Object.freeze({
    '2026Q1': { brent: 77.8, crack: 25, fx: 4.15, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
    '2026Q2': { brent: 97.1, crack: 55, fx: 4.10, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 200 },
    '2026Q3': { brent: 96, crack: 60, fx: 4.08, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 233 },
    '2026Q4': { brent: 98, crack: 55, fx: 4.09, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
    '2027Q1': { brent: 92, crack: 45, fx: 4.09, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
    '2027Q2': { brent: 88, crack: 35, fx: 4.09, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
    '2027Q3': { brent: 85, crack: 28, fx: 4.09, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
    '2027Q4': { brent: 82, crack: 22, fx: 4.09, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
    '2028Q1': { brent: 80, crack: 20, fx: 4.09, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
    '2028Q2': { brent: 78, crack: 20, fx: 4.09, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
    '2028Q3': { brent: 76, crack: 20, fx: 4.09, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
    '2028Q4': { brent: 75, crack: 20, fx: 4.09, cpo: 4200, opr: 2.75, ust10: 4.25, budi95Quota: 300 },
});

/** Brent, crack and FX for 2025 — needed for lagged petroleum tax receipts. */
export const EXOGENOUS_HISTORY = Object.freeze({
    '2025Q1': { brent: 75, crack: 15, fx: 4.43 },
    '2025Q2': { brent: 67, crack: 15, fx: 4.30 },
    '2025Q3': { brent: 68, crack: 15, fx: 4.22 },
    '2025Q4': { brent: 63, crack: 15, fx: 4.18 },
});

/** Policy settings held constant over the baseline. */
export const POLICY = Object.freeze({
    sstRate: 8,              // Service tax rate, % (raised from 6% in Mar 2024)
    cpoDutyRate: 8,          // CPO export duty, %
    budi95On: 1,             // BUDI95 targeted RON95 subsidy in force
    budi95Price: 1.99,       // RM/litre for eligible citizens
});

/**
 * Fiscal plan by calendar year, RM bn. 2026 follows Budget 2026; 2027-28 are
 * "no new policy" extrapolations (operating spending +4.5%/yr). On MaMaMo's
 * oil path this gives a pre-budget 2027 deficit of ~3.0% of GDP, below the
 * Sep 2026 consensus of 3.3-3.6%, mainly because petroleum revenue at
 * USD80-90 oil is higher than budget-style assumptions.
 * - nonPetroleumRevenue: Budget 2026 revenue less petroleum-related revenue
 *   (rescaled to baseline nominal GDP; later years grow with nominal GDP)
 * - otherOperating: operating expenditure excluding fuel subsidies
 * - development: development expenditure
 * - petronasDividend: 2026 as announced; 2027 per CIMB (~RM25bn); 2028 held
 *
 * Reuters (Oct 2026) puts the 2026 fuel subsidy bill near RM40bn against
 * RM15bn set aside in Budget 2026; otherOperating is Budget 2026 OE less that
 * RM15bn allocation.
 */
export const FISCAL_PLAN = Object.freeze({
    2026: { nonPetroleumRevenue: 300.1, otherOperating: 323.2, development: 81, petronasDividend: 20 },
    2027: { nonPetroleumRevenue: null, otherOperating: 337.7, development: 84, petronasDividend: 25 },
    2028: { nonPetroleumRevenue: null, otherOperating: 352.9, development: 87, petronasDividend: 25 },
});

export const FISCAL_ANCHORS = Object.freeze({
    budgetNominalGdp2026: 2128,   // Implied by RM419.2bn = 19.7% of GDP
    debtEnd2025: 1320,            // 65.2% of 2025 nominal GDP (RM2,025bn)
    // Budget 2026 petroleum revenue at its oil assumption (USD62.5 x RM4.25)
    oilAnchorRmPerBbl: 62.5 * 4.25,
    pita: 15.7,
    royalty: 5.1,
    otherPetroleum: 2.2,
});

/** Current account and household-sector baseline levels. */
export const OTHER_BASELINE = Object.freeze({
    currentAccountPct: 2.0,       // % of GDP
    primaryIncomePct: -3.0,
    secondaryIncomePct: -0.5,
    householdDebtPct: 84.0,       // % of GDP (BNM FSR)
    creditGrowth: 5.0,            // household credit y/y %
    propertyPriceGrowth: 3.5,     // MHPI y/y %
    nominalWageGrowth: 4.5,       // y/y %
    mgs10: 3.55,                  // 10-year MGS yield %
});
