# Model Operationalization Checklist

Use this checklist before treating the Malaysia quarterly model as production-ready.

## Data Contract
- Adopt [docs/model_input_schema.json](/Users/shahidrogers/Desktop/stagflation/docs/model_input_schema.json) as the required input contract.
- Enforce the package structure described in [docs/model_input_spec.md](/Users/shahidrogers/Desktop/stagflation/docs/model_input_spec.md).
- Use [docs/model_run_config.template.json](/Users/shahidrogers/Desktop/stagflation/docs/model_run_config.template.json) as the minimum run metadata shape.
- Version every scenario run with dataset vintage and scenario owner.

## Highest-Value Model Gaps
- Replace the current external `CREDIT` path with a satellite credit equation or a documented projection module.
- Replace free-form `MCCI` assumptions with an observable-based rule or a separately versioned confidence model.
- Turn `GOVDEBTADJ` into an explicit debt reconciliation table with named components.
- Formalize `HARAREA` as either a satellite agricultural supply model or a governed scenario path.

## Preprocessing Layer
- Build a preprocessing step that assembles fiscal detail, household balance-sheet stocks, and international investment position stocks.
- Make preprocessing output deterministic from raw source files plus a run config.
- Fail the build when required quarterly observations are missing.

## Governance
- Require a reconciliation note whenever balancing items are non-zero.
- Store units and transformation rules alongside source metadata.
- Do not allow undocumented manual edits to scenario files after a run is published.

## Publication Standard
- Publish the scenario path, assumptions, and reconciliation notes together.
- Run `node scripts/validate_model_inputs.mjs --historical ... --scenario ...` before publishing.
- Run a consistency check between any study page or chart data and the scenario dataset before release.
- Record the exact model file and schema version used for the published scenario.
