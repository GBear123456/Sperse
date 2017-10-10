import { Injectable } from '@angular/core';
import { Operation } from '../models/operation';

let operations: Operation[] = [
{
  "id": 1,
  "type": "income",
  "subgroup": "Affiliate Sales",
  "group": "Total Advertising Income",
  "amount": 1740,
  "date": "2013/01/06",
  "name": null
}, {
  "id": 2,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 850,
  "date": "2013/01/13",
  "name": null
}, {
  "id": 3,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2235,
  "date": "2013/01/07",
  "name": null,
}, {
  "id": 4,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1965,
  "date": "2013/01/03",
  "name": null
}, {
  "id": 5,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 880,
  "date": "2013/01/10",
  "name": null
}, {
  "id": 6,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 5260,
  "date": "2013/01/17",
  "name": null
}, {
  "id": 7,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2790,
  "date": "2013/01/21",
  "name": null
}, {
  "id": 8,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 3140,
  "date": "2013/01/01",
  "name": null
}, {
  "id": 9,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 6175,
  "date": "2013/01/24",
  "name": null
}, {
  "id": 10,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4575,
  "date": "2013/01/11",
  "name": null
}, {
  "id": 11,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3680,
  "date": "2013/01/12",
  "name": null
}, {
  "id": 12,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2260,
  "date": "2013/01/01",
  "name": null
}, {
  "id": 13,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2910,
  "date": "2013/01/26",
  "name": null
}, {
  "id": 14,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 8400,
  "date": "2013/01/05",
  "name": null
}, {
  "id": 15,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 1325,
  "date": "2013/01/14",
  "name": null
}, {
  "id": 16,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3920,
  "date": "2013/01/05",
  "name": null
}, {
  "id": 17,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2220,
  "date": "2013/01/15",
  "name": null
}, {
  "id": 18,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 940,
  "date": "2013/01/01",
  "name": null
}, {
  "id": 19,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1630,
  "date": "2013/01/10",
  "name": null
}, {
  "id": 20,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2910,
  "date": "2013/01/23",
  "name": null
}, {
  "id": 21,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2600,
  "date": "2013/01/14",
  "name": null
}, {
  "id": 22,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 4340,
  "date": "2013/01/26",
  "name": null
}, {
  "id": 23,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 6650,
  "date": "2013/01/24",
  "name": null
}, {
  "id": 24,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 490,
  "date": "2013/01/22",
  "name": null
}, {
  "id": 25,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3390,
  "date": "2013/01/25",
  "name": null
}, {
  "id": 26,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5160,
  "date": "2013/02/20",
  "name": null
}, {
  "id": 27,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5750,
  "date": "2013/02/12",
  "name": null
}, {
  "id": 28,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2805,
  "date": "2013/02/13",
  "name": null
}, {
  "id": 29,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2505,
  "date": "2013/02/09",
  "name": null
}, {
  "id": 30,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 930,
  "date": "2013/02/04",
  "name": null
}, {
  "id": 31,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 1240,
  "date": "2013/02/03",
  "name": null
}, {
  "id": 32,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 315,
  "date": "2013/02/04",
  "name": null
}, {
  "id": 33,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2870,
  "date": "2013/02/18",
  "name": null
}, {
  "id": 34,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 5150,
  "date": "2013/02/18",
  "name": null
}, {
  "id": 35,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2725,
  "date": "2013/02/20",
  "name": null
}, {
  "id": 36,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2840,
  "date": "2013/02/04",
  "name": null
}, {
  "id": 37,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5840,
  "date": "2013/02/13",
  "name": null
}, {
  "id": 38,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6750,
  "date": "2013/02/11",
  "name": null
}, {
  "id": 39,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1200,
  "date": "2013/02/03",
  "name": null
}, {
  "id": 40,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4550,
  "date": "2013/02/08",
  "name": null
}, {
  "id": 41,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 6040,
  "date": "2013/02/17",
  "name": null
}, {
  "id": 42,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2205,
  "date": "2013/02/08",
  "name": null
}, {
  "id": 43,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 990,
  "date": "2013/02/20",
  "name": null
}, {
  "id": 44,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 700,
  "date": "2013/02/11",
  "name": null
}, {
  "id": 45,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2325,
  "date": "2013/02/15",
  "name": null
}, {
  "id": 46,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 930,
  "date": "2013/02/21",
  "name": null
}, {
  "id": 47,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1560,
  "date": "2013/02/04",
  "name": null
}, {
  "id": 48,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1740,
  "date": "2013/03/04",
  "name": null
}, {
  "id": 49,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3575,
  "date": "2013/03/20",
  "name": null
}, {
  "id": 50,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4500,
  "date": "2013/03/04",
  "name": null
}, {
  "id": 51,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1605,
  "date": "2013/03/17",
  "name": null
}, {
  "id": 52,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 800,
  "date": "2013/03/21",
  "name": null
}, {
  "id": 53,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 640,
  "date": "2013/03/08",
  "name": null
}, {
  "id": 54,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 735,
  "date": "2013/03/19",
  "name": null
}, {
  "id": 55,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2520,
  "date": "2013/03/20",
  "name": null
}, {
  "id": 56,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 6675,
  "date": "2013/03/18",
  "name": null
}, {
  "id": 57,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3625,
  "date": "2013/03/25",
  "name": null
}, {
  "id": 58,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1200,
  "date": "2013/03/07",
  "name": null
}, {
  "id": 59,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2000,
  "date": "2013/03/07",
  "name": null
}, {
  "id": 60,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1410,
  "date": "2013/03/10",
  "name": null
}, {
  "id": 61,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 2700,
  "date": "2013/03/19",
  "name": null
}, {
  "id": 62,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5950,
  "date": "2013/03/24",
  "name": null
}, {
  "id": 63,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5120,
  "date": "2013/03/08",
  "name": null
}, {
  "id": 64,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1980,
  "date": "2013/03/17",
  "name": null
}, {
  "id": 65,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1110,
  "date": "2013/03/08",
  "name": null
}, {
  "id": 66,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 980,
  "date": "2013/03/21",
  "name": null
}, {
  "id": 67,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5460,
  "date": "2013/03/19",
  "name": null
}, {
  "id": 68,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3800,
  "date": "2013/03/12",
  "name": null
}, {
  "id": 69,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2610,
  "date": "2013/03/04",
  "name": null
}, {
  "id": 70,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3080,
  "date": "2013/03/22",
  "name": null
}, {
  "id": 71,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 2010,
  "date": "2013/03/23",
  "name": null
}, {
  "id": 72,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1200,
  "date": "2013/03/04",
  "name": null
}, {
  "id": 73,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7680,
  "date": "2013/04/15",
  "name": null
}, {
  "id": 74,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 1325,
  "date": "2013/04/07",
  "name": null
}, {
  "id": 75,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2835,
  "date": "2013/04/10",
  "name": null
}, {
  "id": 76,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3660,
  "date": "2013/04/10",
  "name": null
}, {
  "id": 77,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 390,
  "date": "2013/04/12",
  "name": null
}, {
  "id": 78,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4420,
  "date": "2013/04/08",
  "name": null
}, {
  "id": 79,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1755,
  "date": "2013/04/13",
  "name": null
}, {
  "id": 80,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2580,
  "date": "2013/04/15",
  "name": null
}, {
  "id": 81,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 850,
  "date": "2013/04/01",
  "name": null
}, {
  "id": 82,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2825,
  "date": "2013/04/10",
  "name": null
}, {
  "id": 83,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 540,
  "date": "2013/04/06",
  "name": null
}, {
  "id": 84,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1520,
  "date": "2013/04/08",
  "name": null
}, {
  "id": 85,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8760,
  "date": "2013/04/26",
  "name": null
}, {
  "id": 86,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1110,
  "date": "2013/04/16",
  "name": null
}, {
  "id": 87,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 6850,
  "date": "2013/04/19",
  "name": null
}, {
  "id": 88,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 1940,
  "date": "2013/04/23",
  "name": null
}, {
  "id": 89,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1980,
  "date": "2013/04/21",
  "name": null
}, {
  "id": 90,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 3090,
  "date": "2013/04/03",
  "name": null
}, {
  "id": 91,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1640,
  "date": "2013/04/24",
  "name": null
}, {
  "id": 92,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3585,
  "date": "2013/04/01",
  "name": null
}, {
  "id": 93,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1770,
  "date": "2013/04/01",
  "name": null
}, {
  "id": 94,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4005,
  "date": "2013/04/04",
  "name": null
}, {
  "id": 95,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2870,
  "date": "2013/04/02",
  "name": null
}, {
  "id": 96,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 960,
  "date": "2013/04/20",
  "name": null
}, {
  "id": 97,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 8640,
  "date": "2013/05/14",
  "name": null
}, {
  "id": 98,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5450,
  "date": "2013/05/24",
  "name": null
}, {
  "id": 99,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2535,
  "date": "2013/05/07",
  "name": null
}, {
  "id": 100,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1155,
  "date": "2013/05/20",
  "name": null
}, {
  "id": 101,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3140,
  "date": "2013/05/18",
  "name": null
}, {
  "id": 102,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2260,
  "date": "2013/05/19",
  "name": null
}, {
  "id": 103,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1215,
  "date": "2013/05/23",
  "name": null
}, {
  "id": 104,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1210,
  "date": "2013/05/08",
  "name": null
}, {
  "id": 105,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 875,
  "date": "2013/05/25",
  "name": null
}, {
  "id": 106,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5400,
  "date": "2013/05/03",
  "name": null
}, {
  "id": 107,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5940,
  "date": "2013/05/25",
  "name": null
}, {
  "id": 108,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4700,
  "date": "2013/05/03",
  "name": null
}, {
  "id": 109,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5520,
  "date": "2013/05/12",
  "name": null
}, {
  "id": 110,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9210,
  "date": "2013/05/22",
  "name": null
}, {
  "id": 111,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 7950,
  "date": "2013/05/12",
  "name": null
}, {
  "id": 112,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3740,
  "date": "2013/05/24",
  "name": null
}, {
  "id": 113,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 990,
  "date": "2013/05/02",
  "name": null
}, {
  "id": 114,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 3190,
  "date": "2013/05/03",
  "name": null
}, {
  "id": 115,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2430,
  "date": "2013/05/11",
  "name": null
}, {
  "id": 116,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7380,
  "date": "2013/06/15",
  "name": null
}, {
  "id": 117,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4475,
  "date": "2013/06/08",
  "name": null
}, {
  "id": 118,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1290,
  "date": "2013/06/10",
  "name": null
}, {
  "id": 119,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2250,
  "date": "2013/06/10",
  "name": null
}, {
  "id": 120,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 350,
  "date": "2013/06/22",
  "name": null
}, {
  "id": 121,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 5480,
  "date": "2013/06/24",
  "name": null
}, {
  "id": 122,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2355,
  "date": "2013/06/10",
  "name": null
}, {
  "id": 123,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1960,
  "date": "2013/06/23",
  "name": null
}, {
  "id": 124,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4125,
  "date": "2013/06/06",
  "name": null
}, {
  "id": 125,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7925,
  "date": "2013/06/12",
  "name": null
}, {
  "id": 126,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1120,
  "date": "2013/06/22",
  "name": null
}, {
  "id": 127,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5100,
  "date": "2013/06/01",
  "name": null
}, {
  "id": 128,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1500,
  "date": "2013/06/25",
  "name": null
}, {
  "id": 129,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 5130,
  "date": "2013/06/10",
  "name": null
}, {
  "id": 130,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 2475,
  "date": "2013/06/10",
  "name": null
}, {
  "id": 131,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2100,
  "date": "2013/06/06",
  "name": null
}, {
  "id": 132,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3570,
  "date": "2013/06/10",
  "name": null
}, {
  "id": 133,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 550,
  "date": "2013/06/02",
  "name": null
}, {
  "id": 134,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2850,
  "date": "2013/06/26",
  "name": null
}, {
  "id": 135,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4280,
  "date": "2013/06/19",
  "name": null
}, {
  "id": 136,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 1460,
  "date": "2013/06/17",
  "name": null
}, {
  "id": 137,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 960,
  "date": "2013/06/17",
  "name": null
}, {
  "id": 138,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1520,
  "date": "2013/06/03",
  "name": null
}, {
  "id": 139,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 6750,
  "date": "2013/06/21",
  "name": null
}, {
  "id": 140,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7260,
  "date": "2013/07/14",
  "name": null
}, {
  "id": 141,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2450,
  "date": "2013/07/11",
  "name": null
}, {
  "id": 142,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3540,
  "date": "2013/07/02",
  "name": null
}, {
  "id": 143,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1950,
  "date": "2013/07/03",
  "name": null
}, {
  "id": 144,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 360,
  "date": "2013/07/07",
  "name": null
}, {
  "id": 145,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4500,
  "date": "2013/07/03",
  "name": null
}, {
  "id": 146,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4575,
  "date": "2013/07/21",
  "name": null
}, {
  "id": 147,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2310,
  "date": "2013/07/18",
  "name": null
}, {
  "id": 148,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7500,
  "date": "2013/07/04",
  "name": null
}, {
  "id": 149,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3575,
  "date": "2013/07/23",
  "name": null
}, {
  "id": 150,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 760,
  "date": "2013/07/01",
  "name": null
}, {
  "id": 151,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2400,
  "date": "2013/07/11",
  "name": null
}, {
  "id": 152,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3330,
  "date": "2013/07/04",
  "name": null
}, {
  "id": 153,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3480,
  "date": "2013/07/23",
  "name": null
}, {
  "id": 154,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4875,
  "date": "2013/07/11",
  "name": null
}, {
  "id": 155,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4980,
  "date": "2013/07/19",
  "name": null
}, {
  "id": 156,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2580,
  "date": "2013/07/04",
  "name": null
}, {
  "id": 157,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2650,
  "date": "2013/07/16",
  "name": null
}, {
  "id": 158,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1190,
  "date": "2013/07/02",
  "name": null
}, {
  "id": 159,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 960,
  "date": "2013/07/26",
  "name": null
}, {
  "id": 160,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3600,
  "date": "2013/08/08",
  "name": null
}, {
  "id": 161,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2250,
  "date": "2013/08/01",
  "name": null
}, {
  "id": 162,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1275,
  "date": "2013/08/02",
  "name": null
}, {
  "id": 163,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3885,
  "date": "2013/08/14",
  "name": null
}, {
  "id": 164,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1900,
  "date": "2013/08/05",
  "name": null
}, {
  "id": 165,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2300,
  "date": "2013/08/09",
  "name": null
}, {
  "id": 166,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2895,
  "date": "2013/08/15",
  "name": null
}, {
  "id": 167,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 350,
  "date": "2013/08/20",
  "name": null
}, {
  "id": 168,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4200,
  "date": "2013/08/22",
  "name": null
}, {
  "id": 169,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7175,
  "date": "2013/08/14",
  "name": null
}, {
  "id": 170,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 4420,
  "date": "2013/08/24",
  "name": null
}, {
  "id": 171,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5200,
  "date": "2013/08/21",
  "name": null
}, {
  "id": 172,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7920,
  "date": "2013/08/17",
  "name": null
}, {
  "id": 173,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 6990,
  "date": "2013/08/22",
  "name": null
}, {
  "id": 174,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 2125,
  "date": "2013/08/05",
  "name": null
}, {
  "id": 175,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2220,
  "date": "2013/08/16",
  "name": null
}, {
  "id": 176,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1575,
  "date": "2013/08/23",
  "name": null
}, {
  "id": 177,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1880,
  "date": "2013/08/12",
  "name": null
}, {
  "id": 178,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 710,
  "date": "2013/08/25",
  "name": null
}, {
  "id": 179,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 390,
  "date": "2013/08/20",
  "name": null
}, {
  "id": 180,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4635,
  "date": "2013/08/04",
  "name": null
}, {
  "id": 181,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4350,
  "date": "2013/08/19",
  "name": null
}, {
  "id": 182,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 6020,
  "date": "2013/08/02",
  "name": null
}, {
  "id": 183,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3660,
  "date": "2013/08/19",
  "name": null
}, {
  "id": 184,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4525,
  "date": "2013/08/24",
  "name": null
}, {
  "id": 185,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4410,
  "date": "2013/09/12",
  "name": null
}, {
  "id": 186,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 1725,
  "date": "2013/09/07",
  "name": null
}, {
  "id": 187,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2715,
  "date": "2013/09/14",
  "name": null
}, {
  "id": 188,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2820,
  "date": "2013/09/08",
  "name": null
}, {
  "id": 189,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2310,
  "date": "2013/09/12",
  "name": null
}, {
  "id": 190,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 780,
  "date": "2013/09/08",
  "name": null
}, {
  "id": 191,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2370,
  "date": "2013/09/19",
  "name": null
}, {
  "id": 192,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1410,
  "date": "2013/09/09",
  "name": null
}, {
  "id": 193,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1825,
  "date": "2013/09/23",
  "name": null
}, {
  "id": 194,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4075,
  "date": "2013/09/06",
  "name": null
}, {
  "id": 195,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1020,
  "date": "2013/09/04",
  "name": null
}, {
  "id": 196,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4320,
  "date": "2013/09/25",
  "name": null
}, {
  "id": 197,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7530,
  "date": "2013/09/13",
  "name": null
}, {
  "id": 198,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 2820,
  "date": "2013/09/08",
  "name": null
}, {
  "id": 199,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3050,
  "date": "2013/09/04",
  "name": null
}, {
  "id": 200,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5080,
  "date": "2013/09/25",
  "name": null
}, {
  "id": 201,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1125,
  "date": "2013/09/13",
  "name": null
}, {
  "id": 202,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 850,
  "date": "2013/09/24",
  "name": null
}, {
  "id": 203,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1440,
  "date": "2013/09/19",
  "name": null
}, {
  "id": 204,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1950,
  "date": "2013/09/02",
  "name": null
}, {
  "id": 205,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 6390,
  "date": "2013/10/11",
  "name": null
}, {
  "id": 206,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4625,
  "date": "2013/10/02",
  "name": null
}, {
  "id": 207,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3510,
  "date": "2013/10/24",
  "name": null
}, {
  "id": 208,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2730,
  "date": "2013/10/15",
  "name": null
}, {
  "id": 209,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2070,
  "date": "2013/10/15",
  "name": null
}, {
  "id": 210,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2320,
  "date": "2013/10/18",
  "name": null
}, {
  "id": 211,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4260,
  "date": "2013/10/24",
  "name": null
}, {
  "id": 212,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 840,
  "date": "2013/10/18",
  "name": null
}, {
  "id": 213,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7300,
  "date": "2013/10/24",
  "name": null
}, {
  "id": 214,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5950,
  "date": "2013/10/11",
  "name": null
}, {
  "id": 215,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3220,
  "date": "2013/10/25",
  "name": null
}, {
  "id": 216,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3480,
  "date": "2013/10/08",
  "name": null
}, {
  "id": 217,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4830,
  "date": "2013/10/26",
  "name": null
}, {
  "id": 218,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 4470,
  "date": "2013/10/05",
  "name": null
}, {
  "id": 219,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3675,
  "date": "2013/10/23",
  "name": null
}, {
  "id": 220,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4260,
  "date": "2013/10/01",
  "name": null
}, {
  "id": 221,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4245,
  "date": "2013/10/26",
  "name": null
}, {
  "id": 222,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1470,
  "date": "2013/10/01",
  "name": null
}, {
  "id": 223,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1810,
  "date": "2013/10/02",
  "name": null
}, {
  "id": 224,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 600,
  "date": "2013/10/23",
  "name": null
}, {
  "id": 225,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7500,
  "date": "2013/11/03",
  "name": null
}, {
  "id": 226,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4625,
  "date": "2013/11/02",
  "name": null
}, {
  "id": 227,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2625,
  "date": "2013/11/09",
  "name": null
}, {
  "id": 228,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1440,
  "date": "2013/11/15",
  "name": null
}, {
  "id": 229,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2420,
  "date": "2013/11/15",
  "name": null
}, {
  "id": 230,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4180,
  "date": "2013/11/15",
  "name": null
}, {
  "id": 231,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3720,
  "date": "2013/11/25",
  "name": null
}, {
  "id": 232,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2730,
  "date": "2013/11/08",
  "name": null
}, {
  "id": 233,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3775,
  "date": "2013/11/17",
  "name": null
}, {
  "id": 234,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3525,
  "date": "2013/11/15",
  "name": null
}, {
  "id": 235,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5320,
  "date": "2013/11/08",
  "name": null
}, {
  "id": 236,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5340,
  "date": "2013/11/13",
  "name": null
}, {
  "id": 237,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8850,
  "date": "2013/11/01",
  "name": null
}, {
  "id": 238,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 7050,
  "date": "2013/11/14",
  "name": null
}, {
  "id": 239,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4200,
  "date": "2013/11/18",
  "name": null
}, {
  "id": 240,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4960,
  "date": "2013/11/04",
  "name": null
}, {
  "id": 241,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2280,
  "date": "2013/11/13",
  "name": null
}, {
  "id": 242,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 590,
  "date": "2013/11/11",
  "name": null
}, {
  "id": 243,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 810,
  "date": "2013/11/12",
  "name": null
}, {
  "id": 244,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2625,
  "date": "2013/11/07",
  "name": null
}, {
  "id": 245,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 8280,
  "date": "2013/12/01",
  "name": null
}, {
  "id": 246,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5650,
  "date": "2013/12/19",
  "name": null
}, {
  "id": 247,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2760,
  "date": "2013/12/14",
  "name": null
}, {
  "id": 248,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2670,
  "date": "2013/12/03",
  "name": null
}, {
  "id": 249,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2520,
  "date": "2013/12/20",
  "name": null
}, {
  "id": 250,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4080,
  "date": "2013/12/21",
  "name": null
}, {
  "id": 251,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4140,
  "date": "2013/12/22",
  "name": null
}, {
  "id": 252,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 390,
  "date": "2013/12/04",
  "name": null
}, {
  "id": 253,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1400,
  "date": "2013/12/19",
  "name": null
}, {
  "id": 254,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7275,
  "date": "2013/12/22",
  "name": null
}, {
  "id": 255,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 4100,
  "date": "2013/12/20",
  "name": null
}, {
  "id": 256,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5520,
  "date": "2013/12/25",
  "name": null
}, {
  "id": 257,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 9210,
  "date": "2013/12/24",
  "name": null
}, {
  "id": 258,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 7290,
  "date": "2013/12/05",
  "name": null
}, {
  "id": 259,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 625,
  "date": "2013/12/22",
  "name": null
}, {
  "id": 260,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4460,
  "date": "2013/12/12",
  "name": null
}, {
  "id": 261,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3825,
  "date": "2013/12/13",
  "name": null
}, {
  "id": 262,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2850,
  "date": "2013/12/17",
  "name": null
}, {
  "id": 263,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2780,
  "date": "2013/12/07",
  "name": null
}, {
  "id": 264,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 840,
  "date": "2013/12/18",
  "name": null
}, {
  "id": 265,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2970,
  "date": "2013/12/23",
  "name": null
}, {
  "id": 266,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 945,
  "date": "2013/12/06",
  "name": null
}, {
  "id": 267,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2625,
  "date": "2013/12/04",
  "name": null
}, {
  "id": 268,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 390,
  "date": "2013/12/01",
  "name": null
}, {
  "id": 269,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2250,
  "date": "2013/12/02",
  "name": null
}, {
  "id": 270,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 7710,
  "date": "2014/01/18",
  "name": null
}, {
  "id": 271,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 7975,
  "date": "2014/01/10",
  "name": null
}, {
  "id": 272,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3285,
  "date": "2014/01/13",
  "name": null
}, {
  "id": 273,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2580,
  "date": "2014/01/22",
  "name": null
}, {
  "id": 274,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2160,
  "date": "2014/01/26",
  "name": null
}, {
  "id": 275,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 1100,
  "date": "2014/01/25",
  "name": null
}, {
  "id": 276,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4425,
  "date": "2014/01/21",
  "name": null
}, {
  "id": 277,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1360,
  "date": "2014/01/22",
  "name": null
}, {
  "id": 278,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3250,
  "date": "2014/01/14",
  "name": null
}, {
  "id": 279,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5550,
  "date": "2014/01/21",
  "name": null
}, {
  "id": 280,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2860,
  "date": "2014/01/25",
  "name": null
}, {
  "id": 281,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5320,
  "date": "2014/01/08",
  "name": null
}, {
  "id": 282,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4050,
  "date": "2014/01/14",
  "name": null
}, {
  "id": 283,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3450,
  "date": "2014/01/24",
  "name": null
}, {
  "id": 284,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5425,
  "date": "2014/01/11",
  "name": null
}, {
  "id": 285,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4860,
  "date": "2014/01/12",
  "name": null
}, {
  "id": 286,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4695,
  "date": "2014/01/16",
  "name": null
}, {
  "id": 287,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 610,
  "date": "2014/01/05",
  "name": null
}, {
  "id": 288,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1580,
  "date": "2014/01/15",
  "name": null
}, {
  "id": 289,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3780,
  "date": "2014/02/18",
  "name": null
}, {
  "id": 290,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5400,
  "date": "2014/02/21",
  "name": null
}, {
  "id": 291,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 630,
  "date": "2014/02/18",
  "name": null
}, {
  "id": 292,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3960,
  "date": "2014/02/04",
  "name": null
}, {
  "id": 293,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2010,
  "date": "2014/02/25",
  "name": null
}, {
  "id": 294,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 5000,
  "date": "2014/02/01",
  "name": null
}, {
  "id": 295,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1995,
  "date": "2014/02/20",
  "name": null
}, {
  "id": 296,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 860,
  "date": "2014/02/12",
  "name": null
}, {
  "id": 297,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2150,
  "date": "2014/02/10",
  "name": null
}, {
  "id": 298,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4050,
  "date": "2014/02/06",
  "name": null
}, {
  "id": 299,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2960,
  "date": "2014/02/18",
  "name": null
}, {
  "id": 300,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1780,
  "date": "2014/02/26",
  "name": null
}, {
  "id": 301,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8700,
  "date": "2014/02/03",
  "name": null
}, {
  "id": 302,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3390,
  "date": "2014/02/03",
  "name": null
}, {
  "id": 303,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4425,
  "date": "2014/02/15",
  "name": null
}, {
  "id": 304,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 1180,
  "date": "2014/02/23",
  "name": null
}, {
  "id": 305,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 360,
  "date": "2014/02/08",
  "name": null
}, {
  "id": 306,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2310,
  "date": "2014/02/13",
  "name": null
}, {
  "id": 307,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1770,
  "date": "2014/02/20",
  "name": null
}, {
  "id": 308,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3060,
  "date": "2014/02/26",
  "name": null
}, {
  "id": 309,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1750,
  "date": "2014/02/12",
  "name": null
}, {
  "id": 310,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2280,
  "date": "2014/03/09",
  "name": null
}, {
  "id": 311,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 7600,
  "date": "2014/03/25",
  "name": null
}, {
  "id": 312,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1035,
  "date": "2014/03/23",
  "name": null
}, {
  "id": 313,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1245,
  "date": "2014/03/01",
  "name": null
}, {
  "id": 314,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2860,
  "date": "2014/03/19",
  "name": null
}, {
  "id": 315,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 440,
  "date": "2014/03/19",
  "name": null
}, {
  "id": 316,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4665,
  "date": "2014/03/02",
  "name": null
}, {
  "id": 317,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2270,
  "date": "2014/03/15",
  "name": null
}, {
  "id": 318,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 5000,
  "date": "2014/03/09",
  "name": null
}, {
  "id": 319,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5100,
  "date": "2014/03/23",
  "name": null
}, {
  "id": 320,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2120,
  "date": "2014/03/11",
  "name": null
}, {
  "id": 321,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5140,
  "date": "2014/03/05",
  "name": null
}, {
  "id": 322,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6210,
  "date": "2014/03/19",
  "name": null
}, {
  "id": 323,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9510,
  "date": "2014/03/19",
  "name": null
}, {
  "id": 324,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 7600,
  "date": "2014/03/21",
  "name": null
}, {
  "id": 325,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5420,
  "date": "2014/03/15",
  "name": null
}, {
  "id": 326,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1980,
  "date": "2014/03/05",
  "name": null
}, {
  "id": 327,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1820,
  "date": "2014/03/07",
  "name": null
}, {
  "id": 328,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1670,
  "date": "2014/03/21",
  "name": null
}, {
  "id": 329,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4800,
  "date": "2014/03/08",
  "name": null
}, {
  "id": 330,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2925,
  "date": "2014/03/03",
  "name": null
}, {
  "id": 331,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2940,
  "date": "2014/04/11",
  "name": null
}, {
  "id": 332,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3525,
  "date": "2014/04/13",
  "name": null
}, {
  "id": 333,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2475,
  "date": "2014/04/22",
  "name": null
}, {
  "id": 334,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3315,
  "date": "2014/04/08",
  "name": null
}, {
  "id": 335,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3140,
  "date": "2014/04/07",
  "name": null
}, {
  "id": 336,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2520,
  "date": "2014/04/01",
  "name": null
}, {
  "id": 337,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1200,
  "date": "2014/04/10",
  "name": null
}, {
  "id": 338,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2060,
  "date": "2014/04/21",
  "name": null
}, {
  "id": 339,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7875,
  "date": "2014/04/02",
  "name": null
}, {
  "id": 340,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1450,
  "date": "2014/04/07",
  "name": null
}, {
  "id": 341,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2640,
  "date": "2014/04/22",
  "name": null
}, {
  "id": 342,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1960,
  "date": "2014/04/16",
  "name": null
}, {
  "id": 343,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2250,
  "date": "2014/04/23",
  "name": null
}, {
  "id": 344,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 4500,
  "date": "2014/04/05",
  "name": null
}, {
  "id": 345,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5050,
  "date": "2014/04/11",
  "name": null
}, {
  "id": 346,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2940,
  "date": "2014/04/02",
  "name": null
}, {
  "id": 347,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2880,
  "date": "2014/04/14",
  "name": null
}, {
  "id": 348,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1050,
  "date": "2014/04/19",
  "name": null
}, {
  "id": 349,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1850,
  "date": "2014/04/02",
  "name": null
}, {
  "id": 350,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3160,
  "date": "2014/04/01",
  "name": null
}, {
  "id": 351,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 875,
  "date": "2014/04/04",
  "name": null
}, {
  "id": 352,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3200,
  "date": "2014/04/08",
  "name": null
}, {
  "id": 353,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1380,
  "date": "2014/04/21",
  "name": null
}, {
  "id": 354,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3060,
  "date": "2014/04/06",
  "name": null
}, {
  "id": 355,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 6690,
  "date": "2014/05/19",
  "name": null
}, {
  "id": 356,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4525,
  "date": "2014/05/15",
  "name": null
}, {
  "id": 357,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4665,
  "date": "2014/05/10",
  "name": null
}, {
  "id": 358,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 4530,
  "date": "2014/05/18",
  "name": null
}, {
  "id": 359,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1330,
  "date": "2014/05/08",
  "name": null
}, {
  "id": 360,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 1720,
  "date": "2014/05/20",
  "name": null
}, {
  "id": 361,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3750,
  "date": "2014/05/16",
  "name": null
}, {
  "id": 362,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1290,
  "date": "2014/05/10",
  "name": null
}, {
  "id": 363,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4925,
  "date": "2014/05/14",
  "name": null
}, {
  "id": 364,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4300,
  "date": "2014/05/22",
  "name": null
}, {
  "id": 365,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5740,
  "date": "2014/05/08",
  "name": null
}, {
  "id": 366,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3760,
  "date": "2014/05/18",
  "name": null
}, {
  "id": 367,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7920,
  "date": "2014/05/22",
  "name": null
}, {
  "id": 368,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1440,
  "date": "2014/05/21",
  "name": null
}, {
  "id": 369,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5975,
  "date": "2014/05/25",
  "name": null
}, {
  "id": 370,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4440,
  "date": "2014/05/05",
  "name": null
}, {
  "id": 371,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2310,
  "date": "2014/05/24",
  "name": null
}, {
  "id": 372,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2250,
  "date": "2014/05/06",
  "name": null
}, {
  "id": 373,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2320,
  "date": "2014/05/14",
  "name": null
}, {
  "id": 374,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8370,
  "date": "2014/05/06",
  "name": null
}, {
  "id": 375,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5190,
  "date": "2014/06/26",
  "name": null
}, {
  "id": 376,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 925,
  "date": "2014/06/04",
  "name": null
}, {
  "id": 377,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3240,
  "date": "2014/06/20",
  "name": null
}, {
  "id": 378,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3180,
  "date": "2014/06/23",
  "name": null
}, {
  "id": 379,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 780,
  "date": "2014/06/13",
  "name": null
}, {
  "id": 380,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 4680,
  "date": "2014/06/08",
  "name": null
}, {
  "id": 381,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2475,
  "date": "2014/06/25",
  "name": null
}, {
  "id": 382,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1920,
  "date": "2014/06/20",
  "name": null
}, {
  "id": 383,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7500,
  "date": "2014/06/25",
  "name": null
}, {
  "id": 384,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5025,
  "date": "2014/06/26",
  "name": null
}, {
  "id": 385,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2400,
  "date": "2014/06/08",
  "name": null
}, {
  "id": 386,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1720,
  "date": "2014/06/09",
  "name": null
}, {
  "id": 387,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2880,
  "date": "2014/06/21",
  "name": null
}, {
  "id": 388,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 5430,
  "date": "2014/06/03",
  "name": null
}, {
  "id": 389,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4475,
  "date": "2014/06/19",
  "name": null
}, {
  "id": 390,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 1420,
  "date": "2014/06/20",
  "name": null
}, {
  "id": 391,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2670,
  "date": "2014/06/25",
  "name": null
}, {
  "id": 392,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1930,
  "date": "2014/06/02",
  "name": null
}, {
  "id": 393,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 580,
  "date": "2014/06/25",
  "name": null
}, {
  "id": 394,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1620,
  "date": "2014/06/12",
  "name": null
}, {
  "id": 395,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4530,
  "date": "2014/06/02",
  "name": null
}, {
  "id": 396,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6025,
  "date": "2014/06/23",
  "name": null
}, {
  "id": 397,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3540,
  "date": "2014/07/21",
  "name": null
}, {
  "id": 398,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3000,
  "date": "2014/07/01",
  "name": null
}, {
  "id": 399,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3240,
  "date": "2014/07/26",
  "name": null
}, {
  "id": 400,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2265,
  "date": "2014/07/22",
  "name": null
}, {
  "id": 401,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 400,
  "date": "2014/07/09",
  "name": null
}, {
  "id": 402,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 1460,
  "date": "2014/07/08",
  "name": null
}, {
  "id": 403,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1620,
  "date": "2014/07/18",
  "name": null
}, {
  "id": 404,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2400,
  "date": "2014/07/25",
  "name": null
}, {
  "id": 405,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 5275,
  "date": "2014/07/04",
  "name": null
}, {
  "id": 406,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 4475,
  "date": "2014/07/03",
  "name": null
}, {
  "id": 407,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3980,
  "date": "2014/07/21",
  "name": null
}, {
  "id": 408,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5240,
  "date": "2014/07/11",
  "name": null
}, {
  "id": 409,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1200,
  "date": "2014/07/21",
  "name": null
}, {
  "id": 410,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 5700,
  "date": "2014/07/18",
  "name": null
}, {
  "id": 411,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 5575,
  "date": "2014/07/01",
  "name": null
}, {
  "id": 412,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2160,
  "date": "2014/07/02",
  "name": null
}, {
  "id": 413,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 960,
  "date": "2014/07/09",
  "name": null
}, {
  "id": 414,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1280,
  "date": "2014/07/04",
  "name": null
}, {
  "id": 415,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1040,
  "date": "2014/07/02",
  "name": null
}, {
  "id": 416,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5520,
  "date": "2014/07/21",
  "name": null
}, {
  "id": 417,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1760,
  "date": "2014/07/25",
  "name": null
}, {
  "id": 418,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 4080,
  "date": "2014/07/07",
  "name": null
}, {
  "id": 419,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1000,
  "date": "2014/07/21",
  "name": null
}, {
  "id": 420,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3270,
  "date": "2014/07/12",
  "name": null
}, {
  "id": 421,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1770,
  "date": "2014/08/23",
  "name": null
}, {
  "id": 422,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2700,
  "date": "2014/08/09",
  "name": null
}, {
  "id": 423,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2175,
  "date": "2014/08/03",
  "name": null
}, {
  "id": 424,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3375,
  "date": "2014/08/11",
  "name": null
}, {
  "id": 425,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2040,
  "date": "2014/08/01",
  "name": null
}, {
  "id": 426,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3000,
  "date": "2014/08/21",
  "name": null
}, {
  "id": 427,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3900,
  "date": "2014/08/16",
  "name": null
}, {
  "id": 428,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1370,
  "date": "2014/08/20",
  "name": null
}, {
  "id": 429,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 5700,
  "date": "2014/08/01",
  "name": null
}, {
  "id": 430,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1275,
  "date": "2014/08/22",
  "name": null
}, {
  "id": 431,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 4060,
  "date": "2014/08/13",
  "name": null
}, {
  "id": 432,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2320,
  "date": "2014/08/18",
  "name": null
}, {
  "id": 433,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7590,
  "date": "2014/08/24",
  "name": null
}, {
  "id": 434,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 4560,
  "date": "2014/08/20",
  "name": null
}, {
  "id": 435,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 7575,
  "date": "2014/08/20",
  "name": null
}, {
  "id": 436,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 700,
  "date": "2014/08/25",
  "name": null
}, {
  "id": 437,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2400,
  "date": "2014/08/16",
  "name": null
}, {
  "id": 438,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1390,
  "date": "2014/08/15",
  "name": null
}, {
  "id": 439,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1320,
  "date": "2014/08/09",
  "name": null
}, {
  "id": 440,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1680,
  "date": "2014/08/09",
  "name": null
}, {
  "id": 441,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1500,
  "date": "2014/08/11",
  "name": null
}, {
  "id": 442,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 6150,
  "date": "2014/09/21",
  "name": null
}, {
  "id": 443,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3675,
  "date": "2014/09/02",
  "name": null
}, {
  "id": 444,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2250,
  "date": "2014/09/05",
  "name": null
}, {
  "id": 445,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 3585,
  "date": "2014/09/10",
  "name": null
}, {
  "id": 446,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1470,
  "date": "2014/09/01",
  "name": null
}, {
  "id": 447,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2260,
  "date": "2014/09/02",
  "name": null
}, {
  "id": 448,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3765,
  "date": "2014/09/03",
  "name": null
}, {
  "id": 449,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1640,
  "date": "2014/09/04",
  "name": null
}, {
  "id": 450,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4475,
  "date": "2014/09/09",
  "name": null
}, {
  "id": 451,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5975,
  "date": "2014/09/04",
  "name": null
}, {
  "id": 452,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1100,
  "date": "2014/09/16",
  "name": null
}, {
  "id": 453,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1320,
  "date": "2014/09/18",
  "name": null
}, {
  "id": 454,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8610,
  "date": "2014/09/19",
  "name": null
}, {
  "id": 455,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9210,
  "date": "2014/09/09",
  "name": null
}, {
  "id": 456,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3700,
  "date": "2014/09/01",
  "name": null
}, {
  "id": 457,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3620,
  "date": "2014/09/19",
  "name": null
}, {
  "id": 458,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4275,
  "date": "2014/09/01",
  "name": null
}, {
  "id": 459,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2370,
  "date": "2014/09/03",
  "name": null
}, {
  "id": 460,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1870,
  "date": "2014/09/10",
  "name": null
}, {
  "id": 461,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2070,
  "date": "2014/09/25",
  "name": null
}, {
  "id": 462,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5025,
  "date": "2014/09/19",
  "name": null
}, {
  "id": 463,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1080,
  "date": "2014/10/15",
  "name": null
}, {
  "id": 464,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 1400,
  "date": "2014/10/22",
  "name": null
}, {
  "id": 465,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4260,
  "date": "2014/10/01",
  "name": null
}, {
  "id": 466,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 2745,
  "date": "2014/10/01",
  "name": null
}, {
  "id": 467,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2920,
  "date": "2014/10/23",
  "name": null
}, {
  "id": 468,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3520,
  "date": "2014/10/11",
  "name": null
}, {
  "id": 469,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4035,
  "date": "2014/10/20",
  "name": null
}, {
  "id": 470,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1730,
  "date": "2014/10/05",
  "name": null
}, {
  "id": 471,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 975,
  "date": "2014/10/06",
  "name": null
}, {
  "id": 472,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5700,
  "date": "2014/10/06",
  "name": null
}, {
  "id": 473,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5080,
  "date": "2014/10/18",
  "name": null
}, {
  "id": 474,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2940,
  "date": "2014/10/24",
  "name": null
}, {
  "id": 475,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2670,
  "date": "2014/10/04",
  "name": null
}, {
  "id": 476,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1230,
  "date": "2014/10/11",
  "name": null
}, {
  "id": 477,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 600,
  "date": "2014/10/08",
  "name": null
}, {
  "id": 478,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3700,
  "date": "2014/10/08",
  "name": null
}, {
  "id": 479,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3375,
  "date": "2014/10/11",
  "name": null
}, {
  "id": 480,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1500,
  "date": "2014/10/17",
  "name": null
}, {
  "id": 481,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 370,
  "date": "2014/10/05",
  "name": null
}, {
  "id": 482,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2340,
  "date": "2014/10/16",
  "name": null
}, {
  "id": 483,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1080,
  "date": "2014/10/08",
  "name": null
}, {
  "id": 484,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 2775,
  "date": "2014/10/21",
  "name": null
}, {
  "id": 485,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4380,
  "date": "2014/11/09",
  "name": null
}, {
  "id": 486,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 5500,
  "date": "2014/11/21",
  "name": null
}, {
  "id": 487,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1920,
  "date": "2014/11/24",
  "name": null
}, {
  "id": 488,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 765,
  "date": "2014/11/24",
  "name": null
}, {
  "id": 489,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 370,
  "date": "2014/11/18",
  "name": null
}, {
  "id": 490,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3500,
  "date": "2014/11/25",
  "name": null
}, {
  "id": 491,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 825,
  "date": "2014/11/09",
  "name": null
}, {
  "id": 492,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 490,
  "date": "2014/11/23",
  "name": null
}, {
  "id": 493,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7075,
  "date": "2014/11/20",
  "name": null
}, {
  "id": 494,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 1350,
  "date": "2014/11/25",
  "name": null
}, {
  "id": 495,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 1440,
  "date": "2014/11/15",
  "name": null
}, {
  "id": 496,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2820,
  "date": "2014/11/13",
  "name": null
}, {
  "id": 497,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 2280,
  "date": "2014/11/12",
  "name": null
}, {
  "id": 498,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1110,
  "date": "2014/11/03",
  "name": null
}, {
  "id": 499,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 1150,
  "date": "2014/11/23",
  "name": null
}, {
  "id": 500,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2040,
  "date": "2014/11/20",
  "name": null
}, {
  "id": 501,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3090,
  "date": "2014/11/24",
  "name": null
}, {
  "id": 502,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1940,
  "date": "2014/11/24",
  "name": null
}, {
  "id": 503,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 3090,
  "date": "2014/11/16",
  "name": null
}, {
  "id": 504,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4900,
  "date": "2014/11/05",
  "name": null
}, {
  "id": 505,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3465,
  "date": "2014/11/07",
  "name": null
}, {
  "id": 506,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1110,
  "date": "2014/11/20",
  "name": null
}, {
  "id": 507,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1650,
  "date": "2014/11/02",
  "name": null
}, {
  "id": 508,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5280,
  "date": "2014/12/04",
  "name": null
}, {
  "id": 509,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 3075,
  "date": "2014/12/02",
  "name": null
}, {
  "id": 510,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 690,
  "date": "2014/12/07",
  "name": null
}, {
  "id": 511,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1305,
  "date": "2014/12/15",
  "name": null
}, {
  "id": 512,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1970,
  "date": "2014/12/01",
  "name": null
}, {
  "id": 513,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3760,
  "date": "2014/12/18",
  "name": null
}, {
  "id": 514,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1920,
  "date": "2014/12/22",
  "name": null
}, {
  "id": 515,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1360,
  "date": "2014/12/12",
  "name": null
}, {
  "id": 516,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2525,
  "date": "2014/12/06",
  "name": null
}, {
  "id": 517,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5575,
  "date": "2014/12/20",
  "name": null
}, {
  "id": 518,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5560,
  "date": "2014/12/10",
  "name": null
}, {
  "id": 519,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4880,
  "date": "2014/12/13",
  "name": null
}, {
  "id": 520,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8850,
  "date": "2014/12/03",
  "name": null
}, {
  "id": 521,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 2820,
  "date": "2014/12/10",
  "name": null
}, {
  "id": 522,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 4000,
  "date": "2014/12/12",
  "name": null
}, {
  "id": 523,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 5820,
  "date": "2014/12/02",
  "name": null
}, {
  "id": 524,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 1275,
  "date": "2014/12/12",
  "name": null
}, {
  "id": 525,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1310,
  "date": "2014/12/01",
  "name": null
}, {
  "id": 526,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2180,
  "date": "2014/12/26",
  "name": null
}, {
  "id": 527,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4470,
  "date": "2014/12/17",
  "name": null
}, {
  "id": 528,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2990,
  "date": "2014/12/15",
  "name": null
}, {
  "id": 529,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 7650,
  "date": "2014/12/18",
  "name": null
}, {
  "id": 530,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 780,
  "date": "2014/12/02",
  "name": null
}, {
  "id": 531,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2970,
  "date": "2014/12/13",
  "name": null
}, {
  "id": 532,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1155,
  "date": "2014/12/05",
  "name": null
}, {
  "id": 533,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4470,
  "date": "2015/01/10",
  "name": null
}, {
  "id": 534,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 1125,
  "date": "2015/01/21",
  "name": null
}, {
  "id": 535,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 645,
  "date": "2015/01/17",
  "name": null
}, {
  "id": 536,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 675,
  "date": "2015/01/05",
  "name": null
}, {
  "id": 537,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2840,
  "date": "2015/01/05",
  "name": null
}, {
  "id": 538,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2660,
  "date": "2015/01/04",
  "name": null
}, {
  "id": 539,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4560,
  "date": "2015/01/12",
  "name": null
}, {
  "id": 540,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2880,
  "date": "2015/01/20",
  "name": null
}, {
  "id": 541,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 500,
  "date": "2015/01/02",
  "name": null
}, {
  "id": 542,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 3925,
  "date": "2015/01/07",
  "name": null
}, {
  "id": 543,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5660,
  "date": "2015/01/18",
  "name": null
}, {
  "id": 544,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1460,
  "date": "2015/01/22",
  "name": null
}, {
  "id": 545,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5040,
  "date": "2015/01/10",
  "name": null
}, {
  "id": 546,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 4830,
  "date": "2015/01/13",
  "name": null
}, {
  "id": 547,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3075,
  "date": "2015/01/22",
  "name": null
}, {
  "id": 548,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 3120,
  "date": "2015/01/14",
  "name": null
}, {
  "id": 549,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3525,
  "date": "2015/01/23",
  "name": null
}, {
  "id": 550,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1930,
  "date": "2015/01/09",
  "name": null
}, {
  "id": 551,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2890,
  "date": "2015/01/02",
  "name": null
}, {
  "id": 552,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1545,
  "date": "2015/01/17",
  "name": null
}, {
  "id": 553,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3630,
  "date": "2015/01/20",
  "name": null
}, {
  "id": 554,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 4035,
  "date": "2015/01/14",
  "name": null
}, {
  "id": 555,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 345,
  "date": "2015/01/06",
  "name": null
}, {
  "id": 556,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 7000,
  "date": "2015/01/07",
  "name": null
}, {
  "id": 557,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 3060,
  "date": "2015/02/13",
  "name": null
}, {
  "id": 558,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 6425,
  "date": "2015/02/04",
  "name": null
}, {
  "id": 559,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 615,
  "date": "2015/02/22",
  "name": null
}, {
  "id": 560,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1755,
  "date": "2015/02/07",
  "name": null
}, {
  "id": 561,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1540,
  "date": "2015/02/21",
  "name": null
}, {
  "id": 562,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 2820,
  "date": "2015/02/24",
  "name": null
}, {
  "id": 563,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4305,
  "date": "2015/02/10",
  "name": null
}, {
  "id": 564,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 1520,
  "date": "2015/02/26",
  "name": null
}, {
  "id": 565,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 4725,
  "date": "2015/02/18",
  "name": null
}, {
  "id": 566,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6750,
  "date": "2015/02/16",
  "name": null
}, {
  "id": 567,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 5540,
  "date": "2015/02/07",
  "name": null
}, {
  "id": 568,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1880,
  "date": "2015/02/24",
  "name": null
}, {
  "id": 569,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6180,
  "date": "2015/02/26",
  "name": null
}, {
  "id": 570,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9300,
  "date": "2015/02/03",
  "name": null
}, {
  "id": 571,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3700,
  "date": "2015/02/26",
  "name": null
}, {
  "id": 572,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 740,
  "date": "2015/02/01",
  "name": null
}, {
  "id": 573,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4755,
  "date": "2015/02/23",
  "name": null
}, {
  "id": 574,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2570,
  "date": "2015/02/20",
  "name": null
}, {
  "id": 575,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 2860,
  "date": "2015/02/19",
  "name": null
}, {
  "id": 576,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 5430,
  "date": "2015/03/21",
  "name": null
}, {
  "id": 577,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 4525,
  "date": "2015/03/21",
  "name": null
}, {
  "id": 578,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1515,
  "date": "2015/03/10",
  "name": null
}, {
  "id": 579,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 630,
  "date": "2015/03/15",
  "name": null
}, {
  "id": 580,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1310,
  "date": "2015/03/01",
  "name": null
}, {
  "id": 581,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3200,
  "date": "2015/03/17",
  "name": null
}, {
  "id": 582,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 3945,
  "date": "2015/03/20",
  "name": null
}, {
  "id": 583,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2990,
  "date": "2015/03/18",
  "name": null
}, {
  "id": 584,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1125,
  "date": "2015/03/22",
  "name": null
}, {
  "id": 585,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7950,
  "date": "2015/03/17",
  "name": null
}, {
  "id": 586,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 2960,
  "date": "2015/03/25",
  "name": null
}, {
  "id": 587,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 6300,
  "date": "2015/03/20",
  "name": null
}, {
  "id": 588,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 8670,
  "date": "2015/03/07",
  "name": null
}, {
  "id": 589,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3930,
  "date": "2015/03/23",
  "name": null
}, {
  "id": 590,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 6975,
  "date": "2015/03/02",
  "name": null
}, {
  "id": 591,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4220,
  "date": "2015/03/17",
  "name": null
}, {
  "id": 592,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 3090,
  "date": "2015/03/25",
  "name": null
}, {
  "id": 593,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2380,
  "date": "2015/03/01",
  "name": null
}, {
  "id": 594,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1510,
  "date": "2015/03/07",
  "name": null
}, {
  "id": 595,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 1020,
  "date": "2015/03/19",
  "name": null
}, {
  "id": 596,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 6700,
  "date": "2015/03/26",
  "name": null
}, {
  "id": 597,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4890,
  "date": "2015/04/02",
  "name": null
}, {
  "id": 598,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 7225,
  "date": "2015/04/13",
  "name": null
}, {
  "id": 599,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 795,
  "date": "2015/04/07",
  "name": null
}, {
  "id": 600,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1785,
  "date": "2015/04/03",
  "name": null
}, {
  "id": 601,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1850,
  "date": "2015/04/03",
  "name": null
}, {
  "id": 602,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 5120,
  "date": "2015/04/12",
  "name": null
}, {
  "id": 603,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 615,
  "date": "2015/04/07",
  "name": null
}, {
  "id": 604,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2860,
  "date": "2015/04/05",
  "name": null
}, {
  "id": 605,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1525,
  "date": "2015/04/24",
  "name": null
}, {
  "id": 606,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7425,
  "date": "2015/04/15",
  "name": null
}, {
  "id": 607,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 6080,
  "date": "2015/04/13",
  "name": null
}, {
  "id": 608,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 2940,
  "date": "2015/04/04",
  "name": null
}, {
  "id": 609,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5580,
  "date": "2015/04/16",
  "name": null
}, {
  "id": 610,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 9390,
  "date": "2015/04/19",
  "name": null
}, {
  "id": 611,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3200,
  "date": "2015/04/26",
  "name": null
}, {
  "id": 612,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4380,
  "date": "2015/04/05",
  "name": null
}, {
  "id": 613,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 4725,
  "date": "2015/04/06",
  "name": null
}, {
  "id": 614,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 930,
  "date": "2015/04/25",
  "name": null
}, {
  "id": 615,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 1910,
  "date": "2015/04/05",
  "name": null
}, {
  "id": 616,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 2725,
  "date": "2015/04/16",
  "name": null
}, {
  "id": 617,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 4720,
  "date": "2015/04/02",
  "name": null
}, {
  "id": 618,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 5190,
  "date": "2015/04/10",
  "name": null
}, {
  "id": 619,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 2800,
  "date": "2015/04/26",
  "name": null
}, {
  "id": 620,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 3780,
  "date": "2015/04/24",
  "name": null
}, {
  "id": 621,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 2340,
  "date": "2015/04/17",
  "name": null
}, {
  "id": 622,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 4830,
  "date": "2015/05/12",
  "name": null
}, {
  "id": 623,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Commisions",
  "amount": 2075,
  "date": "2015/05/23",
  "name": null
}, {
  "id": 624,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 3420,
  "date": "2015/05/21",
  "name": null
}, {
  "id": 625,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Vancouver",
  "amount": 1440,
  "date": "2015/05/10",
  "name": null
}, {
  "id": 626,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 1680,
  "date": "2015/05/15",
  "name": null
}, {
  "id": 627,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Reserve and/or escrow",
  "amount": 3440,
  "date": "2015/05/16",
  "name": null
}, {
  "id": 628,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 4695,
  "date": "2015/05/10",
  "name": null
}, {
  "id": 629,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Online Sales",
  "amount": 2380,
  "date": "2015/05/06",
  "name": null
}, {
  "id": 630,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Adsense Revenue",
  "amount": 1875,
  "date": "2015/05/25",
  "name": null
}, {
  "id": 631,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 7550,
  "date": "2015/05/14",
  "name": null
}, {
  "id": 632,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Referral Income",
  "amount": 3340,
  "date": "2015/05/01",
  "name": null
}, {
  "id": 633,
  "group": "Total Advertising Income",
  "type": "income",
  "subgroup": "Affiliate Sales",
  "amount": 1400,
  "date": "2015/05/22",
  "name": null
}, {
  "id": 634,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Loan Principal Payment",
  "amount": 6060,
  "date": "2015/05/22",
  "name": null
}, {
  "id": 635,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "B2B Sales",
  "amount": 8370,
  "date": "2015/05/13",
  "name": null
}, {
  "id": 636,
  "group": "Total Product Sales",
  "type": "income",
  "subgroup": "Licensing Revenue",
  "amount": 3550,
  "date": "2015/05/26",
  "name": null
}, {
  "id": 637,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Sydney",
  "amount": 2620,
  "date": "2015/05/17",
  "name": null
}, {
  "id": 638,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Other Startup Costs",
  "amount": 2400,
  "date": "2015/05/21",
  "name": null
}, {
  "id": 639,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Loan or Other Cash Infusion",
  "amount": 1740,
  "date": "2015/05/21",
  "name": null
}, {
  "id": 640,
  "group": "Total Cash from Loans",
  "type": "income",
  "subgroup": "Interest or Other Income",
  "amount": 500,
  "date": "2015/05/26",
  "name": null
}, {
  "id": 641,
  "group": "Total Cash Paid for Expenses",
  "type": "expense",
  "subgroup": "Capital Purchase (specify)",
  "amount": 780,
  "date": "2015/05/07",
  "name": null
}
];

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
