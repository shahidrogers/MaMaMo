# How To Interpret This Model

## Start With The Right Mental Model

Read MaMaMo as a structural research model, not a black-box forecasting engine.

It does three useful things:

- makes assumptions explicit
- links Malaysian institutions into a coherent macro system
- forces scenarios to move through named channels rather than narrative handwaving

It does not yet eliminate judgment.

## What A Forecast From This Model Means

A model output here should be interpreted as:

- the implied path of the system given the specified external conditions, policy paths, and calibration settings
- not an objective truth about what Malaysia will do next quarter

If two people run the same model with different paths for `CREDIT`, `MCCI`, `GOVDEBTADJ`, or `HARAREA`, they can get materially different results. That is a model governance issue, not necessarily a flaw in the structural design.

## How To Read The Equation File

The model file contains three kinds of relationships:

1. Behavioral equations
Examples:
- consumption
- business investment
- export demand
- wage dynamics

2. Accounting identities
Examples:
- GDP identities
- fiscal balances
- debt accumulation
- household net wealth

3. Calibration rules and closures
Examples:
- residual deflators
- smoothing rules
- exogenous wedges
- policy paths

Do not treat all three categories as equal evidence. Behavioral equations say something about transmission. Identities say something about consistency. Calibration rules say something about closure assumptions.

## What The Model Is Strongest At

- comparative scenarios
- tracing transmission channels
- organizing fiscal and external-sector thinking
- showing where Malaysian institutional details matter

The model is especially useful when the question is:

“If these external conditions and policy settings hold, what does the rest of the system have to do?”

## What Requires Extra Caution

Be careful when interpreting:

- point forecast precision
- medium-run debt paths if `GOVDEBTADJ` is not well governed
- household-demand sensitivity when `CREDIT` or `MCCI` paths are judgmental
- commodity scenarios when `HARAREA`, `PETMARG`, or other wedges are loosely specified

## Best Practice For Public Use

When sharing outputs publicly:

- state that the model is a research prototype
- disclose the key scenario inputs
- disclose any manually governed wedges
- distinguish structural equations from exogenous assumptions
- avoid language that implies official or production-grade forecasting accuracy

## Short Version

The right way to read MaMaMo is:

> a transparent, Malaysia-specific scenario model with serious structure, useful transmission logic, and still-meaningful dependence on governed external inputs.
