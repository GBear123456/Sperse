import { TestBed, inject } from '@angular/core/testing';
import * as moment from 'moment-timezone';
import { CashflowService } from './cashflow.service';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import {
    AccountingTypeDto, CashflowServiceProxy, ContactServiceProxy,
    GetCategoryTreeOutput, InstanceServiceProxy, PermissionServiceProxy, PersonContactServiceProxy,
    ReportSectionDto, SectionGroup, SessionServiceProxy, TenantSubscriptionServiceProxy,
    TransactionStatsDto, TypeDto
} from '@shared/service-proxies/service-proxies';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { CacheService } from '@node_modules/ng2-cache-service';
import { CFOService } from '@shared/cfo/cfo.service';
import { AppService } from '@app/app.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LayoutService } from '@app/shared/layout/layout.service';

describe('CashflowService', () => {
    beforeEach(() => {
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
        TestBed.configureTestingModule({
            providers: [
                CashflowService,
                UserPreferencesService,
                AppSessionService,
                SessionServiceProxy,
                HttpClient,
                HttpHandler,
                AbpMultiTenancyService,
                CacheService,
                CFOService,
                AppService,
                FeatureCheckerService,
                AppPermissionService,
                PermissionServiceProxy,
                PermissionCheckerService,
                InstanceServiceProxy,
                PersonContactServiceProxy,
                NotifyService,
                AppLocalizationService,
                TenantSubscriptionServiceProxy,
                LayoutService,
                ContactServiceProxy,
                CashflowServiceProxy
            ]
        });
    });

    it('should be created', inject([ CashflowService, UserPreferencesService ], (service: CashflowService) => {
        expect(service).toBeTruthy();
    }));

    it('calculateCellValue should work', inject([ CashflowService, UserPreferencesService ], (service: CashflowService) => {
        const dataArray = [
            {
                accountId: 142,
                adjustmentType: 0,
                amount: -1826.38,
                cashflowTypeId: 'B',
                date: moment('2017-07-01T00:00:00Z'),
                initialData: moment('2017-07-01T00:00:00Z')
            },
            {
                accountId: 142,
                adjustmentType: 0,
                amount: 676.18,
                cashflowTypeId: 'B',
                date: moment('2017-09-15T00:00:00Z'),
                initialData: moment('2017-09-15T00:00:00Z')
            },
            {
                accountId: 142,
                amount: 2256.14,
                cashflowTypeId: 'B',
                date: moment('2019-05-06T00:00:00Z'),
                initialData: moment('2019-05-06T00:00:00Z')
            },
            {
                accountId: 142,
                amount: 4000,
                cashflowTypeId: 'B',
                date: moment('2019-05-09T00:00:00Z'),
                initialData: moment('2019-05-09T00:00:00Z')
            }
        ];
        expect(service.calculateCellValue({ year: 2017 }, dataArray, true)).toBe(0);
        expect(service.calculateCellValue({ year: 2017, quarter: 3, accountId: 142, cashflowTypeId: 'B' }, dataArray, true)).toBe(-1826.38);
        expect(service.calculateCellValue({ year: 2017, quarter: 3, month: 9 }, dataArray, true)).toBe(0);
        expect(service.calculateCellValue({ year: 2017, quarter: 3, month: 9, day: 15, accountId: 142, cashflowTypeId: 'B' }, dataArray, true)).toBe(676.18);
        expect(service.calculateCellValue({ year: 2019, quarter: 2, month: 5, projected: '{"startDate":"2019-05-06T00:00:00.000Z","endDate":"2019-05-12T23:59:59.999Z","weekNumber":19}', accountId: 142, cashflowTypeId: 'B' }, dataArray, true)).toBe(2256.14);
        expect(service.calculateCellValue({ year: 2019, quarter: 2, month: 5, day: 9, accountId: 142, cashflowTypeId: 'B' }, dataArray, true)).toBe(4000);
    }));

    it('addCategorizationLevels should work', inject([CashflowService], (service: CashflowService) => {
        const transaction: TransactionStatsDto = new TransactionStatsDto({
            cashflowTypeId: 'I',
            reportSectionId: 11,
            accountingTypeId: 2,
            subCategoryId: 5632,
            adjustmentType: null,
            accountId: 63,
            amount: 40,
            categoryId: 5566,
            count: 0,
            forecastId: 10402,
            transactionDescriptor: 'descriptor',
            currencyId: 'USD',
            date: '2019-07-01T00:00:00Z',
            comment: ''
        });
        service.categoryTree = new GetCategoryTreeOutput({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {
                '2': new AccountingTypeDto({typeId: 'E', name: 'Expense', isSystem: true})
            },
            categories: {},
            reportSections: {
                '11': new ReportSectionDto({ id: 11, group: SectionGroup.Expense, name: 'Business Expenses' })
            }
        });
        const levels = service.addCategorizationLevels(transaction).levels;
        console.log(levels);
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'RGExpense',
            level2: 'RS11',
            level3: 'AT2',
            level4: 'CA5566',
            level5: 'SC5632',
            level6: 'TDdescriptor'
        });
    }));

    it('customizeFieldText should return text', inject([ CashflowService ], (service: CashflowService) => {
        service.categoryTree = new GetCategoryTreeOutput({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {
                '2': new AccountingTypeDto({typeId: 'E', name: 'Expense', isSystem: true})
            },
            categories: {},
            reportSections: {
                '11': new ReportSectionDto({ id: 11, group: SectionGroup.Expense, name: 'Business Expenses' })
            }
        });
        service.cashflowTypes = {B: 'Starting Balance', D: 'Unreconciled Balance', E: 'Outflows', I: 'Inflows'};
        expect(service.customizeFieldText({ value: 'CTI' })).toBe('TOTAL INFLOWS');
        expect(service.customizeFieldText({ value: 'AT2' })).toBe('Expense');
        expect(service.customizeFieldText({ value: 'RGCostOfSales' })).toBe('SectionGroup_CostOfSales');
        expect(service.customizeFieldText({ value: 'RS11' })).toBe('Business Expenses');
    }));
});
