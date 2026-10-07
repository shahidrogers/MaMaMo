import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runModel, summariseYears, marketFuelPrice } from '../src/model-solver.js';
import { createBaselineRunPack, applyOverrides } from '../src/run-pack.js';
import { MACRO_PATH, NATIONAL_ACCOUNTS, FISCAL_ANCHORS } from '../src/baseline-data.js';

function run(overrides = {}, options) {
    const pack = applyOverrides(createBaselineRunPack(), overrides, options);
    const results = runModel(pack);
    return { pack, results, years: summariseYears(results, pack) };
}

const base = run();
const byYear = (years, y) => years.find(r => r.year === y);

describe('baseline', () => {
    it('simulates 2026Q1-2028Q4 and flags forecast quarters', () => {
        assert.equal(base.results.length, 12);
        assert.equal(base.results[0].quarter, '2026Q1');
        assert.equal(base.results.at(-1).quarter, '2028Q4');
        assert.deepEqual(base.results.filter(r => !r.isForecast).map(r => r.quarter), ['2026Q1', '2026Q2']);
    });

    it('reproduces published GDP and the baseline paths exactly', () => {
        for (const r of base.results) {
            assert.equal(r.gdp, MACRO_PATH[r.quarter].gdpGrowth, `GDP growth ${r.quarter}`);
            assert.equal(r.cpi, MACRO_PATH[r.quarter].cpi, `CPI ${r.quarter}`);
            assert.equal(r.unemp, MACRO_PATH[r.quarter].unemp, `unemployment ${r.quarter}`);
            assert.equal(r.gdpDev, 0);
        }
        assert.equal(base.results[1].gdpReal, Math.round(NATIONAL_ACCOUNTS.real['2026Q2'].gdp * 10) / 10);
    });

    it('keeps headline indicators in plausible ranges', () => {
        for (const y of base.years) {
            assert.ok(y.gdpGrowth > 3 && y.gdpGrowth < 6.5, `GDP growth ${y.year}: ${y.gdpGrowth}`);
            assert.ok(y.cpi > 0.5 && y.cpi < 4, `CPI ${y.year}: ${y.cpi}`);
            assert.ok(y.balancePct < -1.5 && y.balancePct > -6, `deficit ${y.year}: ${y.balancePct}`);
            assert.ok(y.debtPct > 55 && y.debtPct < 70, `debt ${y.year}: ${y.debtPct}`);
            assert.ok(y.revenue > 300 && y.revenue < 500, `revenue ${y.year}: ${y.revenue}`);
        }
    });

    it('accumulates debt from the fiscal balance', () => {
        let debt = FISCAL_ANCHORS.debtEnd2025;
        for (const r of base.results) {
            debt -= r.fq.balance;
            assert.ok(Math.abs(r.GOVDEBT - debt) < 1e-6, `debt identity ${r.quarter}`);
        }
    });

    it('prices RON95 consistently with observed pump prices', () => {
        // RM2.60 in 2025 (Brent ~65, normal margins), RM4.52 in early Oct 2026
        assert.ok(Math.abs(marketFuelPrice(65, 15, 4.25) - 2.60) < 0.1);
        assert.ok(Math.abs(marketFuelPrice(100, 58, 4.09) - 4.52) < 0.1);
    });
});

describe('scenarios', () => {
    it('leaves history quarters untouched', () => {
        const s = run({ PBRENT: 150 });
        assert.deepEqual(s.results[0].gdp, base.results[0].gdp);
        assert.deepEqual(s.results[1].fq, base.results[1].fq);
    });

    it('higher refining margins raise subsidies with no revenue offset', () => {
        const s = run({ CRACK: b => b + 20 });
        const y = byYear(s.years, 2027); const b = byYear(base.years, 2027);
        assert.ok(y.fuelSubsidy - b.fuelSubsidy > 5);
        assert.equal(y.petroleumRevenue, b.petroleumRevenue);
        assert.ok(y.balancePct < b.balancePct);
    });

    it('higher crude raises petroleum revenue and subsidies together', () => {
        const s = run({ PBRENT: b => b + 20 });
        const y = byYear(s.years, 2027); const b = byYear(base.years, 2027);
        assert.ok(y.petroleumRevenue > b.petroleumRevenue);
        assert.ok(y.fuelSubsidy > b.fuelSubsidy);
        assert.ok(y.cpi > b.cpi);
    });

    it('OPR hike lowers activity with a lag and raises unemployment', () => {
        const s = run({ OPR: b => b + 1 });
        assert.ok(s.results[2].gdpDev > s.results[6].gdpDev);
        assert.ok(s.results[6].gdpDev < -0.2);
        assert.ok(s.results[6].unemp > base.results[6].unemp);
    });

    it('chip downturn hits GDP, unemployment and the current account', () => {
        const s = run({ WSTD: 85 });
        const r = s.results[6];
        assert.ok(r.gdpDev < -1);
        assert.ok(r.unemp > base.results[6].unemp);
        assert.ok(r.ca < base.results[6].ca);
    });

    it('removing BUDI95 cuts subsidies and raises CPI', () => {
        const s = run({ BUDI95: 0 });
        const y = byYear(s.years, 2027); const b = byYear(base.years, 2027);
        assert.ok(b.fuelSubsidy - y.fuelSubsidy > 15);
        assert.ok(s.results[3].cpi - base.results[3].cpi > 2);
        assert.ok(y.balancePct > b.balancePct);
    });

    it('fiscal multipliers are ordered and below 1.2', () => {
        const gdpPer10bn = (lever) => run({ [lever]: 10 }).years.find(y => y.year === 2027).gdpLevelDev;
        const gdpShare = 10 / byYear(base.years, 2027).nominalGdp * 100;
        const g = gdpPer10bn('GOVCONS') / gdpShare;
        const cash = gdpPer10bn('CASHAID') / gdpShare;
        assert.ok(g > cash, `govcons ${g} vs cash ${cash}`);
        assert.ok(g < 1.2 && cash > 0.3, `govcons ${g}, cash ${cash}`);
    });

    it('service tax rise raises revenue and prices', () => {
        const s = run({ SSTRATE: 10 });
        const y = byYear(s.years, 2027); const b = byYear(base.years, 2027);
        assert.ok(y.revenue > b.revenue);
        assert.ok(s.results[3].cpi > base.results[3].cpi);
    });

    it('rejects unknown inputs', () => {
        assert.throws(() => applyOverrides(createBaselineRunPack(), { NOPE: 1 }), /Unknown scenario input/);
    });

    it('requires a baseline layer', () => {
        const pack = createBaselineRunPack();
        delete pack.baseline;
        assert.throws(() => runModel(pack), /no baseline layer/);
    });
});
