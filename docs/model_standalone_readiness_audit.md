# Malaysia Quarterly Model Standalone Readiness Audit

## Scope
This audit reviews [model/malaysia-quarterly-model.md](/Users/shahidrogers/Desktop/stagflation/model/malaysia-quarterly-model.md) as a runnable model artifact.

The goal is not to judge whether the economics are reasonable in general. The goal is to answer a narrower question:

- what must be supplied from outside the file
- what could be derived inside the model
- what should eventually get its own equation or preprocessing rule

## Bottom Line
The model is structurally coherent, but it is not standalone yet.

It reads like:
- a strong equation library
- plus a glossary of required external series
- plus several policy and calibration placeholders

That is a valid stage for a research model. It is not yet a self-contained production model definition.

The operational follow-on documents are:
- [docs/model_input_schema.json](/Users/shahidrogers/Desktop/stagflation/docs/model_input_schema.json)
- [docs/model_input_spec.md](/Users/shahidrogers/Desktop/stagflation/docs/model_input_spec.md)
- [docs/model_operationalization_checklist.md](/Users/shahidrogers/Desktop/stagflation/docs/model_operationalization_checklist.md)

## Status

### Must Be Input
These are legitimate exogenous inputs or scenario controls. They should stay external, but they need an explicit data contract.

Global / external environment:
- `PBRENT`
- `PCPO`
- `WEQPR`
- `WSTD`
- `WTOUR`
- `WPG`
- `WCPI`
- `UST10`

Domestic policy / scenario controls:
- `OPR`
- `REER`
- `PADMINPRICE`
- `SSTRATE`
- `DEVGR`
- `CPODRATE`
- `FUELCONS`
- `EPFWDRAW`
- `ELNINO`

Trend / demographic anchors:
- `TRGDP`
- `POPAL`
- `WAP`

Calibration / wedge inputs currently treated as exogenous:
- `ADJW`
- `GWADJ`
- `ERGOV`
- `MCCI`
- `IIB`
- `SIB`
- `NDIV`
- `PETMARG`
- `SSTADJ`

Why:
- these are either policy levers, foreign conditions, trend objects, or explicit calibration knobs
- the model already documents many of them in the exogenous glossary near lines 1078-1109

### Can Be Derived In Preprocessing
These do not need full structural equations inside the model file, but they should be generated from a preprocessing layer or dataset builder rather than manually maintained.

Fiscal / residual administrative series:
- `TOTHER`
- `TLEVIES`
- `GOVOREV`
- `GOVDEBTADJ`

Government and transfers:
- `GOVGRANT`
- `GOVPEN`
- `GOVOTR`
- `GOVINVI`
- `GOVFEES`
- `BSHTRF`

External stock/flow scaffolding:
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

Household / financial stock helpers:
- `M3BUS`
- `M3OFI`
- `OSB`
- `KGHH`
- `VALHH`
- `IHHPS`
- `OAHH`

Why:
- many of these are stock-flow scaffolds, balance-sheet initial conditions, or budget-detail placeholders
- they can be loaded from historical data and scenario tables without needing in-model behavioral equations

### Should Get Their Own Equation Or Clearer Rule
These are the highest-value gaps if the goal is better standalone behavior.

Credit and confidence:
- `CREDIT`
- `MCCI`

Reason:
- they materially affect consumption and finance behavior very early in the model
- if they stay external, every scenario depends heavily on undocumented assumptions

Commodity / sectoral supply drivers:
- `HARAREA`
- `NNOILGVA`

Reason:
- these are important drivers for palm oil and oil demand blocks
- they currently behave like hidden scenario levers

Government wage / compensation scaffolding:
- `ADJW`
- `GWADJ`
- `ERGOV`

Reason:
- these control government wage behavior through `GOVWS`
- they could be collapsed into a clearer wage rule or scenario parameter block

Financial market valuation anchors:
- `NDIV`
- `WEQPR`

Reason:
- these matter for equity returns and external income flows
- they are valid exogenous inputs, but currently not well operationalized as a documented scenario layer

Debt-stock adjustment:
- `GOVDEBTADJ`

Reason:
- debt dynamics are central to the fiscal block
- leaving this as an unexplained adjustment weakens debt simulations

### Already In Good Shape
These look fine as in-model relationships and do not need special treatment for standalone readiness beyond data availability.

Examples:
- `BLR = OPR + 2.25`
- `RMORT = OPR + 1.75`
- `PETDIV` smoothing off `PETPROF`
- current account identities
- fiscal balance and debt identities
- administered-price CPI split
- household balance-sheet identities

These are simplified, but they are explicit.

## Highest-Risk Dependencies
If you only fix a handful of things next, fix these first.

1. `CREDIT`
Reason:
- enters consumption directly
- strongly shapes private-sector response

2. `MCCI`
Reason:
- small coefficient, but it is a pure outside narrative variable right now

3. `GOVDEBTADJ`
Reason:
- debt dynamics become hard to trust if this is an opaque plug

4. `HARAREA`
Reason:
- palm oil dynamics are structurally important for Malaysia

5. `DLFDI`, `FLIAB`, `DAFDI`, `FASSET`
Reason:
- the external income block relies on these stocks heavily
- without a clear initialization/data story, BOP behavior is fragile

## Recommended Data Contract
To make the model operational, define three explicit layers.

### Layer 1: Historical Data Inputs
- national accounts
- labour market
- prices
- fiscal outcomes
- financial stocks
- external stocks

### Layer 2: Scenario Inputs
- `PBRENT`
- `PCPO`
- `OPR`
- `REER`
- `UST10`
- `WSTD`
- `WTOUR`
- policy paths such as `PADMINPRICE`, `SSTRATE`, `DEVGR`, `CPODRATE`

### Layer 3: Calibration / Wedge Inputs
- `PETMARG`
- `SSTADJ`
- `ADJW`
- `GWADJ`
- `ERGOV`
- `IIB`
- `SIB`
- `NDIV`
- `GOVDEBTADJ`

This layer should be documented as assumptions, not disguised as ordinary data.

## Suggested Next Steps
1. Create a machine-readable input schema listing every required external series with unit, frequency, and source.
2. Split the model file into endogenous equations vs exogenous/preprocessed inputs.
3. Replace `GOVDEBTADJ` with a documented decomposition or at least a named adjustment policy rule.
4. Decide whether `CREDIT` and `MCCI` stay exogenous or get explicit reduced-form equations.
5. Add a minimal “baseline input pack” example so the file is reproducible.

## Practical Assessment
Current state:
- good research model
- readable
- scenario-capable with prepared inputs
- not standalone

If the goal is a public, inspectable model, it is already useful.
If the goal is one-command reproducibility, the missing input contract is the main blocker.
