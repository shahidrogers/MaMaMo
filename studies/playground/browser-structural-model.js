import { StructuralModelEngine } from './structural-model-engine.js';
import { createBaselineRunPack } from './baseline-run-pack.js';

const B = {
    gdp_millions_rm: 1850000,
    gdp_growth: 4.2,
    cpi_inflation: 2.3,
    core_inflation: 1.8,
    opr: 3.0,
    brent: 82,
    cpo: 4000,
    fx: 3.89,
    unemployment: 3.4,
    fiscal_pct: -3.2,
    gov_revenue_bln: 200,
    gov_expenditure_bln: 260,
    petronas_profit_bln: 95,
    pita_revenue_bln: 36.1,
    petronas_dividend_bln: 28.5,
    fuel_subsidy_bln: 8.4,
    ron95_budi_price: 1.99,
    ron95_market_price: 2.54,
    exports_bln: 980,
    imports_bln: 850,
    current_account_pct: 2.1,
    business_investment_bln: 230,
    public_investment_bln: 120,
    housing_investment_bln: 75,
    household_debt_ratio: 84.2,
    real_wage_growth: 1.9,
    nominal_wage_growth: 4.2,
    consumption_growth: 5.5,
    credit_growth: 5.2,
    property_price_growth: 3.8,
    trade_balance_pct: 7.0,
    primary_income_pct: -4.2,
    transfers_pct: -0.7,
    semi: 100,
    tour: 100,
    devgr: 2.0,
    wpg: 100,
    equity: 100,
    ust10: 4.25,
    sst: 6,
    cpoduty: 8,
    epf: 0,
};

const P = {
    oil_admin_pt: 0.15,
    w_admin: 0.22,
    import_pt: 0.40,
    mpc: 0.55,
    okun: 0.45,
    reer_exp_elast: -0.25,
    ee_elast: 1.05,
    tour_elast: 0.85,
    pet_tax: 0.38,
    ee_share: 0.38,
    oil_share: 0.08,
    cpo_share: 0.05,
    fuel_litres_q: 3.5,
    budi95_coverage: 0.92,
    opr_cons: -0.0072,
    opr_inv: -0.0015,
    wage_price_pt: 0.52,
};

function r1(v) {
    return Math.round(v * 10) / 10;
}

function r2(v) {
    return Math.round(v * 100) / 100;
}

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function getStructuralBaselineInputs() {
    return {
        brent: B.brent,
        cpo: B.cpo,
        semi: B.semi,
        tour: B.tour,
        opr: B.opr,
        fx: B.fx,
        devgr: B.devgr,
        wpg: B.wpg,
        equity: B.equity,
        ust10: B.ust10,
        sst: B.sst,
        cpoduty: B.cpoduty,
        epf: B.epf,
        elnino: false,
        budi95: true,
    };
}

export function createPlaygroundRunPack(inputs = getStructuralBaselineInputs()) {
    const runPack = deepClone(createBaselineRunPack());
    for (const quarter of runPack.quarters) {
        runPack.scenario.PBRENT[quarter] = inputs.brent;
        runPack.scenario.PCPO[quarter] = inputs.cpo;
        runPack.scenario.WSTD[quarter] = inputs.semi;
        runPack.scenario.WTOUR[quarter] = inputs.tour;
        runPack.scenario.WPG[quarter] = inputs.wpg;
        runPack.scenario.WEQPR[quarter] = inputs.equity;
        runPack.scenario.UST10[quarter] = inputs.ust10;
        runPack.scenario.ELNINO[quarter] = inputs.elnino ? 1 : 0;
        runPack.scenario.USDMYR[quarter] = inputs.fx;

        runPack.policy.OPR[quarter] = inputs.opr;
        runPack.policy.DEVGR[quarter] = inputs.devgr / 100;
        runPack.policy.SSTRATE[quarter] = inputs.sst / 100;
        runPack.policy.CPODRATE[quarter] = inputs.cpoduty / 100;
        runPack.policy.EPFWDRAW[quarter] = inputs.epf * 1000;
        runPack.policy.BUDI95[quarter] = inputs.budi95 !== false ? 1 : 0;
        runPack.policy.PADMINPRICE[quarter] = inputs.budi95 !== false ? B.ron95_budi_price : B.ron95_market_price;
        runPack.policy.REER[quarter] = 100 * (B.fx / inputs.fx);
    }
    return runPack;
}

function baselineQuarter(index) {
    const t = index / 7;
    const nominalWageGrowth = B.nominal_wage_growth + (4.35 - B.nominal_wage_growth) * t;
    const cpiInflation = B.cpi_inflation + (2.35 - B.cpi_inflation) * t;
    const baselineMgs10 = 0.85 * B.opr + 0.15 * B.ust10 + 1.85;
    return {
        gdp_growth: B.gdp_growth + (4.15 - B.gdp_growth) * t,
        cpi_inflation: cpiInflation,
        core_inflation: B.core_inflation + (1.95 - B.core_inflation) * t,
        unemployment: B.unemployment + (3.45 - B.unemployment) * t,
        fiscal_pct: B.fiscal_pct + (-3.1 - B.fiscal_pct) * t,
        gov_revenue_bln: B.gov_revenue_bln + (204 - B.gov_revenue_bln) * t,
        gov_expenditure_bln: B.gov_expenditure_bln + (261.5 - B.gov_expenditure_bln) * t,
        petronas_profit_bln: B.petronas_profit_bln,
        pita_revenue_bln: B.pita_revenue_bln,
        petronas_dividend_bln: B.petronas_dividend_bln,
        fuel_subsidy_bln: B.fuel_subsidy_bln,
        exports_bln: B.exports_bln + (1000 - B.exports_bln) * t,
        imports_bln: B.imports_bln + (872 - B.imports_bln) * t,
        current_account_pct: B.current_account_pct + (2.0 - B.current_account_pct) * t,
        household_debt_ratio: B.household_debt_ratio + (84.5 - B.household_debt_ratio) * t,
        real_wage_growth: nominalWageGrowth - cpiInflation,
        nominal_wage_growth: nominalWageGrowth,
        consumption_growth: B.consumption_growth + (5.3 - B.consumption_growth) * t,
        credit_growth: B.credit_growth + (4.9 - B.credit_growth) * t,
        property_price_growth: B.property_price_growth + (4.1 - B.property_price_growth) * t,
        trade_balance_pct: B.trade_balance_pct + (6.65 - B.trade_balance_pct) * t,
        primary_income_pct: B.primary_income_pct + (-4.0 - B.primary_income_pct) * t,
        transfers_pct: B.transfers_pct + (-0.65 - B.transfers_pct) * t,
        business_investment_bln: B.business_investment_bln + (236 - B.business_investment_bln) * t,
        public_investment_bln: B.public_investment_bln + (122 - B.public_investment_bln) * t,
        housing_investment_bln: B.housing_investment_bln + (77 - B.housing_investment_bln) * t,
        ron95_market_price: B.ron95_market_price,
        mgs10: baselineMgs10,
        rmort: B.opr + 1.75,
    };
}

export function runStructuralPlaygroundModel(inputs = getStructuralBaselineInputs()) {
    const runPack = createPlaygroundRunPack(inputs);
    const engine = new StructuralModelEngine(runPack);

    return engine.run(({ quarter, getInput, lag }) => {
        const q = runPack.quarters.indexOf(quarter);
        const lagBase = (baseSeries, periods = 1, fallbackSeries = baseSeries.replace(/^BASE_/, '')) =>
            lag(q < periods ? fallbackSeries : baseSeries, periods);
        const T = baselineQuarter(q);
        const decay = Math.pow(0.88, q);
        const persist = 1 - 0.08 * q;
        const build = Math.min(1, 0.3 + 0.1 * q);
        const brent = getInput('PBRENT');
        const cpo = getInput('PCPO');
        const semi = getInput('WSTD');
        const tour = getInput('WTOUR');
        const opr = getInput('OPR');
        const fx = getInput('USDMYR');
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

        const oilShk = (brent - B.brent) / B.brent;
        const cpoShk = (cpo - B.cpo) / B.cpo;
        const fxShk = (fx - B.fx) / B.fx;
        const oprD = opr - B.opr;
        const semiShk = (semi - B.semi) / B.semi;
        const tourShk = (tour - B.tour) / B.tour;
        const devD = devgr - B.devgr;
        const wpgShk = (wpg - B.wpg) / B.wpg;
        const eqShk = (equity - B.equity) / B.equity;
        const ust10D = ust10 - B.ust10;
        const sstD = sst - B.sst;
        const cpoDutyD = cpoduty - B.cpoduty;

        const effOilShk = oilShk > 0 ? oilShk * decay : oilShk * persist;
        const effBrent = B.brent * (1 + effOilShk);
        const mgs10 = T.mgs10 + 0.72 * oprD + 0.12 * ust10D;
        const baseConsumerRon95 = B.ron95_budi_price * P.budi95_coverage + T.ron95_market_price * (1 - P.budi95_coverage);
        const gdpDenom = B.gdp_millions_rm / 1000;
        const baseSubLitre = Math.max(0, T.ron95_market_price - B.ron95_budi_price);
        const importInf = P.import_pt * (fxShk + 0.3 * effOilShk + 0.5 * wpgShk) * 100;
        const sstInf = sstD * 0.3;
        const coreInf = T.core_inflation + importInf * 0.3 * build + (oprD < 0 ? -oprD * 0.4 : -oprD * 0.2) + semiShk * 0.3 + sstInf * build + wpgShk * 2 * build;
        const ron95Mkt = T.ron95_market_price + (effBrent - B.brent) * fx / B.fx * 0.012;
        const ron95Pump = budi95On ? B.ron95_budi_price : ron95Mkt;
        const ron95Consumer = budi95On ? (B.ron95_budi_price * P.budi95_coverage + ron95Mkt * (1 - P.budi95_coverage)) : ron95Mkt;
        const fuelPriceShockPct = ((ron95Consumer / baseConsumerRon95) - 1) * 100;
        const adminInf = P.oil_admin_pt * fuelPriceShockPct;
        const subShock = !budi95On ? Math.max(0, fuelPriceShockPct) * (q === 0 ? 0.08 : q === 1 ? 0.03 : 0.01 * Math.pow(0.5, q - 2)) : 0;
        const headCpi = T.cpi_inflation + (coreInf - T.core_inflation) + P.w_admin * adminInf + subShock + elnino * 0.8 * (q < 4 ? 1 : 0.5);

        const effCpo = B.cpo * (1 + cpoShk + elnino * 0.15);
        const brentRM = effBrent * fx;
        const baseBrentRM = B.brent * B.fx;
        const petProfit = T.petronas_profit_bln * (brentRM / baseBrentRM);
        const pitaRev = petProfit * P.pet_tax;
        const prevPetProfit = q === 0 ? 95 : lag('pet');
        const prevPetDiv = q === 0 ? 28.5 : lag('petDiv');
        const petDiv = q === 0
            ? T.petronas_dividend_bln * (0.5 + 0.5 * (petProfit / prevPetProfit))
            : prevPetDiv * (0.5 + 0.5 * (petProfit / prevPetProfit));

        const subsidisedLitresQ = budi95On ? P.fuel_litres_q * P.budi95_coverage : 0;
        const subLitre = budi95On ? Math.max(0, ron95Mkt - B.ron95_budi_price) : 0;
        const annSub = budi95On ? T.fuel_subsidy_bln + (subLitre - baseSubLitre) * subsidisedLitresQ * 4 : 0;
        const cpoDutyRev = (cpoduty / 100) * effCpo * 0.000045;
        const baseCpoDutyRev = (B.cpoduty / 100) * B.cpo * 0.000045;
        const sstRevDelta = sstD * 2.0 / 4;
        const govRev = T.gov_revenue_bln / 4 + (pitaRev - T.pita_revenue_bln) / 4 + (petDiv - T.petronas_dividend_bln) / 4 + (cpoDutyRev - baseCpoDutyRev) + sstRevDelta + devD * 0.1;
        const govExp = T.gov_expenditure_bln / 4 + (annSub - T.fuel_subsidy_bln) / 4 + devD * 0.5 + headCpi * 0.15 + (0.7 * (mgs10 - T.mgs10) + 0.3 * oprD) * 0.3;
        const fiscalPct = T.fiscal_pct + ((govRev - T.gov_revenue_bln / 4) - (govExp - T.gov_expenditure_bln / 4)) * 4 / gdpDenom * 100;

        const prevXee = q === 0 ? lag('XEE_LEVEL') : lag('eeExp');
        const prevXs = q === 0 ? lag('XS_LEVEL') : lag('tourExp');
        const prevBaseXee = lagBase('BASE_XEE', 1, 'XEE_LEVEL');
        const prevBaseXs = lagBase('BASE_XS', 1, 'XS_LEVEL');
        const prevXee2 = q < 2 ? prevXee : lag('eeExp', 2);
        const prevXs2 = q < 2 ? prevXs : lag('tourExp', 2);
        const prevBaseXee2 = q < 2 ? prevBaseXee : lagBase('BASE_XEE', 2, 'XEE_LEVEL');
        const prevBaseXs2 = q < 2 ? prevBaseXs : lagBase('BASE_XS', 2, 'XS_LEVEL');
        const prevWstd = q === 0 ? B.semi : lag('WSTD_LEVEL');
        const prevWtour = q === 0 ? B.tour : lag('WTOUR_LEVEL');
        const prevReer = q === 0 ? 100 : lag('REER_LEVEL');
        const prevBaseWstd = q === 0 ? B.semi : lag('BASE_WSTD_LEVEL');
        const prevBaseWtour = q === 0 ? B.tour : lag('BASE_WTOUR_LEVEL');
        const prevBaseReer = q === 0 ? 100 : lag('BASE_REER_LEVEL');
        const dlogXeeLag = q < 2 ? 0 : Math.log(prevXee / prevXee2);
        const dlogXsLag = q < 2 ? 0 : Math.log(prevXs / prevXs2);
        const dlogBaseXeeLag = q < 2 ? 0 : Math.log(prevBaseXee / prevBaseXee2);
        const dlogBaseXsLag = q < 2 ? 0 : Math.log(prevBaseXs / prevBaseXs2);
        const dlogWstdLag = Math.log(Math.max(1e-6, prevWstd / B.semi));
        const dlogWtour = Math.log(Math.max(1e-6, tour / prevWtour));
        const dlogReer = Math.log(Math.max(1e-6, reer / prevReer));
        const dlogBaseWstdLag = Math.log(Math.max(1e-6, prevBaseWstd / B.semi));
        const dlogBaseWtour = Math.log(Math.max(1e-6, B.tour / prevBaseWtour));
        const dlogBaseReer = Math.log(Math.max(1e-6, 100 / prevBaseReer));
        const xeeEcm = Math.log(prevXee) - 1.05 * Math.log(prevWstd) + 0.25 * Math.log(prevReer);
        const xsEcm = Math.log(prevXs) - 0.92 * Math.log(prevWtour) + 0.15 * Math.log(prevReer);
        const baseXeeEcm = Math.log(prevBaseXee) - 1.05 * Math.log(prevBaseWstd) + 0.25 * Math.log(prevBaseReer);
        const baseXsEcm = Math.log(prevBaseXs) - 0.92 * Math.log(prevBaseWtour) + 0.15 * Math.log(prevBaseReer);
        const eeExpDlog = 0.15 * dlogXeeLag + 1.05 * dlogWstdLag - 0.28 * dlogReer - 0.135 * xeeEcm - 0.028;
        const baseEeExpDlog = 0.15 * dlogBaseXeeLag + 1.05 * dlogBaseWstdLag - 0.28 * dlogBaseReer - 0.135 * baseXeeEcm - 0.028;
        const oilExpG = (effOilShk * 0.6 + fxShk * 0.4) * 100;
        const cpoExpG = (cpoShk + elnino * 0.03 - cpoDutyD * 0.005) * 100;
        const tourExpDlog = 0.32 * dlogXsLag + 0.85 * dlogWtour - 0.18 * dlogReer - 0.095 * xsEcm - 0.018;
        const baseTourExpDlog = 0.32 * dlogBaseXsLag + 0.85 * dlogBaseWtour - 0.18 * dlogBaseReer - 0.095 * baseXsEcm - 0.018;
        const eeExpG = (eeExpDlog - baseEeExpDlog) * 100;
        const tourExpG = (tourExpDlog - baseTourExpDlog) * 100;
        const otherExpG = (semiShk * 0.3 + fxShk * P.reer_exp_elast * -0.5 + wpgShk * 0.15) * 100;
        const totExpG = P.ee_share * eeExpG / 100 + P.oil_share * oilExpG / 100 + P.cpo_share * cpoExpG / 100 + 0.06 * tourExpG / 100 + 0.43 * otherExpG / 100;
        const baseEeExp = T.exports_bln * P.ee_share;
        const eeExp = baseEeExp * Math.exp(eeExpDlog - baseEeExpDlog);
        const oilExp = T.exports_bln * P.oil_share * (1 + oilExpG / 100);
        const cpoExp = T.exports_bln * P.cpo_share * (1 + cpoExpG / 100);
        const baseTourExp = T.exports_bln * 0.06;
        const tourExp = baseTourExp * Math.exp(tourExpDlog - baseTourExpDlog);
        const otherExp = T.exports_bln * 0.43 * (1 + otherExpG / 100);
        const exports = eeExp + oilExp + cpoExp + tourExp + otherExp;

        const rmort = opr + 1.75;
        const prelimNomWG = T.nominal_wage_growth + P.wage_price_pt * (headCpi - T.cpi_inflation) * 0.2 + semiShk * 0.35 + tourShk * 0.15 - Math.max(0, oprD) * 0.1;
        const propertyPriceG = T.property_price_growth + 0.9 * (prelimNomWG - T.nominal_wage_growth) - 0.35 * (rmort - T.rmort) - 0.2 * (headCpi - T.cpi_inflation);
        const creditG = T.credit_growth + 0.45 * (propertyPriceG - T.property_price_growth) + 0.35 * (prelimNomWG - T.nominal_wage_growth) - 0.9 * oprD - 0.25 * (headCpi - T.cpi_inflation) + (epf > 0 ? 0.08 * epf : 0);
        const prevPcpiIndex = q === 0 ? lag('PCPI_INDEX') : lag('PCPI_INDEX');
        const prevPcons = q === 0 ? lag('PCONS') : lag('PCONS');
        const prevRhhdi = q === 0 ? lag('RHHDI') : lag('RHHDI');
        const prevNfwpe = q === 0 ? lag('NFWPE') : lag('NFWPE');
        const prevCreditLevel = q === 0 ? lag('CREDIT_LEVEL') : lag('CREDIT_LEVEL');
        const prevBasePcpiIndex = lagBase('BASE_PCPI_INDEX');
        const prevBasePcons = lagBase('BASE_PCONS');
        const prevBaseRhhdi = lagBase('BASE_RHHDI');
        const prevBaseNfwpe = lagBase('BASE_NFWPE');
        const prevBaseCreditLevel = lagBase('BASE_CREDIT_LEVEL');
        const prevUnemp = q === 0 ? T.unemployment : lag('unemp');
        const prevMcci = q === 0 ? 102 : lag('MCCI_LEVEL');
        const prevBaseMcci = q === 0 ? 102 : lag('BASE_MCCI_LEVEL');
        const pcpiIndex = prevPcpiIndex * Math.exp(headCpi / 400);
        const basePcpiIndex = prevBasePcpiIndex * Math.exp(T.cpi_inflation / 400);
        const rhhdiGrowth = (prelimNomWG - headCpi) + 0.08 * (tourExpG / 10) + (epf > 0 ? 0.12 * epf : 0);
        const baseRhhdiGrowth = T.real_wage_growth;
        const rhhdi = prevRhhdi * Math.exp(rhhdiGrowth / 100);
        const baseRhhdi = prevBaseRhhdi * Math.exp(baseRhhdiGrowth / 100);
        const nfwpe = prevNfwpe * Math.exp((0.25 * propertyPriceG + 0.15 * eqShk * 100) / 100);
        const baseNfwpe = prevBaseNfwpe * Math.exp((0.25 * T.property_price_growth) / 100);
        const creditLevel = prevCreditLevel * Math.exp(creditG / 100);
        const baseCreditLevel = prevBaseCreditLevel * Math.exp(T.credit_growth / 100);
        const mcciLevel = prevMcci * Math.exp((0.2 * (semiShk + tourShk) - 0.1 * Math.max(0, oprD)) / 100);
        const baseMcciLevel = prevBaseMcci;
        const dlogRhhdi = Math.log(rhhdi / prevRhhdi);
        const dlogBaseRhhdi = Math.log(baseRhhdi / prevBaseRhhdi);
        const dCreditReal = Math.log((creditLevel / (pcpiIndex / 100)) / (prevCreditLevel / (prevPcpiIndex / 100)));
        const dBaseCreditReal = Math.log((baseCreditLevel / (basePcpiIndex / 100)) / (prevBaseCreditLevel / (prevBasePcpiIndex / 100)));
        const dRealRate = q < 4 ? 0 : (opr - (headCpi - (((pcpiIndex / lag('PCPI_INDEX', 4)) - 1) * 100)));
        const dBaseRealRate = q < 4 ? 0 : (B.opr - (T.cpi_inflation - (((basePcpiIndex / lagBase('BASE_PCPI_INDEX', 4)) - 1) * 100)));
        const dMcci = Math.log(mcciLevel / prevMcci);
        const dBaseMcci = Math.log(baseMcciLevel / prevBaseMcci);
        const ecmCons = Math.log(prevPcons) - 0.55 * Math.log(prevRhhdi) - 0.08 * Math.log(prevNfwpe / (prevPcpiIndex / 100)) - 0.12 * Math.log(prevCreditLevel / (prevPcpiIndex / 100));
        const baseEcmCons = Math.log(prevBasePcons) - 0.55 * Math.log(prevBaseRhhdi) - 0.08 * Math.log(prevBaseNfwpe / (prevBasePcpiIndex / 100)) - 0.12 * Math.log(prevBaseCreditLevel / (prevBasePcpiIndex / 100));
        const dLfsur = prevUnemp - (q < 2 ? T.unemployment : lag('unemp', 2));
        const consDlog = 0.1824 + 0.1385 * dlogRhhdi - 0.0072 * dLfsur + 0.0843 * dCreditReal - 0.0005 * dRealRate - 0.1080 * ecmCons + 0.0382 * dMcci;
        const baseConsDlog = 0.1824 + 0.1385 * dlogBaseRhhdi + 0.0843 * dBaseCreditReal - 0.0005 * dBaseRealRate - 0.1080 * baseEcmCons + 0.0382 * dBaseMcci;
        const basePcons = prevBasePcons * Math.exp(T.consumption_growth / 100);
        const pcons = basePcons * Math.exp(consDlog - baseConsDlog);
        const epfBoost = epf > 0 ? (epf / (B.gdp_millions_rm / 1000)) * 100 * P.mpc * (q < 4 ? 0.6 : 0.2) : 0;
        const consG0 = ((pcons / prevPcons) - 1) * 100 + epfBoost - sstD * 0.3;

        const invBaseline = T.gdp_growth * 1.2;
        const invG = invBaseline + oprD * P.opr_inv * 300 + devD * 0.8 + semiShk * 15 - Math.max(0, headCpi - 5) * 0.5 - ust10D * 0.3 + eqShk * 3;
        const consImpG = 0.15 * (consG0 - T.consumption_growth) / 10;
        const invImpG = 0.22 * (invG - invBaseline) / 10;
        const exportImpG = 0.60 * P.ee_share * (eeExpG / 100) + 0.45 * 0.43 * (otherExpG / 100) + 0.08 * 0.06 * (tourExpG / 100) + 0.52 * (P.oil_share * (oilExpG / 100) + P.cpo_share * (cpoExpG / 100));
        const impG = consImpG + invImpG + exportImpG + fxShk * 0.10 + wpgShk * 0.15;
        const imports = T.imports_bln * Math.exp(impG);

        const gdpConsCtr0 = 0.55 * (consG0 - T.consumption_growth) / 10;
        const gdpInvCtr = 0.23 * (invG - invBaseline) / 10;
        const gdpNetExpCtr = 0.13 * (totExpG - impG * 0.9) * 5;
        const gdpFiscalCtr = devD * 0.15;
        const gdpInflationDrag = -Math.max(0, headCpi - 8) * 0.15;
        const gdpG0 = T.gdp_growth + gdpConsCtr0 + gdpInvCtr + gdpNetExpCtr + gdpFiscalCtr + gdpInflationDrag;
        const prevGdpLevel = q === 0 ? B.gdp_millions_rm : lag('GDPM_LEVEL');
        const basePrevGdpLevel = q === 0 ? B.gdp_millions_rm : lag('BASE_GDPM_LEVEL');
        const baseGdpLevel = basePrevGdpLevel * Math.exp(T.gdp_growth / 100);
        let gdpLevel = baseGdpLevel * Math.exp((gdpG0 - T.gdp_growth) / 100);
        const msgva = gdpLevel * 0.78;
        const baseMsgva = baseGdpLevel * 0.78;

        const prevEms = q === 0 ? 12600 : lag('EMS_LEVEL');
        const prevEms2 = q < 2 ? prevEms : lag('EMS_LEVEL', 2);
        const prevBaseEms = q === 0 ? 12600 : lag('BASE_EMS_LEVEL');
        const prevBaseEms2 = q < 2 ? prevBaseEms : lag('BASE_EMS_LEVEL', 2);
        const prevPsavei = q === 0 ? 118 : lag('PSAVEI_INDEX');
        const prevBasePsavei = q === 0 ? 118 : lag('BASE_PSAVEI_INDEX');
        const prevPmsgva = q === 0 ? 121 : lag('PMSGVA_INDEX');
        const prevBasePmsgva = q === 0 ? 121 : lagBase('BASE_PMSGVA_INDEX');
        const prevMsgva = q === 0 ? baseMsgva : lag('MSGVA_LEVEL');
        const prevMsgva2 = q < 2 ? prevMsgva : lag('MSGVA_LEVEL', 2);
        const prevBaseMsgva = q === 0 ? baseMsgva : lag('BASE_MSGVA_LEVEL');
        const prevBaseMsgva2 = q < 2 ? prevBaseMsgva : lag('BASE_MSGVA_LEVEL', 2);
        const dlogEmsLag = q < 2 ? 0 : Math.log(prevEms / prevEms2);
        const dlogBaseEmsLag = q < 2 ? 0 : Math.log(prevBaseEms / prevBaseEms2);
        const dlogMsgvaLag = q < 2 ? 0 : Math.log(prevMsgva / prevMsgva2);
        const dlogBaseMsgvaLag = q < 2 ? 0 : Math.log(prevBaseMsgva / prevBaseMsgva2);
        const emsEcm = Math.log(prevEms / prevMsgva) + 0.35 * Math.log(prevPsavei / prevPmsgva);
        const baseEmsEcm = Math.log(prevBaseEms / prevBaseMsgva) + 0.35 * Math.log(prevBasePsavei / prevBasePmsgva);
        const dlogEms = -0.0098 + 0.38 * dlogEmsLag + 0.22 * dlogBaseEmsLag + 0.205 * dlogMsgvaLag - 0.0075 * emsEcm;
        const dlogBaseEms = -0.0098 + 0.38 * dlogBaseEmsLag + 0.22 * dlogBaseEmsLag + 0.205 * dlogBaseMsgvaLag - 0.0075 * baseEmsEcm;
        const baseEms = prevBaseEms * Math.exp(dlogBaseEms);
        const ems = baseEms * Math.exp(dlogEms - dlogBaseEms);
        const prevEfor = q === 0 ? 2000 : lag('EFOR_LEVEL');
        const prevBaseEfor = q === 0 ? 2000 : lag('BASE_EFOR_LEVEL');
        const dlogEfor = 0.45 * Math.log(msgva / prevMsgva) - 0.12 * (Math.log(prevEfor) - 0.65 * Math.log(prevMsgva)) + 0.008;
        const dlogBaseEfor = 0.45 * Math.log(baseMsgva / prevBaseMsgva) - 0.12 * (Math.log(prevBaseEfor) - 0.65 * Math.log(prevBaseMsgva)) + 0.008;
        const baseEfor = prevBaseEfor * Math.exp(dlogBaseEfor);
        const efor = baseEfor * Math.exp(dlogEfor - dlogBaseEfor);
        const baseLabourForce = baseEms / Math.max(1e-6, 1 - T.unemployment / 100);
        const labourForce = baseLabourForce * (1 + 0.08 * ((efor / Math.max(1e-6, baseEfor)) - 1));
        const unemp = Math.max(2.5, Math.min(6.0, T.unemployment + ((baseEms - ems) / Math.max(1e-6, labourForce)) * 100));

        const consG = consG0 - 0.35 * (unemp - T.unemployment);
        const gdpConsCtr = 0.55 * (consG - T.consumption_growth) / 10;
        const gdpG = T.gdp_growth + gdpConsCtr + gdpInvCtr + gdpNetExpCtr + gdpFiscalCtr + gdpInflationDrag;
        gdpLevel = baseGdpLevel * Math.exp((gdpG - T.gdp_growth) / 100);

        const prevPmsgva2 = q < 2 ? prevPmsgva : lag('PMSGVA_INDEX', 2);
        const prevPmsgva3 = q < 3 ? prevPmsgva : lag('PMSGVA_INDEX', 3);
        const prevBasePmsgva2 = q < 2 ? prevBasePmsgva : lagBase('BASE_PMSGVA_INDEX', 2);
        const prevBasePmsgva3 = q < 3 ? prevBasePmsgva : lagBase('BASE_PMSGVA_INDEX', 3);
        const dlogPmsgva = Math.log((100 + headCpi) / 100);
        const dlogPmsgva1 = Math.log(prevPmsgva / (q < 2 ? prevPmsgva : lag('PMSGVA_INDEX', 2)));
        const dlogPmsgva2v = Math.log(prevPmsgva2 / (q < 3 ? prevPmsgva2 : prevPmsgva3));
        const dlogPmsgva3v = q < 3 ? dlogPmsgva2v : Math.log(prevPmsgva3 / lag('PMSGVA_INDEX', 4));
        const dlogBasePmsgva = Math.log((100 + T.cpi_inflation) / 100);
        const dlogBasePmsgva1 = Math.log(prevBasePmsgva / (q < 2 ? prevBasePmsgva : lagBase('BASE_PMSGVA_INDEX', 2)));
        const dlogBasePmsgva2v = Math.log(prevBasePmsgva2 / (q < 3 ? prevBasePmsgva2 : prevBasePmsgva3));
        const dlogBasePmsgva3v = q < 3 ? dlogBasePmsgva2v : Math.log(prevBasePmsgva3 / lagBase('BASE_PMSGVA_INDEX', 4));
        const wageEcm = Math.log(prevPsavei) - Math.log(prevMsgva / prevEms) - Math.log(prevPmsgva) + 0.012 * unemp;
        const baseWageEcm = Math.log(prevBasePsavei) - Math.log(prevBaseMsgva / prevBaseEms) - Math.log(prevBasePmsgva) + 0.012 * T.unemployment;
        const dlogPsavei =
            -0.022 +
            0.52 * dlogPmsgva +
            0.28 * dlogPmsgva1 +
            0.12 * dlogPmsgva2v +
            (1 - 0.52 - 0.28 - 0.12) * dlogPmsgva3v -
            0.0075 * (unemp - (q === 0 ? T.unemployment : lag('unemp'))) +
            0.22 * (Math.log(msgva / prevMsgva) - Math.log(ems / prevEms)) +
            0.25 * (Math.log((100 + headCpi) / prevPcpiIndex) - dlogPmsgva) -
            0.038 * wageEcm;
        const dlogBasePsavei =
            -0.022 +
            0.52 * dlogBasePmsgva +
            0.28 * dlogBasePmsgva1 +
            0.12 * dlogBasePmsgva2v +
            (1 - 0.52 - 0.28 - 0.12) * dlogBasePmsgva3v -
            0.038 * baseWageEcm;
        const basePsavei = prevBasePsavei * Math.exp(T.nominal_wage_growth / 100);
        const psavei = basePsavei * Math.exp(dlogPsavei - dlogBasePsavei);
        const wageGap = Math.log(Math.max(1e-6, psavei / basePsavei)) * 100;
        const nomWG = T.nominal_wage_growth + 0.10 * wageGap;
        const realWG = nomWG - headCpi;
        const pmsgvaIndex = prevPmsgva * Math.exp(dlogPmsgva);
        const basePmsgvaIndex = prevBasePmsgva * Math.exp(dlogBasePmsgva);

        const businessInv = T.business_investment_bln * (1 + (invG - invBaseline) / 100);
        const publicInv = T.public_investment_bln * (1 + devD * 0.04);
        const housingInv = T.housing_investment_bln * (1 + 0.0095 * (consG - T.consumption_growth) - 0.0082 * (propertyPriceG - T.property_price_growth) - 0.03 * (rmort - T.rmort));
        const totalInv = businessInv + publicInv + housingInv;
        const debtR = T.household_debt_ratio + 0.25 * (creditG - T.credit_growth) + 0.15 * (propertyPriceG - T.property_price_growth) + oprD * 0.5 - (gdpG - T.gdp_growth) * 0.3 + (epf > 0 ? -epf * 0.02 : 0);
        const tradeBalPct = T.trade_balance_pct + 0.22 * (((exports - T.exports_bln) - (imports - T.imports_bln)) / gdpDenom * 100);
        const eqReturn = Math.log(Math.max(1e-6, equity / B.equity));
        const rexc =
            (dlfdi / fliab) * (1.50 + 2.20 * eqReturn + 0.45 * opr / 4) +
            (eqfli / fliab) * (0.50 + 0.20 * eqReturn) +
            (bfli / fliab) * (0.35 + 0.90 * mgs10 / 4) +
            (otfli / fliab) * (0.10 + 0.70 * opr / 4);
        const rexd =
            (dafdi / fasset) * (0.80 + 2.80 * (petProfit / (B.gdp_millions_rm / 1000)) / 100) +
            (eqfa / fasset) * (0.65 + 0.20 * eqReturn) +
            (bfa / fasset) * (0.30 + 1.10 * mgs10 / 4) +
            (otfa / fasset) * (0.20 + 0.15 * opr / 4 + 0.60 * (mgs10 + 1.8) / 4);
        const prevCipd = lag('CIPD');
        const prevDipd = lag('DIPD');
        const cipd = (0.68 * prevCipd / fliab + (1 - 0.68) * rexc / 100) * fliab;
        const dipd = (0.58 * prevDipd / fasset + (1 - 0.58) * rexd / 100) * fasset;
        const baseRexc =
            (dlfdi / fliab) * (1.50 + 0.45 * B.opr / 4) +
            (eqfli / fliab) * 0.50 +
            (bfli / fliab) * (0.35 + 0.90 * T.mgs10 / 4) +
            (otfli / fliab) * (0.10 + 0.70 * B.opr / 4);
        const baseRexd =
            (dafdi / fasset) * (0.80 + 2.80 * (T.petronas_profit_bln / (B.gdp_millions_rm / 1000)) / 100) +
            (eqfa / fasset) * 0.65 +
            (bfa / fasset) * (0.30 + 1.10 * T.mgs10 / 4) +
            (otfa / fasset) * (0.20 + 0.15 * B.opr / 4 + 0.60 * (T.mgs10 + 1.8) / 4);
        const prevBaseCipd = lagBase('CIPD_BASE', 1, 'CIPD');
        const prevBaseDipd = lagBase('DIPD_BASE', 1, 'DIPD');
        const baseCipd = (0.68 * prevBaseCipd / fliab + (1 - 0.68) * baseRexc / 100) * fliab;
        const baseDipd = (0.58 * prevBaseDipd / fasset + (1 - 0.58) * baseRexd / 100) * fasset;
        const primaryIncomePct = T.primary_income_pct + (((cipd - dipd) - (baseCipd - baseDipd)) / gdpDenom) * 100;
        const prevRemitOut = q === 0 ? 7.5 : lag('REMITOUT');
        const prevBaseRemitOut = q === 0 ? 7.5 : lag('BASE_REMITOUT');
        const neer = (q === 0 ? 100 : lag('NEER_INDEX')) * (reer / (q === 0 ? 100 : lag('REER_LEVEL'))) * (pcpiIndex / prevPcpiIndex) / (getInput('WCPI') / (q === 0 ? getInput('WCPI') : lag('WCPI_INDEX')));
        const baseNeer = (q === 0 ? 100 : lag('BASE_NEER_INDEX')) * (100 / (q === 0 ? 100 : lag('BASE_REER_LEVEL'))) * (basePcpiIndex / prevBasePcpiIndex) / (getInput('WCPI') / (q === 0 ? getInput('WCPI') : lag('BASE_WCPI_INDEX')));
        const remitOut = prevRemitOut * Math.exp(0.45 * Math.log(efor / prevEfor) + 0.35 * Math.log(Math.max(1e-6, psavei / prevPsavei)) - 0.08 * Math.log(Math.max(1e-6, neer / (q === 0 ? 100 : lag('NEER_INDEX')))) + 0.005);
        const baseRemitOut = prevBaseRemitOut * Math.exp(0.45 * Math.log(baseEfor / prevBaseEfor) + 0.35 * Math.log(Math.max(1e-6, basePsavei / prevBasePsavei)) - 0.08 * Math.log(Math.max(1e-6, baseNeer / (q === 0 ? 100 : lag('BASE_NEER_INDEX')))) + 0.005);
        const remitIn = (q === 0 ? 3.0 : lag('REMITIN')) * (gdpLevel / prevGdpLevel);
        const baseRemitIn = (q === 0 ? 3.0 : lag('BASE_REMITIN')) * (baseGdpLevel / basePrevGdpLevel);
        const govTran = (q === 0 ? 0.8 : lag('GOVTRAN')) * (gdpLevel / prevGdpLevel);
        const baseGovTran = (q === 0 ? 0.8 : lag('BASE_GOVTRAN')) * (baseGdpLevel / basePrevGdpLevel);
        const transfersPct = T.transfers_pct + (((remitIn - remitOut + govTran) - (baseRemitIn - baseRemitOut + baseGovTran)) / gdpDenom) * 100;
        const caPct = tradeBalPct + primaryIncomePct + transfersPct;

        const padminIndex = (q === 0 ? 122 : lag('PADMIN_INDEX')) * Math.exp(0.15 * Math.log(Math.max(1e-6, (effBrent / fx) / (B.brent / B.fx))));
        const basePadminIndex = (q === 0 ? 122 : lag('BASE_PADMIN_INDEX')) * Math.exp(0.15 * Math.log(Math.max(1e-6, (B.brent / B.fx) / (B.brent / B.fx))));
        const pmnogIndex = (q === 0 ? 119 : lag('PMNOG_INDEX')) * Math.exp(0.55 * Math.log(pmsgvaIndex / prevPmsgva) + 0.28 * Math.log(Math.max(1e-6, wpg / (q === 0 ? B.wpg : lag('WPG_LEVEL'))) / Math.max(1e-6, neer / (q === 0 ? 100 : lag('NEER_INDEX')))));
        const basePmnogIndex = (q === 0 ? 119 : lag('BASE_PMNOG_INDEX')) * Math.exp(0.55 * Math.log(basePmsgvaIndex / prevBasePmsgva));
        const ppiIndex = (q === 0 ? 120 : lag('PPI_INDEX')) * Math.exp(0.35 * Math.log(psavei / prevPsavei) + 0.2 * Math.log(pmnogIndex / (q === 0 ? 119 : lag('PMNOG_INDEX'))) + 0.1 * Math.log(padminIndex / (q === 0 ? 122 : lag('PADMIN_INDEX'))));
        const basePpiIndex = (q === 0 ? 120 : lag('BASE_PPI_INDEX')) * Math.exp(0.35 * Math.log(basePsavei / prevBasePsavei) + 0.2 * Math.log(basePmnogIndex / (q === 0 ? 119 : lag('BASE_PMNOG_INDEX'))));
        const cpixIndex = (q === 0 ? 131 : lag('CPIX_INDEX')) * Math.exp(0.4 * Math.log(ppiIndex / (q === 0 ? 120 : lag('PPI_INDEX'))) + 0.3 * Math.log(pmnogIndex / (q === 0 ? 119 : lag('PMNOG_INDEX'))) + 0.2 * Math.log(psavei / prevPsavei));
        const baseCpixIndex = (q === 0 ? 131 : lag('BASE_CPIX_INDEX')) * Math.exp(0.4 * Math.log(basePpiIndex / (q === 0 ? 120 : lag('BASE_PPI_INDEX'))) + 0.3 * Math.log(basePmnogIndex / (q === 0 ? 119 : lag('BASE_PMNOG_INDEX'))) + 0.2 * Math.log(basePsavei / prevBasePsavei));
        const cpiIndex = ((q === 0 ? 131.2 : lag('CPI_INDEX')) * ((Math.pow(cpixIndex, 1 - 0.22) * Math.pow(padminIndex, 0.22)) / (Math.pow((q === 0 ? 131 : lag('CPIX_INDEX')), 1 - 0.22) * Math.pow((q === 0 ? 122 : lag('PADMIN_INDEX')), 0.22))));
        const baseCpiIndex = ((q === 0 ? 131.2 : lag('BASE_CPI_INDEX')) * ((Math.pow(baseCpixIndex, 1 - 0.22) * Math.pow(basePadminIndex, 0.22)) / (Math.pow((q === 0 ? 131 : lag('BASE_CPIX_INDEX')), 1 - 0.22) * Math.pow((q === 0 ? 122 : lag('BASE_PADMIN_INDEX')), 0.22))));

        const govws = (q === 0 ? 90 : lag('GOVWS')) * Math.exp((nomWG / 100) * 0.5);
        const govsup = (q === 0 ? 32 : lag('GOVSUP')) * (gdpLevel / prevGdpLevel) * 1.02;
        const govsubBase = (q === 0 ? 18 : lag('GOVSUB_BASE')) * (gdpLevel / prevGdpLevel) * 1.02;
        const avgbr = 0.70 * mgs10 + 0.30 * (opr + 0.50);
        const prevGovDebt = q === 0 ? 1180 : lag('GOVDEBT');
        const prevAvgbr = q === 0 ? avgbr : lag('AVGBR');
        const govdsc = (q === 0 ? 23 : lag('GOVDSC')) * (avgbr / prevAvgbr) * (prevGovDebt / (q === 0 ? 1180 : lag('GOVDEBT')));
        const govgrant = (q === 0 ? 4.8 : lag('GOVGRANT')) * (govRev * 4 / (q === 0 ? B.gov_revenue_bln : lag('govRev') * 4));
        const govpen = (q === 0 ? 8.5 : lag('GOVPEN')) * (govws / (q === 0 ? 90 : lag('GOVWS'))) * 1.015;
        const govotr = (q === 0 ? 7.2 : lag('GOVOTR')) * (gdpLevel / prevGdpLevel);
        const govoe = govws + govsup + govdsc + govsubBase + annSub + (q === 0 ? 1.2 : lag('BSHTRF')) + govgrant + govpen + govotr;
        const govdevps = (q === 0 ? 76 : lag('GOVDEVPS')) * (gdpLevel / prevGdpLevel) * (1 + devgr / 100);
        const govexpStruct = govoe + govdevps;
        const tyind = (q === 0 ? 30 : lag('TYIND')) * (psavei / prevPsavei) * (1 + 0.5 * ((unemp - prevUnemp) / Math.max(1e-6, prevUnemp)));
        const tycorp = 0.24 * ((q === 0 ? 65 : lag('FYCORP')) + ((mgs10 + 1.2) - (opr - 0.5)) / 100 * creditLevel * 0.25) * 0.70;
        const trpgt = (q === 0 ? 3 : lag('TRPGT')) * (propertyPriceG / Math.max(0.1, T.property_price_growth)) * (gdpLevel / prevGdpLevel);
        const tstamp = (q === 0 ? 6 : lag('TSTAMP')) * (gdpLevel / prevGdpLevel);
        const tsst = (sst / 100) * (pcons * (pcpiIndex / 100) + 0.3 * govws) * 1.0 / 1000;
        const texcise = (q === 0 ? 11 : lag('TEXCISE')) * ((pcons * (pcpiIndex / 100)) / Math.max(1e-6, lag('PCONS') * (lag('PCPI_INDEX') / 100)));
        const timport = (q === 0 ? 4 : lag('TIMPORT')) * ((imports) / Math.max(1e-6, q === 0 ? B.imports_bln : lag('imp')));
        const texport = (cpoduty / 100) * cpoExp;
        const govrevStruct = tyind + tycorp + pitaRev + trpgt + tstamp + tsst + texcise + timport + texport + petDiv + (q === 0 ? 4 : lag('GOVINVI')) + (q === 0 ? 5.5 : lag('GOVFEES')) + (q === 0 ? 6 : lag('GOVOREV'));
        const govbal = govrevStruct - govexpStruct;
        const govDebt = prevGovDebt - govbal + getInput('GOVDEBTADJ');
        const fiscalPctStruct = (govbal / gdpLevel) * 100;

        const gce = (q === 0 ? 275 : lag('GCE_REAL')) * Math.exp(0.0006 + 0.35 * Math.log(Math.max(1e-6, govws + govsup) / Math.max(1e-6, q === 0 ? 122 : lag('GCEPS'))) + 0.16 * (q < 1 ? 0 : Math.log(Math.max(1e-6, lag('GCEPS')) / Math.max(1e-6, q < 2 ? lag('GCEPS') : lag('GCEPS', 2)))) - 0.38 * (q < 1 ? 0 : Math.log(Math.max(1e-6, lag('GCE_REAL')) / Math.max(1e-6, q < 2 ? lag('GCE_REAL') : lag('GCE_REAL', 2)))));
        const gfcf = totalInv;
        const val = 0.001 * gdpLevel;
        const dinv = gdpLevel - gce - pcons - gfcf - exports + imports - val;
        const gdpmps = (govws + govsup) + pcons * (pcpiIndex / 100) + dinv * (cpiIndex / 100) + val * (cpiIndex / 100) + gfcf * (cpiIndex / 100) + exports - imports;
        const pgdp = 100 * gdpmps / Math.max(1e-6, gdpLevel);

        return {
            q: quarter.replace(/^(\d{4})Q([1-4])$/, (_, year, qtr) => `Q${qtr} ${year}`),
            brent: r2(effBrent),
            gdp: r2(gdpG),
            cpi: r2(headCpi),
            core: r2(coreInf),
            unemp: r2(unemp),
            fiscal: r2(fiscalPct),
            govRev: r1(govRev * 4),
            govExp: r1(govExp * 4),
            govRevStruct: r1(govrevStruct),
            govExpStruct: r1(govexpStruct),
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
            CIPD: r2(cipd),
            DIPD: r2(dipd),
            CIPD_BASE: r2(baseCipd),
            DIPD_BASE: r2(baseDipd),
            PCONS: r1(pcons),
            RHHDI: r1(rhhdi),
            NFWPE: r1(nfwpe),
            CREDIT_LEVEL: r1(creditLevel),
            PCPI_INDEX: r2(pcpiIndex),
            BASE_PCONS: r1(basePcons),
            BASE_RHHDI: r1(baseRhhdi),
            BASE_NFWPE: r1(baseNfwpe),
            BASE_CREDIT_LEVEL: r1(baseCreditLevel),
            BASE_PCPI_INDEX: r2(basePcpiIndex),
            XEE_LEVEL: r1(eeExp),
            XS_LEVEL: r1(tourExp),
            WSTD_LEVEL: semi,
            WTOUR_LEVEL: tour,
            REER_LEVEL: reer,
            MCCI_LEVEL: r2(mcciLevel),
            BASE_XEE: r1(baseEeExp),
            BASE_XS: r1(baseTourExp),
            BASE_WSTD_LEVEL: B.semi,
            BASE_WTOUR_LEVEL: B.tour,
            BASE_REER_LEVEL: 100,
            BASE_MCCI_LEVEL: r2(baseMcciLevel),
            WPG_LEVEL: wpg,
            EMS_LEVEL: r1(ems),
            BASE_EMS_LEVEL: r1(baseEms),
            EFOR_LEVEL: r1(efor),
            BASE_EFOR_LEVEL: r1(baseEfor),
            MSGVA_LEVEL: r1(msgva),
            BASE_MSGVA_LEVEL: r1(baseMsgva),
            PSAVEI_INDEX: r2(psavei),
            BASE_PSAVEI_INDEX: r2(basePsavei),
            PMSGVA_INDEX: r2(pmsgvaIndex),
            BASE_PMSGVA_INDEX: r2(basePmsgvaIndex),
            NEER_INDEX: r2(neer),
            BASE_NEER_INDEX: r2(baseNeer),
            WCPI_INDEX: getInput('WCPI'),
            BASE_WCPI_INDEX: getInput('WCPI'),
            REMITOUT: r2(remitOut),
            BASE_REMITOUT: r2(baseRemitOut),
            REMITIN: r2(remitIn),
            BASE_REMITIN: r2(baseRemitIn),
            GOVTRAN: r2(govTran),
            BASE_GOVTRAN: r2(baseGovTran),
            GOVWS: r1(govws),
            GOVSUP: r1(govsup),
            GOVSUB_BASE: r1(govsubBase),
            GOVDSC: r1(govdsc),
            GOVGRANT: r1(govgrant),
            GOVPEN: r1(govpen),
            GOVOTR: r1(govotr),
            GOVDEVPS: r1(govdevps),
            GOVDEBT: r1(govDebt),
            BSHTRF: r1(q === 0 ? 1.2 : lag('BSHTRF')),
            AVGBR: r2(avgbr),
            TYIND: r1(tyind),
            FYCORP: r1((q === 0 ? 65 : lag('FYCORP')) * (1 + (gdpG - T.gdp_growth) / 100)),
            TRPGT: r1(trpgt),
            TSTAMP: r1(tstamp),
            TEXCISE: r1(texcise),
            TIMPORT: r1(timport),
            GOVINVI: r1(q === 0 ? 4 : lag('GOVINVI')),
            GOVFEES: r1(q === 0 ? 5.5 : lag('GOVFEES')),
            GOVOREV: r1(q === 0 ? 6 : lag('GOVOREV')),
            GCEPS: r1(govws + govsup),
            GCE_REAL: r1(gce),
            GDPM_LEVEL: r1(gdpLevel),
            BASE_GDPM_LEVEL: r1(baseGdpLevel),
            DINV: r1(dinv),
            GDPMPS: r1(gdpmps),
            PGDP_INDEX: r2(pgdp),
            PADMIN_INDEX: r2(padminIndex),
            BASE_PADMIN_INDEX: r2(basePadminIndex),
            PMNOG_INDEX: r2(pmnogIndex),
            BASE_PMNOG_INDEX: r2(basePmnogIndex),
            PPI_INDEX: r2(ppiIndex),
            BASE_PPI_INDEX: r2(basePpiIndex),
            CPIX_INDEX: r2(cpixIndex),
            BASE_CPIX_INDEX: r2(baseCpixIndex),
            CPI_INDEX: r2(cpiIndex),
            BASE_CPI_INDEX: r2(baseCpiIndex),
            adminInf: r2(adminInf),
            importInf: r2(importInf),
            sstInf: r2(sstInf),
            cpoDuty: r2(cpoDutyRev * 4),
            sstRev: r2(sstRevDelta * 4),
            subCostDelta: r2(annSub - B.fuel_subsidy_bln),
            eeExp: r1(eeExp),
            oilExp: r1(oilExp),
            cpoExp: r1(cpoExp),
            tourExp: r1(tourExp),
            otherExp: r1(otherExp),
            busInv: r1(businessInv),
            pubInv: r1(publicInv),
            houseInv: r1(housingInv),
            totalInv: r1(totalInv),
            gdpBase: B.gdp_growth,
            gdpConsCtr: r2(gdpConsCtr),
            gdpInvCtr: r2(gdpInvCtr),
            gdpNetExpCtr: r2(gdpNetExpCtr),
            gdpFiscalCtr: r2(gdpFiscalCtr),
            gdpInflationDrag: r2(gdpInflationDrag),
        };
    });
}
