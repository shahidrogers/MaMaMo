# Model Architecture

This page gives a clean high-level map of the system in [model/malaysia-quarterly-model.md](../model/malaysia-quarterly-model.md).

## Diagram

```mermaid
flowchart LR
    EXT["External Environment<br/>Brent, CPO, world prices, tourism,<br/>semiconductor cycle, UST10, REER"] --> TRADE["Trade And External Sector<br/>Exports, imports, current account,<br/>capital flows, reserves"]
    EXT --> COM["Commodity Block<br/>Oil & gas, Petronas,<br/>palm oil, export duties"]
    EXT --> MON["Monetary And Financial Conditions<br/>OPR, BLR, MGS10, deposit and lending rates"]

    HH["Households<br/>Income, consumption, durables,<br/>wealth, debt, EPF"] --> GDP["GDP And Identities<br/>Demand, value added,<br/>output gap"]
    FIRMS["Firms And Investment<br/>Business investment, inventories,<br/>cost of capital, prices"] --> GDP
    GOV["Government<br/>Revenue, expenditure,<br/>subsidies, debt"] --> GDP
    TRADE --> GDP
    COM --> GDP

    LAB["Labour Market<br/>Employment, unemployment,<br/>participation, foreign workers, wages"] --> HH
    LAB --> FIRMS
    GDP --> LAB

    MON --> HH
    MON --> FIRMS
    MON --> GOV

    COM --> GOV
    COM --> TRADE

    PRICES["Prices Block<br/>CPI, administered prices, PPI,<br/>import/export prices, unit labour costs"] --> HH
    PRICES --> FIRMS
    PRICES --> GOV
    LAB --> PRICES
    TRADE --> PRICES
    COM --> PRICES

    GOV --> BS["Balance Sheets<br/>Household assets and debt,<br/>public debt, NIIP"]
    HH --> BS
    TRADE --> BS
    MON --> BS
```

## Reading Guide

- Start with households, firms, government, and trade.
- Then read prices, labour, and commodities as the main transmission layers.
- Treat balance sheets and debt dynamics as the stock-flow discipline around the core demand system.
- Treat some external wedges as governed inputs rather than fully endogenous outputs.

## Scope Note

This is an architecture diagram, not a causal proof. Several links are reduced-form and some important drivers remain exogenous in the current version of the model.
