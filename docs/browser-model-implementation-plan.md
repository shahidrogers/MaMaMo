# Browser Model Implementation Plan

This document defines the migration from the current playground simulator to a browser implementation of the actual quarterly model in [model/malaysia-quarterly-model.md](/Users/shahidrogers/Desktop/stagflation/model/malaysia-quarterly-model.md).

## Goal

Replace the current inline reduced-form simulator with:

- a lag-aware quarterly engine
- a versioned run-pack of historical, scenario, policy, calibration, and preprocessing inputs
- a structural equation layer ported from the model file
- a chart/UI layer that only renders model outputs

## Foundations Added

The first migration files now live in:

- [studies/playground/structural-model-engine.js](/Users/shahidrogers/Desktop/stagflation/studies/playground/structural-model-engine.js)
- [studies/playground/baseline-run-pack.js](/Users/shahidrogers/Desktop/stagflation/studies/playground/baseline-run-pack.js)

These do not yet replace the current simulator. They establish:

- quarterly index handling
- lagged-state access
- run-pack validation
- baseline browser input-pack shape aligned to [docs/model_input_schema.json](/Users/shahidrogers/Desktop/stagflation/docs/model_input_schema.json)

## Migration Phases

### Phase 1: Engine Separation

- move simulation logic out of `index.html`
- keep the existing UI
- make charts read from a model result object instead of inline equations

### Phase 2: Core Structural Port

Port these blocks first:

- monetary and rates
- administered prices and fuel subsidies
- commodity and Petronas block
- exports and imports
- fiscal identities

These are already the closest blocks conceptually.

### Phase 3: Household and Balance-Sheet Port

Port:

- private consumption
- property prices
- housing investment
- household assets and debt
- EPF and wealth channels

This is where the current playground diverges most from the full model.

### Phase 4: External Stock-Flow Port

Port:

- current account components
- primary income credits/debits
- remittances
- financial-account and NIIP scaffolding

This phase depends on the preprocessing layer being trustworthy.

### Phase 5: Full Identity Closure

Port:

- inventories
- valuation adjustments
- GDP identities
- debt accumulation and reconciliation items

At this point the browser model becomes a serious structural runner, not just a scenario dashboard.

## Non-Negotiable Requirement

The browser implementation cannot be treated as the actual model unless every published run is backed by the same input contract described in:

- [docs/model_input_spec.md](/Users/shahidrogers/Desktop/stagflation/docs/model_input_spec.md)
- [docs/model_input_schema.json](/Users/shahidrogers/Desktop/stagflation/docs/model_input_schema.json)

Without that, the browser app will only be a more elaborate approximation.

