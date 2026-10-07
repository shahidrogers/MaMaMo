import { StructuralModelEngine, parseQuarter } from './model-engine.js';
import { FISCAL_ANCHORS, OTHER_BASELINE } from './baseline-data.js';

/**
 * MaMaMo solver — baseline-plus-deviation quarterly model.
 *
 * The baseline path (GDP, prices, unemployment, fiscal plan) is an input taken
 * from the run pack's `baseline` layer. The model computes how far a scenario
 * moves the economy away from that path, through demand, price, labour,
 * external and fiscal blocks. With no overrides the output reproduces the
 * baseline exactly.
 *
 * Units: real/nominal flows in RM bn per quarter internally; fiscal flows are
 * reported as annualised rates (x4); rates and growth in percent (y/y).
 *
 * Parameters are calibrated, not estimated. Sources noted where they exist;
 * the rest are judgement calls kept deliberately round.
 */
export const PARAMS = Object.freeze({
    // --- Fuel pricing ---
    LITRES_PER_BBL: 159,
    PUMP_COST: 0.45,            // RM/litre margins, logistics; fits RM2.60 (2025) and RM4.52 (Oct 2026)
    BUDI95_LITRES_Q: 3.4,       // bn litres/quarter at BUDI95 price (300-litre quota); fits ~RM40bn 2026 fuel subsidy bill
    BUDI95_SHARE: 0.85,         // share of RON95 volume sold at the subsidised price
    OTHER_FUEL_LITRES_Q: 1.25,  // bn litres/quarter of controlled diesel (East Malaysia, fleet)
    DIESEL_CONTROLLED: 2.15,    // RM/litre
    LPG_SUBSIDY_Q: 0.9,         // RM bn/quarter at the Budget 2026 oil anchor, scales with oil in RM

    // --- Prices ---
    FUEL_CPI_WEIGHT: 0.055,     // RON95 in CPI basket (approx. DOSM weights)
    FX_PT_CORE: 0.12,           // long-run core pass-through of 1% depreciation (BNM estimates are low)
    WPG_PT_CORE: 0.10,          // world goods prices to core
    ENERGY_PT_CORE: 0.02,       // pump/diesel prices to core via logistics, airfares
    CORE_ADJ: 0.25,             // quarterly adjustment speed of import-cost pass-through
    PHILLIPS: 0.08,             // core level drift per 1% output gap per quarter
    SST_CPI: 0.2,               // CPI level effect of 1pp service tax (services ~25% of basket, 80% pass-through)
    ELNINO_FOOD: 0.6,           // headline CPI level effect of El Nino via food, %
    WAGE_INDEX: 0.5,            // long-run wage indexation to prices
    WAGE_ADJ: 0.15,

    // --- Demand ---
    INCOME_SHARE: 0.35,         // household income response to a GDP deviation
    YD_SHARE: 0.60,             // household disposable income / GDP
    MPC_INCOME: 0.55,
    MPC_CASH: 0.75,             // targeted transfers go to lower-income households
    EPF_SPENT: 0.55,            // share of EPF withdrawals eventually spent (i-Sinar/i-Citra experience)
    EPF_SPEND_RATE: 0.35,       // share of the unspent pool spent each quarter
    C_ADJ: 0.45,
    RATE_C: -0.4,               // % of consumption per 100bp, after ~4 quarters
    EQUITY_C: 0.02,
    ACCEL: 1.0,                 // % investment per 1% output gap
    RATE_I: -3.0,               // % of investment per 100bp
    SEMI_I: 0.15,               // E&E capex sensitivity to the chip cycle
    EQUITY_I: 0.05,
    UST_I: -1.0,                // % investment per 100bp of US yields (financing conditions)
    CORPTAX_I: 0.3,             // investment response per RM of corporate tax
    I_ADJ: 0.3,
    PUBLIC_CAPEX_SHARE: 0.75,   // share of development expenditure that is capital formation

    // --- Trade (shares of real exports; DOSM trade data, rounded) ---
    EE_SHARE: 0.40,
    TOUR_SHARE: 0.06,
    OTHER_SHARE: 0.38,
    CPO_SHARE: 0.04,
    EE_ELAST: 1.05,
    TOUR_ELAST: 0.85,
    OTHER_FX_ELAST: 0.2,        // high import content limits the competitiveness gain
    OTHER_SEMI_ELAST: 0.2,
    ELNINO_CPO_VOL: -0.06,
    M_EE: 0.55,                 // import content (DOSM IO tables, rounded)
    M_OTHER_X: 0.30,
    M_TOUR: 0.10,
    M_C: 0.25,
    M_I: 0.45,
    M_G: 0.20,
    M_FX: -0.05,                // import volume response to 1% depreciation

    // --- Labour ---
    OKUN: 0.25,                 // low: foreign labour absorbs much of the cycle
    U_ADJ: 0.4,

    // --- Nominal GDP and external ---
    DEFL_CPI: 0.6,
    ENERGY_X_GDP: 0.09,         // crude, LNG and products exports / GDP
    ENERGY_M_GDP: 0.075,        // petroleum product imports / GDP
    CPO_X_GDP: 0.04,
    FX_DEFL: 0.05,

    // --- Financial ---
    MGS_OPR: 0.6,
    MGS_UST: 0.4,
    MORTGAGE_SPREAD: 1.75,
    CREDIT_OPR: -0.8,
    CREDIT_GAP: 0.5,
    PRP_OPR: -1.0,
    PRP_GAP: 0.6,

    // --- Fiscal ---
    NONPET_BUOYANCY: 0.9,
    PITA_ELAST: 1.4,            // operating leverage on upstream profits
    SST_PER_PP: 2.5,            // RM bn/year per 1pp service tax
    CPO_DUTY_BASE: 25,          // RM bn/year of CPO exports subject to duty, at baseline price
    AVG_DEBT_RATE: 4.0,         // % effective interest rate on federal debt
    ROLLOVER: 0.035,            // share of debt repriced each quarter
});

const P = PARAMS;

function r1(v) { return Math.round(v * 10) / 10; }
function r2(v) { return Math.round(v * 100) / 100; }
function r3(v) { return Math.round(v * 1000) / 1000; }

function lagSafe(lagFn, name, periods, fallback) {
    try { return lagFn(name, periods); }
    catch { return fallback; }
}

function ln(v) { return Math.log(Math.max(1e-9, v)); }

/** Unsubsidised pump price, RM/litre: refined product cost converted at FX plus fixed margins. */
export function marketFuelPrice(brent, crack, fx) {
    return (brent + crack) * fx / P.LITRES_PER_BBL + P.PUMP_COST;
}

function quotaFactor(quota) {
    return Math.min(1, 0.75 + 0.25 * quota / 300);
}

/** Quarterly fuel subsidy bill, RM bn. */
function fuelSubsidy({ pMkt, budi95On, budiPrice, quota, oilRatio }) {
    const budi = budi95On ? P.BUDI95_LITRES_Q * quotaFactor(quota) * Math.max(0, pMkt - budiPrice) : 0;
    const diesel = P.OTHER_FUEL_LITRES_Q * Math.max(0, pMkt - P.DIESEL_CONTROLLED);
    const lpg = P.LPG_SUBSIDY_Q * oilRatio;
    return { budi, other: diesel + lpg, total: budi + diesel + lpg };
}

/**
 * Quarterly federal government accounts, RM bn per quarter.
 * Called twice per quarter: once for the scenario, once for the reference.
 */
function fiscalAccounts(x) {
    const nonPet = x.planNonPet / 4 * Math.pow(x.nominalRatio, P.NONPET_BUOYANCY)
        + P.SST_PER_PP * x.dSst / 4
        + (x.hhTax + x.corpTax + x.indTax) / 4
        + P.CPO_DUTY_BASE / 4 * (x.cpoDuty / 100 * x.cpoRatio - x.cpoDutyRef / 100);
    const pita = FISCAL_ANCHORS.pita / 4 * Math.pow(x.oilRatioLagged, P.PITA_ELAST);
    const royalty = FISCAL_ANCHORS.royalty / 4 * x.oilRatio;
    const otherPet = FISCAL_ANCHORS.otherPetroleum / 4 * x.oilRatio;
    const dividend = x.petDiv / 4;
    const petroleum = pita + royalty + otherPet + dividend;
    const revenue = nonPet + petroleum;

    const sub = fuelSubsidy(x);
    const otherOperating = x.planOex / 4 + (x.govCons + x.cashAid) / 4 + x.interestDev;
    const development = x.planDe / 4 + x.devExp / 4;
    const expenditure = otherOperating + sub.total + development;
    return {
        nonPet, pita, royalty, otherPet, dividend, petroleum, revenue,
        subsidy: sub.total, budi95Subsidy: sub.budi, otherSubsidy: sub.other,
        otherOperating, development, expenditure,
        balance: revenue - expenditure,
    };
}

/**
 * Create a run pack from raw data objects (e.g. loaded from JSON files).
 * Quarters are taken from the baseline layer when present, otherwise from
 * the first series in the scenario layer.
 *
 * @returns {Object} A run pack ready for model execution
 * @throws {Error} If no quarters can be inferred
 */
export function createRunPackFromFiles(historical, scenario, policy, demographic, calibration, preprocess, baseline = {}) {
    const source = Object.keys(baseline).length ? baseline : scenario;
    const quarters = Object.keys(source[Object.keys(source)[0]] || {});
    if (quarters.length === 0) throw new Error('No quarters found in run pack data');
    return { quarters, historical, scenario, policy, demographic, calibration, preprocess, baseline };
}

/**
 * Run the MaMaMo model for all quarters in the run pack.
 *
 * @param {Object} runPack - Run pack with a `baseline` layer (see createBaselineRunPack)
 * @param {Object} [options={}] - Engine options (reserved)
 * @returns {Array<Object>} One result per quarter: headline indicators,
 *   deviations from baseline, fiscal accounts, and state for the next quarter
 * @throws {Error} If the run pack has no baseline layer
 *
 * @example
 * import { runModel } from './src/model-solver.js';
 * import { createBaselineRunPack, applyOverrides } from './src/run-pack.js';
 *
 * const pack = applyOverrides(createBaselineRunPack(), { PBRENT: 120 });
 * const results = runModel(pack);
 */
export function runModel(runPack, options = {}) {
    if (!runPack.baseline || !runPack.baseline.BASE_YR) {
        throw new Error('Run pack has no baseline layer. Build it with createBaselineRunPack() from src/run-pack.js.');
    }
    const engine = new StructuralModelEngine(runPack, options);
    const firstForecast = runPack.meta?.firstForecastQuarter ?? runPack.quarters[0];

    return engine.run(({ quarter, getInput, getReference, lag }) => {
        const prev = (name, fallback = 0) => lagSafe(lag, name, 1, fallback);
        const prevN = (name, n, fallback = 0) => lagSafe(lag, name, n, fallback);
        const year = parseQuarter(quarter).year;

        // --- Baseline levels for this quarter ---
        const Yr = getReference('BASE_YR');
        const Yn = getReference('BASE_YN');
        const C = getReference('BASE_C');
        const I = getReference('BASE_I');
        const X = getReference('BASE_X');
        const M = getReference('BASE_M');
        const Xn = getReference('BASE_XN');
        const Mn = getReference('BASE_MN');
        const defl = Yn / Yr;

        // --- Inputs and reference values ---
        const inp = name => getInput(name);
        const ref = name => getReference(name);
        const brent = inp('PBRENT'); const brentRef = ref('PBRENT');
        const crack = inp('CRACK'); const crackRef = ref('CRACK');
        const fx = inp('USDMYR'); const fxRef = ref('USDMYR');
        const cpo = inp('PCPO'); const cpoRef = ref('PCPO');
        const opr = inp('OPR'); const oprRef = ref('OPR');
        const ust10 = inp('UST10'); const ust10Ref = ref('UST10');
        const sst = inp('SSTRATE'); const sstRef = ref('SSTRATE');
        const cpoDuty = inp('CPODRATE'); const cpoDutyRef = ref('CPODRATE');
        const budi95On = inp('BUDI95') === 1; const budi95OnRef = ref('BUDI95') === 1;
        const budiPrice = inp('BUDI95PRICE'); const budiPriceRef = ref('BUDI95PRICE');
        const quota = inp('BUDI95QUOTA'); const quotaRef = ref('BUDI95QUOTA');
        const lever = name => inp(name) - ref(name);

        const oilRM = brent * fx;
        const oilRMRef = brentRef * fxRef;
        const oilDev = 100 * ln(oilRM / oilRMRef);
        const pMkt = marketFuelPrice(brent, crack, fx);
        const pMktRef = marketFuelPrice(brentRef, crackRef, fxRef);
        const productDev = 100 * ln(pMkt / pMktRef);
        const fxDev = 100 * ln(fx / fxRef);
        const cpoDev = 100 * ln(cpo / cpoRef);
        const semiDev = 100 * ln(inp('WSTD') / ref('WSTD'));
        const tourDev = 100 * ln(inp('WTOUR') / ref('WTOUR'));
        const wpgDev = 100 * ln(inp('WPG') / ref('WPG'));
        const eqDev = 100 * ln(inp('WEQPR') / ref('WEQPR'));
        const elnino = lever('ELNINO');
        const dOpr = opr - oprRef;
        const dUst = ust10 - ust10Ref;
        const dSst = sst - sstRef;

        // --- Interest rates ---
        const dOprAvg = (dOpr + prev('D_OPR') + prevN('D_OPR', 2) + prevN('D_OPR', 3)) / 4;
        const dMgs = P.MGS_OPR * dOpr + P.MGS_UST * dUst;

        // --- Prices: CPI level deviations in % ---
        const consumerFuel = (on, pSub, q, mkt) => {
            const s = on ? P.BUDI95_SHARE * quotaFactor(q) : 0;
            return s * pSub + (1 - s) * mkt;
        };
        const pEff = consumerFuel(budi95On, budiPrice, quota, pMkt);
        const pEffRef = consumerFuel(budi95OnRef, budiPriceRef, quotaRef, pMktRef);
        const fuelLev = 100 * ln(pEff / pEffRef);

        const coreTarget = P.FX_PT_CORE * fxDev + P.WPG_PT_CORE * wpgDev + P.ENERGY_PT_CORE * productDev;
        const coreImp = prev('CORE_IMP') + P.CORE_ADJ * (coreTarget - prev('CORE_IMP'));
        const corePc = prev('CORE_PC') + P.PHILLIPS * prev('GAP');
        const sstLev = P.SST_CPI * dSst;
        const foodLev = prev('FOOD_LEV') + 0.4 * (P.ELNINO_FOOD * elnino - prev('FOOD_LEV'));
        const cpiAdj = lever('CPIADJ');
        const coreLev = coreImp + corePc + sstLev;
        const pLev = P.FUEL_CPI_WEIGHT * fuelLev + (1 - P.FUEL_CPI_WEIGHT) * (coreImp + corePc) + sstLev + foodLev + cpiAdj;

        const cpi = ref('BASE_CPI') + pLev - prevN('P_LEV', 4);
        const core = ref('BASE_CORE') + coreLev - prevN('CORE_LEV', 4);

        // --- Wages and household income (real RM bn per quarter) ---
        const wageLev = prev('WAGE_LEV') + P.WAGE_ADJ * (P.WAGE_INDEX * pLev - prev('WAGE_LEV')) + 0.1 * prev('GAP');
        const realIncomeLoss = (pLev - wageLev) / 100 * P.YD_SHARE * Yr;
        const dYd = P.INCOME_SHARE * prev('DY') - realIncomeLoss - lever('HHTAX') / 4 / defl;
        const dCash = lever('CASHAID') / 4 / defl;

        const epfIn = lever('EPFWDRAW') * P.EPF_SPENT / defl;
        const epfAvailable = prev('EPF_POOL') + epfIn;
        const epfSpend = P.EPF_SPEND_RATE * epfAvailable;
        const epfPool = epfAvailable - epfSpend;

        // --- Demand deviations (real RM bn per quarter) ---
        const cTarget = P.MPC_INCOME * dYd + P.MPC_CASH * dCash
            + C * (P.RATE_C * dOprAvg + P.EQUITY_C * eqDev) / 100;
        const dCcore = prev('DC_CORE') + P.C_ADJ * (cTarget - prev('DC_CORE'));
        const dC = dCcore + epfSpend;

        const iTarget = I * (P.ACCEL * prev('GAP') + P.RATE_I * dOprAvg + P.SEMI_I * semiDev
            + P.EQUITY_I * eqDev + P.UST_I * dUst) / 100
            - P.CORPTAX_I * lever('CORPTAX') / 4 / defl;
        const dI = prev('DI') + P.I_ADJ * (iTarget - prev('DI'));
        const dIg = P.PUBLIC_CAPEX_SHARE * lever('DEVEXP') / 4 / defl;
        const dG = lever('GOVCONS') / 4 / defl;

        const dXee = prev('DXEE') + 0.5 * (X * P.EE_SHARE * P.EE_ELAST * semiDev / 100 - prev('DXEE'));
        const dXt = prev('DXT') + 0.6 * (X * P.TOUR_SHARE * P.TOUR_ELAST * tourDev / 100 - prev('DXT'));
        const dXo = prev('DXO') + 0.25 * (X * P.OTHER_SHARE * (P.OTHER_FX_ELAST * fxDev + P.OTHER_SEMI_ELAST * semiDev) / 100 - prev('DXO'));
        const cpoEl = prev('CPO_EL') + 0.3 * (elnino - prev('CPO_EL'));
        const dXc = X * P.CPO_SHARE * P.ELNINO_CPO_VOL * cpoEl;
        const dX = dXee + dXt + dXo + dXc;

        const mFx = prev('M_FX') + 0.3 * (M * P.M_FX * fxDev / 100 - prev('M_FX'));
        const dM = P.M_EE * dXee + P.M_OTHER_X * dXo + P.M_TOUR * dXt
            + P.M_C * dC + P.M_I * (dI + dIg) + P.M_G * dG + mFx;

        const dY = dC + dI + dIg + dG + dX - dM;
        const gap = 100 * dY / Yr;

        // --- Labour ---
        const du = prev('DU') + P.U_ADJ * (-P.OKUN * gap - prev('DU'));
        const unemp = ref('BASE_UNEMP') + du;

        // --- Nominal GDP and external ---
        const deflDev = P.DEFL_CPI * pLev + P.ENERGY_X_GDP * oilDev - P.ENERGY_M_GDP * productDev
            + P.CPO_X_GDP * cpoDev + P.FX_DEFL * fxDev;
        const yReal = Yr + dY;
        const yNom = Yn * (1 + gap / 100) * (1 + deflDev / 100);
        const dNetExports = defl * (dX - dM)
            + Yn * (P.ENERGY_X_GDP * oilDev - P.ENERGY_M_GDP * productDev + P.CPO_X_GDP * cpoDev) / 100;
        const tradeBal = 100 * (Xn - Mn + dNetExports) / yNom;
        const baseTradeBal = 100 * (Xn - Mn) / Yn;
        const ca = OTHER_BASELINE.currentAccountPct + tradeBal - baseTradeBal;

        // --- Fiscal ---
        const anchor = FISCAL_ANCHORS.oilAnchorRmPerBbl;
        const oilRatio = oilRM / anchor;
        const oilRatioRef = oilRMRef / anchor;
        const oilRatioLagged = (prev('OILRM') + prevN('OILRM', 2)) / 2 / anchor;
        const oilRatioLaggedRef = (prev('OILRM_REF') + prevN('OILRM_REF', 2)) / 2 / anchor;
        const debtPrev = prev('GOVDEBT', FISCAL_ANCHORS.debtEnd2025);
        const debtPrevRef = prev('GOVDEBT_REF', FISCAL_ANCHORS.debtEnd2025);
        const effRateDev = prev('EFF_RATE_DEV') + P.ROLLOVER * (dMgs - prev('EFF_RATE_DEV'));
        const interestDev = (debtPrevRef * effRateDev + (debtPrev - debtPrevRef) * P.AVG_DEBT_RATE) / 400;
        const nominalRatioPrev = prev('NOMINAL_RATIO', 1);

        const common = {
            planNonPet: ref('PLAN_NONPET'), planOex: ref('PLAN_OEX'), planDe: ref('PLAN_DE'),
            cpoDutyRef,
        };
        const fiscal = fiscalAccounts({
            ...common,
            nominalRatio: (yNom / Yn + nominalRatioPrev) / 2,
            dSst, hhTax: lever('HHTAX'), corpTax: lever('CORPTAX'), indTax: lever('INDTAX'),
            cpoDuty, cpoRatio: cpo / cpoRef,
            oilRatio, oilRatioLagged, petDiv: inp('PETDIV'),
            pMkt, budi95On, budiPrice, quota,
            govCons: lever('GOVCONS'), cashAid: lever('CASHAID'), devExp: lever('DEVEXP'),
            interestDev,
        });
        const fiscalRef = fiscalAccounts({
            ...common,
            nominalRatio: 1,
            dSst: 0, hhTax: 0, corpTax: 0, indTax: 0,
            cpoDuty: cpoDutyRef, cpoRatio: 1,
            oilRatio: oilRatioRef, oilRatioLagged: oilRatioLaggedRef, petDiv: ref('PETDIV'),
            pMkt: pMktRef, budi95On: budi95OnRef, budiPrice: budiPriceRef, quota: quotaRef,
            govCons: 0, cashAid: 0, devExp: 0,
            interestDev: 0,
        });
        const govDebt = debtPrev - fiscal.balance;
        const govDebtRef = debtPrevRef - fiscalRef.balance;
        const nominalLast4 = yNom + prev('YN') + prevN('YN', 2) + prevN('YN', 3);

        // --- Household finance ---
        const creditG = OTHER_BASELINE.creditGrowth + P.CREDIT_OPR * dOprAvg + P.CREDIT_GAP * gap;
        const creditLev = prev('CREDIT_LEV') + (creditG - OTHER_BASELINE.creditGrowth) / 4;
        const hhDebt = OTHER_BASELINE.householdDebtPct * (1 + creditLev / 100) / (yNom / Yn);
        const prpG = OTHER_BASELINE.propertyPriceGrowth + P.PRP_OPR * dOprAvg + P.PRP_GAP * gap;
        const nomW = OTHER_BASELINE.nominalWageGrowth + wageLev - prevN('WAGE_LEV', 4);

        // --- Growth rates ---
        const yRealLag4 = prevN('YR', 4, Yr / (1 + ref('BASE_GDPG') / 100));
        const cReal = C + dC;
        const cRealLag4 = prevN('CR', 4, null);
        const gdp = 100 * (yReal / yRealLag4 - 1);
        const ann = v => v * 4;

        return {
            q: quarter.replace(/^(\d{4})Q([1-4])$/, (_, y, qtr) => `Q${qtr} ${y}`),
            year,
            isForecast: quarter >= firstForecast,

            // Inputs (echoed for charts)
            brent: r2(brent),
            crack: r2(crack),
            fx: r3(fx),
            opr: r2(opr),
            ron95: r2(pMkt),
            ron95Pump: r2(budi95On ? budiPrice : pMkt),
            subLitre: r2(budi95On ? Math.max(0, pMkt - budiPrice) : 0),

            // Activity
            gdp: r2(gdp),
            gdpBase: r2(ref('BASE_GDPG')),
            gdpDev: r3(gap),
            gdpReal: r1(yReal),
            gdpNominal: r1(yNom),
            consG: cRealLag4 ? r2(100 * (cReal / cRealLag4 - 1)) : null,
            inv: r2(100 * (dI + dIg) / I),
            unemp: r2(unemp),

            // Contributions to the GDP level deviation, % of baseline GDP
            gdpConsCtr: r3(100 * (dC * (1 - P.M_C)) / Yr),
            gdpInvCtr: r3(100 * ((dI + dIg) * (1 - P.M_I)) / Yr),
            gdpFiscalCtr: r3(100 * (dG * (1 - P.M_G)) / Yr),
            gdpNetExpCtr: r3(100 * (dX - P.M_EE * dXee - P.M_OTHER_X * dXo - P.M_TOUR * dXt - mFx) / Yr),
            gdpInflationDrag: r3(-100 * P.MPC_INCOME * realIncomeLoss / Yr),

            // Prices
            cpi: r2(cpi),
            cpiBase: r2(ref('BASE_CPI')),
            core: r2(core),
            adminInf: r2(P.FUEL_CPI_WEIGHT * (fuelLev - prevN('FUEL_LEV', 4))),
            importInf: r2((1 - P.FUEL_CPI_WEIGHT) * (coreImp - prevN('CORE_IMP', 4))),
            sstInf: r2(sstLev - prevN('SST_LEV', 4)),
            nomW: r2(nomW),
            realW: r2(nomW - cpi),

            // Financial
            mgs10: r2(OTHER_BASELINE.mgs10 + dMgs),
            rmort: r2(opr + P.MORTGAGE_SPREAD),
            creditG: r2(creditG),
            prpG: r2(prpG),
            debt: r1(hhDebt),

            // External (RM bn annualised; % of GDP)
            exp: r1(ann(Xn + defl * dX + Yn * (P.ENERGY_X_GDP * oilDev + P.CPO_X_GDP * cpoDev) / 100)),
            imp: r1(ann(Mn + defl * dM + Yn * P.ENERGY_M_GDP * productDev / 100)),
            tradeBal: r2(tradeBal),
            primInc: OTHER_BASELINE.primaryIncomePct,
            transfers: OTHER_BASELINE.secondaryIncomePct,
            ca: r2(ca),

            // Fiscal (RM bn annualised; % of GDP)
            govRev: r1(ann(fiscal.revenue)),
            govExp: r1(ann(fiscal.expenditure)),
            govBal: r1(ann(fiscal.balance)),
            fiscal: r2(100 * fiscal.balance / yNom),
            fiscalBase: r2(100 * fiscalRef.balance / Yn),
            petRev: r1(ann(fiscal.petroleum)),
            pita: r1(ann(fiscal.pita)),
            petDiv: r1(ann(fiscal.dividend)),
            sub: r1(ann(fiscal.subsidy)),
            subBudi95: r1(ann(fiscal.budi95Subsidy)),
            subCostDelta: r2(ann(fiscal.subsidy - fiscalRef.subsidy)),
            govDebt: r1(govDebt),
            govDebtPct: r2(100 * govDebt / nominalLast4),

            // Quarterly fiscal flows (RM bn, not annualised) for calendar-year sums
            fq: {
                revenue: fiscal.revenue, expenditure: fiscal.expenditure, balance: fiscal.balance,
                petroleum: fiscal.petroleum, nonPetroleum: fiscal.nonPet, subsidy: fiscal.subsidy,
                otherOperating: fiscal.otherOperating, development: fiscal.development,
            },
            fqRef: {
                revenue: fiscalRef.revenue, expenditure: fiscalRef.expenditure, balance: fiscalRef.balance,
                petroleum: fiscalRef.petroleum, nonPetroleum: fiscalRef.nonPet, subsidy: fiscalRef.subsidy,
                otherOperating: fiscalRef.otherOperating, development: fiscalRef.development,
            },

            // State for the next quarter
            D_OPR: dOpr,
            CORE_IMP: coreImp,
            CORE_PC: corePc,
            CORE_LEV: coreLev,
            FOOD_LEV: foodLev,
            FUEL_LEV: fuelLev,
            SST_LEV: sstLev,
            P_LEV: pLev,
            WAGE_LEV: wageLev,
            EPF_POOL: epfPool,
            DC_CORE: dCcore,
            DI: dI,
            DXEE: dXee,
            DXT: dXt,
            DXO: dXo,
            CPO_EL: cpoEl,
            M_FX: mFx,
            DY: dY,
            GAP: gap,
            DU: du,
            YR: yReal,
            YN: yNom,
            YN_REF: Yn,
            CR: cReal,
            OILRM: oilRM,
            OILRM_REF: oilRMRef,
            NOMINAL_RATIO: yNom / Yn,
            EFF_RATE_DEV: effRateDev,
            GOVDEBT: govDebt,
            GOVDEBT_REF: govDebtRef,
            CREDIT_LEV: creditLev,
        };
    });
}

/**
 * Aggregate quarterly results into calendar years.
 * Years are reported only when all four quarters were simulated.
 *
 * @param {Array<Object>} results - Output of runModel
 * @param {Object} runPack - The run pack used (for prior-year history)
 * @returns {Array<Object>} One summary per complete calendar year
 */
export function summariseYears(results, runPack) {
    const byYear = new Map();
    for (const r of results) {
        if (!byYear.has(r.year)) byYear.set(r.year, []);
        byYear.get(r.year).push(r);
    }
    const history = runPack.meta?.annualHistory ?? {};
    const out = [];
    let prevReal = null;
    let prevRealRef = null;
    for (const [year, rows] of byYear) {
        if (rows.length !== 4) continue;
        const sum = (fn) => rows.reduce((s, r) => s + fn(r), 0);
        const avg = (fn) => sum(fn) / 4;
        const real = sum(r => r.YR);
        const realRef = sum(r => r.YR - r.DY);
        const nominal = sum(r => r.YN);
        const nominalRef = sum(r => r.YN_REF);
        const lastYearReal = prevReal ?? history[year - 1]?.gdpReal ?? null;
        const lastYearRealRef = prevRealRef ?? history[year - 1]?.gdpReal ?? null;
        const flows = key => sum(r => r.fq[key]);
        const flowsRef = key => sum(r => r.fqRef[key]);
        const last = rows[3];
        out.push({
            year,
            gdpGrowth: lastYearReal ? r2(100 * (real / lastYearReal - 1)) : null,
            gdpGrowthBase: lastYearRealRef ? r2(100 * (realRef / lastYearRealRef - 1)) : null,
            gdpLevelDev: r2(100 * (real / realRef - 1)),
            nominalGdp: r1(nominal),
            cpi: r2(avg(r => r.cpi)),
            cpiBase: r2(avg(r => r.cpiBase)),
            core: r2(avg(r => r.core)),
            unemp: r2(avg(r => r.unemp)),
            ca: r2(avg(r => r.ca)),
            revenue: r1(flows('revenue')),
            expenditure: r1(flows('expenditure')),
            balance: r1(flows('balance')),
            balancePct: r2(100 * flows('balance') / nominal),
            balancePctBase: r2(100 * flowsRef('balance') / nominalRef),
            petroleumRevenue: r1(flows('petroleum')),
            nonPetroleumRevenue: r1(flows('nonPetroleum')),
            fuelSubsidy: r1(flows('subsidy')),
            fuelSubsidyBase: r1(flowsRef('subsidy')),
            otherOperating: r1(flows('otherOperating')),
            development: r1(flows('development')),
            debt: r1(last.GOVDEBT),
            debtPct: r2(100 * last.GOVDEBT / nominal),
            debtPctBase: r2(100 * last.GOVDEBT_REF / nominalRef),
        });
        prevReal = real;
        prevRealRef = realRef;
    }
    return out;
}

