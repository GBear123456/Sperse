/** Core imports */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

/** Third party imports */
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeGroup } from '@root/bank-code/products/bank-pass/bank-code-group.interface';
import { ContactGroup } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class BankCodeService {
    bankCodeBadges: number[] = [ 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000 ];
    bankCodeClientsCount$: Observable<number> = this.getClientsBankCodes().pipe(
        map((bankCodeGroups: BankCodeGroup[]) => bankCodeGroups.reduce((sum, group) => sum + group.count, 0))
    );
    bankCodeLevel$: Observable<number> = this.bankCodeClientsCount$.pipe(
        map((currentBankCodeClientsCount: number) => this.bankCodeBadges.findIndex((bankCodeBadgeCount: number) => {
            return currentBankCodeClientsCount <= bankCodeBadgeCount;
        }))
    );
    constructor(
        private ls: AppLocalizationService,
        private httpClient: HttpClient
    ) {}

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

    getClientsBankCodes(): Observable<BankCodeGroup[]> {
        let params = {
            group: '[{"selector":"BankCode","isExpanded":false}]',
            contactGroupId: ContactGroup.Client
        };
        return this.httpClient.get(AppConsts.remoteServiceBaseUrl + '/odata/LeadSlice', {
            params: params,
            headers: new HttpHeaders({
                'Authorization': 'Bearer ' + abp.auth.getToken()
            })
        }).pipe(
            map((result: any) => {
                let items = [];
                if (result && result.data) {
                    items = result.data.filter(bankCodeGroup => !!bankCodeGroup.key);
                }
                return items;
            }),
            publishReplay(),
            refCount()
        );
    }

    getAvailableBankCodes(): Observable<{[bankCode: string]: number}> {
        return this.getClientsBankCodes().pipe(
            map((bankCodeGroups: BankCodeGroup[]) => {
                let availableBankCodes = {};
                bankCodeGroups.forEach((bankCodeGroup: BankCodeGroup) => {
                    availableBankCodes[bankCodeGroup.key] = bankCodeGroup.count;
                });
                return availableBankCodes;
            })
        );
    }

}
