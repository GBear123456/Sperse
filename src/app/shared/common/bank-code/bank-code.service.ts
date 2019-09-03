import { Injectable } from '@angular/core';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';

@Injectable()
export class BankCodeService {
    private bankCodeColors = {
        [BankCodeLetter.A]: {
            background: '#ad1d21',
            color: '#de6669'
        },
        [BankCodeLetter.B]: {
            background: '#104579',
            color: '#719eca'
        },
        [BankCodeLetter.N]: {
            background: '#f39e1c',
            color: '#e4c89c'
        },
        [BankCodeLetter.K]: {
            background: '#186434',
            color: '#3e9c61'
        }
    };

    getColorsByLetter(bankCodeLetter: BankCodeLetter) {
        return this.bankCodeColors[bankCodeLetter];
    }
}
