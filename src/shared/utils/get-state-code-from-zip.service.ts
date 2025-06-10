import { Injectable } from '@angular/core';

@Injectable()
export class GetStateCodeFromZipService {
    constructor() {
    }

    getStateCode(zipCode) {
        // Ensure param is a string to prevent unpredictable parsing results
        if (typeof zipCode !== 'string') {
            return;
        }
        // Ensure you don't parse codes that start with 0 as octal values
        const zip = parseInt(zipCode.substring(0, 5), 10);
        let stateCode;
        // Code blocks alphabetized by state
        if (!(zip >= 35000 && zip <= 36999)) {
            if (zip >= 99500 && zip <= 99999) {
                stateCode = 'AK';
            } else if (zip >= 85000 && zip <= 86999) {
                stateCode = 'AZ';
            } else if (zip >= 71600 && zip <= 72999) {
                stateCode = 'AR';
            } else if (zip >= 90000 && zip <= 96699) {
                stateCode = 'CA';
            } else if (zip >= 80000 && zip <= 81999) {
                stateCode = 'CO';
            } else if (zip >= 6000 && zip <= 6999) {
                stateCode = 'CT';
            } else if (zip >= 19700 && zip <= 19999) {
                stateCode = 'DE';
            } else if (zip >= 32000 && zip <= 34999) {
                stateCode = 'FL';
            } else if (zip >= 30000 && zip <= 31999) {
                stateCode = 'GA';
            } else if (zip >= 96700 && zip <= 96999) {
                stateCode = 'HI';
            } else if (zip >= 83200 && zip <= 83999) {
                stateCode = 'ID';
            } else if (zip >= 60000 && zip <= 62999) {
                stateCode = 'IL';
            } else if (zip >= 46000 && zip <= 47999) {
                stateCode = 'IN';
            } else if (zip >= 50000 && zip <= 52999) {
                stateCode = 'IA';
            } else if (zip >= 66000 && zip <= 67999) {
                stateCode = 'KS';
            } else if (zip >= 40000 && zip <= 42999) {
                stateCode = 'KY';
            } else if (zip >= 70000 && zip <= 71599) {
                stateCode = 'LA';
            } else if (zip >= 3900 && zip <= 4999) {
                stateCode = 'ME';
            } else if (zip >= 20600 && zip <= 21999) {
                stateCode = 'MD';
            } else if (zip >= 1000 && zip <= 2799) {
                stateCode = 'MA';
            } else if (zip >= 48000 && zip <= 49999) {
                stateCode = 'MI';
            } else if (zip >= 55000 && zip <= 56999) {
                stateCode = 'MN';
            } else if (zip >= 38600 && zip <= 39999) {
                stateCode = 'MS';
            } else if (zip >= 63000 && zip <= 65999) {
                stateCode = 'MO';
            } else if (zip >= 59000 && zip <= 59999) {
                stateCode = 'MT';
            } else if (zip >= 27000 && zip <= 28999) {
                stateCode = 'NC';
            } else if (zip >= 58000 && zip <= 58999) {
                stateCode = 'ND';
            } else if (zip >= 68000 && zip <= 69999) {
                stateCode = 'NE';
            } else if (zip >= 88900 && zip <= 89999) {
                stateCode = 'NV';
            } else if (zip >= 3000 && zip <= 3899) {
                stateCode = 'NH';
            } else if (zip >= 7000 && zip <= 8999) {
                stateCode = 'NJ';
            } else if (zip >= 87000 && zip <= 88499) {
                stateCode = 'NM';
            } else if (zip >= 10000 && zip <= 14999) {
                stateCode = 'NY';
            } else if (zip >= 43000 && zip <= 45999) {
                stateCode = 'OH';
            } else if (zip >= 73000 && zip <= 74999) {
                stateCode = 'OK';
            } else if (zip >= 97000 && zip <= 97999) {
                stateCode = 'OR';
            } else if (zip >= 15000 && zip <= 19699) {
                stateCode = 'PA';
            } else if (zip >= 300 && zip <= 999) {
                stateCode = 'PR';
            } else if (zip >= 2800 && zip <= 2999) {
                stateCode = 'RI';
            } else if (zip >= 29000 && zip <= 29999) {
                stateCode = 'SC';
            } else if (zip >= 57000 && zip <= 57999) {
                stateCode = 'SD';
            } else if (zip >= 37000 && zip <= 38599) {
                stateCode = 'TN';
            } else if ((zip >= 75000 && zip <= 79999) || (zip >= 88500 && zip <= 88599)) {
                stateCode = 'TX';
            } else if (zip >= 84000 && zip <= 84999) {
                stateCode = 'UT';
            } else if (zip >= 5000 && zip <= 5999) {
                stateCode = 'VT';
            } else if (zip >= 22000 && zip <= 24699) {
                stateCode = 'VA';
            } else if (zip >= 20000 && zip <= 20599) {
                stateCode = 'DC';
            } else if (zip >= 98000 && zip <= 99499) {
                stateCode = 'WA';
            } else if (zip >= 24700 && zip <= 26999) {
                stateCode = 'WV';
            } else if (zip >= 53000 && zip <= 54999) {
                stateCode = 'WI';
            } else if (zip >= 82000 && zip <= 83199) {
                stateCode = 'WY';
            } else {
                stateCode = 'AL';
            }
        } else {
            stateCode = 'AL';
        }
        return stateCode;
    }
}
