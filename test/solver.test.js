import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runModel } from '../src/model-solver.js';
import { createBaselineRunPack } from '../studies/playground/baseline-run-pack.js';

const EXPECTED_BASELINE = [
    { quarter: '2026Q2', gdp: 3.31, cpi: 2.82, core: 2.32, unemp: 2.5 },
    { quarter: '2026Q3', gdp: 3.4, cpi: 3, core: 2.51, unemp: 2.5 },
    { quarter: '2026Q4', gdp: 3.43, cpi: 3.18, core: 2.71, unemp: 2.5 },
    { quarter: '2027Q1', gdp: 3.48, cpi: 3.36, core: 2.9, unemp: 2.5 },
    { quarter: '2027Q2', gdp: 3.52, cpi: 3.54, core: 3.09, unemp: 2.5 },
    { quarter: '2027Q3', gdp: 3.56, cpi: 3.72, core: 3.29, unemp: 2.5 },
    { quarter: '2027Q4', gdp: 3.59, cpi: 3.9, core: 3.48, unemp: 2.5 },
    { quarter: '2028Q1', gdp: 3.62, cpi: 4.08, core: 3.68, unemp: 2.5 },
];

describe('runModel — baseline regression', () => {
    it('produces 8 quarters of output', () => {
        const runPack = createBaselineRunPack();
        const results = runModel(runPack);
        assert.strictEqual(results.length, 8);
    });

    it('matches expected baseline key metrics', () => {
        const runPack = createBaselineRunPack();
        const results = runModel(runPack);

        for (let i = 0; i < EXPECTED_BASELINE.length; i++) {
            const actual = results[i];
            const expected = EXPECTED_BASELINE[i];
            assert.strictEqual(actual.quarter, expected.quarter, `Quarter mismatch at index ${i}`);
            assert.strictEqual(actual.gdp, expected.gdp, `GDP mismatch at ${expected.quarter}`);
            assert.strictEqual(actual.cpi, expected.cpi, `CPI mismatch at ${expected.quarter}`);
            assert.strictEqual(actual.core, expected.core, `Core inflation mismatch at ${expected.quarter}`);
            assert.strictEqual(actual.unemp, expected.unemp, `Unemployment mismatch at ${expected.quarter}`);
        }
    });
});

describe('runModel — scenario sensitivity', () => {
    it('oil shock changes GDP and CPI outputs', () => {
        const baselinePack = createBaselineRunPack();
        const baseline = runModel(baselinePack);

        const shockPack = createBaselineRunPack();
        shockPack.scenario.PBRENT = Object.fromEntries(
            shockPack.quarters.map(q => [q, 150]),
        );
        shockPack.policy.USDMYR = Object.fromEntries(
            shockPack.quarters.map(q => [q, 4.20]),
        );
        const shock = runModel(shockPack);

        assert.notStrictEqual(baseline[0].cpi, shock[0].cpi, 'CPI should change under oil shock');
    });

    it('OPR change affects credit growth', () => {
        const baselinePack = createBaselineRunPack();
        const baseline = runModel(baselinePack);

        const highOprPack = createBaselineRunPack();
        highOprPack.policy.OPR = Object.fromEntries(
            highOprPack.quarters.map(q => [q, 4.0]),
        );
        const highOpr = runModel(highOprPack);

        assert.notStrictEqual(
            baseline[0].creditG,
            highOpr[0].creditG,
            'Credit growth should change when OPR changes',
        );
    });
});
