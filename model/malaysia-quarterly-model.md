'
' ============================================================================
' MALAYSIA QUARTERLY MACROECONOMIC MODEL
' ============================================================================
' Adapted from UK OBR/HMT model for the Malaysian economy
' Calibrated using BNM working papers, DOSM national accounts,
' IMF Article IV estimates, and published Malaysian macro studies
'
' Base year: 2015 (Malaysia GDP rebasing year)
' Frequency: Quarterly
' Currency: Ringgit Malaysia (RM), millions unless otherwise stated
'
' Variable naming conventions:
'   P prefix = price deflator (index, 2015=100)
'   R prefix = interest rate (percent per annum)
'   d()      = first difference operator
'   dlog()   = log first difference (approx. growth rate)
'   (-n)     = lag n quarters
'   @recode  = dummy variable constructor
'   @elem    = value at specific date
'   @TREND   = time trend
'   @ADD(V)  = add-factor adjustment
' ============================================================================

'
' Group 1: Private Consumption
'
' Error-correction consumption function for Malaysia
' Long-run: consumption driven by real disposable income, wealth, and credit conditions
' Short-run: income growth, interest rates, consumer confidence
' Coefficients calibrated from BNM Working Papers and IMF estimates
' MPC out of income ~0.55 (long-run), wealth elasticity ~0.08 (housing wealth negative in Malaysia)
' OPR pass-through: 20-30bps per 25bps move

dlog(PCONS)  = 0.1824  + 0.1385  * dlog(RHHDI)  - 0.0072  * d(LFSUR)  + 0.0843  * dlog(CREDIT / (PCPI / 100))  - 0.0005  * d(OPR(-1)  - (-1  + PCPI  / PCPI(-4))  * 100)  - 0.1080  * ( log(PCONS(-1))  - 0.5500  * log(RHHDI(-1))  - 0.0800  * log(NFWPE(-1)  / (PCPI(-1)  / 100))  - 0.1200  * log(CREDIT(-1)  / (PCPI(-1)  / 100)) )  + 0.0382  * dlog(MCCI)  - 0.0350  * ( @recode(@date  = @dateval("2008:04")  , 1  , 0)  - @recode(@date  = @dateval("2009:02")  , 1  , 0) )

PCONSPS  = PCONS  * PCPI  / 100

' Durable consumption (vehicles, appliances — important given Malaysia's auto sector)
dlog(CDUR)  = dlog(PCONS)  - 0.5500  * (dlog(PCDUR)  - dlog(PCPI))  + 0.3200  * dlog(RHHDI)  + 0.2800  * dlog(RHHDI(-1))  - 0.0380  * log(CDUR(-1)  / PCONS(-1))  - 0.0120  * log(PCDUR(-1)  * ((((1  + OPR(-1)  / 100)^0.25)  - 1)  + ((1.20^0.25)  - 1)  - d(PCDUR(-1))  / PCDUR(-1))  / 100)  + 0.0250  * log(NFWPE(-1)  / (PCPI(-1)  / 100))  - 0.4800  + 0.0550  * ( @recode(@date  = @dateval("2020:02")  , 1  , 0)  - @recode(@date  = @dateval("2020:03")  , 1  , 0) )

CDURPS  = (PCDUR  / 100)  * CDUR

' Property prices (important driver in Malaysia — high home ownership ~76%)
dlog(PRP)  = dlog(EARN)  - 0.1050  * log(PRP(-1)  / EARN(-1))  + 1.2500  * (dlog(EARN)  - dlog(PCPI))  + 0.1800  * ( @recode(@date  = @dateval("1998:01")  , 1  , 0)  - @recode(@date  = @dateval("1998:02")  , 1  , 0) )  - 0.2200  * ( @recode(@date  = @dateval("2020:02")  , 1  , 0)  - @recode(@date  = @dateval("2020:03")  , 1  , 0) )  + 0.1680

'
' Group 2: Inventories
'
' Residual determination (national accounts identity)

DINV  = (GDPM  + IMP  - SDE)  - GCE  - PCONS  - VAL  - GFCF  - EXP

INV  = INV(-1)  + DINV

BV  = BV(-1)  + DINVPS

SA  = BV(-1)  * (PINV  / PINV(-1)  - 1)

' Inventory deflator (linked to GDP deflator)
PDINV  = PGDP

DINVPS  = DINV  * PDINV  / 100

DINVHH  = 0.05  * DINVPS

' Valuables (negligible for Malaysia — gold, precious stones; set proportional to GDP)
VAL  = 0.001  * GDPM

VALPS  = VAL  * PGDP  / 100

' Alignment adjustment on inventories (typically zero or small)
ALAD  = 0

' Government change in inventories (residual from public sector capital account)
' NPAGOV = net purchase of non-produced assets by government
' KGOV = capital transfers by government
' ASSETSA = asset sales adjustment
NPAGOV  / NPAGOV(-1)  = PGDP  / PGDP(-1)
KGOV  / KGOV(-1)  = PGDP  / PGDP(-1)
ASSETSA  = 0

DINVGOV  = GOVNI  - GOVIPS  - GOVDEVPS  - (NPAGOV)  - (KGOV)  - ASSETSA  + DEP  + ASSETSA

'
' Group 3: Investment (Gross Fixed Capital Formation)
'
' Malaysian investment: private ~70%, public ~30% of GFCF
' Higher public investment share than UK reflecting Malaysia's development stage
' Cost of capital framework adapted for Malaysian financial structure
'
' Debt-equity weights for Malaysian firms (Bursa Malaysia data)
' Average debt-to-equity ~0.6, so debt weight ~0.38, equity weight ~0.62

WD  = 0.38

WE  = 0.62

' Tax-adjusted factors (Malaysian corporate tax rate 24%)
TCORP  = 0.24

' Discount and depreciation
RDELTA  = 0.025

' Cost of capital components
CDEBT  = CDEBT(-1)  + d(BLR)

CEQUITY  = NDIV  * (1  + WG)  + 100  * WG

WG  = 0.04

RWACC  = WD  * CDEBT  + WE  * CEQUITY

' Cost of capital
COCU  = PIBUS  / PGDP  * @elem(PGDP  , "2015Q1")  / @elem(PIBUS  , "2015Q1")  * (RDELTA  + RWACC)

' Discount rate for tax depreciation (nominal, based on MGS10)
DISCO  = MGS10  / 100

' Tax-adjusted cost of capital
DB  = 1  / (1  + DISCO)  * (IIB  + (SIB  / DISCO)  * (1  - (1  + DISCO)^((-1)  * (1  - IIB)  / (SIB  + 0.01))))

TAFB  = (1  - TCORP  * DB)  / (1  - TCORP)

COC  = TAFB  * COCU

' Desired capital stock
KSTAR  = exp(log(MSGVA)  - 0.35  * log(COC)  + 2.250)

' Capital accumulation
KMSXH  = (IBUSX  / 1000)  + KMSXH(-1)  * (1  - RDELTA)

KGAP  = log(KMSXH  * 1000)  - log(KSTAR)

' Private business investment (error-correction)
' Investment elasticity to output ~1.0, adjusted for Malaysia's higher investment/GDP ratio (~23%)
dlog(IBUSX)  = 0.2200  * dlog(IBUSX(-3))  + 1.0500  * dlog(MSGVA(-1))  - 0.0015  * d(BLR)  - 0.0450  * (log(IBUSX(-1))  - log(KMSXH(-2)  * 1000)  + KGAP(-2))  + 0.0650  * @recode(@date  = @dateval("1998:01")  , 1  , 0)  - 0.1200  * @recode(@date  = @dateval("1998:03")  , 1  , 0)  - 0.0750  * ( @recode(@date  = @dateval("2008:04")  , 1  , 0)  - @recode(@date  = @dateval("2009:02")  , 1  , 0) )  + 0.0800  * ( @recode(@date  = @dateval("2020:03")  , 1  , 0)  - @recode(@date  = @dateval("2020:04")  , 1  , 0) )  - 0.0750

' Public enterprise investment (GLCs — Petronas, TNB, Telekom etc.)
PUBI  / PUBI(-1)  = GFCF  / GFCF(-1)

PUBIPS  = PUBI  * PIF  / 100

' Total GFCF decomposition
IBUS  = GFCF  - GOVI  - PUBI  - IH

IBUSX  = IBUS

' Government investment
GOVIPS  = GOVDEVPS

GOVI  = 100  * GOVIPS  / GOVIDEF

GOVIDEF  / GOVIDEF(-1)  = PIF  / PIF(-1)

' Housing investment (sensitive to BNM macroprudential measures — LTV limits)
dlog(IH)  = -1.5200  + 0.0380  * d(RMORT)  - 0.0820  * dlog(PRP(-1))  - 0.4500  * (log(IH(-1))  - 0.9500  * log(PCONSPS(-1)))  - 0.1500  * @recode(@date  = @dateval("1998:01")  , 1  , 0)  + 0.1200  * ( @recode(@date  = @dateval("2020:03")  , 1  , 0)  - @recode(@date  = @dateval("2021:01")  , 1  , 0) )

' Investment deflators
GFCFPS  = GFCF  * PIF  / 100

IHPS  = IH  * PIH  / 100

PIBUS  = 100  * (GFCFPS  - IHPS  - GOVIPS  - PUBIPS)  / IBUS

'
' Group 4: The Labour Market
'
' Malaysian labour market: ~16 million employed, participation ~69%
' Large informal sector, significant foreign worker presence (~2 million)
' Minimum wage RM1,500/month (2023)
' Unemployment typically 3.3-3.5% (pre-COVID)

' Government employment (federal + state)
EGOV  / EGOV(-1)  = EGOVLFS  / EGOVLFS(-1)

' Market sector employment (error-correction)
' Okun coefficient ~0.4-0.5 for Malaysia
dlog(EMS)  = -0.0098  + 0.3800  * dlog(EMS(-1))  + 0.2200  * dlog(EMS(-2))  + 0.2050  * dlog(MSGVA(-1))  - 0.0075  * (log(EMS(-1)  / MSGVA(-1))  + 0.35  * (log(PSAVEI(-1)  / PMSGVA(-1))))  - 0.0250  * ( @recode(@date  = @dateval("2009:01")  , 1  , 0)  - @recode(@date  = @dateval("2009:03")  , 1  , 0) )  - 0.0850  * @recode(@date  = @dateval("2020:02")  , 1  , 0)  + 0.0420  * @recode(@date  = @dateval("2020:04")  , 1  , 0)

' Total employment
ET  = ET(-1)  * ETLFS  / ETLFS(-1)

ETLFS  = 1000  * (HWA  / AVH)

ES  / ES(-1)  = ET  / ET(-1)

ESLFS  / ESLFS(-1)  = ES  / ES(-1)

' Population and labour force
POP15  / POP15(-1)  = (WAP)  / (WAP(-1))

ULFS  = ((POP15  * PART15  / 100)  - ETLFS)

LFSUR  = 100  * ULFS  / (ETLFS  + ULFS)

' Productivity
@IDENTITY PRODH  = GDPM  / HWA

PART15  = 100  * (ULFS  + ETLFS)  / POP15

ER  = 100  * ETLFS  / POP15

' Foreign workers (important for Malaysia — construction, plantation, manufacturing)
dlog(EFOR)  = 0.4500  * dlog(MSGVA)  - 0.1200  * (log(EFOR(-1))  - 0.6500  * log(MSGVA(-1)))  - 0.3500  * @recode(@date  = @dateval("2020:02")  , 1  , 0)  + 0.0080

'
' Group 5: Exports of Goods & Services
'
' Malaysia: very open economy, trade/GDP ~130%
' Key exports: E&E (~38%), petroleum products (~8%), palm oil (~5%), chemicals, machinery
' Major markets: China, Singapore, US, EU, Japan
'
' Goods exports decomposed: E&E, commodities (oil+palm oil), other manufactures

' Non-commodity non-E&E goods exports
XNOG  = EXP  - XS  - XOILGAS  - XCPO  - XEE

dlog(RPRICE)  = dlog(PXNOG)  + dlog(NEER)  - 0.9000  * dlog(WPG)

' E&E exports (largest component — driven by global semiconductor cycle)
dlog(XEE)  = 0.1500  * dlog(XEE(-1))  + 1.0500  * dlog(WSTD(-1))  - 0.2800  * dlog(REER)  - 0.1350  * (log(XEE(-1))  - 1.0500  * log(WSTD(-1))  + 0.2500  * log(REER(-1)))  + 0.0350  * @recode(@date  = @dateval("2021:01")  , 1  , 0)  - 0.0650  * @recode(@date  = @dateval("2020:02")  , 1  , 0)  - 0.0850  * ( @recode(@date  = @dateval("2008:04")  , 1  , 0)  - @recode(@date  = @dateval("2009:02")  , 1  , 0) )  - 0.0280

' Services exports (tourism is major component — ~6% of GDP pre-COVID)
dlog(XS)  = 0.3200  * dlog(XS(-1))  + 0.8500  * dlog(WTOUR)  - 0.1800  * dlog(REER)  - 0.0950  * (log(XS(-1))  - 0.9200  * log(WTOUR(-1))  + 0.1500  * log(REER(-1)))  - 0.5500  * @recode(@date  = @dateval("2020:02")  , 1  , 0)  + 0.2500  * @recode(@date  = @dateval("2022:02")  , 1  , 0)  - 0.0180

' E&E export prices (driven by global tech prices, exchange rate, and domestic PPI)
dlog(PXEE)  = 0.4500  * dlog(PPI(-1))  + 0.3500  * (dlog(WPG)  - dlog(NEER))  - 0.0800  * dlog(REER)  - 0.1200  * (log(PXEE(-1))  + 0.2000  * log(REER(-1))  - 0.5500  * log(PPI(-1))  - (1  - 0.5500)  * log(WPG(-1)  / NEER(-1)))  + 0.1800  - 0.0006  * @TREND(2000Q1)

' Total export value
EXPPS  = (PXNOG  / 100)  * XNOG  + (PXS  / 100)  * XS  + (PXOILGAS  / 100)  * XOILGAS  + (PXCPO  / 100)  * XCPO  + (PXEE  / 100)  * XEE

'
' Group 6: Imports of Goods & Services
'
' Malaysia: high import content due to GVC integration (especially E&E)
' Import content coefficients estimated from DOSM Input-Output tables (2015)
' Intermediate imports ~60% of total imports

MC  = 0.220  * PCONS

MCGOV  = 0.080  * GCE

MGFCF  = 0.300  * GFCF

MDINV  = 0.100  * (DINV  - ALAD)

MXS  = 0.120  * XS

MXG  = 0.520  * (XOILGAS  + XCPO  + XNOG)

' E&E import content adjusted to ~52% (DOSM IO 2015; 65% was too high)
MXE  = 0.520  * XEE

MTFE  = MC  + MCGOV  + MGFCF  + MDINV  + MXS  + MXG  + MXE

MINTY  = 100  * IMP  / MTFE

' Import demand — non-oil goods (error-correction)
MGTFE  = 0.150  * PCONS  + 0.050  * GCE  + 0.220  * GFCF  + 0.080  * DINV  + 0.450  * XNOG  + 0.040  * XS  + 0.600  * XEE

PMGREL  = PMNOG  / (0.130  * PCPI  + 0.080  * GOVCDEF  + 0.250  * PIF  + 0.090  * PINV  + 0.320  * PXNOG  + 0.050  * PXS  + 0.080  * PXEE)

' Non-oil goods imports
MNOG  = IMP  - MS  - MOIL

' Services imports
MSTFE  = 0.070  * PCONS  + 0.025  * GCE  + 0.050  * GFCF  + 0.010  * DINV  + 0.025  * XNOG  + 0.080  * XS

PMSREL  = PMS  / (0.055  * PCPI  + 0.035  * GOVCDEF  + 0.060  * PIF  + 0.035  * PINV  + 0.020  * PXNOG  + 0.085  * PXS)

dlog(MS)  = 0.7500  * dlog(MSTFE)  + 0.3500  * dlog(MSTFE(-1))  - 0.4800  * dlog(MSTFE(-2))  + 0.2500  * dlog(MSTFE(-3))  - 0.4200  * dlog(PMSREL)  - 0.2500  * dlog(PMSREL(-1))  - 0.2400  * dlog(MS(-1))  - 0.1550  * (log(MS(-1))  - 1.0200  * log(MSTFE(-1))  + 0.7800  * log(PMSREL(-1)))  - 0.0280

IMPPS  = MNOG  * (PMNOG  / 100)  + MS  * (PMS  / 100)  + MOIL  * (PMOIL  / 100)

'
' Group 7: Prices and Wages
'
' Malaysia: administered price regime for RON95 petrol, diesel, cooking oil, flour, sugar
' Current baseline: BUDI95 targeted RON95 subsidy. Eligible households/farmers receive subsidised
' petrol up to quota, while non-eligible consumption pays the floating market price. In reduced-form
' implementation this means administered fuel prices should be treated as a weighted consumer price,
' not a universal blanket pump price.
' CPI basket has large food weight (~30%) and transport (~14.5%)
' Core inflation typically 1.5-2.5%
' Import price pass-through: 0.3-0.5 in short run
' Wage growth linked to productivity through minimum wage revisions

' Base year values (2015)
OILBASE  = ((@elem(PBRENT  , "2015Q1")  / @elem(NEER  , "2015Q1"))  + (@elem(PBRENT  , "2015Q2")  / @elem(NEER  , "2015Q2"))  + (@elem(PBRENT  , "2015Q3")  / @elem(NEER  , "2015Q3"))  + (@elem(PBRENT  , "2015Q4")  / @elem(NEER  , "2015Q4")))  / 4

CPOBASE  = ((@elem(PCPO  , "2015Q1"))  + (@elem(PCPO  , "2015Q2"))  + (@elem(PCPO  , "2015Q3"))  + (@elem(PCPO  , "2015Q4")))  / 4

' Wages: error-correction with productivity, prices, and unemployment
' Phillips curve for Malaysia — weaker than advanced economies due to structural factors
dlog(PSAVEI)  = -0.0220  + 0.5200  * dlog(PMSGVA)  + 0.2800  * dlog(PMSGVA(-1))  + 0.1200  * dlog(PMSGVA(-2))  + (1  - 0.5200  - 0.2800  - 0.1200)  * dlog(PMSGVA(-3))  - 0.0075  * (LFSUR  - LFSUR(-1))  + 0.2200  * (dlog(MSGVA)  - dlog(EMS))  + 0.2500  * (dlog(CPI)  - dlog(PMSGVA))  - 0.0380  * (log(PSAVEI(-1))  - log(MSGVA(-1)  / EMS(-1))  - log(PMSGVA(-1))  + log(1  + (EMPSC(-1)  / WFP(-1)))  + 0.0120  * LFSUR(-1))  + 0.0450  * @recode(@date  = @dateval("2013:01")  , 1  , 0)  + 0.0380  * @recode(@date  = @dateval("2023:02")  , 1  , 0)

' Earnings and unit labour costs
EARN  = WFP  / (ETLFS  - ESLFS)

RPW  = (FYEMP  / PGVA)  / (ETLFS  - ESLFS)

RCW  = (FYEMP  / PCPI)  / (ETLFS  - ESLFS)

ULCPS  = 0.1800  * (PSAVEI  * (52  / 4)  * (1  + (EMPSC  + SOCSO)  / WFP)  * EMS  / GVA)

MSGVAPSEMP  = MSGVAPS  - MI

FYEMPMS  = FYEMP  - GOVWS

ULCMS  = 100  * 1.6500  * FYEMPMS  * (1  + (MI  / MSGVAPSEMP))  / MSGVA

' Base values for cost indices
ULCPSBASE  = ( @elem(ULCPS  , "2015Q1")  + @elem(ULCPS  , "2015Q2")  + @elem(ULCPS  , "2015Q3")  + @elem(ULCPS  , "2015Q4") )  / 4

ULCMSBASE  = ( @elem(ULCMS  , "2015Q1")  + @elem(ULCMS  , "2015Q2")  + @elem(ULCMS  , "2015Q3")  + @elem(ULCMS  , "2015Q4") )  / 4

PMNOGBASE  = ( @elem(PMNOG  , "2015Q1")  + @elem(PMNOG  , "2015Q2")  + @elem(PMNOG  , "2015Q3")  + @elem(PMNOG  , "2015Q4") )  / 4

PMSBASE  = ( @elem(PMS  , "2015Q1")  + @elem(PMS  , "2015Q2")  + @elem(PMS  , "2015Q3")  + @elem(PMS  , "2015Q4") )  / 4

PPIBASE  = ( @elem(PPI  , "2015Q1")  + @elem(PPI  , "2015Q2")  + @elem(PPI  , "2015Q3")  + @elem(PPI  , "2015Q4") )  / 4

CPIBASE  = ( @elem(CPIX  , "2015Q1")  + @elem(CPIX  , "2015Q2")  + @elem(CPIX  , "2015Q3")  + @elem(CPIX  , "2015Q4") )  / 4

' Manufacturing cost structure (Input-Output based, adapted for Malaysia)
' Higher import content than UK, lower labour cost share
' ULC ~28%, imported intermediates ~32%, energy/utilities ~8%, other domestic ~32%
MCOST  = 28.00  * (ULCMS  / ULCMSBASE)  + 32.00  * (PMNOG  / PMNOGBASE)  + 3.50  * (PMS  / PMSBASE)  + 8.00  * ((PBRENT  / NEER)  / OILBASE)  + 3.50  * ((INDIRTAX  / GVA)  / TXRATEBASE)  + 20.00  * (SCOST  / 100)  + 2.00  * (CCOST  / 100)  + 3.00  * (UTCOST  / 100)

' Services cost structure (higher labour share)
SCOST  = 62.00  * (ULCMS  / ULCMSBASE)  + 8.00  * (PMNOG  / PMNOGBASE)  + 5.50  * (PMS  / PMSBASE)  + 1.50  * ((PBRENT  / NEER)  / OILBASE)  + 4.00  * ((INDIRTAX  / GVA)  / TXRATEBASE)  + 12.00  * (PPI  / PPIBASE)  + 4.00  * (CCOST  / 100)  + 3.00  * (UTCOST  / 100)

' Construction cost
CCOST  = 35.00  * (ULCMS  / ULCMSBASE)  + 5.00  * (PMNOG  / PMNOGBASE)  + 1.50  * (PMS  / PMSBASE)  + 1.00  * ((PBRENT  / NEER)  / OILBASE)  + 2.00  * ((INDIRTAX  / GVA)  / TXRATEBASE)  + 30.00  * (PPI  / PPIBASE)  + 22.00  * (SCOST  / 100)  + 3.50  * (UTCOST  / 100)

' Utilities cost (fuel-intensive — Malaysia uses gas for power generation)
UTCOST  = 12.00  * (ULCMS  / ULCMSBASE)  + 4.00  * (PMNOG  / PMNOGBASE)  + 1.00  * (PMS  / PMSBASE)  + 48.00  * ((PBRENT  / NEER)  / OILBASE)  + 3.50  * ((INDIRTAX  / GVA)  / TXRATEBASE)  + 10.00  * (PPI  / PPIBASE)  + 18.00  * (SCOST  / 100)  + 3.50  * (CCOST  / 100)

' PPI markup
MKGW  = 100  * ( PPI  / (MCOST  / 100))  / (PPIBASE)

' CPI excluding administered prices
CPIX  = (RPCOST  / 100)  * (MKR  / 100)  * CPIBASE

' Retail/consumer cost
RPCOST  = 15.00  * (PMNOG  / PMNOGBASE)  + 3.50  * (PMS  / PMSBASE)  + 10.00  * ((INDIRTAX  / GVA)  / TXRATEBASE)  + 8.00  * (PPI  / PPIBASE)  + 58.00  * (SCOST  / 100)  + 1.50  * (CCOST  / 100)  + 4.00  * (UTCOST  / 100)

' CPI with administered prices
' W_ADMIN = weight of administered items in CPI
' Pre-GST (before 2015Q2): ~22%; GST period (2015Q2-2018Q2): ~18% (GST broadened base);
' Post-SST (2018Q3+): ~22% (reverted)
W_ADMIN  = 0.22  - 0.04  * @recode(@date >= @dateval("2015:02")  , 1  , 0)  * @recode(@date <= @dateval("2018:02")  , 1  , 0)

CPI  = CPI(-1)  * (CPIX^(1  - W_ADMIN)  * PADMIN^W_ADMIN)  / (CPIX(-1)^(1  - W_ADMIN)  * PADMIN(-1)^W_ADMIN)

' Administered price index (RON95, diesel, electricity tariff, water)
' Changes reflect policy decisions — subsidy rationalisation programme
dlog(PADMIN)  = 0.1500  * dlog((PBRENT  / NEER)  / OILBASE)  + 0.0350  * @recode(@date  = @dateval("2014:04")  , 1  , 0)  + 0.0280  * @recode(@date  = @dateval("2015:04")  , 1  , 0)  - 0.0150  * @recode(@date  = @dateval("2020:01")  , 1  , 0)

' CPI-to-PCE deflator link
PCPI  / PCPI(-4)  = CPI  / CPI(-4)

' Export prices
dlog(PXNOG)  = 0.5800  * dlog(PPI(-1))  + 0.1200  * (dlog(WPG)  - dlog(NEER))  - 0.1100  * dlog(REER)  - 0.0004  * @TREND(2000Q1)  - 0.1450  * (log(PXNOG(-1))  + 0.2800  * log(REER(-1))  - 0.8800  * log(PPI(-1))  - (1  - 0.8800)  * log(WPG(-1)  / NEER(-1)))  + 0.2500

PXS  / PXS(-1)  = PXNOG  / PXNOG(-1)

' Import prices (high pass-through for small open economy)
dlog(PMNOG)  = 0.5500  * dlog(PPI)  + 0.2800  * (dlog(WPG)  - dlog(NEER))  - 0.0950  * dlog(REER)  - 0.0004  * @TREND(2000Q1)  - 0.1450  * (log(PMNOG(-1))  + 0.1200  * (log(REER(-1)))  - 0.5000  * (log(PPI(-1)))  - (1  - 0.5000)  * (log(WPG(-1)  / NEER(-1))))  + 0.1600

PMS  / PMS(-1)  = PMNOG  / PMNOG(-1)

PINV  = 100  * BV  / INV

' Investment deflator (residual from national accounts)
PIF  = (GDPMPS  - GCEPS  - PCONSPS  - DINVPS  - VALPS  - EXPPS  + IMPPS  - SDEPS)  * 100  / GFCF

PCDUR  / PCDUR(-1)  = PMNOG  / PMNOG(-1)

' Mortgage rate
RMORT  = OPR  + 1.75

PMSGVA  = 100  * (MSGVAPS  / MSGVA)

'
' Group 8: Commodities — Oil & Gas and Palm Oil
'
' ============================================================================
' Malaysia is a net oil exporter (though declining) and world's 2nd largest palm oil producer
' Petronas is national oil company — upstream + downstream, dividends to government
' Oil production: ~550-600k bpd crude, ~6.8 bcf/d gas (as of 2024)
' Palm oil: ~18-19 million MT CPO, ~5% of GDP, ~5-8% of exports
' ============================================================================

' --- Oil & Gas Sub-block ---

' Domestic oil demand
dlog(TDOIL)  = -0.2200  * dlog(TDOIL(-1))  + 1.6500  * dlog(NNOILGVA(-1))  - 0.0900  * (log(PBRENT  / (NEER  * (GDPMPS(-1)  - INDIRTAXPS(-1)  - (OILGVA(-1)  * PBRENT(-1)  / (OILBASE  * NEER(-1))))  / NNOILGVA(-1) ) )  - log(PBRENT(-1)  / (NEER(-1)  * (GDPMPS(-2)  - INDIRTAXPS(-2)  - (OILGVA(-2)  * PBRENT(-2)  / (OILBASE  * NEER(-2))))  / NNOILGVA(-2) ) ) )  - 0.0120  - 0.1800  * (@recode(@date  = @dateval("1998:01")  , 1  , 0)  - @recode(@date  = @dateval("1998:02")  , 1  , 0))  + 0.1500  * (@recode(@date  = @dateval("2010:03")  , 1  , 0)  - @recode(@date  = @dateval("2010:04")  , 1  , 0))  - 0.2800  * @recode(@date  = @dateval("2020:02")  , 1  , 0)

' Oil imports (net importer of crude for refining, net exporter of products)
MOIL  = TDOIL  + XOILGAS  - OILGVA

' Oil & gas export prices (track Brent/Asian marker)
dlog(PXOILGAS)  = dlog(PBRENT)  - dlog(NEER)

dlog(PMOIL)  = dlog(PXOILGAS)

' Petronas contribution to GDP (oil & gas value added)
OILGTP  / OILGTP(-1)  = (OILGVA  / OILGVA(-1) )  * (PBRENT  / PBRENT(-1))  / (NEER  / NEER(-1))

' --- Palm Oil Sub-block ---

' CPO production (seasonal, weather-dependent, biological cycle ~3 years)
dlog(CPOPROD)  = 0.0080  + 0.2500  * dlog(CPOPROD(-1))  - 0.1500  * dlog(CPOPROD(-4))  + 0.0350  * dlog(HARAREA)  - 0.0200  * ELNINO  - 0.0650  * @recode(@date  = @dateval("2020:02")  , 1  , 0)

' CPO export volume
XCPO  = 0.65  * CPOPROD

' CPO export price (world CPO price in RM terms, net of export duty)
PXCPO  = PCPO  / NEER  * (1  - CPODRATE)

' CPO domestic price (tracks world price with wedge from domestic mandates)
dlog(DCPO)  = 0.8500  * dlog(PCPO  / NEER)  + 0.0250

' Palm oil contribution to GDP
CPOGVA  / CPOGVA(-1)  = (CPOPROD  / CPOPROD(-1))  * 0.7000  + 0.3000  * (PCPO  / PCPO(-1))  / (NEER  / NEER(-1))

' Combined commodity GVA
COMGVA  = OILGVA  + CPOGVA

' Total commodity exports
XCOMPS  = (PXOILGAS  / 100)  * XOILGAS  + (PXCPO  / 100)  * XCPO

'
' Group 9: Government Expenditure (BNM-style)
'
' ============================================================================
' Malaysian federal government expenditure follows BNM classification:
'   Operating Expenditure (OE): emoluments, debt service, subsidies, grants, supplies
'   Development Expenditure (DE): economic, social, security, general admin
' Public sector includes: Federal Govt, State Govts, Statutory Bodies, NFPEs
' ============================================================================

' --- Operating Expenditure ---

' Emoluments (largest OE component ~35% of OE, ~1.6 million civil servants)
GOVWS  = GWADJ  * ERGOV  * EGOV  * (52  / 4000)  * (1  + (1.200  * EMPSC  / WFP))

' Supplies and services
GOVSUP  / GOVSUP(-1)  = PGDP  / PGDP(-1)  * 1.02

' Debt service charges (interest on government debt ~15% of revenue)
GOVDSC  = GOVDSC(-1)  * (AVGBR  / AVGBR(-1))  * (GOVDEBT  / GOVDEBT(-1))

' Base (non-fuel, non-cash-transfer) subsidies — agriculture, utilities, food price stabilisation
GOVSUB_BASE  / GOVSUB_BASE(-1)  = PGDP  / PGDP(-1)  * 1.02

' Average borrowing rate on government debt (weighted MGS curve)
AVGBR  = 0.70  * MGS10  + 0.30  * (OPR  + 0.50)

' Subsidies and social assistance (important — fuel subsidies, BR1M/BSH, food subsidies)
' Fuel subsidies vary with oil price: higher when Brent > administered price
GOVSUB  = GOVSUB_BASE  + FUELSUB  + BSHTRF

' Fuel subsidy (RON95/diesel gap to market price * subsidised volume)
' Under the current baseline, PADMINPRICE should be interpreted as the BUDI95 subsidised RON95 price
' and FUELCONS as quota/eligibility-adjusted subsidised fuel consumption rather than total national use.
' A fuller implementation can split total fuel demand into:
'   FUELCONS_ELIG  = eligible BUDI95 consumption within quota
'   FUELCONS_FLOAT = non-eligible or above-quota consumption
'   PADMINCONSUMER = weighted average of subsidised and floating prices used for CPI/administered inflation
FUELSUB  = MAX(0  , (PBRENT  / NEER  - PADMINPRICE)  * FUELCONS  * 0.001)

' BSH/STR cash transfers (indexed to CPI, population)
BSHTRF  / BSHTRF(-1)  = CPI  / CPI(-1)  * POP15  / POP15(-1)

' Grants and transfers to state governments
GOVGRANT  / GOVGRANT(-1)  = GOVREV  / GOVREV(-1)

' Pensions and gratuities
GOVPEN  / GOVPEN(-1)  = GOVWS  / GOVWS(-1)  * 1.015

' Other operating expenditure (refunds, write-offs, miscellaneous)
GOVOTR  / GOVOTR(-1)  = PGDP  / PGDP(-1)

' Total operating expenditure
GOVOE  = GOVWS  + GOVSUP  + GOVDSC  + GOVSUB  + GOVGRANT  + GOVPEN  + GOVOTR

' --- Development Expenditure ---

' Development expenditure (public investment — ~4-5% of GDP)
' Follows 5-year Malaysia Plan cycles
GOVDEVPS  = GOVDEVPS(-1)  * PGDP  / PGDP(-1)  * (1  + DEVGR)

' Total government expenditure
GOVEXP  = GOVOE  + GOVDEVPS

' Government consumption expenditure (national accounts basis)
GCEPS  = GOVWS  + GOVSUP  + DEPGOV

GOVCDEF  = 100  * GCEPS  / GCE

dlog(GCE)  = 0.0006  + 0.3500  * dlog(GCEPS)  + 0.1600  * dlog(GCEPS(-1))  - 0.3800  * dlog(GCE(-1))

'
' Group 10: Government Revenue (BNM-style)
'
' ============================================================================
' Malaysian federal revenue structure:
'   Tax revenue (~75-80%): Direct taxes (income, petroleum income, RPGT, stamp duty)
'                          Indirect taxes (SST, excise, import/export duties)
'   Non-tax revenue (~20-25%): Petronas dividend, investment income, fees, licences
' ============================================================================

' --- Direct Taxes ---

' Individual income tax (~25% of tax revenue)
' Progressive rates 0-30%, threshold RM5,000
TYIND  = TYIND(-1)  * (WFP  / WFP(-1))  * (1  + 0.5  * (d(LFSUR)  / LFSUR(-1)))

' Corporate income tax (~22% of tax revenue, rate 24%)
' Corporate tax adjustment factor (allowances, incentives, pioneer status etc.)
TYCADJ  = 0.70

' Financial intermediation services indirectly measured (FISIM)
' Spread between lending and deposit rates times loan stock
FISIMPS  = (ALR  - RDEP)  / 100  * CREDIT  * 0.25

TYCORP  = TCORP  * (FYCPR  + FISIMPS)  * TYCADJ

' Petroleum income tax (PITA — 38% rate on upstream profits)
TYPETRO  = 0.38  * PETPROF

' Petronas upstream profits (function of oil/gas production and prices)
PETPROF  = OILGVA  * (PBRENT  / NEER)  / OILBASE  * PETMARG

' Real property gains tax
TRPGT  / TRPGT(-1)  = PRP  / PRP(-1)  * GDPMPS  / GDPMPS(-1)

' Stamp duty
TSTAMP  / TSTAMP(-1)  = GDPMPS  / GDPMPS(-1)

' Total direct taxes
TDIRTAX  = TYIND  + TYCORP  + TYPETRO  + TRPGT  + TSTAMP  + TOTHER

' --- Indirect Taxes ---

' Sales and Service Tax (SST — replaced GST in Sept 2018)
' Sales tax: 5%/10% on manufactured goods; Service tax: 6% on prescribed services
' Note: GST at 6% was in effect April 2015 to May 2018
TSST  = SSTRATE  * (PCONSPS  + 0.3  * GCEPS)  * SSTADJ

' Excise duties (vehicles, alcohol, tobacco, sugar tax)
TEXCISE  / TEXCISE(-1)  = PCONSPS  / PCONSPS(-1)

' Import duties
TIMPORT  / TIMPORT(-1)  = IMPPS  / IMPPS(-1)

' Export duties (mainly on crude palm oil — sliding scale)
TEXPORT  = CPODRATE  * (PXCPO  / 100)  * XCPO

' Total indirect taxes
TINDTAX  = TSST  + TEXCISE  + TIMPORT  + TEXPORT  + TLEVIES

' --- Non-Tax Revenue ---

' Petronas dividend (~RM25-35bn pa, ~20% of total revenue)
' Linked to Petronas profits but subject to policy decisions
PETDIV  = PETDIV(-1)  * (0.5  + 0.5  * (PETPROF  / PETPROF(-1)))

' Investment income (Khazanah, EPF returns to government, KWAP)
GOVINVI  / GOVINVI(-1)  = GDPMPS  / GDPMPS(-1)

' Licences, permits, fees
GOVFEES  / GOVFEES(-1)  = GDPMPS  / GDPMPS(-1)

' Total non-tax revenue
NONTAXREV  = PETDIV  + GOVINVI  + GOVFEES  + GOVOREV

' --- Total Government Revenue ---
GOVREV  = TDIRTAX  + TINDTAX  + NONTAXREV

' Indirect taxes for national accounts
INDIRTAX  = TINDTAX  - TEXPORT  + GOVSUB_BASE

INDIRTAXPS  = INDIRTAX

TXRATEBASE  = ((@elem(INDIRTAXPS  , "2015Q1")  / @elem(GVA  , "2015Q1"))  + (@elem(INDIRTAXPS  , "2015Q2")  / @elem(GVA  , "2015Q2"))  + (@elem(INDIRTAXPS  , "2015Q3")  / @elem(GVA  , "2015Q3"))  + (@elem(INDIRTAXPS  , "2015Q4")  / @elem(GVA  , "2015Q4")))  / 4

'
' Group 11: Balance of Payments
'
' ============================================================================
' Malaysia: managed float exchange rate since 2005 (de-pegged from USD)
' BNM manages ringgit through intervention, reserves ~USD115bn
' Current account persistent surplus (narrowing trend)
' Large FDI stock, significant portfolio investment flows
' Income deficit due to profit repatriation by MNCs
' ============================================================================

' Nominal effective exchange rate
NEER  = NEER(-1)  * REER  / REER(-1)  * CPI  / CPI(-1)  / (WCPI  / WCPI(-1))

' Bilateral USD/MYR rate
RMYR  = RMYR(-1)  * NEER(-1)  / NEER

' International reserves
d(DRES)  = 0

SRES  = -DRES  + (1  + 0.30  * (NEER(-1)  / NEER  - 1))  * SRES(-1)

' Income credits (investment income from abroad)
CIPD  = ( 0.6800  * CIPD(-1)  / FLIAB(-2)  + (1  - 0.6800)  * REXC  / 100 )  * FLIAB(-1)

REXC  = (DLFDI(-1)  / FLIAB(-1))  * (1.50  + 2.20  * (log(WEQPR)  - log(WEQPR(-4)))  + 0.45  * OPR  / 4)  + (EQFLI(-1)  / FLIAB(-1))  * (0.50  + 0.20  * ( log(WEQPR)  - log(WEQPR(-4))))  + (BFLI(-1)  / FLIAB(-1))  * (0.35  + 0.90  * (MGS10  / 4))  + (OTFLI(-1)  / FLIAB(-1))  * (0.10  + 0.70  * OPR  / 4)

' Income debits (profit repatriation — Malaysia has large FDI stock)
DIPD  = (0.5800  * DIPD(-1)  / FASSET(-2)  + (1  - 0.5800)  * REXD  / 100)  * FASSET(-1)

REXD  = (DAFDI(-1)  / FASSET(-1))  * (0.80  + 2.80  * FYCPR  / GDPMPS)  + (EQFA(-1)  / FASSET(-1))  * (0.65  + 12.00  * NDIVHH  / EQHH)  + (BFA(-1)  / FASSET(-1))  * (0.30  + 1.10  * MGS10  / 4)  + (OTFA(-1)  / FASSET(-1))  * (0.20  + 0.15  * OPR  / 4  + 0.60  * ROCB  / 4)

' Net primary income
NIPD  = CIPD  - DIPD

' Workers' remittances (Malaysia is net outflow — foreign workers remit ~RM30bn pa)
dlog(REMITOUT)  = 0.4500  * dlog(EFOR)  + 0.3500  * dlog(EARN)  - 0.0800  * dlog(NEER)  + 0.0050

' Remittances received (diaspora, much smaller than outflows)
REMITIN  / REMITIN(-1)  = GDPMPS  / GDPMPS(-1)

REMITNET  = REMITIN  - REMITOUT

' Government transfers (net international transfers — typically small)
GOVTRAN  / GOVTRAN(-1)  = GDPMPS  / GDPMPS(-1)

' Secondary income (transfers)
TRANB  = REMITNET  + GOVTRAN

' Trade balance
TB  = EXPPS  - IMPPS

' Current account
CB  = TB  + NIPD  + TRANB

CBPCNT  = (CB  / GDPMPS)  * 100

' Capital account (typically small for Malaysia)
KAPACCT  = 0

' Financial account net (FDI + portfolio + other)
NAFROW  = -(CB  + KAPACCT)

'
' Group 12: Public Sector Totals
'
' ============================================================================
' Malaysian fiscal framework:
'   Federal government fiscal balance = Revenue - Operating Expenditure - Development Expenditure
'   Debt ceiling: 65% of GDP (raised from 60% during COVID)
'   Primary balance excludes debt service charges
' ============================================================================

' Government capital depreciation (linked to government capital stock growth)
DEPGOV  / DEPGOV(-1)  = GOVDEVPS  / GOVDEVPS(-1)

' Depreciation / consumption of fixed capital
DEP  = DEPGOV

' Government fiscal balance
GOVBAL  = GOVREV  - GOVEXP

GOVBALCY  = GOVBAL

' Government fiscal balance as % of GDP
GOVBALPCNT  = 100  * GOVBAL  / GDPMPS

' Primary balance (excl. debt service)
PRIBAL  = GOVBAL  + GOVDSC

PRIBALPCNT  = 100  * PRIBAL  / GDPMPS

' Government debt accumulation
d(GOVDEBT)  = -GOVBAL  + GOVDEBTADJ

' Government debt as % of GDP
DEBTPCNT  = 100  * GOVDEBT  / GDPMPS

' Public sector net investment
GOVNI  = GOVDEVPS  + DINVGOV  + NPAGOV  + KGOV  + ASSETSA

' Total public sector spending (BNM definition)
TPSE  = GOVOE  + DEP  + GOVNI

'
' Group 13: Monetary Policy
'
' ============================================================================
' BNM Overnight Policy Rate (OPR) — primary instrument
' OPR corridor: +-25bps around OPR
' Transmission: OPR -> money market rates -> BLR/BR -> lending/deposit rates
' BNM inflation targeting framework (flexible, no explicit target band)
' ============================================================================

' Base lending rate / base rate (follows OPR with markup)
BLR  = OPR  + 2.25

' Average lending rate
ALR  = 0.85  * BLR  + 0.15  * (OPR  + 1.50)

' Deposit rate
RDEP  = OPR  - 0.50

' MGS 10-year yield (government bond)
d(MGS10)  = 0.7200  * d(OPR)  - 0.2500  * (MGS10(-1)  - 0.8500  * OPR(-1)  - 0.1500  * UST10(-1)  - 1.8500)  + 0.1200  * d(UST10)

' Corporate bond rate (AA-rated)
RCORP  = MGS10  + 1.20

' Rate on corporate bonds (broader measure including lower-rated)
ROCB  = MGS10  + 1.80

'
' Group 14: Domestic Financial Sector
'
' ============================================================================
' Malaysian financial system: bank-dominated (~55% of total assets)
' EPF (Employees Provident Fund) — mandatory savings, ~RM1 trillion AUM
' Household debt ~84% of GDP (high by regional standards)
' Bursa Malaysia market cap ~RM1.8 trillion
' ============================================================================

d(BLR)  = 0.7200  * d(OPR)  - 0.2500  * (BLR(-1)  - 0.8500  * OPR(-1)  - 2.2500)

dlog(EQPR)  = dlog(GDPMPS)

dlog(M1)  = dlog(GDPMPS)

M3  = DEPHH  + M3BUS  + M3OFI

'
' Group 15: Income Account
'
' ============================================================================
' Household income: wages, mixed income (self-employed ~25% of workforce),
'   property income, transfers (BR1M/BSH), EPF withdrawals
' Corporate income: gross operating surplus less Petronas
' ============================================================================

WFP  = ADJW  * PSAVEI  * (EMS  - ESLFS)  + (52  / 4000)  * GWADJ  * ERGOV  * EGOV

MI  / MI(-1)  = WFP  / WFP(-1)

' Employer insurance/social contributions (private sector)
EMPISC  / EMPISC(-1)  = WFP  / WFP(-1)

EMPSC  = EMPISC  + SOCSO  + EMPEPF

FYEMP  = WFP  + EMPSC

' Social security (SOCSO/PERKESO)
SOCSO  / SOCSO(-1)  = WFP  / WFP(-1)

' EPF contributions (employer: 12-13%, employee: 11%)
EMPEPF  / EMPEPF(-1)  = WFP  / WFP(-1)

' Household operating surplus (imputed rent on owner-occupied housing)
OSHH  = 0.06  * GPW

' Household property income received (dividends, interest, EPF returns)
NDIVHH  / NDIVHH(-1)  = FYCPR  / FYCPR(-1)

PIRHH  = NDIVHH  + 0.04  * DEPHH  + 0.03  * EPFHH

' Household property income paid (interest on mortgages and consumer debt)
PIPHH  = (RMORT  / 100)  * LHP  * 0.25  + (ALR  / 100)  * OLPE  * 0.25

' Household disposable income
HHDI  = MI  + FYEMP  - EMPSC  - TYWHH  + SBHH  + (PIRHH  - PIPHH)  + OSHH  + REMITNET

RHHDI  = 100  * HHDI  / PCPI

' Other social benefits (self-employed social security etc.)
OSB  / OSB(-1)  = PCPI  / PCPI(-1)  * POP15  / POP15(-1)

' Government subsidies to households (direct cash transfers portion)
GOVSUB_HH  = 0.40  * BSHTRF

' Government pensions to households
GOVPEN_HH  = 0.85  * GOVPEN

' SOCSO benefits paid to households
SOCSO_BEN  / SOCSO_BEN(-1)  = SOCSO  / SOCSO(-1)

' Social benefits to households (BR1M/BSH, pensions, SOCSO benefits)
SBHH  = EMPISC  + OSB  + GOVSUB_HH  + GOVPEN_HH  + SOCSO_BEN

TYWHH  = TYIND  + TRPGT  + TSTAMP

' Household savings
SVHH  = HHDI  - PCONSPS

' Savings ratio (Malaysia: volatile, ~1% household but ~27% gross national)
SY  = 100  * SVHH  / HHDI

' Corporate profits (non-Petronas)
FYCPR  = OS  - OSHH  - OSGOV  - OILGTP  - CPOGTP

' Gross trading profits of firms
GTPFC  = FYCPR  - COMGTP

COMGTP  = OILGTP  + CPOGTP

' CPO gross trading profits
CPOGTP  / CPOGTP(-1)  = (CPOGVA  / CPOGVA(-1))  * (PCPO  / PCPO(-1))  / (NEER  / NEER(-1))

'
' Group 16: Gross Domestic Product
'
' ============================================================================
' Malaysia GDP by expenditure:
'   GDPM = C + G + I + dINV + X - M + SDE
' Base year 2015 for constant prices
' GDP ~RM1.8 trillion (2024)
' ============================================================================

TFEPS  = GCEPS  + PCONSPS  + DINVPS  + VALPS  + GFCFPS  + EXPPS

SDEPS  = PGDP  * SDE  / 100

GDPMPS  = TFEPS  - IMPPS  + SDEPS

INDIRTAXPS  = INDIRTAX

GVAPS  = GDPMPS  - INDIRTAXPS

TFE  = GCE  + PCONS  + DINV  + VAL  + GFCF  + EXP

' Basic prices adjustment (taxes on products less subsidies on products)
BPA  = INDIRTAX

GVA  = GDPM  - BPA

PGVA  = 100  * GVAPS  / GVA

PGDP  = 100  * GDPMPS  / GDPM

' Statistical discrepancy on income side (exogenous, typically small)
SDI  = SDI(-1)

' Government operating surplus (imputed rent on government buildings etc.)
OSGOV  = 100  + DEPGOV

' Operating surplus
OS  = GDPMPS  - FYEMP  - MI  - INDIRTAXPS  - SDI

' Output gap
GAP  = GDPM  / TRGDP  * 100  - 100

GDPPC  = GDPM  / POPAL

TRGDPPC  = TRGDP  / POPAL

'
' Market Sector GVA Satellite
'

GGVAPS  = GOVWS  + OSGOV

MSGVAPS  = GVAPS  - GGVAPS

GGVA  / GGVA(-1)  = GCE  / GCE(-1)

MSGVA  = GVA  - GGVA

' Non-oil GVA (important for BNM — headline vs non-oil GDP)
NNOILGVA  = GVA  - OILGVA

NNOILGDP  = GDPM  - OILGVA

'
' Group 17: Financial Account and Balance Sheet
'
' --- Households ---

NAFHH  = SVHH  - DINVHH  - VALHH  - IHHPS  + KGHH

' Household financial assets (deposits dominate — EPF, ASB, bank deposits)
d(DEPHH)  = 3.5000  * d(PCONSPS)  + exp(4.8000  * (RDEP  - OPR))  - exp(4.8000  * (RDEP(-1)  - OPR(-1)))  - 0.0320  * (DEPHH(-1)  - 5.2000  * PCONSPS(-1)  - exp(0.8000  * RDEP(-1))  + 180000)

' EPF accumulation (mandatory ~24% of salary)
d(EPFHH)  = 0.24  * WFP  - EPFWDRAW

' Net acquisition of equity by households
NAEQHH  = 0.05  * SVHH

EQHH  = (1  + 0.80  * (EQPR  / EQPR(-1)  - 1)  + 0.20  * ((WEQPR  / WEQPR(-1))  / (REER  / REER(-1))  - 1))  * EQHH(-1)  + NAEQHH

' Other household assets (unit trusts, insurance, ASB/ASN)
OAHH  / OAHH(-1)  = GDPMPS  / GDPMPS(-1)

GFWPE  = DEPHH  + EQHH  + EPFHH  + OAHH

' Household liabilities (high at ~84% of GDP — mortgages ~60%, auto ~15%, personal ~10%)
' Housing loans
d(LHP)  = LHP(-1)  * (0.0650  + 0.3800  * dlog(PRP)  - 0.0180  * d(RMORT)  - 0.0080  * d(LFSUR))

' Other personal debt (hire purchase, personal loans, credit cards)
OLPE  / OLPE(-1)  = PCONSPS  / PCONSPS(-1)  * (1  - 0.15  * d(BLR))

' Total household debt
HHDEBT  = LHP  + OLPE

HHDEBTRATIO  = 100  * HHDEBT  / GDPMPS

' Net financial wealth
NFWPE  = GFWPE  - LHP  - OLPE

' Property wealth proxy
GPW  = 0.9950  * GPW(-1)  * PRP  / PRP(-1)  + 0.001  * IHHPS

'
' --- Rest of World ---

' External balance sheet (IIP)
d(FASSET)  = d(DAFDI)  + d(EQFA)  + d(BFA)  + d(OTFA)

d(FLIAB)  = d(DLFDI)  + d(EQFLI)  + d(BFLI)  + d(OTFLI)

d(NIIP)  = d(FLIAB)  + d(SRES)  - d(FASSET)

'
' ============================================================================
' VARIABLE GLOSSARY (Key Malaysia-specific variables)
' ============================================================================
'
' NATIONAL ACCOUNTS
' GDPM      = GDP at constant (2015) prices
' GDPMPS    = GDP at current prices (RM millions)
' PCONS     = Private consumption at constant prices
' GCE       = Government consumption expenditure at constant prices
' GFCF      = Gross fixed capital formation at constant prices
' EXP       = Exports of goods and services at constant prices
' IMP       = Imports of goods and services at constant prices
' DINV      = Change in inventories at constant prices
' SDE       = Statistical discrepancy at constant prices
' VAL       = Valuables at constant prices
'
' PRICES
' CPI       = Consumer Price Index (2015=100)
' CPIX      = CPI excluding administered items
' PADMIN    = Administered price index
' PPI       = Producer Price Index (2015=100)
' PCPI      = Private consumption deflator
' PGDP      = GDP deflator
' PIF       = GFCF deflator
' PRP       = House price index
' PCPO      = World CPO price (RM/tonne, FOB Malaysia)
' PBRENT    = Brent crude oil price (USD/barrel)
'
' MONETARY/FINANCIAL
' OPR       = BNM Overnight Policy Rate (%)
' BLR       = Base lending rate (%)
' ALR       = Average lending rate (%)
' RDEP      = Average deposit rate (%)
' RMORT     = Average mortgage rate (%)
' MGS10     = 10-year Malaysian Government Securities yield (%)
' UST10     = US 10-year Treasury yield (%)
' NEER      = Nominal effective exchange rate index
' REER      = Real effective exchange rate index
' RMYR      = USD/MYR exchange rate
' CREDIT    = Total bank credit to private sector
' M1, M3    = Money supply aggregates
' EQPR      = Bursa Malaysia equity price index (KLCI)
'
' LABOUR MARKET
' ET        = Total employment (thousands)
' ETLFS     = Total employment (Labour Force Survey basis)
' EMS       = Market sector employment
' EGOV      = Government sector employment
' EFOR      = Foreign workers
' ESLFS     = Self-employed (Labour Force Survey)
' POP15     = Population aged 15 and over (working age)
' WAP       = Working age population
' PART15    = Labour force participation rate (%)
' LFSUR     = Unemployment rate (%)
' HWA       = Total hours worked
' AVH       = Average hours worked
' EARN      = Average earnings
' PRODH     = Labour productivity (output per hour)
'
' FISCAL
' GOVREV    = Federal government total revenue
' GOVOE     = Operating expenditure
' GOVDEVPS  = Development expenditure
' GOVEXP    = Total expenditure
' GOVBAL    = Fiscal balance
' GOVDEBT   = Federal government debt
' TYIND     = Individual income tax
' TYCORP    = Corporate income tax
' TYPETRO   = Petroleum income tax
' TSST      = Sales and Service Tax
' PETDIV    = Petronas dividend
' GOVSUB    = Subsidies and transfers
' FUELSUB   = Fuel subsidies
' BSHTRF    = BSH/STR cash transfers
'
' COMMODITIES
' OILGVA    = Oil and gas value added
' CPOPROD   = Crude palm oil production (MT)
' CPOGVA    = Palm oil sector value added
' XCPO      = CPO export volume
' XOILGAS   = Oil and gas export volume
' COMGVA    = Total commodity GVA
' CPODRATE  = CPO export duty rate
' HARAREA   = Oil palm harvested area
' ELNINO    = El Nino dummy (1 = El Nino year)
' PETPROF   = Petronas upstream profits
' PETMARG   = Petronas profit margin
'
' TRADE
' XEE       = E&E (electrical & electronics) exports
' XS        = Services exports
' XNOG      = Other goods exports
' MNOG      = Non-oil goods imports
' MS        = Services imports
' MOIL      = Oil imports
' WSTD      = World semiconductor trade index
' WTOUR     = World tourism demand index
' WPG       = World price of goods
' WCPI      = World CPI
'
' BALANCE OF PAYMENTS
' TB        = Trade balance
' CB        = Current account balance
' NIPD      = Net primary income
' REMITNET  = Net remittances
' TRANB     = Secondary income balance
' NIIP      = Net international investment position
' FASSET    = Foreign assets
' FLIAB     = Foreign liabilities
' SRES      = Official reserve assets
'
' HOUSEHOLD BALANCE SHEET
' DEPHH     = Household deposits
' EQHH      = Household equity holdings
' EPFHH     = EPF balances (households)
' GFWPE     = Gross financial wealth
' NFWPE     = Net financial wealth
' LHP       = Housing loan portfolio
' OLPE      = Other personal loans/liabilities
' HHDEBT    = Total household debt
' GPW       = Gross property wealth
'
' ADDITIONAL ENDOGENOUS VARIABLES
' PDINV     = Inventory deflator (= PGDP)
' DISCO     = Discount rate for tax depreciation (= MGS10/100)
' FISIMPS   = Financial intermediation services indirectly measured
' TYCADJ    = Corporate tax adjustment factor (allowances, pioneer status)
' PXEE      = E&E export price deflator
' ROCB      = Rate on corporate bonds (broad)
' AVGBR     = Average borrowing rate on government debt
' DEPGOV    = Government capital depreciation
' OSGOV     = Government operating surplus
' GOVSUB_BASE = Base subsidies (non-fuel, non-cash-transfer)
' GOVOTR    = Other operating expenditure
' EMPISC    = Employer insurance/social contributions (private)
' OSHH      = Household operating surplus (imputed rent)
' PIRHH     = Household property income received
' PIPHH     = Household property income paid
' NDIVHH    = Household dividend income
' OSB       = Other social benefits
' GOVSUB_HH = Government subsidies to households (cash transfer portion)
' GOVPEN_HH = Government pensions to households
' SOCSO_BEN = SOCSO benefits paid
' NAEQHH    = Net acquisition of equity by households
' OAHH      = Other household assets (unit trusts, ASB/ASN)
' ALAD      = Alignment adjustment on inventories
' NPAGOV    = Net purchase of non-produced assets (government)
' KGOV      = Capital transfers by government
' ASSETSA   = Asset sales adjustment
' PUBI      = Public enterprise investment
' PUBIPS    = Public enterprise investment (current prices)
' REMITIN   = Remittances received
' GOVTRAN   = Net government international transfers
' KAPACCT   = Capital account balance
'
' EXTERNAL VARIABLES (Exogenous)
' PBRENT    = Brent crude oil price (USD/bbl)
' PCPO      = CPO price (RM/tonne)
' WEQPR     = World equity price index
' WSTD      = World semiconductor trade demand
' WTOUR     = World tourism demand
' WPG       = World price of goods
' WCPI      = World CPI
' UST10     = US Treasury 10-year yield
' REER      = Real effective exchange rate (BNM index)
' ELNINO    = El Nino indicator
' TRGDP     = Trend/potential GDP
' OPR       = BNM Overnight Policy Rate (policy instrument)
' PADMINPRICE = Administered fuel retail price (RM/litre)
' SSTRATE   = SST effective rate
' DEVGR     = Development expenditure real growth rate (policy)
' CPODRATE  = CPO export duty rate (policy)
' FUELCONS  = Fuel consumption volume (exogenous)
' EPFWDRAW  = EPF withdrawals (policy variable)
' POPAL     = Total population
' ADJW      = Wage adjustment factor
' GWADJ     = Government wage adjustment
' ERGOV     = Government average earnings ratio
' MCCI      = Malaysian Consumer Confidence Index
' IIB, SIB  = Initial/subsequent investment allowance rates
' NDIV      = Dividend yield
' PETMARG   = Petronas profit margin
' SSTADJ    = SST collection efficiency adjustment
' TLEVIES   = Other tax levies
' TOTHER    = Other direct taxes
' GOVOREV   = Other non-tax revenue
' CREDIT    = Total bank credit to private sector
' KGHH      = Capital gains/transfers to households
' VALHH     = Valuables held by households
' IHHPS     = Household investment (current prices)
' SDI       = Statistical discrepancy (income)
'
' ============================================================================
' END OF MODEL
' ============================================================================
