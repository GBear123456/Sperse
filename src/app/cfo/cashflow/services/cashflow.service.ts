import { Injectable } from '@angular/core';
import { Operation } from '../models/operation';

let operations: Operation[] = [
{
  "id": 1,
  "type": "income",
  "subgroup": "Affiliate Sales",
  "group": "Total Advertising Income",
  "amount": 1740,
  "date": "2017/01/06"
}, {
  "id": 2,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 850,
  "date": "2017/01/13"
}, {
  "id": 3,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2235,
  "date": "2017/01/07",
}, {
  "id": 4,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1965,
  "date": "2017/01/03"
}, {
  "id": 5,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 880,
  "date": "2017/01/10"
}, {
  "id": 6,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 5260,
  "date": "2017/01/17"
}, {
  "id": 7,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2790,
  "date": "2017/01/21"
}, {
  "id": 8,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 3140,
  "date": "2017/01/01"
}, {
  "id": 9,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 6175,
  "date": "2017/01/24"
}, {
  "id": 10,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4575,
  "date": "2017/01/11"
}, {
  "id": 11,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3680,
  "date": "2017/01/12"
}, {
  "id": 12,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2260,
  "date": "2017/01/01"
}, {
  "id": 13,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2910,
  "date": "2017/01/26"
}, {
  "id": 14,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 8400,
  "date": "2017/01/05"
}, {
  "id": 15,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 1325,
  "date": "2017/01/14"
}, {
  "id": 16,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3920,
  "date": "2017/01/05"
}, {
  "id": 17,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2220,
  "date": "2017/01/15"
}, {
  "id": 18,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 940,
  "date": "2017/01/01"
}, {
  "id": 19,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1630,
  "date": "2017/01/10"
}, {
  "id": 20,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2910,
  "date": "2017/01/23"
}, {
  "id": 21,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2600,
  "date": "2017/01/14"
}, {
  "id": 22,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 4340,
  "date": "2017/01/26"
}, {
  "id": 23,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 6650,
  "date": "2017/01/24"
}, {
  "id": 24,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 490,
  "date": "2017/01/22"
}, {
  "id": 25,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3390,
  "date": "2017/01/25"
}, {
  "id": 26,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5160,
  "date": "2017/02/20"
}, {
  "id": 27,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5750,
  "date": "2017/02/12"
}, {
  "id": 28,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2805,
  "date": "2017/02/13"
}, {
  "id": 29,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2505,
  "date": "2017/02/09"
}, {
  "id": 30,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 930,
  "date": "2017/02/04"
}, {
  "id": 31,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 1240,
  "date": "2017/02/03"
}, {
  "id": 32,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 315,
  "date": "2017/02/04"
}, {
  "id": 33,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2870,
  "date": "2017/02/18"
}, {
  "id": 34,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 5150,
  "date": "2017/02/18"
}, {
  "id": 35,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2725,
  "date": "2017/02/20"
}, {
  "id": 36,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2840,
  "date": "2017/02/04"
}, {
  "id": 37,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5840,
  "date": "2017/02/13"
}, {
  "id": 38,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6750,
  "date": "2017/02/11"
}, {
  "id": 39,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1200,
  "date": "2017/02/03"
}, {
  "id": 40,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4550,
  "date": "2017/02/08"
}, {
  "id": 41,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 6040,
  "date": "2017/02/17"
}, {
  "id": 42,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2205,
  "date": "2017/02/08"
}, {
  "id": 43,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 990,
  "date": "2017/02/20"
}, {
  "id": 44,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 700,
  "date": "2017/02/11"
}, {
  "id": 45,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2325,
  "date": "2017/02/15"
}, {
  "id": 46,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 930,
  "date": "2017/02/21"
}, {
  "id": 47,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1560,
  "date": "2017/02/04"
}, {
  "id": 48,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1740,
  "date": "2017/03/04"
}, {
  "id": 49,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3575,
  "date": "2017/03/20"
}, {
  "id": 50,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4500,
  "date": "2017/03/04"
}, {
  "id": 51,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1605,
  "date": "2017/03/17"
}, {
  "id": 52,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 800,
  "date": "2017/03/21"
}, {
  "id": 53,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 640,
  "date": "2017/03/08"
}, {
  "id": 54,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 735,
  "date": "2017/03/19"
}, {
  "id": 55,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2520,
  "date": "2017/03/20"
}, {
  "id": 56,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 6675,
  "date": "2017/03/18"
}, {
  "id": 57,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3625,
  "date": "2017/03/25"
}, {
  "id": 58,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1200,
  "date": "2017/03/07"
}, {
  "id": 59,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2000,
  "date": "2017/03/07"
}, {
  "id": 60,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1410,
  "date": "2017/03/10"
}, {
  "id": 61,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 2700,
  "date": "2017/03/19"
}, {
  "id": 62,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5950,
  "date": "2017/03/24"
}, {
  "id": 63,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5120,
  "date": "2017/03/08"
}, {
  "id": 64,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1980,
  "date": "2017/03/17"
}, {
  "id": 65,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1110,
  "date": "2017/03/08"
}, {
  "id": 66,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 980,
  "date": "2017/03/21"
}, {
  "id": 67,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5460,
  "date": "2017/03/19"
}, {
  "id": 68,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3800,
  "date": "2017/03/12"
}, {
  "id": 69,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2610,
  "date": "2017/03/04"
}, {
  "id": 70,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3080,
  "date": "2017/03/22"
}, {
  "id": 71,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 2010,
  "date": "2017/03/23"
}, {
  "id": 72,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1200,
  "date": "2017/03/04"
}, {
  "id": 73,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7680,
  "date": "2017/04/15"
}, {
  "id": 74,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 1325,
  "date": "2017/04/07"
}, {
  "id": 75,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2835,
  "date": "2017/04/10"
}, {
  "id": 76,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3660,
  "date": "2017/04/10"
}, {
  "id": 77,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 390,
  "date": "2017/04/12"
}, {
  "id": 78,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4420,
  "date": "2017/04/08"
}, {
  "id": 79,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1755,
  "date": "2017/04/13"
}, {
  "id": 80,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2580,
  "date": "2017/04/15"
}, {
  "id": 81,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 850,
  "date": "2017/04/01"
}, {
  "id": 82,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2825,
  "date": "2017/04/10"
}, {
  "id": 83,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 540,
  "date": "2017/04/06"
}, {
  "id": 84,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1520,
  "date": "2017/04/08"
}, {
  "id": 85,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8760,
  "date": "2017/04/26"
}, {
  "id": 86,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1110,
  "date": "2017/04/16"
}, {
  "id": 87,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 6850,
  "date": "2017/04/19"
}, {
  "id": 88,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 1940,
  "date": "2017/04/23"
}, {
  "id": 89,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1980,
  "date": "2017/04/21"
}, {
  "id": 90,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 3090,
  "date": "2017/04/03"
}, {
  "id": 91,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1640,
  "date": "2017/04/24"
}, {
  "id": 92,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3585,
  "date": "2017/04/01"
}, {
  "id": 93,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1770,
  "date": "2017/04/01"
}, {
  "id": 94,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4005,
  "date": "2017/04/04"
}, {
  "id": 95,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2870,
  "date": "2017/04/02"
}, {
  "id": 96,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 960,
  "date": "2017/04/20"
}, {
  "id": 97,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 8640,
  "date": "2017/05/14"
}, {
  "id": 98,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5450,
  "date": "2017/05/24"
}, {
  "id": 99,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2535,
  "date": "2017/05/07"
}, {
  "id": 100,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1155,
  "date": "2017/05/20"
}, {
  "id": 101,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3140,
  "date": "2017/05/18"
}, {
  "id": 102,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2260,
  "date": "2017/05/19"
}, {
  "id": 103,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1215,
  "date": "2017/05/23"
}, {
  "id": 104,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1210,
  "date": "2017/05/08"
}, {
  "id": 105,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 875,
  "date": "2017/05/25"
}, {
  "id": 106,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5400,
  "date": "2017/05/03"
}, {
  "id": 107,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5940,
  "date": "2017/05/25"
}, {
  "id": 108,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4700,
  "date": "2017/05/03"
}, {
  "id": 109,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5520,
  "date": "2017/05/12"
}, {
  "id": 110,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9210,
  "date": "2017/05/22"
}, {
  "id": 111,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 7950,
  "date": "2017/05/12"
}, {
  "id": 112,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3740,
  "date": "2017/05/24"
}, {
  "id": 113,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 990,
  "date": "2017/05/02"
}, {
  "id": 114,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 3190,
  "date": "2017/05/03"
}, {
  "id": 115,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2430,
  "date": "2017/05/11"
}, {
  "id": 116,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7380,
  "date": "2017/06/15"
}, {
  "id": 117,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4475,
  "date": "2017/06/08"
}, {
  "id": 118,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1290,
  "date": "2017/06/10"
}, {
  "id": 119,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2250,
  "date": "2017/06/10"
}, {
  "id": 120,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 350,
  "date": "2017/06/22"
}, {
  "id": 121,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 5480,
  "date": "2017/06/24"
}, {
  "id": 122,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2355,
  "date": "2017/06/10"
}, {
  "id": 123,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1960,
  "date": "2017/06/23"
}, {
  "id": 124,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4125,
  "date": "2017/06/06"
}, {
  "id": 125,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7925,
  "date": "2017/06/12"
}, {
  "id": 126,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1120,
  "date": "2017/06/22"
}, {
  "id": 127,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5100,
  "date": "2017/06/01"
}, {
  "id": 128,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1500,
  "date": "2017/06/25"
}, {
  "id": 129,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 5130,
  "date": "2017/06/10"
}, {
  "id": 130,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 2475,
  "date": "2017/06/10"
}, {
  "id": 131,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2100,
  "date": "2017/06/06"
}, {
  "id": 132,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3570,
  "date": "2017/06/10"
}, {
  "id": 133,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 550,
  "date": "2017/06/02"
}, {
  "id": 134,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2850,
  "date": "2017/06/26"
}, {
  "id": 135,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4280,
  "date": "2017/06/19"
}, {
  "id": 136,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 1460,
  "date": "2017/06/17"
}, {
  "id": 137,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 960,
  "date": "2017/06/17"
}, {
  "id": 138,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1520,
  "date": "2017/06/03"
}, {
  "id": 139,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 6750,
  "date": "2017/06/21"
}, {
  "id": 140,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7260,
  "date": "2017/07/14"
}, {
  "id": 141,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2450,
  "date": "2017/07/11"
}, {
  "id": 142,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3540,
  "date": "2017/07/02"
}, {
  "id": 143,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1950,
  "date": "2017/07/03"
}, {
  "id": 144,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 360,
  "date": "2017/07/07"
}, {
  "id": 145,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4500,
  "date": "2017/07/03"
}, {
  "id": 146,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4575,
  "date": "2017/07/21"
}, {
  "id": 147,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2310,
  "date": "2017/07/18"
}, {
  "id": 148,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7500,
  "date": "2017/07/04"
}, {
  "id": 149,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3575,
  "date": "2017/07/23"
}, {
  "id": 150,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 760,
  "date": "2017/07/01"
}, {
  "id": 151,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2400,
  "date": "2017/07/11"
}, {
  "id": 152,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3330,
  "date": "2017/07/04"
}, {
  "id": 153,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3480,
  "date": "2017/07/23"
}, {
  "id": 154,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4875,
  "date": "2017/07/11"
}, {
  "id": 155,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4980,
  "date": "2017/07/19"
}, {
  "id": 156,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2580,
  "date": "2017/07/04"
}, {
  "id": 157,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2650,
  "date": "2017/07/16"
}, {
  "id": 158,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1190,
  "date": "2017/07/02"
}, {
  "id": 159,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 960,
  "date": "2017/07/26"
}, {
  "id": 160,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3600,
  "date": "2017/08/08"
}, {
  "id": 161,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2250,
  "date": "2017/08/01"
}, {
  "id": 162,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1275,
  "date": "2017/08/02"
}, {
  "id": 163,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3885,
  "date": "2017/08/14"
}, {
  "id": 164,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1900,
  "date": "2017/08/05"
}, {
  "id": 165,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2300,
  "date": "2017/08/09"
}, {
  "id": 166,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2895,
  "date": "2017/08/15"
}, {
  "id": 167,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 350,
  "date": "2017/08/20"
}, {
  "id": 168,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4200,
  "date": "2017/08/22"
}, {
  "id": 169,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7175,
  "date": "2017/08/14"
}, {
  "id": 170,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 4420,
  "date": "2017/08/24"
}, {
  "id": 171,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5200,
  "date": "2017/08/21"
}, {
  "id": 172,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7920,
  "date": "2017/08/17"
}, {
  "id": 173,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 6990,
  "date": "2017/08/22"
}, {
  "id": 174,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 2125,
  "date": "2017/08/05"
}, {
  "id": 175,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2220,
  "date": "2017/08/16"
}, {
  "id": 176,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1575,
  "date": "2017/08/23"
}, {
  "id": 177,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1880,
  "date": "2017/08/12"
}, {
  "id": 178,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 710,
  "date": "2017/08/25"
}, {
  "id": 179,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 390,
  "date": "2017/08/20"
}, {
  "id": 180,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4635,
  "date": "2017/08/04"
}, {
  "id": 181,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4350,
  "date": "2017/08/19"
}, {
  "id": 182,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 6020,
  "date": "2017/08/02"
}, {
  "id": 183,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3660,
  "date": "2017/08/19"
}, {
  "id": 184,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4525,
  "date": "2017/08/24"
}, {
  "id": 185,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4410,
  "date": "2017/09/12"
}, {
  "id": 186,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 1725,
  "date": "2017/09/07"
}, {
  "id": 187,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2715,
  "date": "2017/09/14"
}, {
  "id": 188,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2820,
  "date": "2017/09/08"
}, {
  "id": 189,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2310,
  "date": "2017/09/12"
}, {
  "id": 190,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 780,
  "date": "2017/09/08"
}, {
  "id": 191,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2370,
  "date": "2017/09/19"
}, {
  "id": 192,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1410,
  "date": "2017/09/09"
}, {
  "id": 193,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1825,
  "date": "2017/09/23"
}, {
  "id": 194,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4075,
  "date": "2017/09/06"
}, {
  "id": 195,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1020,
  "date": "2017/09/04"
}, {
  "id": 196,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4320,
  "date": "2017/09/25"
}, {
  "id": 197,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7530,
  "date": "2017/09/13"
}, {
  "id": 198,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 2820,
  "date": "2017/09/08"
}, {
  "id": 199,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3050,
  "date": "2017/09/04"
}, {
  "id": 200,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5080,
  "date": "2017/09/25"
}, {
  "id": 201,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1125,
  "date": "2017/09/13"
}, {
  "id": 202,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 850,
  "date": "2017/09/24"
}, {
  "id": 203,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1440,
  "date": "2017/09/19"
}, {
  "id": 204,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1950,
  "date": "2017/09/02"
}, {
  "id": 205,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 6390,
  "date": "2017/10/11"
}, {
  "id": 206,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4625,
  "date": "2017/10/02"
}, {
  "id": 207,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3510,
  "date": "2017/10/24"
}, {
  "id": 208,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2730,
  "date": "2017/10/15"
}, {
  "id": 209,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2070,
  "date": "2017/10/15"
}, {
  "id": 210,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2320,
  "date": "2017/10/18"
}, {
  "id": 211,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4260,
  "date": "2017/10/24"
}, {
  "id": 212,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 840,
  "date": "2017/10/18"
}, {
  "id": 213,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7300,
  "date": "2017/10/24"
}, {
  "id": 214,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5950,
  "date": "2017/10/11"
}, {
  "id": 215,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3220,
  "date": "2017/10/25"
}, {
  "id": 216,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3480,
  "date": "2017/10/08"
}, {
  "id": 217,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4830,
  "date": "2017/10/26"
}, {
  "id": 218,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 4470,
  "date": "2017/10/05"
}, {
  "id": 219,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3675,
  "date": "2017/10/23"
}, {
  "id": 220,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4260,
  "date": "2017/10/01"
}, {
  "id": 221,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4245,
  "date": "2017/10/26"
}, {
  "id": 222,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1470,
  "date": "2017/10/01"
}, {
  "id": 223,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1810,
  "date": "2017/10/02"
}, {
  "id": 224,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 600,
  "date": "2017/10/23"
}, {
  "id": 225,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7500,
  "date": "2017/11/03"
}, {
  "id": 226,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4625,
  "date": "2017/11/02"
}, {
  "id": 227,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2625,
  "date": "2017/11/09"
}, {
  "id": 228,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1440,
  "date": "2017/11/15"
}, {
  "id": 229,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2420,
  "date": "2017/11/15"
}, {
  "id": 230,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4180,
  "date": "2017/11/15"
}, {
  "id": 231,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3720,
  "date": "2017/11/25"
}, {
  "id": 232,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2730,
  "date": "2017/11/08"
}, {
  "id": 233,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3775,
  "date": "2017/11/17"
}, {
  "id": 234,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3525,
  "date": "2017/11/15"
}, {
  "id": 235,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5320,
  "date": "2017/11/08"
}, {
  "id": 236,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5340,
  "date": "2017/11/13"
}, {
  "id": 237,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8850,
  "date": "2017/11/01"
}, {
  "id": 238,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 7050,
  "date": "2017/11/14"
}, {
  "id": 239,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4200,
  "date": "2017/11/18"
}, {
  "id": 240,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4960,
  "date": "2017/11/04"
}, {
  "id": 241,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2280,
  "date": "2017/11/13"
}, {
  "id": 242,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 590,
  "date": "2017/11/11"
}, {
  "id": 243,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 810,
  "date": "2017/11/12"
}, {
  "id": 244,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2625,
  "date": "2017/11/07"
}, {
  "id": 245,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 8280,
  "date": "2017/12/01"
}, {
  "id": 246,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5650,
  "date": "2017/12/19"
}, {
  "id": 247,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2760,
  "date": "2017/12/14"
}, {
  "id": 248,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2670,
  "date": "2017/12/03"
}, {
  "id": 249,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2520,
  "date": "2017/12/20"
}, {
  "id": 250,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4080,
  "date": "2017/12/21"
}, {
  "id": 251,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4140,
  "date": "2017/12/22"
}, {
  "id": 252,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 390,
  "date": "2017/12/04"
}, {
  "id": 253,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1400,
  "date": "2017/12/19"
}, {
  "id": 254,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7275,
  "date": "2017/12/22"
}, {
  "id": 255,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 4100,
  "date": "2017/12/20"
}, {
  "id": 256,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5520,
  "date": "2017/12/25"
}, {
  "id": 257,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 9210,
  "date": "2017/12/24"
}, {
  "id": 258,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 7290,
  "date": "2017/12/05"
}, {
  "id": 259,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 625,
  "date": "2017/12/22"
}, {
  "id": 260,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4460,
  "date": "2017/12/12"
}, {
  "id": 261,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3825,
  "date": "2017/12/13"
}, {
  "id": 262,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2850,
  "date": "2017/12/17"
}, {
  "id": 263,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2780,
  "date": "2017/12/07"
}, {
  "id": 264,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 840,
  "date": "2017/12/18"
}, {
  "id": 265,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2970,
  "date": "2017/12/23"
}, {
  "id": 266,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 945,
  "date": "2017/12/06"
}, {
  "id": 267,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2625,
  "date": "2017/12/04"
}, {
  "id": 268,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 390,
  "date": "2017/12/01"
}, {
  "id": 269,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2250,
  "date": "2017/12/02"
}, {
  "id": 270,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7710,
  "date": "2014/01/18"
}, {
  "id": 271,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 7975,
  "date": "2014/01/10"
}, {
  "id": 272,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3285,
  "date": "2014/01/13"
}, {
  "id": 273,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2580,
  "date": "2014/01/22"
}, {
  "id": 274,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2160,
  "date": "2014/01/26"
}, {
  "id": 275,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 1100,
  "date": "2014/01/25"
}, {
  "id": 276,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4425,
  "date": "2014/01/21"
}, {
  "id": 277,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1360,
  "date": "2014/01/22"
}, {
  "id": 278,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3250,
  "date": "2014/01/14"
}, {
  "id": 279,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5550,
  "date": "2014/01/21"
}, {
  "id": 280,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2860,
  "date": "2014/01/25"
}, {
  "id": 281,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5320,
  "date": "2014/01/08"
}, {
  "id": 282,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4050,
  "date": "2014/01/14"
}, {
  "id": 283,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3450,
  "date": "2014/01/24"
}, {
  "id": 284,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5425,
  "date": "2014/01/11"
}, {
  "id": 285,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4860,
  "date": "2014/01/12"
}, {
  "id": 286,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4695,
  "date": "2014/01/16"
}, {
  "id": 287,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 610,
  "date": "2014/01/05"
}, {
  "id": 288,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1580,
  "date": "2014/01/15"
}, {
  "id": 289,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3780,
  "date": "2014/02/18"
}, {
  "id": 290,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5400,
  "date": "2014/02/21"
}, {
  "id": 291,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 630,
  "date": "2014/02/18"
}, {
  "id": 292,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3960,
  "date": "2014/02/04"
}, {
  "id": 293,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2010,
  "date": "2014/02/25"
}, {
  "id": 294,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 5000,
  "date": "2014/02/01"
}, {
  "id": 295,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1995,
  "date": "2014/02/20"
}, {
  "id": 296,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 860,
  "date": "2014/02/12"
}, {
  "id": 297,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2150,
  "date": "2014/02/10"
}, {
  "id": 298,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4050,
  "date": "2014/02/06"
}, {
  "id": 299,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2960,
  "date": "2014/02/18"
}, {
  "id": 300,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1780,
  "date": "2014/02/26"
}, {
  "id": 301,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8700,
  "date": "2014/02/03"
}, {
  "id": 302,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3390,
  "date": "2014/02/03"
}, {
  "id": 303,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4425,
  "date": "2014/02/15"
}, {
  "id": 304,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 1180,
  "date": "2014/02/23"
}, {
  "id": 305,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 360,
  "date": "2014/02/08"
}, {
  "id": 306,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2310,
  "date": "2014/02/13"
}, {
  "id": 307,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1770,
  "date": "2014/02/20"
}, {
  "id": 308,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3060,
  "date": "2014/02/26"
}, {
  "id": 309,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1750,
  "date": "2014/02/12"
}, {
  "id": 310,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2280,
  "date": "2014/03/09"
}, {
  "id": 311,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 7600,
  "date": "2014/03/25"
}, {
  "id": 312,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1035,
  "date": "2014/03/23"
}, {
  "id": 313,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1245,
  "date": "2014/03/01"
}, {
  "id": 314,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2860,
  "date": "2014/03/19"
}, {
  "id": 315,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 440,
  "date": "2014/03/19"
}, {
  "id": 316,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4665,
  "date": "2014/03/02"
}, {
  "id": 317,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2270,
  "date": "2014/03/15"
}, {
  "id": 318,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 5000,
  "date": "2014/03/09"
}, {
  "id": 319,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5100,
  "date": "2014/03/23"
}, {
  "id": 320,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2120,
  "date": "2014/03/11"
}, {
  "id": 321,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5140,
  "date": "2014/03/05"
}, {
  "id": 322,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6210,
  "date": "2014/03/19"
}, {
  "id": 323,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9510,
  "date": "2014/03/19"
}, {
  "id": 324,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 7600,
  "date": "2014/03/21"
}, {
  "id": 325,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5420,
  "date": "2014/03/15"
}, {
  "id": 326,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1980,
  "date": "2014/03/05"
}, {
  "id": 327,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1820,
  "date": "2014/03/07"
}, {
  "id": 328,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1670,
  "date": "2014/03/21"
}, {
  "id": 329,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4800,
  "date": "2014/03/08"
}, {
  "id": 330,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2925,
  "date": "2014/03/03"
}, {
  "id": 331,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2940,
  "date": "2014/04/11"
}, {
  "id": 332,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3525,
  "date": "2014/04/13"
}, {
  "id": 333,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2475,
  "date": "2014/04/22"
}, {
  "id": 334,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3315,
  "date": "2014/04/08"
}, {
  "id": 335,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3140,
  "date": "2014/04/07"
}, {
  "id": 336,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2520,
  "date": "2014/04/01"
}, {
  "id": 337,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1200,
  "date": "2014/04/10"
}, {
  "id": 338,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2060,
  "date": "2014/04/21"
}, {
  "id": 339,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7875,
  "date": "2014/04/02"
}, {
  "id": 340,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1450,
  "date": "2014/04/07"
}, {
  "id": 341,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2640,
  "date": "2014/04/22"
}, {
  "id": 342,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1960,
  "date": "2014/04/16"
}, {
  "id": 343,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2250,
  "date": "2014/04/23"
}, {
  "id": 344,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 4500,
  "date": "2014/04/05"
}, {
  "id": 345,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5050,
  "date": "2014/04/11"
}, {
  "id": 346,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2940,
  "date": "2014/04/02"
}, {
  "id": 347,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2880,
  "date": "2014/04/14"
}, {
  "id": 348,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1050,
  "date": "2014/04/19"
}, {
  "id": 349,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1850,
  "date": "2014/04/02"
}, {
  "id": 350,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3160,
  "date": "2014/04/01"
}, {
  "id": 351,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 875,
  "date": "2014/04/04"
}, {
  "id": 352,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3200,
  "date": "2014/04/08"
}, {
  "id": 353,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1380,
  "date": "2014/04/21"
}, {
  "id": 354,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3060,
  "date": "2014/04/06"
}, {
  "id": 355,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 6690,
  "date": "2014/05/19"
}, {
  "id": 356,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4525,
  "date": "2014/05/15"
}, {
  "id": 357,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4665,
  "date": "2014/05/10"
}, {
  "id": 358,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 4530,
  "date": "2014/05/18"
}, {
  "id": 359,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1330,
  "date": "2014/05/08"
}, {
  "id": 360,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 1720,
  "date": "2014/05/20"
}, {
  "id": 361,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3750,
  "date": "2014/05/16"
}, {
  "id": 362,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1290,
  "date": "2014/05/10"
}, {
  "id": 363,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4925,
  "date": "2014/05/14"
}, {
  "id": 364,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4300,
  "date": "2014/05/22"
}, {
  "id": 365,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5740,
  "date": "2014/05/08"
}, {
  "id": 366,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3760,
  "date": "2014/05/18"
}, {
  "id": 367,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7920,
  "date": "2014/05/22"
}, {
  "id": 368,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1440,
  "date": "2014/05/21"
}, {
  "id": 369,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5975,
  "date": "2014/05/25"
}, {
  "id": 370,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4440,
  "date": "2014/05/05"
}, {
  "id": 371,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2310,
  "date": "2014/05/24"
}, {
  "id": 372,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2250,
  "date": "2014/05/06"
}, {
  "id": 373,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2320,
  "date": "2014/05/14"
}, {
  "id": 374,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8370,
  "date": "2014/05/06"
}, {
  "id": 375,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5190,
  "date": "2014/06/26"
}, {
  "id": 376,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 925,
  "date": "2014/06/04"
}, {
  "id": 377,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3240,
  "date": "2014/06/20"
}, {
  "id": 378,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3180,
  "date": "2014/06/23"
}, {
  "id": 379,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 780,
  "date": "2014/06/13"
}, {
  "id": 380,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4680,
  "date": "2014/06/08"
}, {
  "id": 381,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2475,
  "date": "2014/06/25"
}, {
  "id": 382,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1920,
  "date": "2014/06/20"
}, {
  "id": 383,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7500,
  "date": "2014/06/25"
}, {
  "id": 384,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5025,
  "date": "2014/06/26"
}, {
  "id": 385,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2400,
  "date": "2014/06/08"
}, {
  "id": 386,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1720,
  "date": "2014/06/09"
}, {
  "id": 387,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2880,
  "date": "2014/06/21"
}, {
  "id": 388,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 5430,
  "date": "2014/06/03"
}, {
  "id": 389,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4475,
  "date": "2014/06/19"
}, {
  "id": 390,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 1420,
  "date": "2014/06/20"
}, {
  "id": 391,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2670,
  "date": "2014/06/25"
}, {
  "id": 392,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1930,
  "date": "2014/06/02"
}, {
  "id": 393,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 580,
  "date": "2014/06/25"
}, {
  "id": 394,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1620,
  "date": "2014/06/12"
}, {
  "id": 395,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4530,
  "date": "2014/06/02"
}, {
  "id": 396,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6025,
  "date": "2014/06/23"
}, {
  "id": 397,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3540,
  "date": "2014/07/21"
}, {
  "id": 398,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3000,
  "date": "2014/07/01"
}, {
  "id": 399,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3240,
  "date": "2014/07/26"
}, {
  "id": 400,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2265,
  "date": "2014/07/22"
}, {
  "id": 401,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 400,
  "date": "2014/07/09"
}, {
  "id": 402,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 1460,
  "date": "2014/07/08"
}, {
  "id": 403,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1620,
  "date": "2014/07/18"
}, {
  "id": 404,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2400,
  "date": "2014/07/25"
}, {
  "id": 405,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 5275,
  "date": "2014/07/04"
}, {
  "id": 406,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4475,
  "date": "2014/07/03"
}, {
  "id": 407,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3980,
  "date": "2014/07/21"
}, {
  "id": 408,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5240,
  "date": "2014/07/11"
}, {
  "id": 409,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1200,
  "date": "2014/07/21"
}, {
  "id": 410,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 5700,
  "date": "2014/07/18"
}, {
  "id": 411,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5575,
  "date": "2014/07/01"
}, {
  "id": 412,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2160,
  "date": "2014/07/02"
}, {
  "id": 413,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 960,
  "date": "2014/07/09"
}, {
  "id": 414,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1280,
  "date": "2014/07/04"
}, {
  "id": 415,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1040,
  "date": "2014/07/02"
}, {
  "id": 416,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5520,
  "date": "2014/07/21"
}, {
  "id": 417,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1760,
  "date": "2014/07/25"
}, {
  "id": 418,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 4080,
  "date": "2014/07/07"
}, {
  "id": 419,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1000,
  "date": "2014/07/21"
}, {
  "id": 420,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3270,
  "date": "2014/07/12"
}, {
  "id": 421,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1770,
  "date": "2014/08/23"
}, {
  "id": 422,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2700,
  "date": "2014/08/09"
}, {
  "id": 423,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2175,
  "date": "2014/08/03"
}, {
  "id": 424,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3375,
  "date": "2014/08/11"
}, {
  "id": 425,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2040,
  "date": "2014/08/01"
}, {
  "id": 426,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3000,
  "date": "2014/08/21"
}, {
  "id": 427,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3900,
  "date": "2014/08/16"
}, {
  "id": 428,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1370,
  "date": "2014/08/20"
}, {
  "id": 429,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 5700,
  "date": "2014/08/01"
}, {
  "id": 430,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1275,
  "date": "2014/08/22"
}, {
  "id": 431,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 4060,
  "date": "2014/08/13"
}, {
  "id": 432,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2320,
  "date": "2014/08/18"
}, {
  "id": 433,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7590,
  "date": "2014/08/24"
}, {
  "id": 434,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 4560,
  "date": "2014/08/20"
}, {
  "id": 435,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 7575,
  "date": "2014/08/20"
}, {
  "id": 436,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 700,
  "date": "2014/08/25"
}, {
  "id": 437,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2400,
  "date": "2014/08/16"
}, {
  "id": 438,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1390,
  "date": "2014/08/15"
}, {
  "id": 439,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1320,
  "date": "2014/08/09"
}, {
  "id": 440,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1680,
  "date": "2014/08/09"
}, {
  "id": 441,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1500,
  "date": "2014/08/11"
}, {
  "id": 442,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 6150,
  "date": "2014/09/21"
}, {
  "id": 443,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3675,
  "date": "2014/09/02"
}, {
  "id": 444,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2250,
  "date": "2014/09/05"
}, {
  "id": 445,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3585,
  "date": "2014/09/10"
}, {
  "id": 446,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1470,
  "date": "2014/09/01"
}, {
  "id": 447,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2260,
  "date": "2014/09/02"
}, {
  "id": 448,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3765,
  "date": "2014/09/03"
}, {
  "id": 449,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1640,
  "date": "2014/09/04"
}, {
  "id": 450,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4475,
  "date": "2014/09/09"
}, {
  "id": 451,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5975,
  "date": "2014/09/04"
}, {
  "id": 452,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1100,
  "date": "2014/09/16"
}, {
  "id": 453,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1320,
  "date": "2014/09/18"
}, {
  "id": 454,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8610,
  "date": "2014/09/19"
}, {
  "id": 455,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9210,
  "date": "2014/09/09"
}, {
  "id": 456,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3700,
  "date": "2014/09/01"
}, {
  "id": 457,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3620,
  "date": "2014/09/19"
}, {
  "id": 458,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4275,
  "date": "2014/09/01"
}, {
  "id": 459,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2370,
  "date": "2014/09/03"
}, {
  "id": 460,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1870,
  "date": "2014/09/10"
}, {
  "id": 461,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2070,
  "date": "2014/09/25"
}, {
  "id": 462,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5025,
  "date": "2014/09/19"
}, {
  "id": 463,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1080,
  "date": "2014/10/15"
}, {
  "id": 464,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 1400,
  "date": "2014/10/22"
}, {
  "id": 465,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4260,
  "date": "2014/10/01"
}, {
  "id": 466,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2745,
  "date": "2014/10/01"
}, {
  "id": 467,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2920,
  "date": "2014/10/23"
}, {
  "id": 468,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3520,
  "date": "2014/10/11"
}, {
  "id": 469,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4035,
  "date": "2014/10/20"
}, {
  "id": 470,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1730,
  "date": "2014/10/05"
}, {
  "id": 471,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 975,
  "date": "2014/10/06"
}, {
  "id": 472,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5700,
  "date": "2014/10/06"
}, {
  "id": 473,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5080,
  "date": "2014/10/18"
}, {
  "id": 474,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2940,
  "date": "2014/10/24"
}, {
  "id": 475,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2670,
  "date": "2014/10/04"
}, {
  "id": 476,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1230,
  "date": "2014/10/11"
}, {
  "id": 477,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 600,
  "date": "2014/10/08"
}, {
  "id": 478,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3700,
  "date": "2014/10/08"
}, {
  "id": 479,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3375,
  "date": "2014/10/11"
}, {
  "id": 480,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1500,
  "date": "2014/10/17"
}, {
  "id": 481,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 370,
  "date": "2014/10/05"
}, {
  "id": 482,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2340,
  "date": "2014/10/16"
}, {
  "id": 483,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1080,
  "date": "2014/10/08"
}, {
  "id": 484,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 2775,
  "date": "2014/10/21"
}, {
  "id": 485,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4380,
  "date": "2014/11/09"
}, {
  "id": 486,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5500,
  "date": "2014/11/21"
}, {
  "id": 487,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1920,
  "date": "2014/11/24"
}, {
  "id": 488,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 765,
  "date": "2014/11/24"
}, {
  "id": 489,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 370,
  "date": "2014/11/18"
}, {
  "id": 490,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3500,
  "date": "2014/11/25"
}, {
  "id": 491,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 825,
  "date": "2014/11/09"
}, {
  "id": 492,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 490,
  "date": "2014/11/23"
}, {
  "id": 493,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7075,
  "date": "2014/11/20"
}, {
  "id": 494,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1350,
  "date": "2014/11/25"
}, {
  "id": 495,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1440,
  "date": "2014/11/15"
}, {
  "id": 496,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2820,
  "date": "2014/11/13"
}, {
  "id": 497,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2280,
  "date": "2014/11/12"
}, {
  "id": 498,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1110,
  "date": "2014/11/03"
}, {
  "id": 499,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 1150,
  "date": "2014/11/23"
}, {
  "id": 500,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2040,
  "date": "2014/11/20"
}, {
  "id": 501,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3090,
  "date": "2014/11/24"
}, {
  "id": 502,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1940,
  "date": "2014/11/24"
}, {
  "id": 503,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 3090,
  "date": "2014/11/16"
}, {
  "id": 504,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4900,
  "date": "2014/11/05"
}, {
  "id": 505,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3465,
  "date": "2014/11/07"
}, {
  "id": 506,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1110,
  "date": "2014/11/20"
}, {
  "id": 507,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1650,
  "date": "2014/11/02"
}, {
  "id": 508,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5280,
  "date": "2014/12/04"
}, {
  "id": 509,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3075,
  "date": "2014/12/02"
}, {
  "id": 510,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 690,
  "date": "2014/12/07"
}, {
  "id": 511,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1305,
  "date": "2014/12/15"
}, {
  "id": 512,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1970,
  "date": "2014/12/01"
}, {
  "id": 513,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3760,
  "date": "2014/12/18"
}, {
  "id": 514,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1920,
  "date": "2014/12/22"
}, {
  "id": 515,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1360,
  "date": "2014/12/12"
}, {
  "id": 516,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2525,
  "date": "2014/12/06"
}, {
  "id": 517,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5575,
  "date": "2014/12/20"
}, {
  "id": 518,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5560,
  "date": "2014/12/10"
}, {
  "id": 519,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4880,
  "date": "2014/12/13"
}, {
  "id": 520,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8850,
  "date": "2014/12/03"
}, {
  "id": 521,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 2820,
  "date": "2014/12/10"
}, {
  "id": 522,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4000,
  "date": "2014/12/12"
}, {
  "id": 523,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5820,
  "date": "2014/12/02"
}, {
  "id": 524,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1275,
  "date": "2014/12/12"
}, {
  "id": 525,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1310,
  "date": "2014/12/01"
}, {
  "id": 526,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2180,
  "date": "2014/12/26"
}, {
  "id": 527,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4470,
  "date": "2014/12/17"
}, {
  "id": 528,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2990,
  "date": "2014/12/15"
}, {
  "id": 529,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7650,
  "date": "2014/12/18"
}, {
  "id": 530,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 780,
  "date": "2014/12/02"
}, {
  "id": 531,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2970,
  "date": "2014/12/13"
}, {
  "id": 532,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1155,
  "date": "2014/12/05"
}, {
  "id": 533,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4470,
  "date": "2015/01/10"
}, {
  "id": 534,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 1125,
  "date": "2015/01/21"
}, {
  "id": 535,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 645,
  "date": "2015/01/17"
}, {
  "id": 536,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 675,
  "date": "2015/01/05"
}, {
  "id": 537,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2840,
  "date": "2015/01/05"
}, {
  "id": 538,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2660,
  "date": "2015/01/04"
}, {
  "id": 539,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4560,
  "date": "2015/01/12"
}, {
  "id": 540,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2880,
  "date": "2015/01/20"
}, {
  "id": 541,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 500,
  "date": "2015/01/02"
}, {
  "id": 542,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3925,
  "date": "2015/01/07"
}, {
  "id": 543,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5660,
  "date": "2015/01/18"
}, {
  "id": 544,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1460,
  "date": "2015/01/22"
}, {
  "id": 545,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5040,
  "date": "2015/01/10"
}, {
  "id": 546,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 4830,
  "date": "2015/01/13"
}, {
  "id": 547,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3075,
  "date": "2015/01/22"
}, {
  "id": 548,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3120,
  "date": "2015/01/14"
}, {
  "id": 549,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3525,
  "date": "2015/01/23"
}, {
  "id": 550,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1930,
  "date": "2015/01/09"
}, {
  "id": 551,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2890,
  "date": "2015/01/02"
}, {
  "id": 552,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1545,
  "date": "2015/01/17"
}, {
  "id": 553,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3630,
  "date": "2015/01/20"
}, {
  "id": 554,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 4035,
  "date": "2015/01/14"
}, {
  "id": 555,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 345,
  "date": "2015/01/06"
}, {
  "id": 556,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 7000,
  "date": "2015/01/07"
}, {
  "id": 557,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3060,
  "date": "2015/02/13"
}, {
  "id": 558,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 6425,
  "date": "2015/02/04"
}, {
  "id": 559,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 615,
  "date": "2015/02/22"
}, {
  "id": 560,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1755,
  "date": "2015/02/07"
}, {
  "id": 561,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1540,
  "date": "2015/02/21"
}, {
  "id": 562,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2820,
  "date": "2015/02/24"
}, {
  "id": 563,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4305,
  "date": "2015/02/10"
}, {
  "id": 564,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1520,
  "date": "2015/02/26"
}, {
  "id": 565,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4725,
  "date": "2015/02/18"
}, {
  "id": 566,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6750,
  "date": "2015/02/16"
}, {
  "id": 567,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5540,
  "date": "2015/02/07"
}, {
  "id": 568,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1880,
  "date": "2015/02/24"
}, {
  "id": 569,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6180,
  "date": "2015/02/26"
}, {
  "id": 570,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9300,
  "date": "2015/02/03"
}, {
  "id": 571,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3700,
  "date": "2015/02/26"
}, {
  "id": 572,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 740,
  "date": "2015/02/01"
}, {
  "id": 573,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4755,
  "date": "2015/02/23"
}, {
  "id": 574,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2570,
  "date": "2015/02/20"
}, {
  "id": 575,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2860,
  "date": "2015/02/19"
}, {
  "id": 576,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5430,
  "date": "2015/03/21"
}, {
  "id": 577,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4525,
  "date": "2015/03/21"
}, {
  "id": 578,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1515,
  "date": "2015/03/10"
}, {
  "id": 579,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 630,
  "date": "2015/03/15"
}, {
  "id": 580,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1310,
  "date": "2015/03/01"
}, {
  "id": 581,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3200,
  "date": "2015/03/17"
}, {
  "id": 582,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3945,
  "date": "2015/03/20"
}, {
  "id": 583,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2990,
  "date": "2015/03/18"
}, {
  "id": 584,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1125,
  "date": "2015/03/22"
}, {
  "id": 585,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7950,
  "date": "2015/03/17"
}, {
  "id": 586,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2960,
  "date": "2015/03/25"
}, {
  "id": 587,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 6300,
  "date": "2015/03/20"
}, {
  "id": 588,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8670,
  "date": "2015/03/07"
}, {
  "id": 589,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3930,
  "date": "2015/03/23"
}, {
  "id": 590,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 6975,
  "date": "2015/03/02"
}, {
  "id": 591,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4220,
  "date": "2015/03/17"
}, {
  "id": 592,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3090,
  "date": "2015/03/25"
}, {
  "id": 593,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2380,
  "date": "2015/03/01"
}, {
  "id": 594,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1510,
  "date": "2015/03/07"
}, {
  "id": 595,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1020,
  "date": "2015/03/19"
}, {
  "id": 596,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 6700,
  "date": "2015/03/26"
}, {
  "id": 597,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4890,
  "date": "2015/04/02"
}, {
  "id": 598,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 7225,
  "date": "2015/04/13"
}, {
  "id": 599,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 795,
  "date": "2015/04/07"
}, {
  "id": 600,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1785,
  "date": "2015/04/03"
}, {
  "id": 601,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1850,
  "date": "2015/04/03"
}, {
  "id": 602,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 5120,
  "date": "2015/04/12"
}, {
  "id": 603,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 615,
  "date": "2015/04/07"
}, {
  "id": 604,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2860,
  "date": "2015/04/05"
}, {
  "id": 605,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1525,
  "date": "2015/04/24"
}, {
  "id": 606,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7425,
  "date": "2015/04/15"
}, {
  "id": 607,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 6080,
  "date": "2015/04/13"
}, {
  "id": 608,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2940,
  "date": "2015/04/04"
}, {
  "id": 609,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5580,
  "date": "2015/04/16"
}, {
  "id": 610,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9390,
  "date": "2015/04/19"
}, {
  "id": 611,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3200,
  "date": "2015/04/26"
}, {
  "id": 612,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4380,
  "date": "2015/04/05"
}, {
  "id": 613,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4725,
  "date": "2015/04/06"
}, {
  "id": 614,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 930,
  "date": "2015/04/25"
}, {
  "id": 615,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1910,
  "date": "2015/04/05"
}, {
  "id": 616,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2725,
  "date": "2015/04/16"
}, {
  "id": 617,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4720,
  "date": "2015/04/02"
}, {
  "id": 618,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5190,
  "date": "2015/04/10"
}, {
  "id": 619,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2800,
  "date": "2015/04/26"
}, {
  "id": 620,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3780,
  "date": "2015/04/24"
}, {
  "id": 621,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2340,
  "date": "2015/04/17"
}, {
  "id": 622,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4830,
  "date": "2015/05/12"
}, {
  "id": 623,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2075,
  "date": "2015/05/23"
}, {
  "id": 624,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3420,
  "date": "2015/05/21"
}, {
  "id": 625,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1440,
  "date": "2015/05/10"
}, {
  "id": 626,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1680,
  "date": "2015/05/15"
}, {
  "id": 627,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3440,
  "date": "2015/05/16"
}, {
  "id": 628,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4695,
  "date": "2015/05/10"
}, {
  "id": 629,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2380,
  "date": "2015/05/06"
}, {
  "id": 630,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1875,
  "date": "2015/05/25"
}, {
  "id": 631,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7550,
  "date": "2015/05/14"
}, {
  "id": 632,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3340,
  "date": "2015/05/01"
}, {
  "id": 633,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1400,
  "date": "2015/05/22"
}, {
  "id": 634,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6060,
  "date": "2015/05/22"
}, {
  "id": 635,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 8370,
  "date": "2015/05/13"
}, {
  "id": 636,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3550,
  "date": "2015/05/26"
}, {
  "id": 637,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2620,
  "date": "2015/05/17"
}, {
  "id": 638,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2400,
  "date": "2015/05/21"
}, {
  "id": 639,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1740,
  "date": "2015/05/21"
}, {
  "id": 640,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 500,
  "date": "2015/05/26"
}, {
  "id": 641,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 780,
  "date": "2015/05/07"
}
];

// operations = [
//     {
//         "id": 1,
//         "type": "income",
//         "subgroup": "Affiliate Sales",
//         "group": "Total Advertising Income",
//         "amount": 1740,
//         "date": "2016/01/06"
//     }, {
//         "id": 2,
//         "group": "Total Advertising Income",
//         "type": "income",
//         "subgroup": "Commisions",
//         "amount": 850,
//         "date": "2015/04/13"
//     }, {
//         "id": 3,
//         "group": "Total Advertising Income",
//         "type": "income",
//         "subgroup": "Adsense Revenue",
//         "amount": 2235,
//         "date": "2017/08/07",
//     }
// ];

@Injectable()
export class CashflowService {

  constructor() { }

  getIncomes(): Operation[] {
      return operations.filter(
         operation => operation['type'] === 'income'
      );
  }

  getExpenses(): Operation[] {
    return operations.filter(
        operation => operation['type'] === 'expense'
    );
  }

  getOperations(): Operation[] {
    /** @temporary */
    operations = operations.map(function(operation) {
        if (operation.type === 'expense') {
            operation.amount = -operation.amount;
        }
        return operation;
    });
    return operations;
  }

}
