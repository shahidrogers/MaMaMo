# Contributing to MaMaMo

Thank you for your interest in contributing to MaMaMo. This is a research prototype, and all contributions — from typo fixes to new equations — are welcome.

## Quick Start

1. Fork the repository
2. Create a branch (`git checkout -b feature/your-contribution`)
3. Make your changes
4. Open a pull request

## What We Need

### High Priority

- **Econometric estimation** — replace calibrated coefficients with estimates from DOSM/BNM quarterly data
- **Data pipeline** — auto-ingest from BNM API and OpenDOSM
- **Preprocessing builder** — assemble fiscal detail, household balance sheets, and IIP stocks from raw data
- **Back-testing** — validate against AFC (1997–98), GFC (2008–09), and COVID (2020) outturns
- **Supply side** — add production function, TFP dynamics, sectoral capital stocks

### Medium Priority

- **Financial accelerator** — link household debt to NPLs, bank capital, credit supply
- **Sectoral disaggregation** — break market sector into manufacturing, services, agriculture, construction, mining
- **Stochastic simulation** — fan charts instead of point forecasts
- **Documentation improvements** — clearer equation derivations, coefficient source citations

### Always Welcome

- Bug reports and fixes
- Documentation corrections
- New scenario studies
- UI improvements to the playground and dashboards

## How to Contribute

### Model Equations

When proposing changes to equations in `model/malaysia-quarterly-model.md`:

1. Cite your data source (BNM working paper, IMF report, DOSM publication)
2. Explain the economic intuition
3. Note any coefficient changes and their justification
4. Ensure the variable is defined in the glossary

### Scenario Studies

New scenarios should go in `studies/simulations/`. Each scenario needs:

- `index.html` — interactive dashboard
- `scenario-data.json` — quarterly projections
- A clear description of the shock and transmission channels

### Data and Validation

- Run `node scripts/validate_model_inputs.mjs` before submitting changes to input files
- Include the model version and data vintage in any scenario metadata

## Development Setup

```bash
# Validate model inputs
node scripts/validate_model_inputs.mjs --historical <path> --scenario <path>

# View locally
# Open index.html in a browser, or serve with:
npx serve .
```

## Code of Conduct

Be respectful, constructive, and evidence-based. This is a research project — disagreements about model specification are normal and welcome. Critique the equations, not the authors.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
