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
    gfcf_bln: 425,
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
    inv_elast: 1.05,
    okun: 0.45,
    reer_exp_elast: -0.25,
    ee_elast: 1.05,
    tour_elast: 0.85,
    pet_tax: 0.38,
    pet_div: 0.30,
    ee_share: 0.38,
    oil_share: 0.08,
    cpo_share: 0.05,
    import_content_ee: 0.52,
    fuel_litres_q: 3.5,
    budi95_coverage: 0.92,
    opr_cons: -0.0072,
    opr_inv: -0.0015,
    wage_price_pt: 0.52,
};

const QS = ['Q2 2026','Q3 2026','Q4 2026','Q1 2027','Q2 2027','Q3 2027','Q4 2027','Q1 2028'];

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function baselineQuarter(q) {
    const t = q / (QS.length - 1);
    const nominalWageGrowth = lerp(B.nominal_wage_growth, 4.35, t);
    const cpiInflation = lerp(B.cpi_inflation, 2.35, t);
    const baselineOpr = B.opr;
    const baselineUst10 = B.ust10;
    const baselineMgs10 = 0.85 * baselineOpr + 0.15 * baselineUst10 + 1.85;
    return {
        gdp_growth: lerp(B.gdp_growth, 4.15, t),
        cpi_inflation: cpiInflation,
        core_inflation: lerp(B.core_inflation, 1.95, t),
        unemployment: lerp(B.unemployment, 3.45, t),
        fiscal_pct: lerp(B.fiscal_pct, -3.1, t),
        gov_revenue_bln: lerp(B.gov_revenue_bln, 204, t),
        gov_expenditure_bln: lerp(B.gov_expenditure_bln, 261.5, t),
        petronas_profit_bln: lerp(B.petronas_profit_bln, 95, t),
        pita_revenue_bln: lerp(B.pita_revenue_bln, 36.1, t),
        petronas_dividend_bln: lerp(B.petronas_dividend_bln, 28.5, t),
        fuel_subsidy_bln: lerp(B.fuel_subsidy_bln, 8.4, t),
        exports_bln: lerp(B.exports_bln, 1000, t),
        imports_bln: lerp(B.imports_bln, 872, t),
        current_account_pct: lerp(B.current_account_pct, 2.0, t),
        household_debt_ratio: lerp(B.household_debt_ratio, 84.5, t),
        real_wage_growth: nominalWageGrowth - cpiInflation,
        nominal_wage_growth: nominalWageGrowth,
        consumption_growth: lerp(B.consumption_growth, 5.3, t),
        credit_growth: lerp(B.credit_growth, 4.9, t),
        property_price_growth: lerp(B.property_price_growth, 4.1, t),
        trade_balance_pct: lerp(B.trade_balance_pct, 6.65, t),
        primary_income_pct: lerp(B.primary_income_pct, -4.0, t),
        transfers_pct: lerp(B.transfers_pct, -0.65, t),
        business_investment_bln: lerp(B.business_investment_bln, 236, t),
        public_investment_bln: lerp(B.public_investment_bln, 122, t),
        housing_investment_bln: lerp(B.housing_investment_bln, 77, t),
        ron95_market_price: lerp(B.ron95_market_price, 2.54, t),
        mgs10: baselineMgs10,
        rmort: baselineOpr + 1.75,
    };
}

const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;

export function getPlaygroundBaselineInputs() {
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

export function runPlaygroundModel(inp) {
    const oilShk = (inp.brent - B.brent) / B.brent;
    const cpoShk = (inp.cpo - B.cpo) / B.cpo;
    const fxShk = (inp.fx - B.fx) / B.fx;
    const oprD = inp.opr - B.opr;
    const semiShk = (inp.semi - B.semi) / B.semi;
    const tourShk = (inp.tour - B.tour) / B.tour;
    const devD = inp.devgr - B.devgr;
    const wpgShk = (inp.wpg - B.wpg) / B.wpg;
    const eqShk = (inp.equity - B.equity) / B.equity;
    const ust10D = inp.ust10 - B.ust10;
    const sstD = inp.sst - B.sst;
    const cpoDutyD = inp.cpoduty - B.cpoduty;
    const epfBln = inp.epf;
    const elM = inp.elnino ? 1 : 0;
    const out = [];
    let prevPetProfit = B.petronas_profit_bln;
    let prevPetDiv = B.petronas_dividend_bln;

    for (let q = 0; q < 8; q++) {
        const T = baselineQuarter(q);
        const decay = Math.pow(0.88, q);
        const persist = 1 - 0.08 * q;
        const build = Math.min(1, 0.3 + 0.1 * q);
        const effOilShk = oilShk > 0 ? oilShk * decay : oilShk * persist;
        const effBrent = B.brent * (1 + effOilShk);
        const mgs10 = T.mgs10 + 0.72 * oprD + 0.12 * ust10D;
        const budi95On = inp.budi95 !== false;
        const baseConsumerRon95 = B.ron95_budi_price * P.budi95_coverage + T.ron95_market_price * (1 - P.budi95_coverage);
        const gdpDenom = B.gdp_millions_rm / 1000;
        const baseSubLitre = Math.max(0, T.ron95_market_price - B.ron95_budi_price);
        const importInf = P.import_pt * (fxShk + 0.3 * effOilShk + 0.5 * wpgShk) * 100;
        const sstInf = sstD * 0.3;
        const coreInf = T.core_inflation + importInf * 0.3 * build + (oprD < 0 ? -oprD * 0.4 : -oprD * 0.2) + semiShk * 0.3 + sstInf * build + wpgShk * 2 * build;
        const ron95Mkt = T.ron95_market_price + (effBrent - B.brent) * inp.fx / B.fx * 0.012;
        const ron95Pump = budi95On ? B.ron95_budi_price : ron95Mkt;
        const ron95Consumer = budi95On ? (B.ron95_budi_price * P.budi95_coverage + ron95Mkt * (1 - P.budi95_coverage)) : ron95Mkt;
        const fuelPriceShockPct = ((ron95Consumer / baseConsumerRon95) - 1) * 100;
        const adminInf = P.oil_admin_pt * fuelPriceShockPct;
        const subShock = !budi95On ? Math.max(0, fuelPriceShockPct) * (q === 0 ? 0.08 : q === 1 ? 0.03 : 0.01 * Math.pow(0.5, q - 2)) : 0;
        const headCpi = T.cpi_inflation + (coreInf - T.core_inflation) + P.w_admin * adminInf + subShock + elM * 0.8 * (q < 4 ? 1 : 0.5);
        const effCpo = B.cpo * (1 + cpoShk + elM * 0.15);
        const brentRM = effBrent * inp.fx;
        const baseBrentRM = B.brent * B.fx;
        const petProfit = T.petronas_profit_bln * (brentRM / baseBrentRM);
        const pitaRev = petProfit * P.pet_tax;
        const petDiv = q === 0 ? T.petronas_dividend_bln * (0.5 + 0.5 * (petProfit / prevPetProfit)) : prevPetDiv * (0.5 + 0.5 * (petProfit / prevPetProfit));
        const subsidisedLitresQ = budi95On ? P.fuel_litres_q * P.budi95_coverage : 0;
        const subLitre = budi95On ? Math.max(0, ron95Mkt - B.ron95_budi_price) : 0;
        const annSub = budi95On ? T.fuel_subsidy_bln + (subLitre - baseSubLitre) * subsidisedLitresQ * 4 : 0;
        const cpoDutyRev = (inp.cpoduty / 100) * effCpo * 0.000045;
        const baseCpoDutyRev = (B.cpoduty / 100) * B.cpo * 0.000045;
        const sstRevDelta = sstD * 2.0 / 4;
        const govRev = T.gov_revenue_bln / 4 + (pitaRev - T.pita_revenue_bln) / 4 + (petDiv - T.petronas_dividend_bln) / 4 + (cpoDutyRev - baseCpoDutyRev) + sstRevDelta + devD * 0.1;
        const govExp = T.gov_expenditure_bln / 4 + (annSub - T.fuel_subsidy_bln) / 4 + devD * 0.5 + headCpi * 0.15 + (0.7 * (mgs10 - T.mgs10) + 0.3 * oprD) * 0.3;
        const fiscalPct = T.fiscal_pct + ((govRev - T.gov_revenue_bln / 4) - (govExp - T.gov_expenditure_bln / 4)) * 4 / gdpDenom * 100;
        const eeExpG = P.ee_elast * semiShk + P.reer_exp_elast * fxShk * 0.5;
        const oilExpG = effOilShk * 0.6 + fxShk * 0.4;
        const cpoExpG = cpoShk + elM * 0.03 - cpoDutyD * 0.005;
        const tourExpG = P.tour_elast * tourShk;
        const otherExpG = semiShk * 0.3 + fxShk * P.reer_exp_elast * -0.5 + wpgShk * 0.15;
        const totExpG = P.ee_share * eeExpG + P.oil_share * oilExpG + P.cpo_share * cpoExpG + 0.06 * tourExpG + 0.43 * otherExpG;
        const eeExp = T.exports_bln * P.ee_share * (1 + eeExpG);
        const oilExp = T.exports_bln * P.oil_share * (1 + oilExpG);
        const cpoExp = T.exports_bln * P.cpo_share * (1 + cpoExpG);
        const tourExp = T.exports_bln * 0.06 * (1 + tourExpG);
        const otherExp = T.exports_bln * 0.43 * (1 + otherExpG);
        const exports = T.exports_bln * (1 + totExpG);
        const rmort = inp.opr + 1.75;
        const prelimNomWG = T.nominal_wage_growth + P.wage_price_pt * (headCpi - T.cpi_inflation) * 0.2 + semiShk * 0.35 + tourShk * 0.15 - Math.max(0, oprD) * 0.1;
        const propertyPriceG = T.property_price_growth + 0.9 * (prelimNomWG - T.nominal_wage_growth) - 0.35 * (rmort - T.rmort) - 0.2 * (headCpi - T.cpi_inflation);
        const creditG = T.credit_growth + 0.45 * (propertyPriceG - T.property_price_growth) + 0.35 * (prelimNomWG - T.nominal_wage_growth) - 0.9 * oprD - 0.25 * (headCpi - T.cpi_inflation) + (epfBln > 0 ? 0.08 * epfBln : 0);
        const realDispIncomeG = (prelimNomWG - headCpi) + 0.18 * (creditG - T.credit_growth);
        const epfBoost = epfBln > 0 ? (epfBln / (B.gdp_millions_rm / 1000)) * 100 * P.mpc * (q < 4 ? 0.6 : 0.2) : 0;
        const consG0 = T.consumption_growth + 0.55 * (realDispIncomeG - T.real_wage_growth) + 0.084 * (creditG - T.credit_growth) + eqShk * 0.6 + oprD * P.opr_cons * 200 - Math.max(0, headCpi - T.cpi_inflation) * 0.25 + epfBoost - sstD * 0.3;
        const invBaseline = T.gdp_growth * 1.2;
        const invG = invBaseline + oprD * P.opr_inv * 300 + devD * 0.8 + semiShk * 15 - Math.max(0, headCpi - 5) * 0.5 - ust10D * 0.3 + eqShk * 3;
        const consImpG = 0.15 * (consG0 - T.consumption_growth) / 10;
        const invImpG = 0.22 * (invG - invBaseline) / 10;
        const exportImpG = 0.60 * P.ee_share * eeExpG + 0.45 * 0.43 * otherExpG + 0.08 * 0.06 * tourExpG + 0.52 * (P.oil_share * oilExpG + P.cpo_share * cpoExpG);
        const impG = consImpG + invImpG + exportImpG + fxShk * 0.10 + wpgShk * 0.15;
        const imports = T.imports_bln * (1 + impG);
        const gdpConsCtr0 = 0.55 * (consG0 - T.consumption_growth) / 10;
        const gdpInvCtr = 0.23 * (invG - invBaseline) / 10;
        const gdpNetExpCtr = 0.13 * (totExpG - impG * 0.9) * 5;
        const gdpFiscalCtr = devD * 0.15;
        const gdpInflationDrag = -Math.max(0, headCpi - 8) * 0.15;
        const gdpG0 = T.gdp_growth + gdpConsCtr0 + gdpInvCtr + gdpNetExpCtr + gdpFiscalCtr + gdpInflationDrag;
        const unempD0 = -P.okun * (gdpG0 - T.gdp_growth) / 100 * 5;
        const unemp0 = Math.max(2.5, Math.min(6.0, T.unemployment + unempD0));
        const consG = consG0 - 0.35 * (unemp0 - T.unemployment);
        const gdpConsCtr = 0.55 * (consG - T.consumption_growth) / 10;
        const gdpG = T.gdp_growth + gdpConsCtr + gdpInvCtr + gdpNetExpCtr + gdpFiscalCtr + gdpInflationDrag;
        const unempD = -P.okun * (gdpG - T.gdp_growth) / 100 * 5;
        const unemp = Math.max(2.5, Math.min(6.0, T.unemployment + unempD));
        const nomWG = T.nominal_wage_growth + P.wage_price_pt * (headCpi - T.cpi_inflation) * 0.3 + (gdpG - T.gdp_growth) * 0.4 - 0.08 * (unemp - T.unemployment);
        const realWG = nomWG - headCpi;
        const businessInv = T.business_investment_bln * (1 + (invG - invBaseline) / 100);
        const publicInv = T.public_investment_bln * (1 + devD * 0.04);
        const housingInv = T.housing_investment_bln * (1 + 0.0095 * (consG - T.consumption_growth) - 0.0082 * (propertyPriceG - T.property_price_growth) - 0.03 * (rmort - T.rmort));
        const totalInv = businessInv + publicInv + housingInv;
        const debtR = T.household_debt_ratio + 0.25 * (creditG - T.credit_growth) + 0.15 * (propertyPriceG - T.property_price_growth) + oprD * 0.5 - (gdpG - T.gdp_growth) * 0.3 + (epfBln > 0 ? -epfBln * 0.02 : 0);
        const tradeBalPct = T.trade_balance_pct + ((exports - T.exports_bln) - (imports - T.imports_bln)) / gdpDenom * 100;
        const primaryIncomePct = T.primary_income_pct + eqShk * 0.6 - 0.18 * (gdpG - T.gdp_growth) - 0.08 * (mgs10 - T.mgs10) - 0.05 * oprD;
        const transfersPct = T.transfers_pct + fxShk * 0.4 - 0.06 * (nomWG - T.nominal_wage_growth);
        const caPct = tradeBalPct + primaryIncomePct + transfersPct;
        out.push({
            q: QS[q], brent: r2(effBrent), gdp: r2(gdpG), cpi: r2(headCpi), core: r2(coreInf),
            unemp: r2(unemp), fiscal: r2(fiscalPct), govRev: r1(govRev * 4), govExp: r1(govExp * 4),
            pet: r1(petProfit), pita: r1(pitaRev), petDiv: r1(petDiv), sub: r1(annSub),
            exp: r1(exports), imp: r1(imports), ca: r2(caPct), consG: r2(consG),
            nomW: r2(nomWG), realW: r2(realWG), debt: r1(debtR), inv: r2(invG), ron95: r2(ron95Mkt),
            ron95Pump: r2(ron95Pump), subLitre: r2(subLitre), mgs10: r2(mgs10),
            rmort: r2(rmort), prpG: r2(propertyPriceG), creditG: r2(creditG),
            tradeBal: r2(tradeBalPct), primInc: r2(primaryIncomePct), transfers: r2(transfersPct),
            adminInf: r2(adminInf), importInf: r2(importInf), sstInf: r2(sstInf), cpoDuty: r2(cpoDutyRev * 4),
            sstRev: r2(sstRevDelta * 4), subCostDelta: r2(annSub - B.fuel_subsidy_bln),
            eeExp: r1(eeExp), oilExp: r1(oilExp), cpoExp: r1(cpoExp), tourExp: r1(tourExp), otherExp: r1(otherExp),
            busInv: r1(businessInv), pubInv: r1(publicInv), houseInv: r1(housingInv), totalInv: r1(totalInv),
            gdpBase: B.gdp_growth, gdpConsCtr: r2(gdpConsCtr), gdpInvCtr: r2(gdpInvCtr), gdpNetExpCtr: r2(gdpNetExpCtr),
            gdpFiscalCtr: r2(gdpFiscalCtr), gdpInflationDrag: r2(gdpInflationDrag)
        });
        prevPetProfit = petProfit;
        prevPetDiv = petDiv;
    }
    return out;
}

