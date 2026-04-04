/**
 * Parse a quarter string (e.g. "2026Q1") into year and quarter numbers.
 * @param {string} quarter - Quarter string in YYYYQn format
 * @returns {{year: number, quarter: number}} Parsed year and quarter
 * @throws {Error} If the quarter string format is invalid
 */
export function parseQuarter(quarter) {
    const match = /^(\d{4})Q([1-4])$/.exec(quarter);
    if (!match) throw new Error(`Invalid quarter: ${quarter}`);
    return { year: Number(match[1]), quarter: Number(match[2]) };
}

/**
 * Get the next consecutive quarter.
 * @param {string} quarter - Current quarter string (e.g. "2026Q1")
 * @returns {string} Next quarter string
 */
export function nextQuarter(quarter) {
    const { year, quarter: q } = parseQuarter(quarter);
    return q === 4 ? `${year + 1}Q1` : `${year}Q${q + 1}`;
}

/**
 * Get the previous consecutive quarter.
 * @param {string} quarter - Current quarter string (e.g. "2026Q2")
 * @returns {string} Previous quarter string
 */
export function prevQuarter(quarter) {
    const { year, quarter: q } = parseQuarter(quarter);
    return q === 1 ? `${year - 1}Q4` : `${year}Q${q - 1}`;
}

/**
 * Generate a sequence of consecutive quarters starting from a given quarter.
 * @param {string} startQuarter - Starting quarter (e.g. "2026Q1")
 * @param {number} length - Number of quarters to generate
 * @returns {string[]} Array of quarter strings
 */
export function quarterRange(startQuarter, length) {
    const out = [startQuarter];
    while (out.length < length) out.push(nextQuarter(out[out.length - 1]));
    return out;
}

/**
 * Create a time series object mapping each quarter to a constant value.
 * @param {string[]} quarters - Array of quarter strings
 * @param {number} value - Constant value for all quarters
 * @returns {Object.<string, number>} Object mapping quarters to the value
 */
export function constantSeries(quarters, value) {
    return Object.fromEntries(quarters.map(quarter => [quarter, value]));
}

const REQUIRED_RUN_PACK_KEYS = ['quarters', 'historical', 'scenario', 'policy', 'demographic', 'calibration', 'preprocess'];

/**
 * Validate that a run pack has all required keys and valid quarter sequences.
 * @param {Object} runPack - The run pack to validate
 * @param {string[]} runPack.quarters - Array of consecutive quarter strings
 * @param {Object} runPack.historical - Historical data layer
 * @param {Object} runPack.scenario - Scenario data layer
 * @param {Object} runPack.policy - Policy data layer
 * @param {Object} runPack.demographic - Demographic data layer
 * @param {Object} runPack.calibration - Calibration data layer
 * @param {Object} runPack.preprocess - Preprocess data layer
 * @throws {Error} If required keys are missing, quarters is empty, or quarters have gaps
 */
export function validateRunPack(runPack) {
    for (const key of REQUIRED_RUN_PACK_KEYS) {
        if (!(key in runPack)) throw new Error(`Run pack missing required key "${key}"`);
    }
    const { quarters } = runPack;
    if (!Array.isArray(quarters) || quarters.length === 0) {
        throw new Error('Run pack must include a non-empty quarters array');
    }
    for (let i = 1; i < quarters.length; i += 1) {
        if (quarters[i] !== nextQuarter(quarters[i - 1])) {
            throw new Error(`Quarter gap between ${quarters[i - 1]} and ${quarters[i]}`);
        }
    }
}

/**
 * Structural model engine that iterates over quarters, managing state,
 * input layering, and lag utilities for macroeconomic model execution.
 *
 * Input layering priority (first match wins):
 * scenario → policy → demographic → calibration → preprocess
 */
export class StructuralModelEngine {
    /**
     * @param {Object} runPack - Validated run pack with all data layers
     * @param {Object} [options={}] - Engine options (reserved for future use)
     */
    constructor(runPack, options = {}) {
        validateRunPack(runPack);
        this.runPack = runPack;
        this.options = options;
        this.quarters = runPack.quarters;
        this.results = [];
        this.stateByQuarter = new Map();
    }

    /**
     * Get a value from a specific data layer.
     * @param {string} layerName - Layer key (e.g. "historical", "scenario")
     * @param {string} seriesName - Series name within the layer
     * @param {string} quarter - Quarter string
     * @returns {*} The value for the given series and quarter
     * @throws {Error} If the layer, series, or quarter is missing
     */
    getSeries(layerName, seriesName, quarter) {
        const layer = this.runPack[layerName] ?? {};
        const series = layer[seriesName];
        if (!series) throw new Error(`Missing ${layerName}.${seriesName}`);
        if (!(quarter in series)) throw new Error(`Missing ${layerName}.${seriesName}[${quarter}]`);
        return series[quarter];
    }

    /**
     * Get an input value respecting layer priority (scenario → policy → demographic → calibration → preprocess).
     * @param {string} quarter - Quarter string
     * @param {string} seriesName - Series name to look up
     * @returns {*} The value from the highest-priority layer that has it
     * @throws {Error} If the series is not found in any layer
     */
    getInput(quarter, seriesName) {
        const layerOrder = ['scenario', 'policy', 'demographic', 'calibration', 'preprocess'];
        for (const layerName of layerOrder) {
            const layer = this.runPack[layerName] ?? {};
            if (layer[seriesName] && quarter in layer[seriesName]) return layer[seriesName][quarter];
        }
        throw new Error(`Input series "${seriesName}" is not available for ${quarter}`);
    }

    /**
     * Get a value from the historical data layer.
     * @param {string} seriesName - Series name
     * @param {string} quarter - Quarter string
     * @returns {*} The historical value
     */
    getHistorical(seriesName, quarter) {
        return this.getSeries('historical', seriesName, quarter);
    }

    /**
     * Get a state value — first from previously computed results, then from historical data.
     * @param {string} quarter - Quarter string
     * @param {string} seriesName - Series name
     * @returns {*} The state value
     * @throws {Error} If the series is not available in state or historical data
     */
    getState(quarter, seriesName) {
        const state = this.stateByQuarter.get(quarter);
        if (state && seriesName in state) return state[seriesName];
        if (this.runPack.historical[seriesName] && quarter in this.runPack.historical[seriesName]) {
            return this.runPack.historical[seriesName][quarter];
        }
        throw new Error(`State series "${seriesName}" is not available for ${quarter}`);
    }

    /**
     * Get a lagged value by going back a number of quarters.
     * @param {string} currentQuarter - Current quarter string
     * @param {string} seriesName - Series name
     * @param {number} [periods=1] - Number of quarters to go back
     * @returns {*} The lagged state value
     */
    lag(currentQuarter, seriesName, periods = 1) {
        let q = currentQuarter;
        for (let i = 0; i < periods; i += 1) q = prevQuarter(q);
        return this.getState(q, seriesName);
    }

    /**
     * Run the model by iterating over quarters and calling the step function.
     * The step function receives helpers for input access, lagging, and state management.
     *
     * @param {function} stepFn - Function called for each quarter. Receives an object with:
     *   - {string} quarter - Current quarter string
     *   - {function} getInput - Get input value with layer priority
     *   - {function} getHistorical - Get historical value
     *   - {function} getState - Get current state value
     *   - {function} lag - Get lagged state value
     *   - {function} prevQuarter - Get previous quarter string
     * @returns {Array<Object>} Array of result objects, one per quarter, each containing
     *   the quarter string and all state values returned by stepFn
     */
    run(stepFn) {
        this.results = [];
        this.stateByQuarter = new Map();
        for (const quarter of this.quarters) {
            const state = stepFn({
                quarter,
                getInput: name => this.getInput(quarter, name),
                getHistorical: name => this.getHistorical(name, quarter),
                getState: name => this.getState(quarter, name),
                lag: (name, periods = 1) => this.lag(quarter, name, periods),
                prevQuarter: (periods = 1) => {
                    let q = quarter;
                    for (let i = 0; i < periods; i += 1) q = prevQuarter(q);
                    return q;
                },
            });
            this.stateByQuarter.set(quarter, state);
            this.results.push({ quarter, ...state });
        }
        return this.results;
    }
}
