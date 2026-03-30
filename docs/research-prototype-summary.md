# Research Prototype Summary

## What This Is

MaMaMo is an open structural quarterly macro model prototype for Malaysia.

It adapts the broad block architecture of the UK OBR/HM Treasury model and re-specifies it for Malaysian institutions, fiscal structure, trade composition, administered prices, and household balance-sheet features.

This is best understood as a documented research model:

- strong enough to inspect, critique, and run governed scenarios
- not yet strong enough to present as a validated production forecasting engine

## What Is In The Model

The model file contains roughly 17 linked blocks covering:

- private consumption and durables
- inventories and investment
- labour market and wages
- exports and imports
- prices and administered-price pass-through
- oil and gas, palm oil, and commodity-linked fiscal channels
- government expenditure and revenue
- balance of payments
- public debt dynamics
- monetary policy and domestic finance
- income accounts
- GDP identities
- household and external balance sheets

The model is written in EViews-compatible syntax and combines behavioral equations, identities, and calibration rules.

## What Makes It Specifically Malaysian

The most important Malaysia-specific features are:

- administered fuel and utility price treatment inside CPI
- GST-to-SST policy treatment
- Petronas profits, petroleum income tax, and dividends
- palm oil production, export duties, and weather sensitivity
- E&E exports tied to the global semiconductor cycle
- foreign worker and remittance channels
- EPF as a distinct household wealth and savings mechanism
- fuel subsidy mechanics linked to Brent, administered prices, and consumption volume
- BNM-style operating vs development expenditure structure

## Current Status

| Area | Status |
| --- | --- |
| Structure | Strong |
| Documentation | Strong |
| Malaysia-specific adaptation | Strong |
| Calibration discipline | Moderate |
| Raw-data reproducibility | Partial |
| Econometric estimation | Incomplete |
| Production readiness | Not yet |

## What The Model Is Good For Today

- structured scenario analysis
- policy transmission thought experiments
- fiscal and commodity sensitivity exercises
- teaching and discussion
- transparent model design review

## What The Model Is Not Yet Good For

- official forecasts
- high-confidence point projections
- policy sign-off without supplementary validation
- repeated production use without a preprocessing and governance layer

## Why The Limitation Matters

Some important drivers are still external inputs or preprocessing products rather than internally modeled series. The highest-impact examples are:

- `CREDIT`
- `MCCI`
- `GOVDEBTADJ`
- `HARAREA`

That does not invalidate the model. It means scenario quality still depends materially on the quality and discipline of the input layer.

## Publishable Claim

The strongest defensible public claim today is:

> MaMaMo is a transparent, Malaysia-specific structural quarterly macro model prototype built for research, scenario analysis, and open iteration.

That claim is strong enough for publication and honest enough to hold up under scrutiny.
