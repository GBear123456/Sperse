/** Core imports */
import { Injectable } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

/** Third party imports */
import { Observable } from 'rxjs';
import { map, publishReplay, refCount, startWith } from 'rxjs/operators';
import * as moment from 'moment';
import buildQuery from 'odata-query';

/** Application imports */
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeGroup } from '@root/bank-code/products/bank-pass/bank-code-group.interface';
import { ContactGroup } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { BankCodeTime } from '@app/shared/common/bank-code/bank-code-time.enum';
import { GoalType } from '@app/shared/common/bank-code/goal-type.interface';

@Injectable()
export class BankCodeService {
    bankCodeBadges: number[] = [ 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000 ];
    bankCodeClientsCount$: Observable<string> = this.getClientsBankCodesTotalCount().pipe(
        startWith(0),
        map((count: string) => this.decimalPipe.transform(count))
    );
    bankCodeLevel$: Observable<number> = this.bankCodeClientsCount$.pipe(
        map((currentBankCodeClientsCount: string) => this.bankCodeBadges.findIndex((bankCodeBadgeCount: number) => {
            return +currentBankCodeClientsCount <= bankCodeBadgeCount;
        })),
        publishReplay(),
        refCount()
    );
    goalTypes: GoalType[] = [
        {
            name: 'daily',
            text: this.ls.l('Daily'),
            number: 3,
            currentNumber$: this.getBankCodesNumber(BankCodeTime.Daily),
            innerColor: '#91bfdd',
            outerColor: '#004a81'
        },
        {
            name: 'weekly',
            text: this.ls.l('Weekly'),
            number: 20,
            currentNumber$: this.getBankCodesNumber(BankCodeTime.Weekly),
            innerColor: '#ce767f',
            outerColor: '#ac1f22'
        },
        {
            name: 'monthly',
            text: this.ls.l('Monthly'),
            number: 90,
            currentNumber$: this.getBankCodesNumber(BankCodeTime.Monthly),
            innerColor: '#ecd68a',
            outerColor: '#f09e1e'
        },
        {
            name: 'quarterly',
            text: this.ls.l('Quarterly'),
            number: 250,
            currentNumber$: this.getBankCodesNumber(BankCodeTime.Quarterly),
            innerColor: '#87c796',
            outerColor: '#1b6634'
        },
        {
            name: 'annual',
            text: this.ls.l('Annual'),
            number: 1000,
            currentNumber$: this.getBankCodesNumber(BankCodeTime.Annual),
            innerColor: '#c8c0e1',
            outerColor: '#004a81'
        },
        {
            name: 'lifetime',
            text: this.ls.l('Lifetime'),
            number: 25000,
            currentNumber$: this.bankCodeClientsCount$,
            innerColor: '#ddbcdb',
            outerColor: '#b142ab'
        }
    ];
    constructor(
        private decimalPipe: DecimalPipe,
        private ls: AppLocalizationService,
        private httpClient: HttpClient
    ) {}

    bankCodeConfig = {
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
    reportsLink = 'https://www.codebreakertech.com/reports';
    partnerCode = location.href.indexOf('successfactory.com') >= 0 ? 'SF' : 'CB';

    getBankCodeReportLink(
        languageCode: string,
        bankCode: string,
        reportsFolder: 'Sales' | 'Prospects' = 'Prospects',
        reportType: 'sales' | 'profile' = 'profile',
        resolution = ''
    ) {
        return this.reportsLink + '/' + this.partnerCode + '/' + languageCode + '/' + reportsFolder + '/' + bankCode + '-' + reportType.toUpperCase() + '-REPORT' + resolution + '.pdf';
    }

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

    private getClientsBankCodesData(filters = []): Observable<any> {
        let params = {
            group: '[{"selector":"BankCode","isExpanded":false}]',
            contactGroupId: ContactGroup.Client
        };
        filters.push({ 'BankCode': { 'ne': null }});
        let filter = buildQuery({
            filter: filters
        });
        return this.httpClient.get(AppConsts.remoteServiceBaseUrl + '/odata/LeadSlice' + filter, {
            params: params,
            headers: new HttpHeaders({
                'Authorization': 'Bearer ' + abp.auth.getToken()
            })
        }).pipe(
            publishReplay(),
            refCount()
        );
    }

    getClientsBankCodes(filters = []): Observable<BankCodeGroup[]> {
        return this.getClientsBankCodesData(filters).pipe(
            map((result: any) => result && result.data)
        );
    }

    getClientsBankCodesTotalCount(filters = []): Observable<string> {
        return this.getClientsBankCodesData(filters).pipe(
            map((result: any) => result && result.totalCount && result.totalCount.toString())
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
            }),
            publishReplay(),
            refCount()
        );
    }

    getBankCodesNumber(time?: BankCodeTime): Observable<string> {
        let filter;
        if (time) {
            filter = this.getFilterFromTime(time);
        }
        return this.getClientsBankCodesTotalCount(filter).pipe(
            startWith(''),
            map((count: string) => this.decimalPipe.transform(count))
        );
    }

    getPercent(number$: Observable<number>, total: number): Observable<number> {
        return number$.pipe(
            map((number: number) => +(number / total * 100).toFixed())
        );
    }

    getPercentString(number: Observable<number>, total: number): Observable<string> {
        return this.getPercent(number, total).pipe(
            startWith(''),
            map((percent: number) => percent + '%')
        );
    }

    private getFilterFromTime(time: BankCodeTime) {
        const currentDate = moment();
        return [
            {
                LeadDate: {
                    ge: currentDate.startOf(time.toString()).toDate(),
                    le: currentDate.endOf(time.toString()).toDate()
                }
            }
        ];
    }

}
