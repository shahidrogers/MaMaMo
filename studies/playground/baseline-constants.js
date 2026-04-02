/**
 * MaMaMo Playground Baseline Constants
 * 
 * Source: OpenDOSM (data.gov.my) - Department of Statistics Malaysia
 * Pulled: 2026-04-02
 * 
 * Key baseline values from latest available data:
 * - GDP: RM532,870M nominal (Q4 2025), 6.3% YoY growth
 * - CPI: 136.0 (Feb 2026), 1.4% YoY headline, 2.0% core
 * - Unemployment: 3.0% (Q3 2025)
 * - Labour Force: 17,487k, Participation: 70.9%
 * - Household Consumption: RM319,887M (Q4 2025)
 * - Government Consumption: RM79,569M (Q4 2025)
 * - GFCF: RM108,355M (Q4 2025)
 * - Exports: RM380,362M (Q4 2025)
 * - Imports: RM351,670M (Q4 2025)
 * 
 * Model calibration sources:
 * - BNM Working Papers (MPC, elasticities, pass-through rates)
 * - DOSM National Accounts (2015 base year)
 * - IMF Article IV estimates
 * - Published Malaysian macro studies
 */

// ============================================================================
// BASELINE CONSTANTS (B) - Latest OpenDOSM data
// ============================================================================
// All values are for Q4 2025 / Q1 2026 unless otherwise noted
// GDP in RM millions, rates in percent, indices at 2015=100

export const BASELINE = Object.freeze({
    // GDP and growth
    gdp_millions_rm: 532870,           // Nominal GDP Q4 2025 (OpenDOSM: gdp_qtr_nominal)
    gdp_growth: 6.3,                   // YoY growth Q4 2025 (OpenDOSM)
    gdp_growth_qoq: 3.0,               // QoQ growth Q4 2025 (OpenDOSM)
    gdp_real_millions_rm: 457681,      // Real GDP Q4 2025 (OpenDOSM: gdp_qtr_real)

    // GDP expenditure components (nominal, Q4 2025, OpenDOSM: gdp_qtr_nominal_demand)
    household_consumption_nominal: 319887,   // e1
    government_consumption_nominal: 79569,   // e2
    gfcf_nominal: 108355,                    // e3
    inventories_nominal: -3634,              // e4
    exports_nominal: 380362,                 // e5
    imports_nominal: 351670,                 // e6

    // GDP expenditure components (real, Q4 2025, OpenDOSM: gdp_qtr_real_demand)
    household_consumption_real: 266320,      // e1 real
    government_consumption_real: 72896,      // e2 real
    gfcf_real: 97329,                        // e3 real
    inventories_real: 9535,                  // e4 real
    exports_real: 301696,                    // e5 real
    imports_real: 290094,                    // e6 real

    // Inflation (OpenDOSM: cpi_headline, cpi_headline_inflation, cpi_core_inflation)
    cpi_index: 136.0,                  // Feb 2026 (2015=100)
    cpi_inflation: 1.4,                // YoY Feb 2026
    cpi_inflation_mom: 0.2,            // MoM Feb 2026
    core_inflation: 2.0,               // Core YoY Feb 2026

    // Labour market (OpenDOSM: lfs_qtr, Q3 2025)
    unemployment: 3.0,                 // Unemployment rate %
    labour_force: 17487,               // Thousands
    employed: 16967,                   // Thousands
    unemployed: 520,                   // Thousands
    participation_rate: 70.9,          // %
    ep_ratio: 68.8,                    // Employment-population ratio %
    lf_outside: 7183,                  // Thousands outside labour force

    // Prices and rates (model calibration, not directly from DOSM)
    opr: 3.0,                          // BNM Overnight Policy Rate %
    brent: 82,                         // Brent crude USD/bbl (external)
    cpo: 4000,                         // CPO price RM/tonne (external)
    fx: 4.45,                          // USD/MYR (updated from 3.89 to reflect 2026 levels)
    mgs10: 4.35,                       // 10-year MGS yield % (calibrated)

    // Fiscal (model calibration based on MOF data)
    fiscal_pct: -3.2,                  // Fiscal balance % GDP
    gov_revenue_bln: 280,              // Annual government revenue RM bn (updated)
    gov_expenditure_bln: 340,          // Annual government expenditure RM bn (updated)
    petronas_profit_bln: 95,           // Annual Petronas profit RM bn
    pita_revenue_bln: 36.1,            // Petroleum income tax RM bn
    petronas_dividend_bln: 28.5,       // Petronas dividend RM bn
    fuel_subsidy_bln: 8.4,             // Annual fuel subsidy RM bn

    // Fuel prices
    ron95_budi_price: 1.99,            // BUDI95 subsidised price RM/litre
    ron95_market_price: 2.54,          // Market RON95 price RM/litre

    // External sector (OpenDOSM: gdp_qtr_nominal_demand)
    exports_bln: 380.4,                // Quarterly exports RM bn
    imports_bln: 351.7,                // Quarterly imports RM bn
    current_account_pct: 2.1,          // Current account % GDP

    // Investment components (derived from GFCF breakdown)
    gfcf_bln: 108.4,                   // GFCF quarterly RM bn
    business_investment_bln: 75,       // Business investment RM bn (~70% of GFCF)
    public_investment_bln: 22,         // Public investment RM bn (~20% of GFCF)
    housing_investment_bln: 11,        // Housing investment RM bn (~10% of GFCF)

    // Household balance sheet
    household_debt_ratio: 84.2,        // HH debt / GDP %
    real_wage_growth: 1.9,             // Real wage growth %
    nominal_wage_growth: 3.3,          // Nominal wage growth % (CPI + real)
    consumption_growth: 6.3,           // Household consumption growth % (matches GDP)
    credit_growth: 5.2,                // Bank credit growth %
    property_price_growth: 3.8,        // Property price growth %

    // Balance of payments
    trade_balance_pct: 5.4,            // Trade balance % GDP
    primary_income_pct: -4.2,          // Primary income % GDP
    transfers_pct: -0.7,               // Transfers % GDP

    // External indices (baseline = 100)
    semi: 100,                         // E&E demand index
    tour: 100,                         // Tourism demand index
    wpg: 100,                          // World goods prices index
    equity: 100,                       // Global equity index
    ust10: 4.25,                       // US 10Y yield %

    // Policy parameters
    devgr: 2.0,                        // Development expenditure growth %
    sst: 6,                            // SST rate %
    cpoduty: 8,                        // CPO export duty %
    epf: 0,                            // EPF withdrawal RM bn
});

// ============================================================================
// CALIBRATION PARAMETERS (P) - From model equations and BNM papers
// ============================================================================
// These are structural parameters from the Malaysia Quarterly Model
// See model/malaysia-quarterly-model.md for equation references

export const CALIBRATION = Object.freeze({
    // Consumption equation (Group 1, line 35)
    // dlog(PCONS) = 0.1824 + 0.1385*dlog(RHHDI) - 0.0072*d(LFSUR) + ...
    cons_income_elast: 0.1385,         // Short-run income elasticity
    cons_credit_elast: 0.0843,         // Credit elasticity
    cons_opr_elast: -0.0005,           // Real rate elasticity
    cons_ecm_speed: 0.1080,            // Error correction speed
    cons_conf_elast: 0.0382,           // Confidence elasticity
    mpc: 0.55,                         // Long-run MPC out of income (used as P.mpc)
    wealth_elast: 0.08,                // Wealth elasticity

    // Investment equation (Group 3, line 137)
    // dlog(IBUSX) = 0.2200*dlog(IBUSX(-3)) + 1.0500*dlog(MSGVA(-1)) + ...
    inv_output_elast: 1.05,            // Investment elasticity to output
    inv_elast: 1.05,                   // Alias for inv_output_elast
    inv_opr_elast: -0.0015,            // Interest rate sensitivity
    inv_ecm_speed: 0.0450,             // Error correction speed

    // Labour market (Group 4, line 179)
    // dlog(EMS) = -0.0098 + 0.3800*dlog(EMS(-1)) + 0.2050*dlog(MSGVA(-1)) + ...
    okun: 0.45,                        // Okun's law coefficient (used as P.okun)
    okun_coeff: 0.45,                  // Alias
    emp_output_elast: 0.2050,          // Employment-output elasticity
    emp_ecm_speed: 0.0075,             // Error correction speed

    // Export equations (Group 5)
    // E&E: dlog(XEE) = 0.1500*dlog(XEE(-1)) + 1.0500*dlog(WSTD(-1)) - 0.2800*dlog(REER) + ...
    ee_elast: 1.05,                    // E&E demand elasticity (used as P.ee_elast)
    ee_demand_elast: 1.05,             // Alias
    ee_price_elast: -0.28,             // E&E price elasticity (REER)
    ee_ecm_speed: 0.1350,              // E&E error correction speed
    // Services: dlog(XS) = 0.3200*dlog(XS(-1)) + 0.8500*dlog(WTOUR) - 0.1800*dlog(REER) + ...
    tour_elast: 0.85,                  // Tourism demand elasticity (used as P.tour_elast)
    tour_demand_elast: 0.85,           // Alias
    tour_price_elast: -0.18,           // Tourism price elasticity
    tour_ecm_speed: 0.0950,            // Tourism error correction speed
    reer_exp_elast: -0.25,             // REER export elasticity (general)

    // Import equations (Group 6)
    // Import content coefficients from DOSM IO 2015
    import_content_cons: 0.22,         // Consumption import content
    import_content_gov: 0.08,          // Government import content
    import_content_gfcf: 0.30,         // GFCF import content
    import_content_ee: 0.52,           // E&E import content (DOSM IO 2015)
    import_pt: 0.40,                   // FX pass-through to import prices (used as P.import_pt)
    import_pass_through: 0.40,         // Alias

    // Price equations (Group 7)
    // Wage Phillips curve (line 296)
    wage_productivity_elast: 0.52,     // Wage-productivity elasticity
    wage_price_elast: 0.25,            // Wage-price elasticity
    wage_unemp_elast: -0.0075,         // Wage-unemployment elasticity
    wage_ecm_speed: 0.0380,            // Wage error correction speed
    wage_price_pt: 0.52,               // Alias for wage_productivity_elast (used as P.wage_price_pt)
    // Administered prices
    oil_admin_pt: 0.15,                // Oil to administered price pass-through (used as P.oil_admin_pt)
    oil_admin_pass_through: 0.15,      // Alias
    w_admin: 0.22,                     // Weight of administered items in CPI

    // Fiscal parameters
    pet_tax: 0.38,                     // Petroleum income tax rate (PITA) (used as P.pet_tax)
    pet_tax_rate: 0.38,                // Alias
    corp_tax_rate: 0.24,               // Corporate tax rate
    pet_div: 0.30,                     // Petronas dividend payout ratio (used as P.pet_div)
    pet_div_payout: 0.30,              // Alias
    budi95_coverage: 0.92,             // BUDI95 eligible population coverage
    fuel_litres_q: 3.5,                // Quarterly subsidised fuel volume (bn litres)

    // Sector shares (from DOSM national accounts)
    ee_share: 0.38,                    // E&E share of exports
    oil_share: 0.08,                   // Oil & gas share of exports
    cpo_share: 0.05,                   // CPO share of exports
    services_export_share: 0.06,       // Services export share of GDP
    other_export_share: 0.43,          // Other exports share

    // Monetary transmission
    opr_cons: -0.0072,                 // OPR effect on consumption (used as P.opr_cons)
    opr_cons_effect: -0.0072,          // Alias
    opr_inv: -0.0015,                  // OPR effect on investment (used as P.opr_inv)
    opr_inv_effect: -0.0015,           // Alias
    mortgage_spread: 1.75,             // Mortgage rate = OPR + spread
    blr_spread: 2.25,                  // BLR = OPR + spread

    // External sector
    fx_export_elast: 0.4,              // FX effect on oil exports
    fx_import_elast: 0.1,              // FX effect on imports
});

// ============================================================================
// DATA SOURCES - For citation and educational purposes
// ============================================================================

export const DATA_SOURCES = Object.freeze({
    gdp: {
        source: 'OpenDOSM: gdp_qtr_nominal, gdp_qtr_real',
        url: 'https://open.dosm.gov.my/data-catalogue/gdp_qtr_nominal',
        frequency: 'Quarterly',
        latest: 'Q4 2025',
        note: 'GDP at current and constant 2015 prices'
    },
    gdp_expenditure: {
        source: 'OpenDOSM: gdp_qtr_nominal_demand',
        url: 'https://open.dosm.gov.my/data-catalogue/gdp_qtr_nominal_demand',
        frequency: 'Quarterly',
        latest: 'Q4 2025',
        note: 'GDP by expenditure type: household, government, GFCF, inventories, exports, imports'
    },
    cpi: {
        source: 'OpenDOSM: cpi_headline, cpi_headline_inflation, cpi_core_inflation',
        url: 'https://open.dosm.gov.my/data-catalogue/cpi_headline',
        frequency: 'Monthly',
        latest: 'Feb 2026',
        note: 'Consumer Price Index 2015=100, headline and core inflation'
    },
    labour: {
        source: 'OpenDOSM: lfs_qtr',
        url: 'https://open.dosm.gov.my/data-catalogue/lfs_qtr',
        frequency: 'Quarterly',
        latest: 'Q3 2025',
        note: 'Labour Force Survey: employment, unemployment, participation rate'
    },
    model_calibration: {
        source: 'BNM Working Papers, IMF Article IV, DOSM IO Tables 2015',
        note: 'Elasticities and structural parameters calibrated from published research'
    }
});

// ============================================================================
// MODEL EQUATIONS REFERENCE
// Maps variable names to their equation numbers in the model file
// ============================================================================

export const EQUATION_REFERENCES = Object.freeze({
    consumption: {
        variable: 'PCONS',
        equation: 'Group 1, line 35',
        description: 'Error-correction consumption function',
        key_params: 'MPC=0.55, wealth elast=0.08, credit elast=0.0843',
        file: 'model/malaysia-quarterly-model.md#L35'
    },
    durable_consumption: {
        variable: 'CDUR',
        equation: 'Group 1, line 40',
        description: 'Durable consumption (vehicles, appliances)',
        file: 'model/malaysia-quarterly-model.md#L40'
    },
    property_prices: {
        variable: 'PRP',
        equation: 'Group 1, line 45',
        description: 'Property price equation',
        file: 'model/malaysia-quarterly-model.md#L45'
    },
    investment: {
        variable: 'IBUSX',
        equation: 'Group 3, line 137',
        description: 'Private business investment (error-correction)',
        key_params: 'Output elast=1.05, OPR elast=-0.0015',
        file: 'model/malaysia-quarterly-model.md#L137'
    },
    housing_investment: {
        variable: 'IH',
        equation: 'Group 3, line 157',
        description: 'Housing investment (sensitive to mortgage rates)',
        file: 'model/malaysia-quarterly-model.md#L157'
    },
    employment: {
        variable: 'EMS',
        equation: 'Group 4, line 179',
        description: 'Market sector employment (Okun coefficient ~0.45)',
        file: 'model/malaysia-quarterly-model.md#L179'
    },
    foreign_workers: {
        variable: 'EFOR',
        equation: 'Group 4, line 205',
        description: 'Foreign worker equation',
        file: 'model/malaysia-quarterly-model.md#L205'
    },
    ee_exports: {
        variable: 'XEE',
        equation: 'Group 5, line 222',
        description: 'E&E exports (semiconductor cycle driven)',
        key_params: 'Demand elast=1.05, REER elast=-0.28',
        file: 'model/malaysia-quarterly-model.md#L222'
    },
    services_exports: {
        variable: 'XS',
        equation: 'Group 5, line 225',
        description: 'Services exports (tourism)',
        key_params: 'Tourism elast=0.85, REER elast=-0.18',
        file: 'model/malaysia-quarterly-model.md#L225'
    },
    imports: {
        variable: 'MS',
        equation: 'Group 6, line 272',
        description: 'Services imports (error-correction)',
        file: 'model/malaysia-quarterly-model.md#L272'
    },
    wages: {
        variable: 'PSAVEI',
        equation: 'Group 7, line 296',
        description: 'Wage Phillips curve',
        key_params: 'Productivity elast=0.52, price elast=0.25',
        file: 'model/malaysia-quarterly-model.md#L296'
    },
    cpi: {
        variable: 'CPI',
        equation: 'Group 7, line 355',
        description: 'CPI with administered prices',
        key_params: 'Admin weight=22%, GST/SST treatment',
        file: 'model/malaysia-quarterly-model.md#L355'
    },
    administered_prices: {
        variable: 'PADMIN',
        equation: 'Group 7, line 359',
        description: 'Administered price index (RON95, diesel, electricity)',
        file: 'model/malaysia-quarterly-model.md#L359'
    },
    oil_demand: {
        variable: 'TDOIL',
        equation: 'Group 8, line 399',
        description: 'Domestic oil demand',
        file: 'model/malaysia-quarterly-model.md#L399'
    },
    palm_oil: {
        variable: 'CPOPROD',
        equation: 'Group 8, line 415',
        description: 'CPO production (weather-dependent)',
        file: 'model/malaysia-quarterly-model.md#L415'
    },
    gov_expenditure: {
        variable: 'GOVEXP',
        equation: 'Group 9, line 497',
        description: 'Total government expenditure (OE + DE)',
        file: 'model/malaysia-quarterly-model.md#L497'
    },
    fuel_subsidy: {
        variable: 'FUELSUB',
        equation: 'Group 9, line 473',
        description: 'Fuel subsidy (BUDI95 mechanism)',
        file: 'model/malaysia-quarterly-model.md#L473'
    },
    gov_revenue: {
        variable: 'GOVREV',
        equation: 'Group 10, line 582',
        description: 'Total government revenue',
        file: 'model/malaysia-quarterly-model.md#L582'
    },
    petronas_dividend: {
        variable: 'PETDIV',
        equation: 'Group 10, line 570',
        description: 'Petronas dividend to government',
        file: 'model/malaysia-quarterly-model.md#L570'
    },
    sst: {
        variable: 'TSST',
        equation: 'Group 10, line 552',
        description: 'Sales and Service Tax revenue',
        file: 'model/malaysia-quarterly-model.md#L552'
    },
    mgs10: {
        variable: 'MGS10',
        equation: 'Group 13, line 715',
        description: '10-year MGS yield equation',
        file: 'model/malaysia-quarterly-model.md#L715'
    },
    household_income: {
        variable: 'HHDI',
        equation: 'Group 15, line 779',
        description: 'Household disposable income',
        file: 'model/malaysia-quarterly-model.md#L779'
    },
    gdp: {
        variable: 'GDPM',
        equation: 'Group 16, line 831',
        description: 'GDP at market prices (expenditure approach)',
        file: 'model/malaysia-quarterly-model.md#L831'
    },
    current_account: {
        variable: 'CB',
        equation: 'Group 11, line 644',
        description: 'Current account balance',
        file: 'model/malaysia-quarterly-model.md#L644'
    },
    fiscal_balance: {
        variable: 'GOVBAL',
        equation: 'Group 12, line 671',
        description: 'Government fiscal balance',
        file: 'model/malaysia-quarterly-model.md#L671'
    },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get baseline value for a variable
 */
export function getBaseline(key) {
    return BASELINE[key];
}

/**
 * Get calibration parameter
 */
function getCalibration(key) {
    return CALIBRATION[key];
}

/**
 * Get equation reference for a variable
 */
export function getEquationRef(key) {
    return EQUATION_REFERENCES[key];
}

/**
 * Get data source citation
 */
export function getDataSource(key) {
    return DATA_SOURCES[key];
}

/**
 * Format a value with appropriate units
 */
export function formatValue(key, value) {
    const formatters = {
        gdp_millions_rm: v => `RM${(v / 1000).toFixed(1)}bn`,
        gdp_growth: v => `${v.toFixed(1)}%`,
        cpi_index: v => v.toFixed(1),
        cpi_inflation: v => `${v.toFixed(1)}%`,
        unemployment: v => `${v.toFixed(1)}%`,
        labour_force: v => `${(v).toFixed(0)}k`,
        fx: v => v.toFixed(4),
        opr: v => `${v.toFixed(2)}%`,
        brent: v => `$${v.toFixed(2)}`,
        cpo: v => `RM${v.toFixed(0)}`,
    };
    return formatters[key] ? formatters[key](value) : value;
}

/**
 * Get all baseline values as a flat object for model input
 */
export function getBaselineInputs() {
    return {
        brent: BASELINE.brent,
        cpo: BASELINE.cpo,
        semi: BASELINE.semi,
        tour: BASELINE.tour,
        opr: BASELINE.opr,
        fx: BASELINE.fx,
        devgr: BASELINE.devgr,
        wpg: BASELINE.wpg,
        equity: BASELINE.equity,
        ust10: BASELINE.ust10,
        sst: BASELINE.sst,
        cpoduty: BASELINE.cpoduty,
        epf: BASELINE.epf,
        elnino: false,
        budi95: true,
    };
}
