/** Core imports */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

/** Third party imports */
import { Observable } from 'rxjs';
import { map, publishReplay, refCount, startWith, withLatestFrom } from 'rxjs/operators';
import * as moment from 'moment';
import buildQuery from 'odata-query';
import values from 'lodash/values';

/** Application imports */
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ContactGroup } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { BankCodeTime } from '@app/shared/common/bank-code/bank-code-time.enum';
import { GoalType } from '@app/shared/common/bank-code/goal-type.interface';
import { FiltersService } from '@shared/filters/filters.service';
import { BankCodeCount } from './bank-code-count.interface';
import { BankCodeGroup } from "@root/bank-code/products/bank-pass/bank-code-group.interface";
import { AppSessionService } from "@shared/common/session/app-session.service";

@Injectable()
export class BankCodeService {
    bankCodeBadges: number[] = [ 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000 ];
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

    /** ContactSlice request for current contact */
    contactClientsBankCodeData$: Observable<any> = this.getClientsBankCodesData(this.getSourceFilters());
    /** ContactSlice request for all contacts */
    allContactClientsBankCodeData$: Observable<any> = this.getClientsBankCodesData();

    /** Number of clients that current contact cracked */
    contactClientsBankCodesTotalCount$: Observable<number> = this.getClientsBankCodesTotalCount(this.contactClientsBankCodeData$);
    /** Number of all cracked bank codes */
    allClientsBankCodesTotalCount$: Observable<number> = this.getClientsBankCodesTotalCount(this.allContactClientsBankCodeData$);

    contactBankCodeClientsCount$: Observable<number> = this.contactClientsBankCodesTotalCount$.pipe(startWith(0));
    allBankCodeClientsCount$: Observable<number> = this.allClientsBankCodesTotalCount$.pipe(startWith(0));

    contactClientsBankCodes$: Observable<BankCodeGroup[]> = this.contactClientsBankCodeData$.pipe(
        map((result: any) => result && result.data)
    );
    allClientsBankCodes$: Observable<BankCodeGroup[]> = this.allContactClientsBankCodeData$.pipe(
        map((result: any) => result && result.data)
    );

    contactAvailableBankCodes$: Observable<BankCodeCount> = this.getAvailableBankCodes(this.contactClientsBankCodes$);
    allAvailableBankCodes$: Observable<BankCodeCount> = this.getAvailableBankCodes(this.allClientsBankCodes$);

    contactBankCodeGroupsCounts$ = this.getBankCodeGroupsCounts$(this.contactAvailableBankCodes$);
    allContactBankCodeGroupsCounts$ = this.getBankCodeGroupsCounts$(this.allAvailableBankCodes$);

    contactBankCodesGroupsCountsWithPercents$ = this.getBankCodesGroupsCountsWithPercents(this.contactBankCodeGroupsCounts$, this.contactBankCodeClientsCount$);
    allBankCodesGroupsCountsWithPercents$ = this.getBankCodesGroupsCountsWithPercents(this.allContactBankCodeGroupsCounts$, this.allBankCodeClientsCount$);

    contactBankCodeTotalCount$: Observable<string> = this.contactBankCodeClientsCount$.pipe(
        map((count) => count.toString())
    );
    allBankCodeTotalCount$: Observable<string> = this.allBankCodeClientsCount$.pipe(
        map((count) => count.toString())
    );

    goalTypes: GoalType[] = [
        {
            name: 'daily',
            text: this.ls.l('Daily'),
            number: 3,
            currentNumber$: this.getContactBankCodesNumber(BankCodeTime.Daily),
            innerColor: '#91bfdd',
            outerColor: '#004a81'
        },
        {
            name: 'weekly',
            text: this.ls.l('Weekly'),
            number: 20,
            currentNumber$: this.getContactBankCodesNumber(BankCodeTime.Weekly),
            innerColor: '#ce767f',
            outerColor: '#ac1f22'
        },
        {
            name: 'monthly',
            text: this.ls.l('Monthly'),
            number: 90,
            currentNumber$: this.getContactBankCodesNumber(BankCodeTime.Monthly),
            innerColor: '#ecd68a',
            outerColor: '#f09e1e'
        },
        {
            name: 'quarterly',
            text: this.ls.l('Quarterly'),
            number: 250,
            currentNumber$: this.getContactBankCodesNumber(BankCodeTime.Quarterly),
            innerColor: '#87c796',
            outerColor: '#1b6634'
        },
        {
            name: 'annual',
            text: this.ls.l('Annual'),
            number: 1000,
            currentNumber$: this.getContactBankCodesNumber(BankCodeTime.Annual),
            innerColor: '#c8c0e1',
            outerColor: '#004a81'
        },
        {
            name: 'lifetime',
            text: this.ls.l('Lifetime'),
            number: 25000,
            currentNumber$: this.contactBankCodeClientsCount$,
            innerColor: '#ddbcdb',
            outerColor: '#b142ab'
        }
    ];
    bankCodeLevel$: Observable<number> = this.contactBankCodeClientsCount$.pipe(
        map((currentBankCodeClientsCount: number) => {
            let level: number;
            if (currentBankCodeClientsCount >= this.bankCodeBadges[this.bankCodeBadges.length - 1]) {
                level = 10;
            } else {
                level = this.bankCodeBadges.findIndex((bankCodeBadgeCount: number) => {
                    return currentBankCodeClientsCount < bankCodeBadgeCount;
                });
            }
            return level;
        }),
        publishReplay(),
        refCount()
    );

    constructor(
        private ls: AppLocalizationService,
        private httpClient: HttpClient,
        private appSessionService: AppSessionService
    ) {}

    getSourceFilters() {
        return this.appSessionService.user
            ? [{ 'SourceContactId ': { 'eq': this.appSessionService.user.contactId }}]
            : [];
    }

    private static getFilterFromTime(time: BankCodeTime) {
        const currentDate = moment();
        return [
            {
                ContactDate: {
                    ge: currentDate.startOf(time.toString()).toDate(),
                    le: currentDate.endOf(time.toString()).toDate()
                }
            }
        ];
    }

    getBankCodeReportLink(
        languageCode: string,
        bankCode: string,
        reportsFolder: 'Sales' | 'Prospects' = 'Prospects',
        reportType: 'sales' | 'profile' = 'profile',
        resolution = ''
    ) {
        return this.reportsLink + '/' + this.partnerCode + '/' + languageCode + '/' + reportsFolder + '/' + bankCode + '-' + reportType.toUpperCase() + '-REPORT' + resolution + '.pdf';
    }

    private getAvailableBankCodes(clientsBankCodesGroups$: Observable<BankCodeGroup[]>): Observable<BankCodeCount> {
        return clientsBankCodesGroups$.pipe(
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

    private getBankCodeGroupsCounts$(availableBankCodes$: Observable<BankCodeCount>): Observable<number[]> {
        return availableBankCodes$.pipe(
            map((bankCodes: BankCodeCount) => {
                let bankCodeGroups = {
                    'B': 0,
                    'A': 0,
                    'N': 0,
                    'K': 0
                };
                for (let bankCode in bankCodes) {
                    bankCodeGroups[bankCode[0]] += bankCodes[bankCode];
                }
                return values(bankCodeGroups);
            })
        );
    }

    private getBankCodesGroupsCountsWithPercents(
        bankCodeGroupsCounts$: Observable<number[]>,
        bankCodeClienstCount$: Observable<number>
    ): Observable<{ percent: number, count: number }[]> {
        return bankCodeGroupsCounts$.pipe(
            withLatestFrom(bankCodeClienstCount$),
            map(([bankCodeGroupsCounts, total]: [number[], number]) => {
                return bankCodeGroupsCounts.map((groupCount: number) => ({
                    percent: total ? groupCount / total * 100 : 0,
                    count: groupCount
                }));
            })
        );
    }

    getColorsByLetter(bankCodeLetter: BankCodeLetter): { color: string, background: string } {
        const colors = this.bankCodeConfig[bankCodeLetter];
        return colors
            ? { color: colors.color, background: colors.background }
            : null;
    }

    getBackgroundColorByLetter(bankCodeLetter: BankCodeLetter): string {
        return this.bankCodeConfig[bankCodeLetter] && this.bankCodeConfig[bankCodeLetter].background;
    }

    getBankCodeDefinition(bankCodeLetter: BankCodeLetter): string {
        return this.bankCodeConfig[bankCodeLetter] && this.bankCodeConfig[bankCodeLetter].definition;
    }

    private getClientsBankCodesData(filters = []): Observable<any> {
        let params = {
            group: '[{"selector":"BankCode","isExpanded":false}]',
            contactGroupId: ContactGroup.Client,
            isActive: 'true'
        };
        filters.push(
            { 'BankCode': { 'ne': null }},
            { 'BankCode': { 'ne': '' }},
            FiltersService.filterByParentId()
        );
        let filter = buildQuery({
            filter: filters
        });
        return this.httpClient.get(AppConsts.remoteServiceBaseUrl + '/odata/ContactSlice' + filter, {
            params: params,
            headers: new HttpHeaders({
                'Authorization': 'Bearer ' + abp.auth.getToken()
            })
        }).pipe(
            publishReplay(),
            refCount()
        );
    }

    private getClientsBankCodesTotalCount(data$: Observable<any>): Observable<number> {
        return data$.pipe(
            map((result: any) => result && result.totalCount)
        );
    }

    private getContactBankCodesNumber(time?: BankCodeTime): Observable<number> {
        return this.getClientsBankCodesData(
            [
                ...BankCodeService.getFilterFromTime(time),
                ...this.getSourceFilters()
            ]
        ).pipe(
            map((result: any) => result && result.totalCount),
            startWith(0)
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

    getBankCodeColor(bankCode): string {
        return bankCode ? this.getBackgroundColorByLetter(bankCode[0] as BankCodeLetter) : '#000';
    }

}
