import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
    parseQuarter,
    nextQuarter,
    prevQuarter,
    quarterRange,
    constantSeries,
    validateRunPack,
    StructuralModelEngine,
} from '../src/model-engine.js';

describe('parseQuarter', () => {
    it('parses a valid quarter string', () => {
        assert.deepEqual(parseQuarter('2026Q1'), { year: 2026, quarter: 1 });
        assert.deepEqual(parseQuarter('2025Q4'), { year: 2025, quarter: 4 });
        assert.deepEqual(parseQuarter('1997Q2'), { year: 1997, quarter: 2 });
    });

    it('throws on invalid quarter format', () => {
        assert.throws(() => parseQuarter('2026Q5'), /Invalid quarter/);
        assert.throws(() => parseQuarter('2026Q0'), /Invalid quarter/);
        assert.throws(() => parseQuarter('2026-01'), /Invalid quarter/);
        assert.throws(() => parseQuarter('Q1'), /Invalid quarter/);
        assert.throws(() => parseQuarter(''), /Invalid quarter/);
        assert.throws(() => parseQuarter('invalid'), /Invalid quarter/);
    });
});

describe('nextQuarter', () => {
    it('advances to the next quarter within the same year', () => {
        assert.strictEqual(nextQuarter('2026Q1'), '2026Q2');
        assert.strictEqual(nextQuarter('2026Q2'), '2026Q3');
        assert.strictEqual(nextQuarter('2026Q3'), '2026Q4');
    });

    it('wraps to Q1 of the next year after Q4', () => {
        assert.strictEqual(nextQuarter('2026Q4'), '2027Q1');
        assert.strictEqual(nextQuarter('1999Q4'), '2000Q1');
    });
});

describe('prevQuarter', () => {
    it('goes back to the previous quarter within the same year', () => {
        assert.strictEqual(prevQuarter('2026Q2'), '2026Q1');
        assert.strictEqual(prevQuarter('2026Q3'), '2026Q2');
        assert.strictEqual(prevQuarter('2026Q4'), '2026Q3');
    });

    it('wraps to Q4 of the previous year before Q1', () => {
        assert.strictEqual(prevQuarter('2026Q1'), '2025Q4');
        assert.strictEqual(prevQuarter('2000Q1'), '1999Q4');
    });
});

describe('quarterRange', () => {
    it('generates a sequence of consecutive quarters', () => {
        const range = quarterRange('2026Q1', 4);
        assert.deepEqual(range, ['2026Q1', '2026Q2', '2026Q3', '2026Q4']);
    });

    it('wraps across year boundaries', () => {
        const range = quarterRange('2025Q3', 4);
        assert.deepEqual(range, ['2025Q3', '2025Q4', '2026Q1', '2026Q2']);
    });

    it('returns a single-element array for length 1', () => {
        assert.deepEqual(quarterRange('2026Q2', 1), ['2026Q2']);
    });
});

describe('constantSeries', () => {
    it('creates an object mapping each quarter to the same value', () => {
        const quarters = ['2026Q1', '2026Q2', '2026Q3'];
        const series = constantSeries(quarters, 42);
        assert.deepEqual(series, { '2026Q1': 42, '2026Q2': 42, '2026Q3': 42 });
    });

    it('handles empty quarter array', () => {
        assert.deepEqual(constantSeries([], 1), {});
    });
});

describe('validateRunPack', () => {
    const validRunPack = {
        quarters: ['2026Q1', '2026Q2'],
        historical: {},
        scenario: {},
        policy: {},
        demographic: {},
        calibration: {},
        preprocess: {},
    };

    it('accepts a valid run pack', () => {
        validateRunPack(validRunPack);
    });

    it('throws when required keys are missing', () => {
        assert.throws(() => validateRunPack({}), /Run pack missing required key/);
        assert.throws(() => validateRunPack({ quarters: [] }), /Run pack missing required key/);
        const missingScenario = { ...validRunPack };
        delete missingScenario.scenario;
        assert.throws(() => validateRunPack(missingScenario), /scenario/);
    });

    it('throws when quarters is empty or not an array', () => {
        assert.throws(() => validateRunPack({ ...validRunPack, quarters: [] }), /non-empty quarters array/);
        assert.throws(() => validateRunPack({ ...validRunPack, quarters: '2026Q1' }), /non-empty quarters array/);
    });

    it('throws when quarters have gaps', () => {
        const gapped = { ...validRunPack, quarters: ['2026Q1', '2026Q3'] };
        assert.throws(() => validateRunPack(gapped), /Quarter gap/);
    });

    it('throws when quarters are not in order', () => {
        const reversed = { ...validRunPack, quarters: ['2026Q2', '2026Q1'] };
        assert.throws(() => validateRunPack(reversed), /Quarter gap/);
    });
});

describe('StructuralModelEngine', () => {
    function makeRunPack(overrides = {}) {
        return {
            quarters: ['2026Q1', '2026Q2', '2026Q3'],
            historical: { GDP: { '2026Q1': 100, '2026Q2': 102 } },
            scenario: { PBRENT: { '2026Q1': 80, '2026Q2': 82, '2026Q3': 85 } },
            policy: { OPR: { '2026Q1': 3.0, '2026Q2': 3.0, '2026Q3': 3.0 } },
            demographic: {},
            calibration: {},
            preprocess: {},
            ...overrides,
        };
    }

    it('validates the run pack on construction', () => {
        assert.throws(() => new StructuralModelEngine({}), /Run pack missing required key/);
    });

    it('runs the step function for each quarter', () => {
        const engine = new StructuralModelEngine(makeRunPack());
        const quarters = [];
        engine.run(({ quarter }) => {
            quarters.push(quarter);
            return { result: 1 };
        });
        assert.deepEqual(quarters, ['2026Q1', '2026Q2', '2026Q3']);
    });

    it('collects results in order', () => {
        const engine = new StructuralModelEngine(makeRunPack());
        const results = engine.run(({ quarter }) => ({ value: quarter }));
        assert.strictEqual(results.length, 3);
        assert.strictEqual(results[0].quarter, '2026Q1');
        assert.strictEqual(results[2].quarter, '2026Q3');
    });

    it('getInput respects layer priority (scenario > policy > ...)', () => {
        const runPack = makeRunPack({
            scenario: { X: { '2026Q1': 10, '2026Q2': 10, '2026Q3': 10 } },
            policy: { X: { '2026Q1': 20, '2026Q2': 20, '2026Q3': 20 } },
        });
        const engine = new StructuralModelEngine(runPack);
        engine.run(({ getInput }) => {
            assert.strictEqual(getInput('X'), 10);
            return {};
        });
    });

    it('getInput falls back to lower layers when series missing from higher', () => {
        const runPack = makeRunPack({
            scenario: {},
            policy: { X: { '2026Q1': 20, '2026Q2': 20, '2026Q3': 20 } },
        });
        const engine = new StructuralModelEngine(runPack);
        engine.run(({ getInput }) => {
            assert.strictEqual(getInput('X'), 20);
            return {};
        });
    });

    it('getInput throws when series not found in any layer', () => {
        const engine = new StructuralModelEngine(makeRunPack());
        assert.throws(
            () => engine.run(({ getInput }) => { getInput('MISSING'); return {}; }),
            /is not available for/,
        );
    });

    it('lag returns historical values for the first quarter', () => {
        const runPack = makeRunPack({
            historical: { GDP: { '2025Q4': 100, '2026Q1': 105, '2026Q2': 110 } },
        });
        const engine = new StructuralModelEngine(runPack);
        engine.run(({ lag, quarter }) => {
            if (quarter === '2026Q1') {
                assert.strictEqual(lag('GDP', 1), 100);
            }
            return {};
        });
    });

    it('lag returns previously computed state values', () => {
        const engine = new StructuralModelEngine(makeRunPack());
        engine.run(({ lag, quarter }) => {
            if (quarter === '2026Q2') {
                assert.strictEqual(lag('GDP', 1), 100);
            }
            return { GDP: quarter === '2026Q1' ? 100 : 105 };
        });
    });

    it('getHistorical returns data from the historical layer', () => {
        const runPack = makeRunPack({
            historical: { GDP: { '2026Q1': 100, '2026Q2': 102, '2026Q3': 105 } },
        });
        const engine = new StructuralModelEngine(runPack);
        let checked = false;
        engine.run(({ getHistorical, quarter }) => {
            if (quarter === '2026Q1' && !checked) {
                assert.strictEqual(getHistorical('GDP'), 100);
                checked = true;
            }
            return {};
        });
        assert.ok(checked, 'Should have checked Q1 historical data');
    });

    it('getHistorical throws when historical data is missing', () => {
        const engine = new StructuralModelEngine(makeRunPack());
        assert.throws(
            () => engine.run(({ getHistorical }) => { getHistorical('NONEXISTENT'); return {}; }),
            /Missing historical/,
        );
    });
});
