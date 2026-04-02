import { StructuralModelEngine, prevQuarter } from './model-engine.js';

const DEFAULTS = {
    GDP_MILLIONS_RM: 1850000,
    GDP_GROWTH: 4.2,
    CPI_INFLATION: 2.3,
    CORE_INFLATION: 1.8,
    OPR: 3.0,
    BRENT: 82,
    CPO: 4000,
    FX: 3.89,
    UNEMPLOYMENT: 3.4,
    FISCAL_PCT: -3.2,
    GOV_REVENUE_BLN: 200,
    GOV_EXPENDITURE_BLN: 260,
    PETRONAS_PROFIT_BLN: 95,
    PITA_REVENUE_BLN: 36.1,
    PETRONAS_DIVIDEND_BLN: 28.5,
    FUEL_SUBSIDY_BLN: 8.4,
    RON95_BUDI_PRICE: 1.99,
    RON95_MARKET_PRICE: 2.54,
    EXPORTS_BLN: 980,
    IMPORTS_BLN: 850,
    CURRENT_ACCOUNT_PCT: 2.1,
    BUSINESS_INVESTMENT_BLN: 230,
    PUBLIC_INVESTMENT_BLN: 120,
    HOUSING_INVESTMENT_BLN: 75,
    HOUSEHOLD_DEBT_RATIO: 84.2,
    REAL_WAGE_GROWTH: 1.9,
    NOMINAL_WAGE_GROWTH: 4.2,
    CONSUMPTION_GROWTH: 5.5,
    CREDIT_GROWTH: 5.2,
    PROPERTY_PRICE_GROWTH: 3.8,
    TRADE_BALANCE_PCT: 7.0,
    PRIMARY_INCOME_PCT: -4.2,
    TRANSFERS_PCT: -0.7,
    SEMI: 100,
    TOUR: 100,
    DEVGR: 2.0,
    WPG: 100,
    EQUITY: 100,
    UST10: 4.25,
    SST: 6,
    CPODUTY: 8,
    EPF: 0,
};

const PARAMS = {
    OIL_ADMIN_PT: 0.15,
    W_ADMIN: 0.22,
    IMPORT_PT: 0.40,
    MPC: 0.55,
    OKUN: 0.45,
    REER_EXP_ELAST: -0.25,
    EE_ELAST: 1.05,
    TOUR_ELAST: 0.85,
    PET_TAX: 0.38,
    EE_SHARE: 0.38,
    OIL_SHARE: 0.08,
    CPO_SHARE: 0.05,
    FUEL_LITRES_Q: 3.5,
    BUDI95_COVERAGE: 0.92,
    OPR_CONS: -0.0072,
    OPR_INV: -0.0015,
    WAGE_PRICE_PT: 0.52,
};

function r1(v) { return Math.round(v * 10) / 10; }
function r2(v) { return Math.round(v * 100) / 100; }
function r3(v) { return Math.round(v * 1000) / 1000; }

function lagSafe(lagFn, name, periods, fallback) {
    try { return lagFn(name, periods); }
    catch { return fallback; }
}

export function createRunPackFromFiles(historical, scenario, policy, demographic, calibration, preprocess) {
    const quarters = Object.keys(scenario[Object.keys(scenario)[0]] || {});
    if (quarters.length === 0) throw new Error('No quarters found in scenario data');
    return { quarters, historical, scenario, policy, demographic, calibration, preprocess };
}

export function runModel(runPack, options = {}) {
    const engine = new StructuralModelEngine(runPack, options);

    return engine.run(({ quarter, getInput, lag, prevQuarter: pq }) => {
        const quarters = runPack.quarters;
        const q = quarters.indexOf(quarter);
        const isQ0 = q === 0;

        // --- Read exogenous inputs ---
        const brent = getInput('PBRENT');
        const cpo = getInput('PCPO');
        const semi = getInput('WSTD');
        const tour = getInput('WTOUR');
        const opr = getInput('OPR');
        const fx = getInput('USDMYR') || getInput('REER');
        const devgr = getInput('DEVGR') * 100;
        const wpg = getInput('WPG');
        const equity = getInput('WEQPR');
        const ust10 = getInput('UST10');
        const sst = getInput('SSTRATE') * 100;
        const cpoduty = getInput('CPODRATE') * 100;
        const epf = getInput('EPFWDRAW') / 1000;
        const elnino = getInput('ELNINO');
        const budi95On = getInput('BUDI95') === 1;
        const reer = getInput('REER');
        const wcpi = getInput('WCPI');

        // Preprocess-derived stocks
        const dlfdi = getInput('DLFDI');
        const fliab = getInput('FLIAB');
        const dafdi = getInput('DAFDI');
        const fasset = getInput('FASSET');
        const eqfli = getInput('EQFLI');
        const bfli = getInput('BFLI');
        const otfli = getInput('OTFLI');
        const eqfa = getInput('EQFA');
        const bfa = getInput('BFA');
        const otfa = getInput('OTFA');
        const creditPath = getInput('CREDIT');
        const hararea = getInput('HARAREA');
        const nnoilgva = getInput('NNOILGVA');
        const govdebtadj = getInput('GOVDEBTADJ') || 0;

        // Calibration
        const mcci = getInput('MCCI');
        const iib = getInput('IIB');
        const sib = getInput('SIB');
        const ndiv = getInput('NDIV');
        const petmarg = getInput('PETMARG');
        const sstadj = getInput('SSTADJ');
        const adjw = getInput('ADJW');
        const gwadj = getInput('GWADJ');
        const ergov = getInput('ERGOV');

        // Demographic
        const trgdp = getInput('TRGDP');
        const popal = getInput('POPAL');
        const wap = getInput('WAP');

        // --- Compute shocks relative to baseline ---
        const oilShk = (brent - DEFAULTS.BRENT) / DEFAULTS.BRENT;
        const cpoShk = (cpo - DEFAULTS.CPO) / DEFAULTS.CPO;
        const fxShk = (fx - DEFAULTS.FX) / DEFAULTS.FX;
        const oprD = opr - DEFAULTS.OPR;
        const semiShk = (semi - DEFAULTS.SEMI) / DEFAULTS.SEMI;
        const tourShk = (tour - DEFAULTS.TOUR) / DEFAULTS.TOUR;
        const devD = devgr - DEFAULTS.DEVGR;
        const wpgShk = (wpg - DEFAULTS.WPG) / DEFAULTS.WPG;
        const eqShk = (equity - DEFAULTS.EQUITY) / DEFAULTS.EQUITY;
        const ust10D = ust10 - DEFAULTS.UST10;
        const sstD = sst - DEFAULTS.SST;
        const cpoDutyD = cpoduty - DEFAULTS.CPODUTY;

        // --- Baseline trends ---
        const t = q / (quarters.length - 1);
        const baselineGdpGrowth = DEFAULTS.GDP_GROWTH + (4.15 - DEFAULTS.GDP_GROWTH) * t;
        const baselineCpi = DEFAULTS.CPI_INFLATION + (2.35 - DEFAULTS.CPI_INFLATION) * t;
        const baselineCore = DEFAULTS.CORE_INFLATION + (1.95 - DEFAULTS.CORE_INFLATION) * t;
        const baselineUnemp = DEFAULTS.UNEMPLOYMENT + (3.45 - DEFAULTS.UNEMPLOYMENT) * t;
        const baselineFiscal = DEFAULTS.FISCAL_PCT + (-3.1 - DEFAULTS.FISCAL_PCT) * t;
        const baselineGovRev = DEFAULTS.GOV_REVENUE_BLN + (204 - DEFAULTS.GOV_REVENUE_BLN) * t;
        const baselineGovExp = DEFAULTS.GOV_EXPENDITURE_BLN + (261.5 - DEFAULTS.GOV_EXPENDITURE_BLN) * t;
        const baselineExports = DEFAULTS.EXPORTS_BLN + (1000 - DEFAULTS.EXPORTS_BLN) * t;
        const baselineImports = DEFAULTS.IMPORTS_BLN + (872 - DEFAULTS.IMPORTS_BLN) * t;
        const baselineCa = DEFAULTS.CURRENT_ACCOUNT_PCT + (2.0 - DEFAULTS.CURRENT_ACCOUNT_PCT) * t;
        const baselineDebt = DEFAULTS.HOUSEHOLD_DEBT_RATIO + (84.5 - DEFAULTS.HOUSEHOLD_DEBT_RATIO) * t;
        const baselineConsG = DEFAULTS.CONSUMPTION_GROWTH + (5.3 - DEFAULTS.CONSUMPTION_GROWTH) * t;
        const baselineCreditG = DEFAULTS.CREDIT_GROWTH + (4.9 - DEFAULTS.CREDIT_GROWTH) * t;
        const baselinePrpG = DEFAULTS.PROPERTY_PRICE_GROWTH + (4.1 - DEFAULTS.PROPERTY_PRICE_GROWTH) * t;
        const baselineTradeBal = DEFAULTS.TRADE_BALANCE_PCT + (6.65 - DEFAULTS.TRADE_BALANCE_PCT) * t;
        const baselinePrimInc = DEFAULTS.PRIMARY_INCOME_PCT + (-4.0 - DEFAULTS.PRIMARY_INCOME_PCT) * t;
        const baselineTransfers = DEFAULTS.TRANSFERS_PCT + (-0.65 - DEFAULTS.TRANSFERS_PCT) * t;
        const baselineBusInv = DEFAULTS.BUSINESS_INVESTMENT_BLN + (236 - DEFAULTS.BUSINESS_INVESTMENT_BLN) * t;
        const baselinePubInv = DEFAULTS.PUBLIC_INVESTMENT_BLN + (122 - DEFAULTS.PUBLIC_INVESTMENT_BLN) * t;
        const baselineHouseInv = DEFAULTS.HOUSING_INVESTMENT_BLN + (77 - DEFAULTS.HOUSING_INVESTMENT_BLN) * t;
        const baselineMgs10 = 0.85 * DEFAULTS.OPR + 0.15 * DEFAULTS.UST10 + 1.85;
        const baselineNomWG = DEFAULTS.NOMINAL_WAGE_GROWTH + (4.35 - DEFAULTS.NOMINAL_WAGE_GROWTH) * t;
        const baselineRealWG = baselineNomWG - baselineCpi;

        // --- Monetary policy block (Group 13) ---
        const mgs10 = baselineMgs10 + 0.72 * oprD + 0.12 * ust10D;
        const blr = opr + 2.25;
        const alr = 0.85 * blr + 0.15 * (opr + 1.50);
        const rdep = opr - 0.50;
        const rmort = opr + 1.75;
        const rcorp = mgs10 + 1.20;
        const rocb = mgs10 + 1.80;

        // --- Prices block (Group 7) ---
        const importInf = PARAMS.IMPORT_PT * (fxShk + 0.3 * oilShk + 0.5 * wpgShk) * 100;
        const sstInf = sstD * 0.3;
        const coreInf = baselineCore + importInf * 0.3 * Math.min(1, 0.3 + 0.1 * q)
            + (oprD < 0 ? -oprD * 0.4 : -oprD * 0.2)
            + semiShk * 0.3 + sstInf * Math.min(1, 0.3 + 0.1 * q)
            + wpgShk * 2 * Math.min(1, 0.3 + 0.1 * q);

        const ron95Mkt = 2.54 + (brent - DEFAULTS.BRENT) * fx / DEFAULTS.FX * 0.012;
        const ron95Pump = budi95On ? DEFAULTS.RON95_BUDI_PRICE : ron95Mkt;
        const baseConsumerRon95 = DEFAULTS.RON95_BUDI_PRICE * PARAMS.BUDI95_COVERAGE + 2.54 * (1 - PARAMS.BUDI95_COVERAGE);
        const ron95Consumer = budi95On
            ? (DEFAULTS.RON95_BUDI_PRICE * PARAMS.BUDI95_COVERAGE + ron95Mkt * (1 - PARAMS.BUDI95_COVERAGE))
            : ron95Mkt;
        const fuelPriceShockPct = ((ron95Consumer / baseConsumerRon95) - 1) * 100;
        const adminInf = PARAMS.OIL_ADMIN_PT * fuelPriceShockPct;
        const subShock = !budi95On
            ? Math.max(0, fuelPriceShockPct) * (q === 0 ? 0.08 : q === 1 ? 0.03 : 0.01 * Math.pow(0.5, q - 2))
            : 0;
        const headCpi = baselineCpi + (coreInf - baselineCore) + PARAMS.W_ADMIN * adminInf + subShock
            + elnino * 0.8 * (q < 4 ? 1 : 0.5);

        // PCPI index evolution
        const prevPcpiIndex = isQ0 ? 131.2 : lag('PCPI_INDEX');
        const pcpiIndex = prevPcpiIndex * Math.exp(headCpi / 400);

        // --- Consumption block (Group 1) ---
        const prevPcons = isQ0 ? 471300 : lag('PCONS');
        const prevRhhdi = isQ0 ? 442100 : lag('RHHDI');
        const prevNfwpe = isQ0 ? 887000 : lag('NFWPE');
        const prevCreditLevel = isQ0 ? 2064000 : lag('CREDIT_LEVEL');
        const prevUnemp = isQ0 ? baselineUnemp : lag('unemp');
        const prevMcci = isQ0 ? 102 : lag('MCCI_LEVEL');

        // Real disposable income growth
        const rhhdiGrowth = (baselineNomWG - headCpi) + 0.08 * tourShk * 100 + (epf > 0 ? 0.12 * epf : 0);
        const rhhdi = prevRhhdi * Math.exp(rhhdiGrowth / 100);

        // Net financial wealth
        const propertyPriceG = baselinePrpG + 0.9 * ((baselineNomWG - headCpi) - baselineRealWG)
            - 0.35 * (rmort - (DEFAULTS.OPR + 1.75)) - 0.2 * (headCpi - baselineCpi);
        const nfwpe = prevNfwpe * Math.exp((0.25 * propertyPriceG + 0.15 * eqShk * 100) / 100);

        // Credit level
        const creditG = baselineCreditG + 0.45 * (propertyPriceG - baselinePrpG)
            + 0.35 * ((baselineNomWG - headCpi) - baselineRealWG)
            - 0.9 * oprD - 0.25 * (headCpi - baselineCpi) + (epf > 0 ? 0.08 * epf : 0);
        const creditLevel = prevCreditLevel * Math.exp(creditG / 100);

        // MCCI level
        const mcciLevel = prevMcci * Math.exp((0.2 * (semiShk + tourShk) - 0.1 * Math.max(0, oprD)) / 100);

        // ECM consumption equation
        const dlogRhhdi = Math.log(rhhdi / prevRhhdi);
        const dCreditReal = Math.log((creditLevel / (pcpiIndex / 100)) / (prevCreditLevel / (prevPcpiIndex / 100)));
        const dRealRate = q < 4 ? 0 : (opr - (headCpi - (((pcpiIndex / lagSafe(lag, 'PCPI_INDEX', 4, prevPcpiIndex)) - 1) * 100)));
        const dMcci = Math.log(mcciLevel / prevMcci);
        const dLfsur = prevUnemp - (q < 2 ? baselineUnemp : lagSafe(lag, 'unemp', 2, prevUnemp));
        const ecmCons = Math.log(prevPcons) - 0.55 * Math.log(prevRhhdi)
            - 0.08 * Math.log(prevNfwpe / (prevPcpiIndex / 100))
            - 0.12 * Math.log(prevCreditLevel / (prevPcpiIndex / 100));

        const consDlog = 0.1824 + 0.1385 * dlogRhhdi - 0.0072 * dLfsur
            + 0.0843 * dCreditReal - 0.0005 * dRealRate
            - 0.1080 * ecmCons + 0.0382 * dMcci;

        // Baseline consumption
        const basePcons = prevPcons * Math.exp(baselineConsG / 100);
        const baseConsDlog = Math.log(basePcons / prevPcons);
        const pcons = basePcons * Math.exp(consDlog - baseConsDlog);

        const epfBoost = epf > 0
            ? (epf / (DEFAULTS.GDP_MILLIONS_RM / 1000)) * 100 * PARAMS.MPC * (q < 4 ? 0.6 : 0.2)
            : 0;
        const consG0 = ((pcons / prevPcons) - 1) * 100 + epfBoost - sstD * 0.3;

        // --- Export block (Group 5) ---
        const prevXee = isQ0 ? 370.8 : lag('XEE_LEVEL');
        const prevXs = isQ0 ? 58.5 : lag('XS_LEVEL');
        const prevWstd = isQ0 ? DEFAULTS.SEMI : lag('WSTD_LEVEL');
        const prevWtour = isQ0 ? DEFAULTS.TOUR : lag('WTOUR_LEVEL');
        const prevReer = isQ0 ? 100 : lag('REER_LEVEL');

        const prevXee2 = q < 2 ? prevXee : lagSafe(lag, 'XEE_LEVEL', 2, prevXee);
        const prevXs2 = q < 2 ? prevXs : lagSafe(lag, 'XS_LEVEL', 2, prevXs);
        const prevWstd2 = q < 2 ? prevWstd : lagSafe(lag, 'WSTD_LEVEL', 2, prevWstd);
        const prevWtour2 = q < 2 ? prevWtour : lagSafe(lag, 'WTOUR_LEVEL', 2, prevWtour);

        const dlogXeeLag = q < 2 ? 0 : Math.log(prevXee / prevXee2);
        const dlogXsLag = q < 2 ? 0 : Math.log(prevXs / prevXs2);
        const dlogWstdLag = Math.log(Math.max(1e-6, semi / prevWstd));
        const dlogWtour = Math.log(Math.max(1e-6, tour / prevWtour));
        const dlogReer = Math.log(Math.max(1e-6, reer / prevReer));

        const xeeEcm = Math.log(prevXee) - 1.05 * Math.log(prevWstd) + 0.25 * Math.log(prevReer);
        const xsEcm = Math.log(prevXs) - 0.92 * Math.log(prevWtour) + 0.15 * Math.log(prevReer);

        const eeExpDlog = 0.15 * dlogXeeLag + 1.05 * dlogWstdLag - 0.28 * dlogReer
            - 0.135 * xeeEcm - 0.028;
        const tourExpDlog = 0.32 * dlogXsLag + 0.85 * dlogWtour - 0.18 * dlogReer
            - 0.095 * xsEcm - 0.018;

        // Baseline export growth
        const baseEeExpDlog = 0.15 * dlogXeeLag + 1.05 * Math.log(Math.max(1e-6, DEFAULTS.SEMI / prevWstd))
            - 0.28 * Math.log(Math.max(1e-6, 100 / prevReer))
            - 0.135 * (Math.log(prevXee) - 1.05 * Math.log(prevWstd) + 0.25 * Math.log(prevReer)) - 0.028;
        const baseTourExpDlog = 0.32 * dlogXsLag + 0.85 * Math.log(Math.max(1e-6, DEFAULTS.TOUR / prevWtour))
            - 0.18 * Math.log(Math.max(1e-6, 100 / prevReer))
            - 0.095 * (Math.log(prevXs) - 0.92 * Math.log(prevWtour) + 0.15 * Math.log(prevReer)) - 0.018;

        const eeExpG = (eeExpDlog - baseEeExpDlog) * 100;
        const tourExpG = (tourExpDlog - baseTourExpDlog) * 100;

        const oilExpG = (oilShk * 0.6 + fxShk * 0.4) * 100;
        const cpoExpG = (cpoShk + elnino * 0.03 - cpoDutyD * 0.005) * 100;
        const otherExpG = (semiShk * 0.3 + fxShk * PARAMS.REER_EXP_ELAST * -0.5 + wpgShk * 0.15) * 100;

        const baseEeExp = baselineExports * PARAMS.EE_SHARE;
        const eeExp = baseEeExp * Math.exp(eeExpDlog - baseEeExpDlog);
        const oilExp = baselineExports * PARAMS.OIL_SHARE * (1 + oilExpG / 100);
        const cpoExp = baselineExports * PARAMS.CPO_SHARE * (1 + cpoExpG / 100);
        const baseTourExp = baselineExports * 0.06;
        const tourExp = baseTourExp * Math.exp(tourExpDlog - baseTourExpDlog);
        const otherExp = baselineExports * 0.43 * (1 + otherExpG / 100);
        const exports = eeExp + oilExp + cpoExp + tourExp + otherExp;

        // --- Import block (Group 6) ---
        const consImpG = 0.15 * (consG0 - baselineConsG) / 10;
        const invBaseline = baselineGdpGrowth * 1.2;
        const invG = invBaseline + oprD * PARAMS.OPR_INV * 300 + devD * 0.8
            + semiShk * 15 - Math.max(0, headCpi - 5) * 0.5 - ust10D * 0.3 + eqShk * 3;
        const invImpG = 0.22 * (invG - invBaseline) / 10;
        const exportImpG = 0.60 * PARAMS.EE_SHARE * (eeExpG / 100) + 0.45 * 0.43 * (otherExpG / 100)
            + 0.08 * 0.06 * (tourExpG / 100)
            + 0.52 * (PARAMS.OIL_SHARE * (oilExpG / 100) + PARAMS.CPO_SHARE * (cpoExpG / 100));
        const impG = consImpG + invImpG + exportImpG + fxShk * 0.10 + wpgShk * 0.15;
        const imports = baselineImports * Math.exp(impG);

        // --- Labour market (Group 4) ---
        const prevEms = isQ0 ? 12600 : lag('EMS_LEVEL');
        const prevEms2 = q < 2 ? prevEms : lagSafe(lag, 'EMS_LEVEL', 2, prevEms);
        const prevMsgva = isQ0 ? 1438000 : lag('MSGVA_LEVEL');
        const prevMsgva2 = q < 2 ? prevMsgva : lagSafe(lag, 'MSGVA_LEVEL', 2, prevMsgva);
        const prevPsavei = isQ0 ? 118 : lag('PSAVEI_INDEX');
        const prevPmsgva = isQ0 ? 121 : lag('PMSGVA_INDEX');

        const dlogMsgvaLag = q < 2 ? 0 : Math.log(prevMsgva / prevMsgva2);
        const emsEcm = Math.log(prevEms / prevMsgva) + 0.35 * Math.log(prevPsavei / prevPmsgva);
        const dlogEms = -0.0098 + 0.38 * Math.log(prevEms / Math.max(1e-6, prevEms2))
            + 0.22 * Math.log(prevEms / Math.max(1e-6, prevEms2))
            + 0.205 * dlogMsgvaLag - 0.0075 * emsEcm;
        const baseEms = prevEms * Math.exp(baselineGdpGrowth / 100 * 0.4);
        const ems = baseEms * Math.exp(dlogEms);

        const prevEfor = isQ0 ? 2000 : lag('EFOR_LEVEL');
        const dlogEfor = 0.45 * Math.log(Math.max(1e-6, prevMsgva / prevMsgva2))
            - 0.12 * (Math.log(prevEfor) - 0.65 * Math.log(prevMsgva)) + 0.008;
        const efor = prevEfor * Math.exp(dlogEfor);

        const labourForce = baseEms / Math.max(1e-6, 1 - baselineUnemp / 100);
        const unemp = Math.max(2.5, Math.min(6.0,
            baselineUnemp + ((baseEms - ems) / Math.max(1e-6, labourForce)) * 100));

        // --- Wages (Group 7) ---
        const prevPmsgva2 = q < 2 ? prevPmsgva : lagSafe(lag, 'PMSGVA_INDEX', 2, prevPmsgva);
        const prevPmsgva3 = q < 3 ? prevPmsgva : lagSafe(lag, 'PMSGVA_INDEX', 3, prevPmsgva);
        const dlogPmsgva = Math.log((100 + headCpi) / 100);
        const dlogPmsgva1 = Math.log(prevPmsgva / prevPmsgva2);
        const dlogPmsgva2v = Math.log(prevPmsgva2 / prevPmsgva3);
        const dlogPmsgva3v = q < 3 ? dlogPmsgva2v : Math.log(prevPmsgva3 / lagSafe(lag, 'PMSGVA_INDEX', 4, prevPmsgva2));
        const wageEcm = Math.log(prevPsavei) - Math.log(prevMsgva / prevEms) - Math.log(prevPmsgva) + 0.012 * unemp;
        const dlogPsavei = -0.022 + 0.52 * dlogPmsgva + 0.28 * dlogPmsgva1 + 0.12 * dlogPmsgva2v
            + (1 - 0.52 - 0.28 - 0.12) * dlogPmsgva3v
            - 0.0075 * (unemp - prevUnemp)
            + 0.22 * (Math.log(prevMsgva / prevMsgva2) - Math.log(ems / prevEms))
            + 0.25 * (Math.log((100 + headCpi) / prevPcpiIndex) - dlogPmsgva)
            - 0.038 * wageEcm;
        const psavei = prevPsavei * Math.exp(dlogPsavei);
        const nomWG = baselineNomWG + 0.10 * Math.log(psavei / prevPsavei) * 100;
        const realWG = nomWG - headCpi;

        // --- GDP aggregation ---
        const gdpDenom = DEFAULTS.GDP_MILLIONS_RM / 1000;
        const gdpConsCtr = 0.55 * (consG0 - baselineConsG) / 10;
        const gdpInvCtr = 0.23 * (invG - invBaseline) / 10;
        const totExpG = PARAMS.EE_SHARE * eeExpG / 100 + PARAMS.OIL_SHARE * oilExpG / 100
            + PARAMS.CPO_SHARE * cpoExpG / 100 + 0.06 * tourExpG / 100 + 0.43 * otherExpG / 100;
        const gdpNetExpCtr = 0.13 * (totExpG - impG * 0.9) * 5;
        const gdpFiscalCtr = devD * 0.15;
        const gdpInflationDrag = -Math.max(0, headCpi - 8) * 0.15;
        const gdpG0 = baselineGdpGrowth + gdpConsCtr + gdpInvCtr + gdpNetExpCtr + gdpFiscalCtr + gdpInflationDrag;
        const consG = consG0 - 0.35 * (unemp - baselineUnemp);
        const gdpConsCtrFinal = 0.55 * (consG - baselineConsG) / 10;
        const gdpG = baselineGdpGrowth + gdpConsCtrFinal + gdpInvCtr + gdpNetExpCtr + gdpFiscalCtr + gdpInflationDrag;

        const baseGdpLevel = (isQ0 ? 1835000 : lag('GDPM_LEVEL')) * Math.exp(baselineGdpGrowth / 100);
        const gdpLevel = baseGdpLevel * Math.exp((gdpG - baselineGdpGrowth) / 100);
        const msgva = gdpLevel * 0.78;

        // --- Investment ---
        const businessInv = baselineBusInv * (1 + (invG - invBaseline) / 100);
        const publicInv = baselinePubInv * (1 + devD * 0.04);
        const housingInv = baselineHouseInv * (1 + 0.0095 * (consG - baselineConsG)
            - 0.0082 * (propertyPriceG - baselinePrpG) - 0.03 * (rmort - (DEFAULTS.OPR + 1.75)));
        const totalInv = businessInv + publicInv + housingInv;

        // --- Household debt ---
        const debtR = baselineDebt + 0.25 * (creditG - baselineCreditG)
            + 0.15 * (propertyPriceG - baselinePrpG) + oprD * 0.5
            - (gdpG - baselineGdpGrowth) * 0.3 + (epf > 0 ? -epf * 0.02 : 0);

        // --- Balance of Payments (Group 11) ---
        const eqReturn = Math.log(Math.max(1e-6, equity / DEFAULTS.EQUITY));
        const rexc = (dlfdi / fliab) * (1.50 + 2.20 * eqReturn + 0.45 * opr / 4)
            + (eqfli / fliab) * (0.50 + 0.20 * eqReturn)
            + (bfli / fliab) * (0.35 + 0.90 * mgs10 / 4)
            + (otfli / fliab) * (0.10 + 0.70 * opr / 4);
        const rexd = (dafdi / fasset) * (0.80 + 2.80 * (DEFAULTS.PETRONAS_PROFIT_BLN / gdpDenom) / 100)
            + (eqfa / fasset) * (0.65 + 0.20 * eqReturn)
            + (bfa / fasset) * (0.30 + 1.10 * mgs10 / 4)
            + (otfa / fasset) * (0.20 + 0.15 * opr / 4 + 0.60 * rocb / 4);
        const prevCipd = isQ0 ? 19.3 : lag('CIPD');
        const prevDipd = isQ0 ? 98.2 : lag('DIPD');
        const cipd = (0.68 * prevCipd / fliab + (1 - 0.68) * rexc / 100) * fliab;
        const dipd = (0.58 * prevDipd / fasset + (1 - 0.58) * rexd / 100) * fasset;
        const nipd = cipd - dipd;

        const prevRemitOut = isQ0 ? 7.5 : lag('REMITOUT');
        const prevNeer = isQ0 ? 100 : lag('NEER_INDEX');
        const neer = prevNeer * (reer / (isQ0 ? 100 : lag('REER_LEVEL')))
            * (pcpiIndex / prevPcpiIndex) / (wcpi / (isQ0 ? wcpi : lag('WCPI_INDEX')));
        const remitOut = prevRemitOut * Math.exp(
            0.45 * Math.log(efor / prevEfor)
            + 0.35 * Math.log(Math.max(1e-6, psavei / prevPsavei))
            - 0.08 * Math.log(Math.max(1e-6, neer / prevNeer)) + 0.005);
        const prevRemitIn = isQ0 ? 3.0 : lag('REMITIN');
        const remitIn = prevRemitIn * (gdpLevel / (isQ0 ? 1835000 : lag('GDPM_LEVEL')));
        const prevGovTran = isQ0 ? 0.8 : lag('GOVTRAN');
        const govTran = prevGovTran * (gdpLevel / (isQ0 ? 1835000 : lag('GDPM_LEVEL')));
        const remitNet = remitIn - remitOut;
        const tranB = remitNet + govTran;

        const tb = exports - imports;
        const cb = tb + nipd + tranB;
        const tradeBalPct = baselineTradeBal + 0.22 * (((exports - baselineExports) - (imports - baselineImports)) / gdpDenom * 100);
        const primaryIncomePct = baselinePrimInc + ((nipd - (baselinePrimInc * gdpDenom / 100)) / gdpDenom) * 100;
        const transfersPct = baselineTransfers + ((tranB - (baselineTransfers * gdpDenom / 100)) / gdpDenom) * 100;
        const caPct = tradeBalPct + primaryIncomePct + transfersPct;

        // --- Fiscal block (Groups 9-10, 12) ---
        const effBrent = brent;
        const brentRM = effBrent * fx;
        const baseBrentRM = DEFAULTS.BRENT * DEFAULTS.FX;
        const petProfit = DEFAULTS.PETRONAS_PROFIT_BLN * (brentRM / baseBrentRM);
        const pitaRev = petProfit * PARAMS.PET_TAX;
        const prevPetProfit = isQ0 ? DEFAULTS.PETRONAS_PROFIT_BLN : lag('PETPROF');
        const prevPetDiv = isQ0 ? DEFAULTS.PETRONAS_DIVIDEND_BLN : lag('PETDIV');
        const petDiv = prevPetDiv * (0.5 + 0.5 * (petProfit / prevPetProfit));

        const subsidisedLitresQ = budi95On ? PARAMS.FUEL_LITRES_Q * PARAMS.BUDI95_COVERAGE : 0;
        const baseSubLitre = Math.max(0, 2.54 - DEFAULTS.RON95_BUDI_PRICE);
        const subLitre = budi95On ? Math.max(0, ron95Mkt - DEFAULTS.RON95_BUDI_PRICE) : 0;
        const annSub = budi95On
            ? DEFAULTS.FUEL_SUBSIDY_BLN + (subLitre - baseSubLitre) * subsidisedLitresQ * 4
            : 0;

        const cpoDutyRev = (cpoduty / 100) * cpo * 0.000045;
        const baseCpoDutyRev = (DEFAULTS.CPODUTY / 100) * DEFAULTS.CPO * 0.000045;
        const sstRevDelta = sstD * 2.0 / 4;

        const govws = isQ0 ? 90 : lag('GOVWS');
        const govsup = isQ0 ? 32 : lag('GOVSUP');
        const govsubBase = isQ0 ? 18 : lag('GOVSUB_BASE');
        const avgbr = 0.70 * mgs10 + 0.30 * (opr + 0.50);
        const prevGovDebt = isQ0 ? 1180 : lag('GOVDEBT');
        const prevAvgbr = isQ0 ? avgbr : lag('AVGBR');
        const govdsc = (isQ0 ? 23 : lag('GOVDSC')) * (avgbr / prevAvgbr) * (prevGovDebt / (isQ0 ? 1180 : lag('GOVDEBT')));
        const govgrant = (isQ0 ? 4.8 : lag('GOVGRANT')) * (1 + (gdpG - baselineGdpGrowth) / 100 * 0.5);
        const govpen = (isQ0 ? 8.5 : lag('GOVPEN')) * (govws / (isQ0 ? 90 : lag('GOVWS'))) * 1.015;
        const govotr = isQ0 ? 7.2 : lag('GOVOTR');
        const bshtrf = isQ0 ? 1.2 : lag('BSHTRF');
        const govoe = govws + govsup + govdsc + govsubBase + annSub + bshtrf + govgrant + govpen + govotr;
        const govdevps = (isQ0 ? 76 : lag('GOVDEVPS')) * (gdpLevel / (isQ0 ? 1835000 : lag('GDPM_LEVEL'))) * (1 + devgr / 100);
        const govexpStruct = govoe + govdevps;

        const tyind = (isQ0 ? 30 : lag('TYIND')) * (psavei / prevPsavei) * (1 + 0.5 * ((unemp - prevUnemp) / Math.max(1e-6, prevUnemp)));
        const tycorp = 0.24 * ((isQ0 ? 65 : lag('FYCORP')) + ((mgs10 + 1.2) - (opr - 0.5)) / 100 * creditLevel * 0.25) * 0.70;
        const trpgt = (isQ0 ? 3 : lag('TRPGT')) * (propertyPriceG / Math.max(0.1, baselinePrpG)) * (gdpLevel / (isQ0 ? 1835000 : lag('GDPM_LEVEL')));
        const tstamp = (isQ0 ? 6 : lag('TSTAMP')) * (gdpLevel / (isQ0 ? 1835000 : lag('GDPM_LEVEL')));
        const tsst = (sst / 100) * (pcons * (pcpiIndex / 100) + 0.3 * govws) * 1.0 / 1000;
        const texcise = (isQ0 ? 11 : lag('TEXCISE')) * ((pcons * (pcpiIndex / 100)) / Math.max(1e-6, lagSafe(lag, 'PCONS', 1, pcons) * (lagSafe(lag, 'PCPI_INDEX', 1, prevPcpiIndex) / 100)));
        const timport = (isQ0 ? 4 : lag('TIMPORT')) * (imports / Math.max(1e-6, isQ0 ? baselineImports : lag('imp', 1, baselineImports)));
        const texport = (cpoduty / 100) * cpoExp;
        const govrevStruct = tyind + tycorp + pitaRev + trpgt + tstamp + tsst + texcise + timport + texport
            + petDiv + (isQ0 ? 4 : lag('GOVINVI')) + (isQ0 ? 5.5 : lag('GOVFEES')) + (isQ0 ? 6 : lag('GOVOREV'));
        const govbal = govrevStruct - govexpStruct;
        const govDebt = prevGovDebt - govbal + govdebtadj;
        const fiscalPctStruct = (govbal / gdpLevel) * 100;

        // --- Price indices ---
        const padminIndex = (isQ0 ? 122 : lag('PADMIN_INDEX')) * Math.exp(0.15 * Math.log(Math.max(1e-6, (effBrent / fx) / (DEFAULTS.BRENT / DEFAULTS.FX))));
        const pmnogIndex = (isQ0 ? 119 : lag('PMNOG_INDEX')) * Math.exp(0.55 * dlogPmsgva + 0.28 * Math.log(Math.max(1e-6, wpg / (isQ0 ? DEFAULTS.WPG : lag('WPG_LEVEL'))) / Math.max(1e-6, neer / prevNeer)));
        const ppiIndex = (isQ0 ? 120 : lag('PPI_INDEX')) * Math.exp(0.35 * Math.log(psavei / prevPsavei) + 0.2 * Math.log(pmnogIndex / (isQ0 ? 119 : lag('PMNOG_INDEX'))) + 0.1 * Math.log(padminIndex / (isQ0 ? 122 : lag('PADMIN_INDEX'))));
        const cpixIndex = (isQ0 ? 131 : lag('CPIX_INDEX')) * Math.exp(0.4 * Math.log(ppiIndex / (isQ0 ? 120 : lag('PPI_INDEX'))) + 0.3 * Math.log(pmnogIndex / (isQ0 ? 119 : lag('PMNOG_INDEX'))) + 0.2 * Math.log(psavei / prevPsavei));
        const cpiIndex = ((isQ0 ? 131.2 : lag('CPI_INDEX')) * ((Math.pow(cpixIndex, 1 - 0.22) * Math.pow(padminIndex, 0.22)) / (Math.pow((isQ0 ? 131 : lag('CPIX_INDEX')), 1 - 0.22) * Math.pow((isQ0 ? 122 : lag('PADMIN_INDEX')), 0.22))));

        // --- GDP identities (Group 16) ---
        const gceps = govws + govsup;
        const dinv = gdpLevel - gceps - pcons - totalInv - exports + imports - 0.001 * gdpLevel;
        const gdpmps = gceps + pcons * (pcpiIndex / 100) + dinv * (cpiIndex / 100)
            + 0.001 * gdpLevel * (cpiIndex / 100) + totalInv * (cpiIndex / 100) + exports - imports;
        const pgdp = 100 * gdpmps / Math.max(1e-6, gdpLevel);

        // --- Return state for next quarter ---
        return {
            q: quarter.replace(/^(\d{4})Q([1-4])$/, (_, year, qtr) => `Q${qtr} ${year}`),
            brent: r2(effBrent),
            gdp: r2(gdpG),
            cpi: r2(headCpi),
            core: r2(coreInf),
            unemp: r2(unemp),
            fiscal: r2(fiscalPctStruct),
            govRev: r1(govrevStruct),
            govExp: r1(govexpStruct),
            pet: r1(petProfit),
            pita: r1(pitaRev),
            petDiv: r1(petDiv),
            sub: r1(annSub),
            exp: r1(exports),
            imp: r1(imports),
            ca: r2(caPct),
            consG: r2(consG),
            nomW: r2(nomWG),
            realW: r2(realWG),
            debt: r1(debtR),
            inv: r2(invG),
            ron95: r2(ron95Mkt),
            ron95Pump: r2(ron95Pump),
            subLitre: r2(subLitre),
            mgs10: r2(mgs10),
            rmort: r2(rmort),
            prpG: r2(propertyPriceG),
            creditG: r2(creditG),
            tradeBal: r2(tradeBalPct),
            primInc: r2(primaryIncomePct),
            transfers: r2(transfersPct),
            adminInf: r2(adminInf),
            importInf: r2(importInf),
            sstInf: r2(sstInf),
            cpoDuty: r2(cpoDutyRev * 4),
            sstRev: r2(sstRevDelta * 4),
            subCostDelta: r2(annSub - DEFAULTS.FUEL_SUBSIDY_BLN),
            eeExp: r1(eeExp),
            oilExp: r1(oilExp),
            cpoExp: r1(cpoExp),
            tourExp: r1(tourExp),
            otherExp: r1(otherExp),
            busInv: r1(businessInv),
            pubInv: r1(publicInv),
            houseInv: r1(housingInv),
            totalInv: r1(totalInv),
            gdpBase: baselineGdpGrowth,
            gdpConsCtr: r2(gdpConsCtrFinal),
            gdpInvCtr: r2(gdpInvCtr),
            gdpNetExpCtr: r2(gdpNetExpCtr),
            gdpFiscalCtr: r2(gdpFiscalCtr),
            gdpInflationDrag: r2(gdpInflationDrag),
            govbal: r1(govbal),
            govDebt: r1(govDebt),
            tb: r1(tb),
            nipd: r2(nipd),
            tranB: r2(tranB),
            cipd: r2(cipd),
            dipd: r2(dipd),
            remitOut: r2(remitOut),
            remitIn: r2(remitIn),
            govTran: r2(govTran),
            gdpmps: r1(gdpmps),
            pgdp: r2(pgdp),
            dinv: r1(dinv),

            // State variables for next quarter
            PCONS: r1(pcons),
            RHHDI: r1(rhhdi),
            NFWPE: r1(nfwpe),
            CREDIT_LEVEL: r1(creditLevel),
            PCPI_INDEX: r2(pcpiIndex),
            XEE_LEVEL: r1(eeExp),
            XS_LEVEL: r1(tourExp),
            WSTD_LEVEL: semi,
            WTOUR_LEVEL: tour,
            REER_LEVEL: reer,
            MCCI_LEVEL: r2(mcciLevel),
            WPG_LEVEL: wpg,
            EMS_LEVEL: r1(ems),
            EFOR_LEVEL: r1(efor),
            MSGVA_LEVEL: r1(msgva),
            PSAVEI_INDEX: r2(psavei),
            PMSGVA_INDEX: r2(pmnogIndex),
            NEER_INDEX: r2(neer),
            WCPI_INDEX: wcpi,
            REMITOUT: r2(remitOut),
            REMITIN: r2(remitIn),
            GOVTRAN: r2(govTran),
            GOVWS: r1(govws),
            GOVSUP: r1(govsup),
            GOVSUB_BASE: r1(govsubBase),
            GOVDSC: r1(govdsc),
            GOVGRANT: r1(govgrant),
            GOVPEN: r1(govpen),
            GOVOTR: r1(govotr),
            GOVDEVPS: r1(govdevps),
            GOVDEBT: r1(govDebt),
            BSHTRF: r1(bshtrf),
            AVGBR: r2(avgbr),
            TYIND: r1(tyind),
            FYCORP: r1((isQ0 ? 65 : lag('FYCORP')) * (1 + (gdpG - baselineGdpGrowth) / 100)),
            TRPGT: r1(trpgt),
            TSTAMP: r1(tstamp),
            TEXCISE: r1(texcise),
            TIMPORT: r1(timport),
            GOVINVI: r1(isQ0 ? 4 : lag('GOVINVI')),
            GOVFEES: r1(isQ0 ? 5.5 : lag('GOVFEES')),
            GOVOREV: r1(isQ0 ? 6 : lag('GOVOREV')),
            GCEPS: r1(gceps),
            GDPM_LEVEL: r1(gdpLevel),
            DINV: r1(dinv),
            GDPMPS: r1(gdpmps),
            PGDP_INDEX: r2(pgdp),
            PADMIN_INDEX: r2(padminIndex),
            PMNOG_INDEX: r2(pmnogIndex),
            PPI_INDEX: r2(ppiIndex),
            CPIX_INDEX: r2(cpixIndex),
            CPI_INDEX: r2(cpiIndex),
            PETPROF: r1(petProfit),
            PETDIV: r1(petDiv),
            CIPD: r2(cipd),
            DIPD: r2(dipd),
        };
    });
}
