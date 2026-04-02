export function parseQuarter(quarter) {
    const match = /^(\d{4})Q([1-4])$/.exec(quarter);
    if (!match) throw new Error(`Invalid quarter: ${quarter}`);
    return { year: Number(match[1]), quarter: Number(match[2]) };
}

export function nextQuarter(quarter) {
    const { year, quarter: q } = parseQuarter(quarter);
    return q === 4 ? `${year + 1}Q1` : `${year}Q${q + 1}`;
}

export function prevQuarter(quarter) {
    const { year, quarter: q } = parseQuarter(quarter);
    return q === 1 ? `${year - 1}Q4` : `${year}Q${q - 1}`;
}

export function quarterRange(startQuarter, length) {
    const out = [startQuarter];
    while (out.length < length) out.push(nextQuarter(out[out.length - 1]));
    return out;
}

export function constantSeries(quarters, value) {
    return Object.fromEntries(quarters.map(quarter => [quarter, value]));
}

const REQUIRED_RUN_PACK_KEYS = ['quarters', 'historical', 'scenario', 'policy', 'demographic', 'calibration', 'preprocess'];

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

export class StructuralModelEngine {
    constructor(runPack, options = {}) {
        validateRunPack(runPack);
        this.runPack = runPack;
        this.options = options;
        this.quarters = runPack.quarters;
        this.results = [];
        this.stateByQuarter = new Map();
    }

    getSeries(layerName, seriesName, quarter) {
        const layer = this.runPack[layerName] ?? {};
        const series = layer[seriesName];
        if (!series) throw new Error(`Missing ${layerName}.${seriesName}`);
        if (!(quarter in series)) throw new Error(`Missing ${layerName}.${seriesName}[${quarter}]`);
        return series[quarter];
    }

    getInput(quarter, seriesName) {
        const layerOrder = ['scenario', 'policy', 'demographic', 'calibration', 'preprocess'];
        for (const layerName of layerOrder) {
            const layer = this.runPack[layerName] ?? {};
            if (layer[seriesName] && quarter in layer[seriesName]) return layer[seriesName][quarter];
        }
        throw new Error(`Input series "${seriesName}" is not available for ${quarter}`);
    }

    getHistorical(seriesName, quarter) {
        return this.getSeries('historical', seriesName, quarter);
    }

    getState(quarter, seriesName) {
        const state = this.stateByQuarter.get(quarter);
        if (state && seriesName in state) return state[seriesName];
        if (this.runPack.historical[seriesName] && quarter in this.runPack.historical[seriesName]) {
            return this.runPack.historical[seriesName][quarter];
        }
        throw new Error(`State series "${seriesName}" is not available for ${quarter}`);
    }

    lag(currentQuarter, seriesName, periods = 1) {
        let q = currentQuarter;
        for (let i = 0; i < periods; i += 1) q = prevQuarter(q);
        return this.getState(q, seriesName);
    }

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
