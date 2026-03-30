# MaMaMo

**Malaysia's open-source macroeconomic model — ~200 equations, zero gatekeeping.**

`v0.2.0` · A curiosity project by [Shahid Rogers](mailto:shahidrogers+mamamo@gmail.com), built with [Claude](https://claude.ai)

---

## Index

1. [What is this?](#what-is-this)
2. [What's inside](#whats-inside)
3. [What makes it Malaysian](#what-makes-it-malaysian)
4. [Key assumptions](#key-assumptions)
5. [Use cases](#use-cases)
6. [What's next](#whats-next-contributions-welcome)
7. [Files](#files)
8. [Studies](#studies)
9. [Changelog](#changelog)
10. [License](#license)
11. [References](#references)

---

## What is this?

MaMaMo (Malaysia Macro Model) is a structural quarterly macroeconomic model for the Malaysian economy. It takes the battle-tested architecture of the UK OBR/HM Treasury model and rebuilds it — every block, every coefficient, every institutional detail — for Malaysia.

The idea is simple: Malaysia deserves a transparent, publicly available macro model. BNM and MOF have their own, but those are proprietary. Academic models tend to be partial. MaMaMo aims to be the thing you can actually open, read, run, break, fix, and learn from.

This is a curiosity project — built by [Shahid Rogers](mailto:shahidrogers+mamamo@gmail.com) with [Claude](https://claude.ai) to see what happens when you point an LLM at 200 equations and a country's economy. It's not finished. It might never be. But it's a start.

---

## What's inside

~200 equations across 17 blocks, written in EViews-compatible syntax:

| Block | What it covers |
|-------|---------------|
| **1–3** | Private consumption (with credit and confidence), durables, property prices, inventories, business & housing investment, cost of capital |
| **4** | Labour market — employment, wages, unemployment, participation, and a foreign workers sub-block (~2M workers in plantations, construction, manufacturing) |
| **5–6** | Exports (E&E/semiconductors, commodities, tourism, other goods) and imports (with IO-table-derived import content ratios) |
| **7** | Prices and wages — CPI with administered prices split out (~22% weight for fuel, utilities, controlled food), PPI, ULC, export/import deflators, the GST/SST transition |
| **8** | Commodities — dual block for Oil & Gas (Petronas, Brent pass-through) and Palm Oil (CPO production, El Niño effects, export duties) |
| **9–10** | Government revenue (income tax, corporate tax, PITA, SST, Petronas dividends) and expenditure (emoluments, debt service, fuel subsidies, BSH cash transfers, development expenditure) |
| **11** | Balance of payments — managed float exchange rate, current account, remittance outflows, FDI/portfolio flows |
| **12** | Fiscal totals — fiscal balance, primary balance, debt dynamics, 65%-of-GDP ceiling |
| **13–14** | Monetary policy (OPR transmission to BLR, deposits, MGS yields) and financial sector |
| **15** | Income accounts — household disposable income, EPF, corporate profits, SOCSO |
| **16** | GDP identities, output gap, market sector satellite |
| **17** | Household balance sheet (deposits, EPF, equities, housing loans, hire purchase) and external IIP |

---

## What makes it Malaysian

This isn't a UK model with the labels swapped. Key Malaysia-specific features:

- **Administered prices** — RON95, diesel, electricity tariffs treated separately from market-driven CPI
- **Petronas** — upstream profits, PITA (38%), and dividends (~20% of federal revenue) flow through to the fiscal block
- **Palm oil** — CPO production with El Niño sensitivity, sliding-scale export duties, contribution to GVA
- **E&E exports** — driven by the global semiconductor cycle, ~38% of goods exports, with ~52% import content reflecting GVC integration
- **EPF** — mandatory 24% savings modelled as a distinct household wealth channel
- **Foreign workers** — 2 million workers modelled explicitly (absent from advanced-economy models)
- **Fuel subsidies** — endogenous: gap between Brent-in-ringgit and the administered pump price times consumption volume
- **GST/SST transition** — time-varying administered price weight and policy dummies for the 2015–2018 episode
- **BNM-style fiscal** — operating vs development expenditure, matching the federal budget structure

Crisis dummies for: 1997–98 AFC, 2008–09 GFC, 2013 minimum wage, 2015 oil crash, 2020 COVID.

---

## Key assumptions

**Structural:** Error-correction (ECM) framework — long-run equilibrium with short-run adjustment dynamics. Small open economy — Malaysia is a price-taker in commodity and capital markets. Managed float exchange rate — REER exogenous, NEER determined by relative prices.

**Coefficients:** Calibrated from BNM working papers, IMF Article IV reports, DOSM Input-Output tables, and published Malaysian macro studies. Not estimated from raw data — treat as informed starting points that need proper econometric validation.

**Policy variables (exogenous):** OPR, administered fuel price, SST rate, CPO export duty rate, development expenditure growth.

---

## Use cases

Fiscal forecasting under different oil/CPO price paths. OPR transmission analysis. Subsidy rationalisation scenarios. Minimum wage impact assessment. Stress testing macro scenarios. Teaching structural macro modelling. Or just poking around to see how Malaysia's economy hangs together.

---

## What's next (contributions welcome)

The biggest wins, roughly in priority order:

1. **Re-estimate everything** — replace calibrated coefficients with proper econometrics using DOSM/BNM quarterly data
2. **Supply side** — add a production function, TFP dynamics, sectoral capital stocks
3. **Sectoral disaggregation** — break the market sector into manufacturing, services, agriculture, construction, mining
4. **Financial accelerator** — link household debt (~84% of GDP) to NPLs, bank capital, credit supply
5. **E&E/GVC granularity** — front-end vs back-end semicon, US-China decoupling scenarios
6. **Stochastic simulation** — fan charts instead of point forecasts
7. **Data pipeline** — auto-ingest from BNM API + OpenDOSM
8. **Back-testing** — validate against AFC, GFC, COVID outturns
9. **Forward-looking expectations** — rational expectations for inflation and exchange rates
10. **Digital economy** — capture the ~23% of GDP that's now digital

In practice, [model/malaysia-quarterly-model.md](/Users/shahidrogers/Desktop/stagflation/model/malaysia-quarterly-model.md) is now documented well enough to support a governed input pipeline. What it still lacks for true production quality is a preprocessing builder plus better treatment of the big external wedges, especially `CREDIT`, `MCCI`, `GOVDEBTADJ`, and `HARAREA`.

The next highest-value step is to build that preprocessing layer and satellite-rule set so the model can be run from raw source data instead of hand-assembled quarterly inputs.

---

## Files

```
model/
  malaysia-quarterly-model.md          # The model (~200 equations, EViews syntax)
  reference/
    uk-obr-reference.md               # Original UK OBR model (reference)
studies/
  simulations/
    oil-200-iran-war/
      index.html                       # Interactive simulation dashboard
      scenario-data.json               # Full quarterly projections (JSON)
      satellite/
        residential-projects-slip/
          index.html                   # Residential satellite dashboard
          scenario-data.json           # Residential quarterly projections (JSON)
README.md                              # You are here
```

## Studies

| Scenario | What it models | Link |
|----------|---------------|------|
| **$200 Oil — Iran War** | Brent spikes to $200/bbl on a US–Iran ground war. Traces fiscal, trade, household, and Petronas impacts over 8 quarters. | [View simulation →](https://shahidrogers.github.io/MaMaMo/studies/simulations/oil-200-iran-war/) |
| **When Oil Hits $200, Residential Projects Slip** | Satellite study inside the oil-war scenario. Maps the same macro shock into construction-cost inflation, launch deferrals, project delays, contractor stress, and LAD exposure for Malaysian residential development. | [View simulation →](https://shahidrogers.github.io/MaMaMo/studies/simulations/oil-200-iran-war/satellite/residential-projects-slip/) |

---

## Changelog

**v0.2.0** — Audit pass. Fixed 3 critical undefined variables (PDINV, TYCADJ, PXEE), added 2008–09 GFC dummies, corrected E&E import content (0.65 → 0.52), defined ~20 previously missing variables, made administered price weight time-varying for GST/SST.

**v0.1.0** — Initial adaptation from UK OBR model. All 17 blocks rebuilt for Malaysia.

---

## License

Research and educational use. The original UK OBR model structure is Crown Copyright under the Open Government Licence. The Malaysian adaptation is provided as-is.

---

## References

### Official data sources

- **OpenDOSM** — Malaysia's open data platform. GDP, inflation, employment, trade, and population data under CC BY 4.0. [open.dosm.gov.my](https://open.dosm.gov.my/)
- **DOSM, *Input-Output Tables 2015*** — Basis for import content ratios and cost structure weights. Released 26 Dec 2018. [dosm.gov.my](https://www.dosm.gov.my/portal-main/release-subthemes/economy)
- **BNM Monthly Statistical Bulletin** — Interest rates, monetary aggregates, credit, BOP, and financial data. [bnm.gov.my/publications](https://www.bnm.gov.my/publications)

### Institutional reports

- **Bank Negara Malaysia, *Annual Report 2024*** — Macro outlook, monetary policy review, financial stability assessment. [bnm.gov.my/ar2024](https://www.bnm.gov.my/ar2024)
- **BNM Research Papers** — Working papers and staff studies on Malaysian monetary transmission, household debt, and macro modelling. [bnm.gov.my/publications/research](https://www.bnm.gov.my/publications/research)
- **IMF, *Malaysia: 2025 Article IV Consultation*** — Country Report No. 25/57, concluded 25 Feb 2025. Staff report with macro projections, fiscal assessment, and policy recommendations. [imf.org](https://www.imf.org/en/publications/cr/issues/2025/03/03/malaysia-2025-article-iv-consultation-press-release-and-staff-report-562916)
- **IMF, *Malaysia: 2024 Article IV Consultation*** — Country Report No. 24/70, Mar 2024. [imf.org](https://www.imf.org/en/Publications/CR/Issues/2024/03/08/Malaysia-2024-Article-IV-Consultation-Press-Release-Staff-Report-and-Statement-by-the-546087)
- **World Bank, *Malaysia Economic Monitor, October 2025*** — "From Bytes to Benefits: Digital Transformation as a Catalyst for Public Sector Productivity." [worldbank.org](https://www.worldbank.org/en/country/malaysia/publication/malaysia-economic-monitor-reports)
- **OBR (UK), *Forecast Methodology*** — Documentation of the original UK model architecture that MaMaMo adapts. [obr.uk/forecasts-in-depth/forecast-methodology](https://obr.uk/forecasts-in-depth/forecast-methodology/)

### Academic papers

- Alp, H., Elekdag, S.A. & Lall, S. (2012). "An Assessment of Malaysian Monetary Policy During the Global Financial Crisis of 2008–09." *IMF Working Paper No. 12/35*. [imf.org](https://www.imf.org/en/Publications/WP/Issues/2016/12/31/An-Assessment-of-Malaysian-Monetary-Policy-During-the-Global-Financial-Crisis-of-2008-09-25685)
- BIS (2008). "The Monetary Transmission Mechanism in Malaysia." *BIS Papers No. 35*. [bis.org](https://www.bis.org/publ/bppdf/bispap35p.pdf)
- Pham, T.A. & Nguyen, T.D. (2018). "The Transmission Mechanism of Malaysian Monetary Policy: A Time-Varying Vector Autoregression Approach." *Empirical Economics*, 55(2). [ideas.repec.org](https://ideas.repec.org/a/spr/empeco/v55y2018i2d10.1007_s00181-017-1280-z.html)
