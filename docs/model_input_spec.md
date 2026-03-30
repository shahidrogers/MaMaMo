# Malaysia Quarterly Model Input Spec

## Purpose
This document turns [model/malaysia-quarterly-model.md](/Users/shahidrogers/Desktop/stagflation/model/malaysia-quarterly-model.md) into an operational model contract.

The model is usable in the real world only if the external data burden is made explicit. That means:

- every required external series has a named owner
- every scenario control has a unit and storage rule
- every stock-flow bridge is versioned and explainable
- every quarterly run can be reproduced from a declared input package

The machine-readable version of this contract lives in [docs/model_input_schema.json](/Users/shahidrogers/Desktop/stagflation/docs/model_input_schema.json).

## Required Package
Each model run should be backed by a versioned input bundle with these files:

1. `historical_inputs.csv`
Contains quarterly history for all required series.

2. `scenario_inputs.csv`
Contains quarterly forecast paths for all required series.

3. `run_config.json`
Contains model version, sample window, scenario name, dataset vintage, and notes on any manual overrides.

4. `reconciliation_notes.md`
Required whenever `GOVDEBTADJ`, `BSHTRF`, or other balancing items are materially non-zero.

Use long CSV format for both input files:

| quarter | series | value |
| --- | --- | --- |
| `2025Q4` | `PBRENT` | `74.2` |
| `2025Q4` | `OPR` | `3.00` |
| `2025Q4` | `CREDIT` | `2103450` |

A template config lives in [docs/model_run_config.template.json](/Users/shahidrogers/Desktop/stagflation/docs/model_run_config.template.json).

## Quarterly Index
Use a single quarterly index field called `quarter` in `YYYYQn` format.

Rules:
- no missing quarters
- no duplicate quarters
- all files must share the same quarter range
- history should end exactly one quarter before the scenario horizon begins, unless the scenario explicitly restates history as a vintage update

## Input Classes

### 1. Scenario Inputs
These are foreign conditions or shock paths that should remain external.

| Series | Unit | Notes |
| --- | --- | --- |
| `PBRENT` | USD/bbl | Core oil shock path |
| `PCPO` | RM/tonne | CPO price path |
| `WEQPR` | index | Global equity valuation anchor |
| `WSTD` | index | World semiconductor demand |
| `WTOUR` | index | World tourism demand |
| `WPG` | index | World goods prices |
| `WCPI` | index | External inflation anchor |
| `UST10` | percent | US long-end yield |
| `ELNINO` | indicator | Palm-oil weather shock control |

### 2. Policy Inputs
These are domestic levers that should be intentionally set, not inferred from narrative copy.

| Series | Unit | Notes |
| --- | --- | --- |
| `OPR` | percent | Main monetary policy instrument |
| `REER` | index | Treated as exogenous in current model design |
| `PADMINPRICE` | RM/litre | Administered fuel price |
| `SSTRATE` | decimal share | Effective SST rate |
| `DEVGR` | qoq growth rate | Real development spending growth rule |
| `CPODRATE` | decimal share | CPO export duty rate |
| `FUELCONS` | volume | Must be consistent with subsidy scaling |
| `EPFWDRAW` | RM million | Policy-driven EPF withdrawals |

### 3. Demographic and Trend Anchors
These are slow-moving anchors that should be owned by a preprocessing or forecasting method.

| Series | Unit | Notes |
| --- | --- | --- |
| `TRGDP` | RM million, constant prices | Potential GDP |
| `POPAL` | persons | Total population |
| `WAP` | persons | Working-age population |

### 4. Calibration Inputs
These are valid for now, but should be governed tightly because they can easily become hidden judgment calls.

| Series | Unit | Notes |
| --- | --- | --- |
| `ADJW` | multiplier | Wage wedge |
| `GWADJ` | multiplier | Government wage wedge |
| `ERGOV` | ratio | Government earnings ratio |
| `MCCI` | index | Confidence input; high-priority gap |
| `IIB` | decimal share | Initial investment allowance |
| `SIB` | decimal share | Subsequent investment allowance |
| `NDIV` | decimal share | Dividend yield anchor |
| `PETMARG` | decimal share | Petronas profit margin |
| `SSTADJ` | multiplier | SST collection efficiency |

### 5. Preprocessing-Derived Inputs
These should come from a data builder, not manual editing inside the model.

Fiscal and administrative:
- `TLEVIES`
- `TOTHER`
- `GOVOREV`
- `GOVDEBTADJ`
- `GOVGRANT`
- `GOVPEN`
- `GOVOTR`
- `GOVINVI`
- `GOVFEES`
- `BSHTRF`

External balance-sheet stocks:
- `DLFDI`
- `FLIAB`
- `DAFDI`
- `FASSET`
- `EQFLI`
- `BFLI`
- `OTFLI`
- `EQFA`
- `BFA`
- `OTFA`

Household and monetary stocks:
- `M3BUS`
- `M3OFI`
- `OSB`
- `KGHH`
- `VALHH`
- `IHHPS`
- `OAHH`

Real-economy helpers:
- `HARAREA`
- `NNOILGVA`
- `SDI`
- `CREDIT`

## Minimum Validation Standard
Do not consider a model run publishable unless these checks pass:

1. Coverage
Every required series exists for the full quarterly window.

2. Unit integrity
Rates stored as shares are decimals, not percentages.

3. Stock-flow integrity
Stock variables are levels. Flow variables are quarterly flows. No mixed conventions.

4. Identity sanity
Preprocessing bridges do not create silent breaks in debt, NIIP, or household wealth paths.

5. Override traceability
Any hand-tuned path for `CREDIT`, `MCCI`, `PETMARG`, `SSTADJ`, or `GOVDEBTADJ` must be disclosed in `run_config.json`.

6. Automated validation
Run:

```bash
node scripts/validate_model_inputs.mjs \
  --historical path/to/historical_inputs.csv \
  --scenario path/to/scenario_inputs.csv
```

before a model run is treated as publishable.

## High-Priority Upgrades
If the goal is a model that survives real-world repeated use, these are the next upgrades worth doing:

1. Give `CREDIT` a satellite equation or documented projection rule.
2. Replace free-form `MCCI` assumptions with a mapped indicator process.
3. Treat `GOVDEBTADJ` as an explicit reconciliation table, not a hidden plug.
4. Formalize `HARAREA` and other commodity supply-side drivers.
5. Build a repeatable preprocessing step for IIP, fiscal detail, and household balance-sheet stocks.

## Recommended Operating Standard
For every published scenario, store:

- model file version
- input schema version
- data vintage date
- scenario name
- scenario owner
- source notes for all overridden paths
- reconciliation note for any balancing item

Without that discipline, the model will drift back into a one-off research file.
