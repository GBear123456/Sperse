import { Injectable } from '@angular/core';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Injectable()
export class BankCodeService {

    constructor(private ls: AppLocalizationService) {}

    private bankCodeConfig = {
        [BankCodeLetter.A]: {
            name: 'action',
            definition: this.ls.l('BankCode_Action'),
            background: '#ad1d21',
            color: '#de6669'
        },
        [BankCodeLetter.B]: {
            name: 'blueprint',
            definition: this.ls.l('BankCode_Blueprint'),
            background: '#104579',
            color: '#719eca'
        },
        [BankCodeLetter.N]: {
            name: 'nurturing',
            definition: this.ls.l('BankCode_Nurturing'),
            background: '#f39e1c',
            color: '#e4c89c'
        },
        [BankCodeLetter.K]: {
            name: 'knowledge',
            definition: this.ls.l('BankCode_Knowledge'),
            background: '#186434',
            color: '#3e9c61'
        }
    };
    readonly emptyBankCode = '????';

    getColorsByLetter(bankCodeLetter: BankCodeLetter) {
        const colors = this.bankCodeConfig[bankCodeLetter];
        return colors
            ? { color: colors.color, background: colors.background }
            : null;
    }

    getBackgroundColorByLetter(bankCodeLetter: BankCodeLetter) {
        return this.bankCodeConfig[bankCodeLetter] && this.bankCodeConfig[bankCodeLetter].background;
    }

    getBankCodeDefinition(bankCodeLetter: BankCodeLetter): string {
        return this.bankCodeConfig[bankCodeLetter] && this.bankCodeConfig[bankCodeLetter].definition;
    }

}
