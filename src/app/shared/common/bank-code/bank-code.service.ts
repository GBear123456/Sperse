import { Injectable } from '@angular/core';

@Injectable()
export class BankCodeService {
    bankCodeColors = {
        A: {
            background: '#ad1d21',
            color: '#de6669'
        },
        B: {
            background: '#104579',
            color: '#719eca'
        },
        N: {
            background: '#f39e1c',
            color: '#e4c89c'
        },
        K: {
            background: '#186434',
            color: '#3e9c61'
        }
    };

    getColorsByLetter(bankCodeLetter: 'A' | 'B' | 'N' | 'K') {
        return this.bankCodeColors[bankCodeLetter];
    }
}
