/**
 * Playground adapter for the shared MaMaMo model (src/model-solver.js).
 *
 * The playground sliders hold one value per input. Price-like sliders scale the
 * baseline path (Brent at 120 when the baseline starts at 96 = +25% every
 * quarter), rate sliders shift it, and index/policy sliders set a level. With
 * every slider at its default the model returns the baseline exactly.
 *
 * Some playground charts show detail the model does not carry (CPI divisions,
 * tax splits, employment levels, remittances). Those fields are presentation
 * splits of model outputs using fixed shares, noted inline.
 */
import { runModel } from '../../src/model-solver.js';
import { createBaselineRunPack, applyOverrides } from '../../src/run-pack.js';
import { FIRST_FORECAST_QUARTER, FISCAL_PLAN } from '../../src/baseline-data.js';
import { BASELINE as B } from './baseline-constants.js';

const HORIZON = 8;

// CPI division indices, 2026Q2 averages (OpenDOSM cpi_headline), and CPI weights
const CPI_START = { overall: 137.03, food: 159.97, housing: 132.97, transport: 126.57, restaurants: 159.93 };
const CPI_HISTORY = { '2025Q3': 134.93, '2025Q4': 135.23, '2026Q1': 136.03, '2026Q2': 137.03 };
const W = { food: 0.297, housing: 0.233, transport: 0.117, fuelInTransport: 0.47 };

function r1(v) { return Math.round(v * 10) / 10; }
function r2(v) { return Math.round(v * 100) / 100; }

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

/** Translate slider inputs into run-pack overrides (only for inputs moved off baseline). */
function toOverrides(inp) {
    const o = {};
    const moved = (key) => inp[key] !== undefined && Math.abs(inp[key] - B[key]) > 1e-9;
    if (moved('brent')) o.PBRENT = b => b * inp.brent / B.brent;
    if (moved('fx')) o.USDMYR = b => b * inp.fx / B.fx;
    if (moved('cpo')) o.PCPO = b => b * inp.cpo / B.cpo;
    if (moved('opr')) o.OPR = b => b + inp.opr - B.opr;
    if (moved('ust10')) o.UST10 = b => b + inp.ust10 - B.ust10;
    if (moved('semi')) o.WSTD = inp.semi;
    if (moved('tour')) o.WTOUR = inp.tour;
    if (moved('wpg')) o.WPG = inp.wpg;
    if (moved('equity')) o.WEQPR = inp.equity;
    if (moved('sst')) o.SSTRATE = inp.sst;
    if (moved('cpoduty')) o.CPODRATE = inp.cpoduty;
    // Development spending growth (% y/y) → extra RM bn per year on the DE base
    if (moved('devgr')) o.DEVEXP = (inp.devgr - B.devgr) / 100 * FISCAL_PLAN[2026].development;
    if (inp.epf > 0) o.EPFWDRAW = { [FIRST_FORECAST_QUARTER]: inp.epf };
    if (inp.elnino) o.ELNINO = 1;
    if (inp.budi95 === false) o.BUDI95 = 0;
    return o;
}

export function createPlaygroundRunPack(inputs = getStructuralBaselineInputs()) {
    return applyOverrides(createBaselineRunPack(), toOverrides(inputs));
}

export function runStructuralPlaygroundModel(inputs = getStructuralBaselineInputs()) {
    const all = runModel(createPlaygroundRunPack(inputs));
    const cpiIdx = { ...CPI_HISTORY };
    for (const r of all) {
        if (!(r.quarter in cpiIdx)) {
            const [y, q] = r.quarter.split('Q');
            cpiIdx[r.quarter] = cpiIdx[`${y - 1}Q${q}`] * (1 + r.cpi / 100);
        }
    }
    const byQuarter = Object.fromEntries(all.map(r => [r.quarter, r]));
    const lag4 = (quarter, key) => {
        const [y, q] = quarter.split('Q');
        return byQuarter[`${y - 1}Q${q}`]?.[key] ?? 0;
    };

    return all.filter(r => r.isForecast).slice(0, HORIZON).map(r => {
        const nonPet = r.fq.nonPetroleum * 4;
        const growth = cpiIdx[r.quarter] / CPI_START.overall;
        const foodShock = r.FOOD_LEV / W.food;
        const fuelShock = r.FUEL_LEV * W.fuelInTransport;
        // Employment (thousands): Q3 2025 LFS level growing 2% a year, less the unemployment deviation
        const quartersSinceLfs = all.indexOf(r) + 2;
        const employed = 16967 * Math.pow(1.02, quartersSinceLfs / 4) * (1 - (r.unemp - 3.0) / 100);
        return {
            ...r,
            pet: r.petRev,
            // CPI divisions: overall index path plus model food and fuel shocks
            cpiIdx: r2(cpiIdx[r.quarter]),
            cpiFood: r2(CPI_START.food * growth * (1 + foodShock / 100)),
            cpiHousing: r2(CPI_START.housing * growth),
            cpiTransport: r2(CPI_START.transport * growth * (1 + fuelShock / 100)),
            cpiRestaurants: r2(CPI_START.restaurants * growth),
            cpiMisc: r2(cpiIdx[r.quarter]),
            cpiFoodContrib: r2(W.food * r.cpiBase + r.FOOD_LEV - lag4(r.quarter, 'FOOD_LEV')),
            cpiHousingContrib: r2(W.housing * r.cpiBase),
            cpiTransportContrib: r2(W.transport * r.cpiBase + r.adminInf),
            cpiOtherContrib: r2(r.cpi - W.food * r.cpiBase - (r.FOOD_LEV - lag4(r.quarter, 'FOOD_LEV'))
                - W.housing * r.cpiBase - W.transport * r.cpiBase - r.adminInf),
            // Labour: participation held at the Q3 2025 LFS rate (70.9%)
            partRate: 70.9,
            epRatio: r1(70.9 * (1 - r.unemp / 100)),
            EMS_LEVEL: r1(employed),
            EFOR_LEVEL: r1(2200 * (1 + 0.8 * r.gdpDev / 100)),
            MSGVA_LEVEL: r1(r.gdpReal * 4 * 1000 * 0.85),
            // Revenue split of non-petroleum revenue (Budget 2026 composition, rounded)
            dirTax: r1(0.55 * nonPet),
            indTax: r1(0.33 * nonPet),
            nonTaxRev: r1(0.12 * nonPet + r.petRev - r.pita - r.petDiv),
            sstRev: r1(0.33 * nonPet * 0.45),
            cpoDuty: r1(25 * inputs.cpoduty / 100 * (inputs.cpo / B.cpo)),
            // Debt service on the effective borrowing rate
            AVGBR: r2(4.0 + r.EFF_RATE_DEV),
            GOVDSC: r1(r.govDebt * (4.0 + r.EFF_RATE_DEV) / 100),
            GOVDEBT: r.govDebt,
            // Remittances, RM bn per quarter, scaled with activity
            REMITOUT: r2(9.0 * (1 + r.gdpDev / 100)),
            REMITIN: r2(3.2),
            // Export and investment detail, RM bn annualised
            eeExp: r1(r.exp * 0.40),
            oilExp: r1(r.exp * 0.09 / 0.70),
            cpoExp: r1(r.exp * 0.04 / 0.70),
            tourExp: r1(r.exp * 0.06),
            otherExp: r1(r.exp * (1 - 0.40 - 0.06 - 0.13 / 0.70)),
            busInv: r1(r.gdpNominal * 4 * 0.215 * 0.70 * (1 + r.inv / 100)),
            pubInv: r1(r.gdpNominal * 4 * 0.215 * 0.20 * (1 + r.inv / 100)),
            houseInv: r1(r.gdpNominal * 4 * 0.215 * 0.10 * (1 + r.inv / 100)),
            totalInv: r1(r.gdpNominal * 4 * 0.215 * (1 + r.inv / 100)),
        };
    });
}
