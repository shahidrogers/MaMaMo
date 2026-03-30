'
' Group 1: Consumption

dlog(CONS)  = 0.2645906  + 0.1029795  * dlog(RHHDI)  - 0.0083736  * d(LFSUR)  + 0.1269445  * dlog((GPW  * 1000)  / (PCE  / 100) )  - 0.0004036  * d(R(-1)  - (-1  + PCE  / PCE(-4))  * 100)  - 0.1250582  * ( log(CONS(-1))  - 0.4392933  * log(RHHDI(-1))  - 0.1059181  * log((GPW(-1)  * 1000)  / (PCE(-1)  / 100) )  - 0.2215558  * log( NFWPE(-1)  / (PCE(-1)  / 100) ) )

CONSPS  = CONS  * PCE  / 100

dlog(CDUR)  = dlog(CONS)  - 0.6408491  * (dlog(PCDUR)  - dlog(PCE))  + 0.0378296  * dlog(PD)  + 0.4517152  * dlog(RHHDI)  + 0.3438288  * dlog(RHHDI(-1))  - 0.0421498  * log(CDUR(-1)  / CONS(-1))  - 0.0145656  * log(PCDUR(-1)  * ((((1  + R(-1)  / 100)^0.25)  - 1)  + ((1.25^0.25)  - 1)  - d(PCDUR(-1))  / PCDUR(-1))  / 100)  + 0.0313983  * log(NFWPE(-1)  / (PCE(-1)  / 100))  - 0.6203775  + 0.0636941  * ( @recode(@date  = @dateval("2009:04")  , 1  , 0)  - @recode(@date  = @dateval("2010:01")  , 1  , 0) )

CDURPS  = (PCDUR  / 100)  * CDUR

dlog(PD)  = dlog(GPW  / APH)  - 0.1278181  * log(PD(-1)  / (GPW(-1)  / APH(-1)))  + 1.54494  * (dlog(APH)  - dlog(PCE))  + 0.2058841  * ( @recode(@date  = @dateval("1992:03")  , 1  , 0)  - @recode(@date  = @dateval("1992:04")  , 1  , 0) )  + 0.340128  * @recode(@date  = @dateval("2004:01")  , 1  , 0)  + 0.1437075  * ( @recode(@date  = @dateval("2009:04")  , 1  , 0)  - @recode(@date  = @dateval("2010:01")  , 1  , 0) )  + 0.2732277  * ( @recode(@date  = @dateval("2016:01")  , 1  , 0)  - @recode(@date  = @dateval("2016:02")  , 1  , 0) )  + 0.2217687

'
' Group 2: Inventories
'
'Changed to enable indirect T2 fix:

DINV  = (GDPM  + M  - SDE)  - CGG  - CONS  - VAL  - IF  - X

INV  = INV(-1)  + DINV

BV  = BV(-1)  + DINVPS

SA  = BV(-1)  * (PINV  / PINV(-1)  - 1)

DINVPS  = DINV  * PDINV  / 100

DINVHH  = 0.07  * DINVPS

'Changed to enable indirect T2 fix:

DINVCG  = PSNI  - CGIPS  - LAIPS  - IPCPS  - IBPC  - (NPACG  + NPALA)  - (KCGPSO  - KPSCG)  - (KLA  - KGLAPC  - KGLA)  - (KPCPS  - KPSPC)  - ASSETSA  + DEP  + ASSETSA

'
' Group 3: Investment

DB  = @recode(@date <= @dateval("2011:02")  , 1  , 0)  * 1  / (1  + DISCO)  * (IIB  + (SIB  / DISCO)  * (1  - (1  + DISCO)^((-1)  * (1  - IIB)  / (SIB  + 0.1  * @recode(@date >= @dateval("2011:03")  , 1  , 0)))))

DP  = 1  / (1  + DISCO)  * ((DISCO  * FP  + SP)  / (DISCO  + SP))

DV  = SV  / (DISCO  + SV)

WB  = 0.31

WP  = 0.54

WV  = 0.14

TAFB  = (1  - TCPRO  * DB)  / (1  - TCPRO)

TAFP  = (1  - TCPRO  * DP)  / (1  - TCPRO)

TAFV  = (1  - TCPRO  * DV)  / (1  - TCPRO)

TAF  = WB  * TAFB  + WP  * TAFP  + WV  * TAFV

WG  = 0.03

CDEBT  = CDEBT(-1)  + d(RIC)

CEQUITY  = NDIV  * (1  + WG)  + 100  * WG

RWACC  = DEBTW  * CDEBT  + (1  - DEBTW)  * CEQUITY

RDELTA  = 0.022

COCU  = PIBUS  / PGDP  * @elem(PGDP  , "1970Q1")  / @elem(PIBUS  , "1970Q1")  * (DELTA  + RWACC)

COC  = TAF  * COCU

KSTAR  = exp(log(MSGVA)  - 0.4  * log(COC)  + 2.434202655)

KMSXH  = (IBUSX  / 1000)  + KMSXH(-1)  * (1  - RDELTA)

KGAP  = log(KMSXH  * 1000)  - log(KSTAR)

TQ  =  - (NWIC  / 1000)  / (KMSXH  * (PKMSXHB  / 100))

PKMSXHB  = PIBUS

'Changed to enable indirect T2 fix:

IBUS  = IF  - GGI  - PCIH  - PCLEB  - IH  - IPRL

'IF  = IBUS  + GGI  + PCIH  + PCLEB  + IH  + IPRL
'

IBUSX  = IBUS  - 17394  * @recode(@date  = @dateval("2005:02")  , 1  , 0)

'
'dlog(IBUSX)  = 0.1992007  * dlog(IBUSX(-3))  + 1.00573  * dlog(MSGVA(-1))  - 0.0012369*CBIUD - 0.0418036*(log(IBUSX(-1)) - log(KMSXH(-2)  * 1000)  + KGAP(-2)  + 0.0544706  * @recode(@date  = @dateval("1998:01")  , 1  , 0)  + 0.0597525  * @recode(@date  = @dateval("2005:02")  , 1  , 0)  - 0.0884031

GGIPS  = CGIPS  + LAIPS

GGI  = 100  * GGIPS  / GGIDEF

GGIX  = GGI  + 17394  * @recode(@date  = @dateval("2005:02")  , 1  , 0)

GGIDEF  / GGIDEF(-1)  = PIF  / PIF(-1)

dlog(HIMPROV)  =  - 1.936849  + 0.0467091  * d(RMORT)  - 0.09652566  * dlog(PD(-1))  - 0.5129925  * (log(HIMPROV(-1))  - 1.00768  * log(CONSPS(-1)))  - 0.0834384  * @recode(@date  = @dateval("2003:01")  , 1  , 0)

PCIH  / PCIH(-1)  = IH  / IH(-1)

VALPS  = VAL  * PIF  / 100

VALHH  = 0.25  * VALPS

'Changed to enable indirect T2 fix:
'
'IF  = IBUS  + GGI  + PCIH  + PCLEB  + IH  + IPRL

IFPS  = IF  * PIF  / 100

PIPRL  = 100  * IPRLPS  / IPRL

IHPS  = IH  * PIH  / 100

'IPRLPS  = IPRL  * PIPRL  / 100

IHHPS  = IHHPS(-1)  * (0.8456  * IHPS  + 0.5674  * IPRLPS  + 0.0803  * (PIBUS  / 100)  * IBUS)  / (0.8456  * IHPS(-1)  + 0.5674  * IPRLPS(-1)  + 0.0803  * (PIBUS(-1)  / 100)  * IBUS(-1))

PIBUS  = 100  * (IFPS  - IHPS  - IPRLPS  - (PIF  * 0.9828  / 100)  * (PCIH  + PCLEB)  - GGIPS)  / IBUS

ICCPS  = 0.1543  * IHPS  + 0.4204  * IPRLPS  + 0.8331  * (PIBUS  / 100)  * IBUS

IPCPS  = (PIF  * 0.9828  / 100)  * (PCIH  + PCLEB)  + 0.0456  * (PIBUS  / 100)  * IBUS

IFCPS  = IFPS  - IHHPS  - ICCPS  - LAIPS  - CGIPS  - IPCPS

NETAD  = (PEHC  / 1000)  * 1.5166

HSALL  = HSALL(-1)  + NETAD

'
' Group 4: The Labour Market

ECG  / ECG(-1)  = EGG  / EGG(-1)

ELA  / ELA(-1)  = EGG  / EGG(-1)

dlog(EPS)  = log((ET  - ECG  - ELA)  / (ET(-1)  - ECG(-1)  - ELA(-1)))

dlog(EMS)  =  - 0.0113474  + 0.4369834  * dlog(EMS(-1))  + 0.1932386  * dlog(EMS(-2))  + 0.1713792  * dlog(MSGVA(-1))  - 0.0062207  * (log(EMS(-1)  / MSGVA(-1))  + 0.4  * (log(PSAVEI(-1)  / PMSGVA(-1))))  - 0.0103188  * @recode(@date  = @dateval("2010:04")  , 1  , 0)

ET  = ET(-1)  * ETLFS  / ETLFS(-1)

WRGTP  = WRGTP(-1)  * ET  / ET(-1)

WFJ  = ET  + WRGTP

ETLFS  = 1000  * (HWA  / AVH)

ES  / ES(-1)  = ET  / ET(-1)

ESLFS  / ESLFS(-1)  = ES  / ES(-1)

GAD  = GAD1  + GAD2  + GAD3

POP16  / POP16(-1)  = (GAD2  + GAD3)  / (GAD2(-1)  + GAD3(-1))

ULFS  = ((POP16  * PART16  / 100)  - ETLFS)

LFSUR  = 100  * ULFS  / (ETLFS  + ULFS)

'Changed to enable indirect T2 fix:
'
'HWA  = H16

@IDENTITY PRODH  = GDPM  / HWA

'PRODH  = GDPM  / HWA

PART16  = 100  * (ULFS  + ETLFS)  / POP16

ER  = 100  * ETLFS  / POP16

'
' Group 5: Exports of goods & services
'
'Changed to enable indirect T2 fix:

XNOG  = X  - XS  - XOIL

dlog(RPRICE)  = dlog(PXNOG)  + dlog(RXD)  - 0.9351684  * dlog(WPG)

'Changed to enable indirect T2 fix:

XPS  = (PXNOG  / 100)  * XNOG  + (PXS  / 100)  * XS  + (PXOIL  / 100)  * XOIL

'
' Group 6: Imports of goods & services

MC  = 0.257  * CONS

MCGG  = 0.094  * CGG

MIF  = 0.234  * IF

MDINV  = 0.106  * (DINV  - ALAD)

MXS  = 0.142  * XS

MXG  = 0.376  * (XOIL  + XNOG )

MTFE  = MC  + MCGG  + MIF  + MDINV  + MXS  + MXG

MINTY  = 100  * (M )  / MTFE

MGTFE  = 0.176  * CONS  + 0.064  * CGG  + 0.175  * IF  + 0.094  * DINV  + 0.410  * XNOG  + 0.049  * XS

PMGREL  = PMNOG  / (0.156  * PCE+0.097  * GGFCD  + 0.203  * PIF  + 0.096  * PINV  + 0.352  * PXNOG  + 0.063  * PXS)

'Changed to enable indirect T2 fix:

MNOG  = M  - MS  - MOIL

MSTFE  = 0.081  * CONS  + 0.030  * CGG  + 0.059  * IF  + 0.012  * DINV  + 0.029  * XNOG  + 0.093  * XS

PMSREL  = PMS  / (0.060  * PCE+0.040  * GGFCD  + 0.067  * PIF  + 0.040  * PINV  + 0.024  * PXNOG  + 0.098  * PXS)

dlog(MS)  = 0.819114  * dlog(MSTFE)  + 0.389511  * dlog(MSTFE(-1))  - 0.525436  * dlog(MSTFE(-2))  + 0.288639  * dlog(MSTFE(-3))  - 0.477411  * dlog(PMSREL)  - 0.292804  * dlog(PMSREL(-1))  - 0.271392  * dlog(MS(-1))  - 0.171294  * (log(MS(-1))  - 1.079017  * log(MSTFE(-1))  - 0.662445  * log(SPECX(-1))  + 0.112661  * ((@recode(@date >= @dateval("2007:01")  , 1  , 0))  * SPECX)  + 0.874335  * log(PMSREL(-1))  - 0.126418  * (@recode(@date >= @dateval("2007:01")  , 1  , 0)  - @recode(@date >= @dateval("2013:01")  , 1  , 0)))  - 0.031665

MPS  = MNOG  * (PMNOG  / 100)  + MS  * (PMS  / 100)  + MOIL  * (PMOIL  / 100)

'
' Group 7: Prices and Wages

OILBASE  = ((@elem(PBRENT  , "2009Q1")  / @elem(RXD  , "2009Q1"))  + (@elem(PBRENT  , "2009Q2")  / @elem(RXD  , "2009Q2"))  + (@elem(PBRENT  , "2009Q3")  / @elem(RXD  , "2009Q3"))  + (@elem(PBRENT  , "2009Q4")  / @elem(RXD  , "2009Q4")))  / 4

dlog(PSAVEI)  =  - 0.0282  + 0.575  * dlog(PMSGVA)  + 0.250  * dlog(PMSGVA(-1))  + 0.105  * dlog(PMSGVA(-2))  + (1  - 0.575  - 0.250  - 0.105)  * dlog(PMSGVA(-3))  - 0.0096  * (LFSUR  - LFSUR(-1))  + 0.264  * (dlog(MSGVA)  - dlog(EMS))  + 0.282  * (dlog(CPI)  - dlog(PMSGVA))  - 0.04328  * (log(PSAVEI(-1))  - log(MSGVA(-1)  / EMS(-1))  - log(PMSGVA(-1))  + log(1  + (EMPSC(-1)  / WFP(-1)))  + 0.0137  * LFSUR(-1))

EARN  = WFP  / (ETLFS  - ESLFS)

RPW  = (FYEMP  / PGVA)  / (ETLFS  - ESLFS)

RCW  = (FYEMP  / PCE)  / (ETLFS  - ESLFS)

ULCPS  = 0.17910  * (PSAVEI  * (52  / 4)  * (1  + (EMPSC  + NIS)  / WFP)  * EMS  / GVA)

MSGVAPSEMP  = MSGVAPS  - MI

FYEMPMS  = FYEMP  - CGWS  - LAWS

ULCMS  = 100  * 1.6715  * FYEMPMS  * (1  + (MI  / MSGVAPSEMP))  / MSGVA

ULCPSBASE  = ( @elem(ULCPS  , "2009Q1")  + @elem(ULCPS  , "2009Q2")  + @elem(ULCPS  , "2009Q3")  + @elem(ULCPS  , "2009Q4") )  / 4

ULCMSBASE  = ( @elem(ULCMS  , "2009Q1")  + @elem(ULCMS  , "2009Q2")  + @elem(ULCMS  , "2009Q3")  + @elem(ULCMS  , "2009Q4") )  / 4

PMNOGBASE  = ( @elem(PMNOG  , "2009Q1")  + @elem(PMNOG  , "2009Q2")  + @elem(PMNOG  , "2009Q3")  + @elem(PMNOG  , "2009Q4") )  / 4

PMSBASE  = ( @elem(PMS  , "2009Q1")  + @elem(PMS  , "2009Q2")  + @elem(PMS  , "2009Q3")  + @elem(PMS  , "2009Q4") )  / 4

TXRATEBASE  = ((@elem(BPAPS  , "2009Q1")  / @elem(GVA  , "2009Q1"))  + (@elem(BPAPS  , "2009Q2")  / @elem(GVA  , "2009Q2"))  + (@elem(BPAPS  , "2009Q3")  / @elem(GVA  , "2009Q3"))  + (@elem(BPAPS  , "2009Q4")  / @elem(GVA  , "2009Q4")))  / 4

PPIYBASE  = ( @elem(PPIY  , "2009Q1")  + @elem(PPIY  , "2009Q2")  + @elem(PPIY  , "2009Q3")  + @elem(PPIY  , "2009Q4") )  / 4

CPIXBASE  = ( @elem(CPIX  , "2009Q1")  + @elem(CPIX  , "2009Q2")  + @elem(CPIX  , "2009Q3")  + @elem(CPIX  , "2009Q4") )  / 4

MCOST  = 36.83  * (ULCMS  / ULCMSBASE)  + 24.64  * (PMNOG  / PMNOGBASE)  + 4.04  * (PMS  / PMSBASE)  + 4.85  * ((PBRENT  / RXD)  / OILBASE)  + 1.01  * ((BPAPS  / GVA)  / TXRATEBASE)  + 24.72  * (SCOST  / 100)  + 0.47  * (CCOST  / 100)  + 3.43  * (UTCOST  / 100)

SCOST  = 70.54  * (ULCMS  / ULCMSBASE)  + 6.93  * (PMNOG  / PMNOGBASE)  + 6.41  * (PMS  / PMSBASE)  + 0.09  * ((PBRENT  / RXD)  / OILBASE)  + 3.52  * ((BPAPS  / GVA)  / TXRATEBASE)  + 9.78  * (PPIY  / PPIYBASE)  + 1.64  * (CCOST  / 100)  + 1.09  * (UTCOST  / 100)

CCOST  = 40.25  * (ULCMS  / ULCMSBASE)  + 2.80  * (PMNOG  / PMNOGBASE)  + 0.90  * (PMS  / PMSBASE)  + 0.03  * ((PBRENT  / RXD)  / OILBASE)  + 0.51  * ((BPAPS  / GVA)  / TXRATEBASE)  + 27.06  * (PPIY  / PPIYBASE)  + 28.13  * (SCOST  / 100)  + 0.34  * (UTCOST  / 100)

UTCOST  = 14.85  * (ULCMS  / ULCMSBASE)  + 3.04  * (PMNOG  / PMNOGBASE)  + 0.51  * (PMS  / PMSBASE)  + 51.52  * ((PBRENT  / RXD)  / OILBASE)  + 2.90  * ((BPAPS  / GVA)  / TXRATEBASE)  + 8.24  * (PPIY  / PPIYBASE)  + 16.00  * (SCOST  / 100)  + 2.95  * (CCOST  / 100)

RPCOST  = 13.18  * (PMNOG  / PMNOGBASE)  + 4.07  * (PMS  / PMSBASE)  + 11.56  * ((BPAPS  / GVA)  / TXRATEBASE)  + 7.07  * (PPIY  / PPIYBASE)  + 59.96  * (SCOST  / 100)  + 0.92  * (CCOST  / 100)  + 3.24  * (UTCOST  / 100)

ICOST  = 18.40  * (PMNOG  / PMNOGBASE)  + 0.41  * (PMS  / PMSBASE)  + 0.19  * ((PBRENT  / RXD)  / OILBASE)  + 5.63  * ((BPAPS  / MSGVA)  / TXRATEBASE)  + 8.18  * (PPIY  / PPIYBASE)  + 20.76  * (SCOST  / 100)  + 46.42  * (CCOST  / 100)

XGCOST  = 15.77  * (PMNOG  / PMNOGBASE)  + 2.92  * ((BPAPS  / MSGVA)  / TXRATEBASE)  + 68.46  * (PPIY  / PPIYBASE)  + 12.80  * (SCOST  / 100)  + 0.05  * (UTCOST  / 100)

XSCOST  = 7.22  * (PMS  / PMSBASE)  + 5.99  * ((BPAPS  / MSGVA)  / TXRATEBASE)  + 9.29  * (PPIY  / PPIYBASE)  + 75.39  * (SCOST  / 100)  + 1.90  * (CCOST  / 100)  + 0.21  * (UTCOST  / 100)

're-written to enable indirect T2 fix:

MKGW  = 100  * ( PPIY  / (MCOST  / 100))  / (PPIYBASE)

're-written to enable indirect T2 fix:

dlog(MKR)  = (dlog(CPI)  - W1  * dlog(CPIRENT)  - (1  - W1)  * dlog(RPCOST))  / (1  - W1)

'PPIY  = (MCOST  / 100)  * (MKGW  / 100)  * PPIYBASE

CPIX  = (RPCOST  / 100)  * (MKR  / 100)  * CPIXBASE

PRENT  = PRENT(-1)  * (0.62  * ((WFP  / (ETLFS  - ESLFS))  / ((WFP(-1)  / (ETLFS(-1)  - ESLFS(-1)))))  + (0.15  * (HRRPW  / HRRPW(-1)))  + (0.23  * (PRP  / PRP(-1))))

'W1  = 0.084
'
'W4  = 0.024
'
'W5  = 0.172
'
'I4  = 222.8
'
'I7  = 317.7
'
'I9  = 319.5
'
'I10  = 115.1
'
'I11  = 114.7
'
'I12  = 111.2

CPIH  = CPIH(-1)  * (CPI^(1  - W5)  * OOH^W5)  / (CPI(-1)^(1  - W5)  * OOH(-1)^W5)

CPIRENT  = CPIRENT(-1)  * (0.62  * ((WFP  / (ETLFS  - ESLFS))  / (WFP(-1)  / (ETLFS(-1)  - ESLFS(-1))))  + (0.15  * (HRRPW  / HRRPW(-1)))  + (0.23  * (PRP  / PRP(-1))))

'CPI  = CPI(-1)  * (CPIX^(1  - W1)  * CPIRENT^W1)  / (CPIX(-1)^(1  - W1)  * CPIRENT(-1)^W1)

PRMIP  = PRMIP(-1)  * (RMORT  / RMORT(-1))  * (LHP  / LHP(-1))  / (HH  / HH(-1))
@ADD(V) PRMIP  PRMIP_A

PR  = I7  * ((1  - W4)  * PRXMIP  / I9  + W4  * PRMIP  / I4)

RPI  = PR  / PR(-4)  * 100  - 100

dlog(PXNOG)  = 0.635957  * dlog(PPIY(-1))  + 0.102727  * (dlog(WPG)  - dlog(RXD))  - 0.131253  * dlog(RX)  - 0.000508  * @TREND(1979Q4)  + 0.100860  * @recode(@date  = @dateval("1997:01")  , 1  , 0)  - 0.063293  * @recode(@date  = @dateval("1998:01")  , 1  , 0)  + 0.034519  * @recode(@date  = @dateval("1993:01")  , 1  , 0)  - 0.161370  * (log(PXNOG(-1))  + 0.330293  * log(RX(-1))  - 0.921258  * log(PPIY(-1))  - (1  - 0.921258)  * log(WPG(-1)  / RXD(-1)))  + 0.297153

PXS  / PXS(-1)  = PXNOG  / PXNOG(-1)

dlog(PMNOG)  = 0.606452  * dlog(PPIY)  + 0.230808  * (dlog(WPG)  - dlog(RXD))  - 0.106493  * dlog(RX)  + 0.066665  * @recode(@date  = @dateval("1997:01")  , 1  , 0)  - 0.038986  * @recode(@date  = @dateval("1998:01")  , 1  , 0)  - 0.000538  * @TREND(1979Q4)  - 0.160709  * (log(PMNOG(-1))  + 0.139917  * (log(RX(-1)))  - 0.552396  * (log(PPIY(-1)))  - (1  - 0.552396)  * (log(WPG(-1)  / RXD(-1))))  + 0.183135

PMS  / PMS(-1)  = PMNOG  / PMNOG(-1)

PINV  = 100  * BV  / INV

PCE  / PCE(-4)  = CPI  / CPI(-4)

're-written to enable indirect T2 fix:

PIF  = (GDPMPS  - CGGPS  - CONSPS  - DINVPS  - VALPS  - XPS  + MPS  - SDEPS)  * 100  / IF

'dlog(PIF)  = 0.003188  + 0.002519  * dlog(ULCMS(-2))  + 0.077266  * dlog(PMNOG(-1))  + 0.0625094  * dlog(PMS(-2))  + 0.0055335  * (log(PBRENT(-3)  / RXD(-3))  - log(PBRENT(-4)  / RXD(-4)))  + 0.005682  * (log(BPAPS(-2)  / MSGVA(-2))  - log(BPAPS(-3)  / MSGVA(-3)))  + 0.1284747  * dlog(PPIY(-3))  + 0.0510447  * dlog(APH(-2))

PCDUR  / PCDUR(-1)  = PMNOG  / PMNOG(-1)

RHF  = RMORT  - (1  - 0.25  * TPBRZ)  * (RMORT  - RDEP)  * (1  - 0.001  * LHP  / GPW)

HD  / HD(-1)  = APH  / APH(-1)

PMSGVA  = 100  * (MSGVAPS  / MSGVA)

'
' Group 8: North Sea Oil
'

dlog(TDOIL)  =  - 0.2444325  * dlog(TDOIL(-1))  + 1.896486  * dlog(NNSGVA(-1))  - 0.1077816  * (log(PBRENT  / (RXD  * (GDPMPS(-1)  - BPAPS(-1)  - (NSGVA(-1)  * PBRENT(-1)  / (OILBASE  * RXD(-1))))  / NNSGVA(-1) ) )  - log(PBRENT(-1)  / (RXD(-1)  * (GDPMPS(-2)  - BPAPS(-2)  - (NSGVA(-2)  * PBRENT(-2)  / (OILBASE  * RXD(-2))))  / NNSGVA(-2) ) ) )  + 0.0780697  * (@recode(@date >= @dateval("1984:01")  , 1  , 0)  * @recode(@date <= @dateval("1985:01")  , 1  , 0))  - 0.0143727  - 0.2216107  * (@recode(@date  = @dateval("1986:01")  , 1  , 0)  - @recode(@date  = @dateval("1986:02")  , 1  , 0))  - 0.2457494  * (@recode(@date  = @dateval("2001:03")  , 1  , 0)  - @recode(@date  = @dateval("2001:04")  , 1  , 0))  + 0.1907036  * (@recode(@date  = @dateval("2010:03")  , 1  , 0)  - @recode(@date  = @dateval("2010:04")  , 1  , 0))  - 0.4334139  * @recode(@date  = @dateval("2013:01")  , 1  , 0)

'XOIL  = 1.37  * NSGVA
'@ADD(V) XOIL  XOIL_A

MOIL  = TDOIL  + XOIL  - NSGVA

dlog(PXOIL)  = dlog(PBRENT)  - dlog(RXD)

dlog(PMOIL)  = dlog(PXOIL)

NSGTP  / NSGTP(-1)  = (NSGVA  / NSGVA(-1) )  * (PBRENT  / PBRENT(-1))  / (RXD  / RXD(-1))

'
' Group 9: Public Expenditure

CGWS  = CGWADJ  * ERCG  * ECG  * (52  / 4000)  * (1  + (1.249  * EMPSC  / WFP))

LAWS  = LAWADJ  * ERLA  * ELA  * (52  / 4000)  * (1  + (1.418  * EMPSC  / WFP))

OSGG  = RCGIM  + RLAIM  + 100

'Changed to enable indirect T2 fix:

CGP  = CGGPSPSF  - (CGWS  + LAWS)  - LAPR  - (RCGIM  + RLAIM)

'CGGPSPSF  = (CGWS  + LAWS)  + (CGP  + LAPR)  + (RCGIM  + RLAIM)
'
'CGGPS  = (CGWS  + LAWS)  + (CGP  + LAPR)  + (RCGIM  + RLAIM)

GGFCD  = 100  * CGGPS  / CGG

dlog(CGG)  = 0.0007011  + 0.3739498  * dlog(CGGPS)  + 0.1802323  * dlog(CGGPS(-1))  - 0.4198339  * dlog(CGG(-1))

CGTSUB  = CGSUBP  + CGSUBPR

LASUBPR  = (LASUBPR(-4)  + LASUBPR(-3)  + LASUBPR(-2)  + LASUBPR(-1))  * 0.25  * (PGDP  * 4)  / (PGDP(-4)  + PGDP(-3)  + PGDP(-2)  + PGDP(-1))

LATSUB  = LASUBP  + LASUBPR

CGASC  / CGASC(-1)  = CGWS  / CGWS(-1)

CGISC  / CGISC(-1)  = CGWS  / CGWS(-1)

EESCCG  / EESCCG(-1)  = CGWS  / CGWS(-1)

LASC  / LASC(-1)  = LAWS  / LAWS(-1)

EESCLA  / EESCLA(-1)  = LAWS  / LAWS(-1)

CGNCGA  = TROD

'
' Group 10: Public Sector Receipts

CT  = NSCTP  + NNSCTP

CETAX  = VREC  + TXFUEL  + TXTOB  + TXALC  + CUST  + CCL  + AL  + TXCUS

VED  = VEDHH  + VEDCO

OCT  = VEDHH  + BBC  + PASSPORT  + OHT

d(CGC)  / CGC(-1)  = 0.21  * d(ROCB)  / ROCB(-1)

PSINTR  = CGNDIV  + LANDIV  + PCNDIV

CGRENT  = RNCG  + HHTCG

TAXCRED  = MILAPM  + CTC

INCTAXG  = TYEM  + TSEOP  + TCINV  - INCTAC  + CTC  - NPISHTC

PUBSTIW  = TYEM  + TSEOP  + PRT  + TCINV  + CT  + CGT  + FCACA  + BETPRF  + BETLEVY  + OFGEM  - NPISHTC  - TYPCO  + PROV  - LAEPS

PUBSTPD  = (CETAX  - BETPRF)  + EXDUTAC  + XLAVAT  + LAVAT  - EUOT  + TSD  + ROCS  + TXMIS  + RFP  + (NNDRA  + VEDCO  + LAPT  + OPT  + EUETS)  + CIL  + ENVLEVY  + BANKROLL  + RULC

PSCR  = PUBSTIW  + PUBSTPD  + OCT  + CC  + INHT  + EENIC  + EMPNIC  + (RCGIM  + RLAIM  + OSPC)  + PSINTR  + (RNCG  + HHTCG)  + LARENT  + PCRENT  + BLEVY  + LAEPS  + SWISSCAP

NATAXES  = PUBSTIW  + PUBSTPD  + OCT  + BLEVY  + INHT  + LAEPS  + SWISSCAP  + EENIC  + EMPNIC  + CC  + EUOT

'
' Group 11: Balance of Payments

RXD  = RXD(-1)  * RX  / RX(-1)

ECUPO  = (ECUPO(-1)  * RX  / RX(-1))

d(DRES)  = 0

SRES  =  - DRES  + (1  + 0.227  * (RXD(-1)  / RXD  - 1)  + 0.364  * (RX(-1)  / RX  - 1))  * SRES(-1)

CIPD  = ( 0.7173  * CIPD(-1)  / LROW(-2)  + (1  - 0.7173)  * REXC  / 100 )  * LROW(-1)

REXC  = (DLROW(-1)  / LROW(-1))  * (1.24  + 1.91  * (log(WEQPR)  - log(WEQPR(-4)))  + 0.57  * R  / 4)  + (EQLROW(-1)  / LROW(-1))  * (0.41  + 0.17  * ( log(WEQPR)  - log(WEQPR(-4))))  + (BLROW(-1)  / LROW(-1))  * (0.30  + 0.82  * (ROLT  / 4))  + (OTLROW(-1)  / LROW(-1))  * (0.09  + 0.8  * ROCB  / 4)

DIPD  = (0.6283  * DIPD(-1)  / AROW(-2)  + (1  - 0.6283)  * REXD  / 100)  * AROW(-1)

REXD  = (DAROW(-1)  / AROW(-1))  * (0.62  + 2.36  * FYCPR  / GDPMPS  - 1.64  * @recode(@date  = @dateval("1998:03")  , 1  , 0))  + (EQAROW(-1)  / AROW(-1))  * (0.57  + 15.33  * NDIVHH  / EQHH)  + (BAROW(-1)  / AROW(-1))  * (0.23  + 1.04  * RL  / 4)  + (OTAROW(-1)  / AROW(-1))  * (0.18  + 0.14  * R  / 4  + 0.78  * ROCB  / 4)

d(CGCBOP)  / CGCBOP(-1)  = d(CGC)  / CGC(-1)

NIPD  = CIPD  - DIPD  + CGCBOP

dlog(EECOMPD)  =  - 0.492198  * log(EECOMPD(-1))  + 0.693337  * log(FYEMP(-1))  + 2.148955  * dlog(FYEMP)  + 0.107609  * @recode(@date >= @dateval("2005:01")  , 1  , 0)  - 0.004629  * @TREND(1979Q4)  - 5.105951

EECOMPC  / EECOMPC(-1)  = MAJGDP  / MAJGDP(-1)

EUSUBP  = 0

EUSUBPR  = EUSUBPR(-1)  * ECUPO(-1)  / ECUPO

EUSF  = EUSF(-1)  * ECUPO(-1)  / ECUPO

ECNET  = (1  - 0.5  * (ECUPO(-1)  / ECUPO  - 1))  * ECNET(-1)

GNP4  = 0.010  * ((GDPMPS  + NIPD  + EECOMPC  - EECOMPD)  / ECUPO(-4))

EUVAT  = 0.0325  * VREC  / (0.8267  * ECUPO(-4))

BENAB  = 0.012  * CGSB

CGITFA  = ITA

ITA  = 0.001115  * WFP

log(HHTFA)  = log(HHTFA(-1)  * MAJGDP  / MAJGDP(-1))

HHTA  / HHTA(-1)  = WFP  / WFP(-1)

TRANC  = EUSUBP  + HHTFA  + EUSF  + CGITFA  + EUSUBPR  + INSURE

TRAND  = TROD  + ECNET  + EUVAT  + EUOT  + HHTA  + GNP4  + BENAB  + ITA  + INSURE

TRANB  = TRANC  - TRAND

CGKTA  = 0.02351  * KCGPSO

TB  = XPS  - MPS

CB  = TB  + (EECOMPC  - EECOMPD)  + NIPD  + TRANC  - TRAND

CBPCNT  = (CB  / GDPMPS)  * 100

NAFROW  =  - (CB  + (EUKT)  - (CGKTA  + OPSKTA)  + NPAA)

'
' Group 12: Public Sector totals
'
'Changed to enable indirect T2 fix:

CGSUBP  = PSCE  - (CGWS  + CGP  + RCGIM  + LAWS  + LAPR  + RLAIM)  - LATSUB  - (CGSB  + LASBHH)  - CGNCGA  - ECNET  - LANCGA  - (CGOTR  + LAOTRHH)  - (DICGOP  + DILAPR  + DIPCOP)  - EUVAT  - GNP4  - CGSUBPR

'PSCE  = (CGWS  + CGP  + RCGIM  + LAWS  + LAPR  + RLAIM)  + (CGTSUB  + LATSUB)  + (CGSB  + LASBHH)  + CGNCGA  + ECNET +  LANCGA  + (CGOTR  + LAOTRHH)  + (DICGOP  + DILAPR  + DIPCOP)  + EUVAT  + GNP4

DEP  = RCGIM  + RLAIM  + PCCON

PSCB  = PSCR  - PSCE  - DEP

NPACG  = (NPACG(-1)  + NPACG(-2)  + NPACG(-3)  + NPACG(-4))  / 4

NPALA  = (NPALA(-1)  + NPALA(-2)  + NPALA(-3)  + NPALA(-4))  / 4

PSGI  = CGIPS  + LAIPS  + IPCPS  + IBPC  + DINVCG  + (NPACG  + NPALA)  + (KCGPSO  - KPSCG)  + (KLA  - KGLAPC  - KGLA)  + (KPCPS  - KPSPC)  + ASSETSA

'Changed to enable indirect T2 fix:
'
'PSNI  = PSGI  - DEP  - ASSETSA

TME  = PSCE  + DEP  + PSNI

CGNB  = (CGWS  + CGP)  + CGTSUB  + CGSB  + CGNCGA  + CGCGLA  + CGOTR  + GNP4  + EUVAT  + DICGOP  + (CGIPS  + NPACG)  + DINVCG  + (KCGLA  + KCGPC)  + KCGPSO  - KPSCG  - (PUBSTIW  + TYPCO)  - (PUBSTPD  - LAPT)  - (OCT  + LANNDR)  - (INHT  + LAEPS  + SWISSCAP)  - (EMPNIC  + EENIC)  - CGNDIV  - CGINTRA  - (RNCG  + HHTCG  + BLEVY)

LANB  = (LAWS  + LAPR)  + LATSUB  + LASBHH  + LANCGA  - CGCGLA  + LAOTRHH  + DILAPR  + (LAIPS  + NPALA)  - KCGLA  + (KLA  - KGLAPC)  - KGLA  - LAPT  - (CC  - LANNDR)  - LAINTRA  - LANDIV  - LARENT  - CIL

GGNB  = CGNB  + LANB

GGNBCY  = GGNB

PCNB  = DIPCOP  + IPCPS  + IBPC  - (KCGPC  + KGLAPC)  + (KPCPS  - KPSPC)  + TYPCO  - OSPC  - PCNDIV  - PCINTRA  - PCRENT

PCNBCY  = PCNB

PSNBNSA  =  - PSCB  + PSNI

PSNBCY  = PSNBNSA
@ADD(V) PSNBCY  PSNBCY_A

SWAPS  = 0

TDEF  = CGNB  + LANB  + SWAPS

CGLSFA  = (LCGOS  + LCGPR)  + (CGMISP)

PSLSFA  = CGLSFA  + (LALEND  + LAMISE)  + (PCLEND  + PCMISE)

CGACADJ  = (EXDUTAC  + NICAC  + INCTAC)  + FCACA  + CGACRES  + (ILGAC  + CONACC)  + MFTRAN

PSACADJ  = CGACADJ  + LAAC  + LAMFT  + PCAC  + PCGILT  + MFTPC

PSFL  = CGGILTS  + OFLPS  + NATSAV  + MKTIG

PSTA  = PSTA(-1)  * PIF  / PIF(-1)  + 0.5  * (PSNI  + KCGPC  + KGLAPC  - KLA  - KCGPSO)  * (1  + GGIDEF  / GGIDEF(-1))

PSNW  = PSTA  + PSFA  - PSFL

LABRO  = LANB  + LALEND  + LAMISE  + LAAC  + LAGILT  + LAMFT  - LCGLA

CGNCR  = CGNB  + CGLSFA  + CGACADJ  + LCGLA  + LCGPC

PSNCR  = PSNBNSA  + PSLSFA  + PSACADJ

COIN  / COIN(-4)  = M0  / M0(-4)

d(PSND)  = PSNCR  - ILGAC  + d(FLEASGG)  + d(FLEASPC)  + PSNDRES

GGLIQ  = CGLIQ  + LALIQ

d(GGGD)  = CGNCR  + LABRO  - ILGAC  + d(SRES)  + d(GGLIQ)  + GGGDRES

'
' Group 14: Domestic financial sector

d(RIC)  = 0.755375  * d(R)  - 0.286805  * (RIC(-1)  - 0.822845  * R(-1)  - 2.583124)

dlog(EQPR)  = dlog(GDPMPS)

dlog(M0)  = dlog(GDPMPS)

M4IC  / M4IC(-1)  = GDPMPS  / GDPMPS(-1)

M4  = DEPHH  + M4IC  + M4OFC

'
' Group 15: Income Account

WFP  = ADJW  * PSAVEI  * (EMS  - ESLFS)  + (52  / 4000)  * CGWADJ  * ERCG  * ECG  + (52  / 4000)  * LAWADJ  * ERLA  * ELA

MI  / MI(-1)  = WFP  / WFP(-1)

EMPSC  = EMPISC  + CGASC  + EMPNIC  + EMPCPP

FYEMP  = WFP  + EMPSC

EMPISC  = HHISC  + LASC  + CGISC

EMPASC  = EMPSC  - EMPISC

EMPISCPP  / EMPISCPP(-1)  = EMPISC  / EMPISC(-1)

HHISC  / HHISC(-1)  = WFP  / WFP(-1)

HHSB  = 2  * HHISC

OSB  / OSB(-1)  = PCE  / PCE(-1)  * GAD3  / GAD3(-1)

SBHH  = EMPISC  + OSB  + (HHSB  - HHISC  - EMPISCPP)  + CGSB  + LASBHH  + EESCLA  + EESCCG  + CGASC  - BENAB
@ADD(V) SBHH  SBHH_A

TYWHH  = TYEM  + TSEOP  + CC  + CGT  + OCT  - NPISHTC
@ADD(V) TYWHH  TYWHH_A

NMTRHH  = LAOTRHH  + (CGOTR  - HHTCG)  + (HHTFA  - HHTA)  + (EUSF)  + 100

DIPHHx  = DIPHH  + DIPHHmf  + DIPHHuf

DIPHHmf  = LHP(-1)  * ((1  + (RMORT  - R)  / 100)^0.25  - 1)

'FSMADJ  =  - @recode(@date >= @dateval("2023:02")  , 1  , 0)  * ( ( dirhhf  - @elem(dirhhf  , "2023Q2" ))  + ( diphhuf  - @elem(diphhuf  , "2023Q2" )) )

DIPHH  = (LHP(-1)  + OLPE(-1))  * ((1  + (0.9  * R  + 0.2)  / 100)^0.25  - 1)

DIRHHx  = DIRHH  - DIRHHf

DIRHHf  =  - (0.75  * DEPHH(-1)  * ((1  + (RDEP  - R)  / 100)^.25  - 1))

DIRICx  = DIRIC  - DIRICf

d(DIRICf)  =  - ((2.75)  * M4IC(-1)  * (((1  + (0.9  * R  - 0.2  - R)  / 100)^0.25)  - 1))  + ((2.75)  * M4IC(-2)  * (((1  + (0.9  * R(-1)  - 0.2  - R(-1))  / 100)^0.25)  - 1))

d(DIRIC)  = (M4IC(-1)  * (((1  + R  / 100)^0.25)  - 1)  - M4IC(-2)  * (((1  + R(-1)  / 100)^0.25)  - 1))  * 1.3  + (M4IC(-1)  * (((1  + ROCB  / 100)^0.25)  - 1)  - M4IC(-2)  * (((1  + ROCB(-1)  / 100)^0.25)  - 1) )  * 0.6

DIPICx  = DIPIC  + DIPICf

d(DIPICf)  = STLIC  * (((1  + (RIC  - R)  / 100)^0.25)  - 1)  + FXLIC  * (((1  + 2.9  / 100)^0.25)  - 1)  - STLIC(-1)  * (((1  + (RIC(-1)  - R(-1))  / 100)^0.25)  - 1)  + FXLIC(-1)  * (((1  + 2.9  / 100)^0.25)  - 1)

d(DIPIC)  = (STLIC(-1)  * (((1  + R  / 100)^0.25)  - 1)  - STLIC(-2)  * (((1  + R(-1)  / 100)^0.25)  - 1))  + (FXLIC(-1)  * (((1  + ROCB  / 100)^0.25)  - 1)  - FXLIC(-2)  * (((1  + ROCB(-1)  / 100)^0.25)  - 1))  + (BLIC(- 1)  * (((1  + RL  / 100)^0.25)  - 1)  - BLIC(-2)  * (((1  + RL(-1)  / 100)^0.25)  - 1))

WYQC  / WYQC(-1)  = FYCPR  / FYCPR(-1)

log(NDIVHH)  =  - 8.605599  + 0.8092696  * log(FYCPR(-4))  + 0.6597959  * log(CORP)

PIRHH  = NDIVHH  + APIIH  + DIRHH  + WYQC

PIPHH  = DIPHH

EECPP  = ((1  + (RL  / 100))^0.25  - 1)  * (PIHH(-1)  * 0.729)  + ((1  + 0.05)^0.25  - 1)  * (PIHH(-1)  * 0.271)

EESC  = EESCLA  + EENIC  + EECPP  + EESCCG
@ADD(V) EESC  EESC_A

HHDI  = MI  + FYEMP  - EMPSC  - EESC  - TYWHH  + NMTRHH  + SBHH  + (PIRHH  - PIPHH  + FSMADJ)  - HHSB  + HHISC  + (EECOMPC  - EECOMPD)  + OSHH

RHHDI  = 100  * HHDI  / PCE

EMPCPP  / EMPCPP(-1)  = WFP  / WFP(-1)

NEAHH  = EMPCPP  + EECPP  + EMPISCPP  - OSB

SVHH  = HHDI  + NEAHH  - CONSPS

SY  = 100  * (SVHH  / (NEAHH  + HHDI))

KGHH  =  - INHT  + 0.95  * KLA  + 0.55  * KCGPSO  + 0.4  * EUKT

NAFHH  = SVHH  + KGHH  - DINVHH  - VALHH  - NPAHH  - IHHPS

NAFCO  =  - NAFHH  + CB  + EUKT  - CGKTA  - OPSKTA  + NPAA  + SDEPS  - SDI  + PSNBCY

NAFFC  =  - 12012  + FISIMPS  - NEAHH  - BLEVY

NAFIC  = NAFCO  - NAFFC

SAVCO  = NAFCO  + KGHH  - DINVHH  + DINVPS  - DINVCG  + VALPS  - VALHH  - NPAHH  + IFPS  - IHHPS  - NPACG  - CGIPS  - KLA  - KCGPSO  - LAIPS  - NPALA  + INHT  + KGLA  - EUKT  + CGKTA  + OPSKTA  - NPAA  - IPCPS  - IBPC

'
' Group 16: Gross Domestic Product

TFEPS  = CGGPS  + CONSPS  + DINVPS  + VALPS  + IFPS  + XPS

SDEPS  = PGDP  * SDE  / 100

' SDEPS  = GDPMPS  - TFEPS  + MPS
'

GDPMPS  = TFEPS  - MPS  + SDEPS

' GDPMPS  = PGDP  * GDPM  / 100

MGDPNSA  = GDPMPS
@ADD(V) MGDPNSA  MGDPNSA_A

BPAPS  = (CETAX  - BETPRF)  + EXDUTAC  + XLAVAT  + LAVAT  + TSD  + TXMIS  + ROCS  - (EUSUBP  + LASUBP  + CGSUBP  + CCLACA)  + BANKROLL  + BLEVY

GVAPS  = GDPMPS  - BPAPS

TFE  = CGG  + CONS  + DINV  + VAL  + IF  + X

'Switched off to enable indirect T2 fix:
'
'GDPM  = TFE  - M  + SDE

BPA  / BPA(-1)  = GDPM  / GDPM(-1)

GVA  = GDPM  - BPA

PGVA  = 100  * GVAPS  / GVA

'exogenised to enable indirect T2 fix:
'
'PGDP  = 100  * GDPMPS  / GDPM

TPRODPS  = NNDRA  + NIS  + VEDCO  + OPT  + LAPT  + EUETS  - CGSUBPR  - LASUBPR  - EUSUBPR

SDI  = SDI(-1)

OS  = GDPMPS  - FYEMP  - MI  - BPAPS  - TPRODPS  - SDI

RENTCO  / RENTCO(-1)  = GDPMPS  / GDPMPS(-1)

IROO  = (PRENT  * POP16)  / 1000

OSHH  = (12874  + 0.85  * IROO  - DIPHHmf)

FISIMGG  = 0

FISIMPS  = (DIRHHf  + DIPHHuf  + DIPHHmf)  + (DIRICf  + DIPICf)  + FISIMGG  + FISIMROW

FYCPR  = OS  - OSHH  - OSGG  - OSPC  - RENTCO  + SA  - FISIMPS

OSCO  = OS  - OSHH  - OSGG  - OSPC

GTPFC  = FYCPR  - NNSGTP  - NSGTP

FC  = FISIMPS  + GTPFC

GNIPS  = GDPMPS  + NIPD  + (EECOMPC  - EECOMPD)  + (EUSUBPR  + EUSUBP)  - (EUOT  + EUVAT)

NNSGVA  = GVA  - NSGVA

GAP  = GDPM  / TRGDP  * 100  - 100

GDPMAL  = GDPM  / POPAL

TRGDPAL  = TRGDP  / POPAL

GDPM16  = GDPM  / POP16

TRGDP16  = TRGDP  / POP16

'
' Market sector GVA satellite

GGVAPS  = CGWS  + LAWS  + OSGG

MSGVAPS  = GVAPS  - GGVAPS

GGVA  / GGVA(-1)  = CGG  / CGG(-1)

MSGVA  = GVA  - GGVA

'
' Group 18: Financial Account and Financial Balance Sheet
' Households

NAFHHNSA  = NAFHH  + NAFHH(-1)  + NAFHH(-2)  + NAFHH(-3)  - NAFHHNSA(-1)  - NAFHHNSA(-2)  - NAFHHNSA(-3)

SDLHH  = 0

NLHH  = NAFHHNSA  - SDLHH

'
' HOUSHOLDS: FINANCIAL ASSETS

GMF  = (PD  * APH  * 0.858)  / DEPHH(-1)

d(DEPHHx)  = 3.9056  * d(CONSPS)  + exp(5.1811  * (RDEP  - R))  - exp(5.1811  * (RDEP(-1)  - R(-1)))  + exp(0.8206  * LFSUR)  - exp(0.8206  * LFSUR(-1))  + exp(106.3011  * GMF)  - 0.0369  * (DEPHH(-1)  - 5.5399  * CONSPS(-1)  - exp(0.8479  * RDEP(-1))  - exp(1.0821  * LFSUR(-1))  + 233379.6)

d(DEPHH)  = (DEPHHx  - DEPHHx(-1))  + DEPHHADJ

NAEQHHx  = 0.4560  * NLHH  - 12867

NAEQHH  = NAEQHHx  + NAEQHHADJ

EQHH  = (1  + 0.844  * (EQPR  / EQPR(-1)  - 1)  + 0.156  * ((WEQPR  / WEQPR(-1))  / (RX  / RX(-1))  - 1))  * EQHH(-1)  + NAEQHH

NAPEN  = NEAHH

NAINSx  = 13293.71  + 0.627  * (NAINSx(-1))  - 236267.3  * (SIPT(-3))

NAINS  = NAINSx  + NAINSADJ

PIHH  = (1  + 0.200  * ((EQPR  / EQPR(-1))  - 1)  + 0.098  * (RX(-1)  / RX  - 1)  + 0.170  * ((WEQPR  / WEQPR(-1))  / (RX  / RX(-1))  - 1)  + 0.574  * (DBR  / DBR(-1)  - 1))  * PIHH(-1)  + NAPEN  + NAINS

DBR  = 1  / ((1  + (RL  / 100))^(15))

dlog(OAHHx)  = 1.6091  - 0.1607  * log(OAHHx(-1))  + 0.0169  * log(GDPMPS(-1))  - 0.57443  * (log(GDPMPS)  - log(GDPMPS(-1)))  + 0.001796  * @TREND(1986Q4)

d(OAHH)  = (OAHHx  - OAHHx(-1))  + OAHHADJ

GFWPE  = DEPHH  + EQHH  + PIHH  + OAHH

'
' HOUSEHOLDS: FINANCIAL LIABILITIES

NAOLPEx  = OLPEx(-1)  * DEBTU

NAOLPE  = NAOLPEx  + d(STUDENT)  + NAOLPEADJ

DEBTU  = 0.0812616  + 0.4338504  * DEBTU(-1)  - 0.0248383  * log(OLPEx(-1))  + 0.013581  * log(CONSPS(-1))  - 0.0014364  * LFSUR(-1)  + 0.0143662  * log(PD(-1))

OLPEx  = OLPEx(-1)  - 0.00219  * OLPEx(-1)  + NAOLPEx  + NAOLPEADJ

OLPE  = OLPEx  + STUDENT

AAHH  = d(OAHH)  + d(DEPHH)  + NAEQHH  + NAPEN  + NAINS

ALHH  = NAOLPE  + d(LHP)

HHRES  = NLHH  - ((d(DEPHHx)  + NAEQHHx  + NAPEN  + NAINSx  + d(OAHHx))  - (NAOLPEx  + d(STUDENT)  + d(LHP)))

OAHHADJ  = HHRES  - DEPHHADJ  - NAEQHHADJ  - NAINSADJ  + NAOLPEADJ

'
'AGGREGATES

NFWPE  = GFWPE  - LHP  - OLPE

GPW  = 0.9933  * GPW(-1)  * APH  / APH(-1)  + .001  * IHHPS

'
' REST OF WORLD

NAFROWNSA  = NAFROW  + NAFROW(-1)  + NAFROW(-2)  + NAFROW(-3)  - NAFROWNSA(-1)  - NAFROWNSA(-2)  - NAFROWNSA(-3)

SDLROW  = 0

NLROW  = NAFROWNSA  - SDLROW

'
' EXTERNAL BALANCE SHEET: FINANCIAL ASSETS OF ROW

d(DAROW)  = (0.3813  * (XPS  + MPS)  / TFEPS  + 0.7067  * ICCPS  / TFEPS  - 0.1872)  * TFEPS

EQAROW  = EQAROW(-1)  * (EQPR  / EQPR(-1) )  + NAEQAROW

NAEQAROW  = ( 0.25  * (EQAROW(-1)  + EQAROW(-2)  + EQAROW(-3)  + EQAROW(-4))  / (0.25  * (EQAROW(-1)  + EQAROW(-2)  + EQAROW(-3)  + EQAROW(-4))  + 0.25  * (BAROW(-1)  + BAROW(-2)  + BAROW(-3)  + BAROW(-4))))  * (AAROW  - d(DAROW)  - NAOTAROW)

BAROW  = BAROW(-1)  * (0.40  / ( RX  / RX(-1) )  + (1  - 0.40))  + NABAROW

NABAROW  = (0.25  * (BAROW(-1)  + BAROW(-2)  + BAROW(-3)  + BAROW(-4))  / (0.25  * (EQAROW(-1)  + EQAROW(-2)  + EQAROW(-3)  + EQAROW(-4))  + 0.25  * (BAROW(-1)  + BAROW(-2)  + BAROW(-3)  + BAROW(-4))))  * (AAROW  - d(DAROW)  - NAOTAROW)

OTAROW  = OTAROW(-1)  * (0.84  / (RX  / RX(-1) )  + (1  - 0.84))  + NAOTAROW

NAOTAROW  = NAOTLROW

AROW  = DAROW  + EQAROW  + BAROW  + OTAROW

AAROW  = ALROW  + NLROW

'
' EXTERNAL BALANCE SHEET: FINANCIAL LIABILTIES OF ROW

DLROW  = DLROW(-1)  / (RX  / RX(-1) )  + NADLROW

NADLROW  = DLROW(-1)  * (-0.0375  - 0.2124  * DLROW(-1)  / LROW(-1)  - 0.2004  * (FYCPR(-1)  + FISIMPS(-1))  / EQLIC  + 0.1026  * WEQPR  / WEQPR(-1))

EQLROW  = EQLROW(-1)  * (WEQPR  / WEQPR(-1) )  / ( RX  / RX(-1) )  + NAEQLROW

NAEQLROW  = 0.196  * (NAINS  + NAPEN)  + 0.132  * NAEQHH  + 0.003  * GDPMPS

BLROW  = BLROW(-1)  / ( RX  / RX(-1))  + NABLROW

NABLROW  = 0.17  * (NAINS  + NAPEN)  + 0.0325  * GDPMPS

OTLROW  = OTLROW(-1)  * (0.90  / (RX  / RX(-1))  + (1  - 0.90))  + NAOTLROW

NAOTLROW  = OTLROW(-1)  * ((GDPMPS  / GDPMPS(-1))  - 1)

LROW  = DLROW  + EQLROW  + BLROW  + OTLROW

ALROW  = NADLROW  + NAEQLROW  + NABLROW  + NAOTLROW  - DRES

'
' AGGREGATES

d(NIIP)  = d(LROW)  + d(SRES)  - d(AROW)

'
' PNFC BALANCE SHEET MODEL

BLIC  = BLIC(-1)  + NABLIC

STLIC  = STLIC(-1)  + 0.09  * NALIC

FXLIC  = FXLIC(-1)  * (RX(-1)  / RX)  + NAFXLIC

EQLIC  = EQLIC(-1)  * (EQPR  / EQPR(-1))  + NAEQLIC

OLIC  = OLIC(-1)  + 0.04  * NALIC

LIC  = BLIC  + STLIC  + FXLIC  + EQLIC  + OLIC

NABLIC  = 0.14  * NALIC

NAFXLIC  = 0.07  * NALIC

NAEQLIC  = (1.6035  + 0.9385  * EQLIC(-1)  / ( FYCPR(-1)  + FISIMPS(-1) ) )  * (FYCPR  + FISIMPS)  - EQLIC(-1)  * GDPMPS  / GDPMPS(-1)

NALIC  =  - 27362  + 1.513178  * IBUS  * (PIF  / 100)

AIC  = AIC(-1)  + (NAAIC  - d(M4IC))

NAAIC  = AIC(-1)  * (GDPMPS  / GDPMPS(-1)  - 1)

NWIC  = AIC  - LIC