/** Core imports  */
import { inject, TestBed } from '@angular/core/testing';
import { CurrencyPipe } from '@angular/common';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';

/** Third party imports */
import * as moment from 'moment-timezone';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { CashflowService } from './cashflow.service';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import {
    AccountingTypeDto,
    CashflowServiceProxy,
    ContactServiceProxy,
    GetCategoryTreeOutput,
    GroupByPeriod,
    InstanceServiceProxy, Period,
    PermissionServiceProxy,
    PersonContactServiceProxy,
    GetReportTemplateDefinitionOutput,
    SessionServiceProxy,
    StatsFilter,
    TenantSubscriptionServiceProxy,
    TypeDto,
    ReportSectionDto,
    SectionGroup,
    CategoryDto,
    TenantHostServiceProxy
} from '@shared/service-proxies/service-proxies';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AbpMultiTenancyService } from 'abp-ng2-module';
import { CFOService } from '@shared/cfo/cfo.service';
import { AppService } from '@app/app.service';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { NotifyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { RootStoreModule } from '@root/store/root-store.module';
import { SummaryCell } from 'devextreme/ui/pivot_grid/ui.pivot_grid.summary_display_modes.js';
import { TransactionStatsDtoExtended } from '@app/cfo/cashflow/models/transaction-stats-dto-extended';
import { CategorizationPrefixes } from '@app/cfo/cashflow/enums/categorization-prefixes.enum';
import { CashflowTypes } from '@app/cfo/cashflow/enums/cashflow-types.enum';

describe('CashflowService', () => {
    beforeEach(() => {
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
        TestBed.configureTestingModule({
            imports: [
                RootStoreModule,
                RouterTestingModule
            ],
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
                CashflowServiceProxy,
                CfoPreferencesService,
                CurrencyPipe,
                TenantHostServiceProxy
            ]
        });
        abp.timing['timeZoneInfo'] = {
            iana: { timeZoneId: 'UTC' },
            windows: {
                timeZoneId: 'UTC',
                baseUtcOffsetInMilliseconds: 0,
                currentUtcOffsetInMilliseconds: 0,
                isDaylightSavingTimeNow: false,
            }
        };
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
        const transaction: TransactionStatsDtoExtended = new TransactionStatsDtoExtended({
            cashflowTypeId: 'I',
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
                2: new AccountingTypeDto({typeId: 'E', name: 'Expense', isSystem: true})
            },
            categories: {
                5566: new CategoryDto({ parentId: 5632, name: 'Child category', accountingTypeId: 2, coAID: null, isActive: true, reportingCategoryId: null }),
                5632: new CategoryDto({ parentId: 777, name: 'Middle category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                777: new CategoryDto({ parentId: null, name: 'Parent category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null })
            }
        });
        service.updateStatsCategoryTree([transaction]);
        service.addCategoriesLevelsToCategorizationConfig();
        service.reportSections = new GetReportTemplateDefinitionOutput({
            sections: {
                11: new ReportSectionDto({
                    name: 'Expense',
                    group: SectionGroup.Expense
                })
            },
            categorySectionMap: {
                5566: 11,
                5632: 11,
                777: 11
            }
        });
        let levels = service.addCategorizationLevels(transaction).levels;
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'AT2',
            level2: 'CA777',
            level3: 'CA5632',
            level4: 'CA5566',
            level5: 'TDdescriptor'
        });
        service.userPreferencesService.localPreferences.value.showReportingSectionTotals = true;
        levels = service.addCategorizationLevels(transaction).levels;
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'RGExpense',
            level2: 'RS11',
            level3: 'AT2',
            level4: 'CA777',
            level5: 'CA5632',
            level6: 'CA5566',
            level7: 'TDdescriptor'
        });
    }));

    it('addCategorizationLevels should work (reporting N/A test)', inject([CashflowService], (service: CashflowService) => {
        const transaction: TransactionStatsDtoExtended = new TransactionStatsDtoExtended({
            cashflowTypeId: 'I',
            adjustmentType: null,
            accountId: null,
            amount: 40,
            categoryId: 999,
            count: 0,
            forecastId: null,
            transactionDescriptor: 'descriptor',
            currencyId: 'USD',
            date: '2019-07-01T00:00:00Z',
            comment: ''
        });
        service.categoryTree = new GetCategoryTreeOutput({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {},
            categories: {
                999: new CategoryDto({
                    parentId: null,
                    name: 'Neutral category',
                    accountingTypeId: null,
                    coAID: null,
                    isActive: true,
                    reportingCategoryId: null
                })
            }
        });
        service.reportSections = new GetReportTemplateDefinitionOutput({
            sections: {},
            categorySectionMap: {}
        });
        service.userPreferencesService.localPreferences.value.showReportingSectionTotals = true;
        service.updateStatsCategoryTree([transaction]);
        service.addCategoriesLevelsToCategorizationConfig();

        /** Add N/A reporting group if category doesn't belong to some group */
        let levels = service.addCategorizationLevels(transaction).levels;
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'RGN/A',
            level2: 'CA999',
            level3: 'TDdescriptor'
        });
    }));

    it('addCategorizationLevels should work (empty categories test)', inject([CashflowService], (service: CashflowService) => {
        const transaction: TransactionStatsDtoExtended = new TransactionStatsDtoExtended({
            cashflowTypeId: 'I',
            adjustmentType: null,
            accountId: null,
            amount: 40,
            categoryId: null,
            count: 0,
            forecastId: null,
            transactionDescriptor: 'descriptor',
            currencyId: 'USD',
            date: '2019-07-01T00:00:00Z',
            comment: ''
        });
        service.categoryTree = new GetCategoryTreeOutput({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {},
            categories: {
                999: new CategoryDto({
                    parentId: null,
                    name: 'Neutral category',
                    accountingTypeId: null,
                    coAID: null,
                    isActive: true,
                    reportingCategoryId: null
                })
            }
        });
        service.userPreferencesService.localPreferences.value.showReportingSectionTotals = true;
        let levels = service.addCategorizationLevels(transaction).levels;
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'RGN/A',
            level2: null,
            level3: 'TDdescriptor'
        });
    }));

    it('addCategorizationLevels should work (SC-12069 test comment)', inject([CashflowService], (service: CashflowService) => {
        const transaction: TransactionStatsDtoExtended = new TransactionStatsDtoExtended({
            accountId: 88188,
            adjustmentType: undefined,
            amount: -54.92,
            cashflowTypeId: 'I',
            categoryId: 52113,
            comment: undefined,
            count: 1,
            currencyId: 'USD',
            date: '2020-05-01T00:00:00Z',
            forecastId: undefined,
            initialDate: '2020-05-01T00:00:00Z',
            transactionDescriptor: undefined
        });
        /** Bug levels: {level0: "CTI", level1: "CA52107", level2: "CA52109", level3: "CA52113"} */
        service.categoryTree = new GetCategoryTreeOutput({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {
                5525: new AccountingTypeDto({
                    isSystem: false,
                    name: 'Income',
                    typeId: 'I'
                })
            },
            categories: {
                52113: new CategoryDto({
                    accountingTypeId: 5525,
                    coAID: null,
                    isActive: false,
                    name: 'Plants and Soil',
                    parentId: 52109,
                    reportingCategoryId: null
                }),
                52109: new CategoryDto({
                    accountingTypeId: 5525,
                    coAID: null,
                    isActive: false,
                    name: 'Job Materials',
                    parentId: 52107,
                    reportingCategoryId: null
                }),
                52107: new CategoryDto({
                    accountingTypeId: 5525,
                    coAID: null,
                    isActive: false,
                    name: 'Landscaping Services',
                    parentId: null,
                    reportingCategoryId: null
                })
            }
        });
        let levels = service.addCategorizationLevels(transaction).levels;
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'AT5525',
            level2: 'CA52107',
            level3: 'CA52109',
            level4: 'CA52113'
        });
    }));

    it('addCategorizationLevels should return levels for cashflowType only', inject([CashflowService], (service: CashflowService) => {
        const transaction = new TransactionStatsDtoExtended({
            adjustmentType: null,
            accountId: null,
            currencyId: 'USD',
            amount: 0,
            comment: null,
            date: null,
            initialDate: null,
            forecastId: null,
            isStub: true,
            cashflowTypeId: CashflowTypes.StartedBalance
        });
        service.categoryTree = new GetCategoryTreeOutput({
            types: {},
            accountingTypes: {},
            categories: {}
        });
        const updatedTransaction: TransactionStatsDtoExtended = service.addCategorizationLevels(transaction);
        expect(Object.keys(updatedTransaction.levels).length).toBe(1);
    }));

    it('customizeFieldText should return text', inject([ CashflowService ], (service: CashflowService) => {
        service.categoryTree = new GetCategoryTreeOutput({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {
                '2': new AccountingTypeDto({typeId: 'E', name: 'Expense', isSystem: true})
            },
            categories: {}
        });
        service.reportSections = new GetReportTemplateDefinitionOutput({
            sections: {
                11: new ReportSectionDto({
                    name: 'Business Expenses',
                    group: SectionGroup.Expense
                })
            },
            categorySectionMap: {
                5566: 11
            }
        });
        service.cashflowTypes = { B: 'Starting Balance', D: 'Unreconciled Balance', E: 'Outflows', I: 'Inflows' };
        expect(service.customizeFieldText({ value: 'CTI' })).toBe('TOTAL INFLOWS');
        expect(service.customizeFieldText({ value: 'AT2' })).toBe('Expense');
        expect(service.customizeFieldText({ value: 'RGCostOfSales' })).toBe('SectionGroup_CostOfSales');
        expect(service.customizeFieldText({ value: 'RS11' })).toBe('Business Expenses');
        expect(service.customizeFieldText({ value: 'RGN/A' })).toBe('N/A');
    }));

    it('getDetailFilterFromCell should return filter from cell', inject([ CashflowService ], (service: CashflowService) => {
        const cellObj = {
            cell: {
                columnPath: [ '0', moment().format('YYYY'), '3', '10' ],
                rowPath: [ 'CTI', 'RGExpense', 'RS3', 'CA48', 'CA59', 'CA77' ]
            }
        };
        service.requestFilter = new StatsFilter({
            startDate: moment().subtract(1, 'year').startOf('year'),
            endDate: moment().add(1, 'year').endOf('year'),
            forecastModelId: 1,
            showResolvedComments: true,
            groupByPeriod: GroupByPeriod.Monthly,
            dailyPeriods: [],
            calculateStartingBalance: true,
            currencyId: 'USD',
            accountIds: [],
            businessEntityIds: [],
        });
        const result = service.getDetailFilterFromCell(cellObj);
        expect(result.cashflowTypeId).toEqual('I');
        expect(result.reportSectionGroup).toEqual('Expense');
        expect(result.reportSectionId).toEqual('3');
        expect(result.categoryId).toEqual('77');
    }));

    it('getStubsCashflowDataForAllPeriods should work properly', inject([CashflowService], (service: CashflowService) => {
        const cashflowData = [
            new TransactionStatsDtoExtended({
                adjustmentType: 2,
                cashflowTypeId: 'B',
                accountId: 142,
                currencyId: 'USD',
                date: moment('2019-01-15T22:00:00.000Z'),
                initialDate: moment('2019-01-15T22:00:00.000Z'),
                amount: 13247.42,
                count: 2,
                comment: '',
                accountingTypeId: 1,
                categoryId: 1,
                reportSectionId: 1,
                transactionDescriptor: '',
                forecastId: null
            })
        ];
        service.allYears = [ 2019 ];
        service.requestFilter = new StatsFilter({
            accountIds: [63, 64, 142, 143],
            calculateStartingBalance: true,
            currencyId: 'USD',
            dailyPeriods: [new Period({
                start: moment('Tue Jan 01 2019 00:00:00 GMT+0000'),
                end: moment('Thu Jan 31 2019 23:59:59 GMT+0000')
            })],
            endDate: moment('Sat Jan 26 2019 02:00:00 GMT+0200'),
            forecastModelId: 1,
            groupByPeriod: GroupByPeriod.Monthly,
            showResolvedComments: false,
            startDate: moment('Wed Jan 16 2019 02:00:00 GMT+0200'),
            businessEntityIds: []
        });
        const allPeriods = service.getStubsCashflowDataForAllPeriods(cashflowData, GroupByPeriod.Monthly);
        /** One stub transaction stat for every day */
        expect(allPeriods.length).toBe(11);
    }));

    it('calculateSummary value should return correct value from cell', inject([ CashflowService ], (service: CashflowService) => {
        const descriptions = {
            columns: [
                {
                    'caption': 'Historical',
                    'area': 'column',
                    'showTotals': false,
                    'expanded': true,
                    'allowExpand': false,
                    'wordWrapEnabled': true,
                    'visible': true,
                    '_initProperties': {'area': 'column', 'areaIndex': 0, 'expanded': true},
                    'index': 0,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 0
                },
                {
                    'caption': 'Year',
                    'dataField': 'date',
                    'dataType': 'date',
                    'area': 'column',
                    'groupInterval': 'year',
                    'showTotals': true,
                    'visible': true,
                    'summaryDisplayMode': 'percentVariation',
                    '_initProperties': {'area': 'column', 'areaIndex': 1, 'summaryDisplayMode': 'percentVariation'},
                    'index': 1,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 1
                },
                {
                    'caption': 'Quarter',
                    'dataField': 'date',
                    'dataType': 'date',
                    'width': 0.01,
                    'area': 'column',
                    'groupInterval': 'quarter',
                    'showTotals': false,
                    'visible': true,
                    '_initProperties': {'area': 'column', 'areaIndex': 2},
                    'expanded': false,
                    'index': 2,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 2
                },
                {
                    'caption': 'Month',
                    'dataField': 'date',
                    'dataType': 'date',
                    'area': 'column',
                    'width': 0.01,
                    'showTotals': false,
                    'groupInterval': 'month',
                    'visible': true,
                    '_initProperties': {'area': 'column', 'areaIndex': 3},
                    'expanded': false,
                    'index': 3,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 3
                },
                {
                    'caption': 'Week',
                    'area': 'column',
                    'width': 0.01,
                    'showTotals': false,
                    'sortBy': 'displayText',
                    'visible': true,
                    '_initProperties': {'area': 'column', 'areaIndex': 5, 'sortBy': 'displayText'},
                    'index': 4,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 4
                },
                {
                    'caption': 'Day',
                    'dataField': 'date',
                    'dataType': 'date',
                    'area': 'column',
                    'showTotals': false,
                    'groupInterval': 'day',
                    'visible': true,
                    '_initProperties': {'area': 'column', 'areaIndex': 6},
                    'index': 5,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 5
                }
            ],
            rows: [
                {
                    'dataField': 'levels.level0',
                    'dataType': 'string',
                    'displayFolder': 'levels',
                    'caption': 'Type',
                    'width': 120,
                    'area': 'row',
                    'expanded': false,
                    'allowExpandAll': false,
                    'allowExpand': false,
                    'sortOrder': 'asc',
                    'rowHeaderLayout': 'tree',
                    'showTotals': true,
                    '_initProperties': {'area': 'row', 'areaIndex': 0, 'sortOrder': 'asc', 'expanded': false},
                    'index': 0,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'areaIndex': 0
                },
                {
                    'dataField': 'levels.level1',
                    'dataType': 'string',
                    'displayFolder': 'levels',
                    'caption': 'Reporting Group',
                    'width': 120,
                    'area': 'row',
                    'sortBy': 'displayText',
                    'sortOrder': 'asc',
                    'expanded': false,
                    'showTotals': true,
                    'resortable': true,
                    '_initProperties': {
                        'area': 'row',
                        'areaIndex': 1,
                        'sortOrder': 'asc',
                        'sortBy': 'displayText',
                        'expanded': false
                    },
                    'index': 1,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 1
                },
                {
                    'caption': 'Reporting Section',
                    'width': 120,
                    'area': 'row',
                    'dataField': 'levels.level2',
                    'sortBy': 'displayText',
                    'sortOrder': 'asc',
                    'expanded': false,
                    'showTotals': true,
                    'resortable': true,
                    '_initProperties': {
                        'area': 'row',
                        'areaIndex': 2,
                        'sortOrder': 'asc',
                        'sortBy': 'displayText',
                        'expanded': false
                    },
                    'index': 2,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 2
                },
                {
                    'caption': 'Account Type',
                    'width': 120,
                    'area': 'row',
                    'dataField': 'levels.level3',
                    'sortBy': 'displayText',
                    'sortOrder': 'asc',
                    'expanded': false,
                    'showTotals': true,
                    'resortable': true,
                    'rowHeaderLayout': 'tree',
                    '_initProperties': {
                        'area': 'row',
                        'areaIndex': 3,
                        'sortOrder': 'asc',
                        'sortBy': 'displayText',
                        'expanded': false
                    },
                    'index': 3,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 3
                },
                {
                    'caption': 'Category',
                    'showTotals': false,
                    'area': 'row',
                    'sortBy': 'displayText',
                    'sortOrder': 'asc',
                    'resortable': true,
                    'dataField': 'levels.level4',
                    '_initProperties': {'area': 'row', 'areaIndex': 4, 'sortOrder': 'asc', 'sortBy': 'displayText'},
                    'index': 4,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 4
                },
                {
                    'caption': 'Sub Category',
                    'showTotals': false,
                    'area': 'row',
                    'sortBy': 'displayText',
                    'sortOrder': 'asc',
                    'resortable': true,
                    'dataField': 'levels.level5',
                    '_initProperties': {'area': 'row', 'areaIndex': 5, 'sortOrder': 'asc', 'sortBy': 'displayText'},
                    'index': 5,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 5
                },
                {
                    'caption': 'Descriptor',
                    'showTotals': false,
                    'area': 'row',
                    'sortBy': 'displayText',
                    'sortOrder': 'asc',
                    'resortable': true,
                    'dataField': 'levels.level6',
                    '_initProperties': {'area': 'row', 'areaIndex': 6, 'sortOrder': 'asc', 'sortBy': 'displayText'},
                    'index': 6,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 6
                }
            ],
            values: [
                {
                    'dataField': 'amount',
                    'dataType': 'number',
                    'displayFolder': '',
                    'caption': 'Amount',
                    'summaryType': 'sum',
                    'area': 'data',
                    'showColumnTotals': true,
                    'summaryDisplayMode': 'percentOfColumnTotal',
                    '_initProperties': {
                        'area': 'data',
                        'summaryType': 'sum',
                        'summaryDisplayMode': 'percentOfColumnTotal'
                    },
                    'index': 7,
                    'allowSorting': false,
                    'allowSortingBySummary': false,
                    'allowFiltering': false,
                    'allowExpandAll': false,
                    'areaIndex': 0
                }
            ]
        };
        const fields = {
            'fields': {},
            'positions': {'1': {'area': 'row', 'index': 1}, '13': {'area': 'column', 'index': 4}},
            'levels.level1': {
                'dataField': 'levels.level1',
                'dataType': 'string',
                'displayFolder': 'levels',
                'caption': 'Reporting Group',
                'width': 120,
                'area': 'row',
                'sortBy': 'displayText',
                'sortOrder': 'asc',
                'expanded': false,
                'showTotals': true,
                'resortable': true,
                '_initProperties': {
                    'area': 'row',
                    'areaIndex': 1,
                    'sortOrder': 'asc',
                    'sortBy': 'displayText',
                    'expanded': false
                },
                'index': 1,
                'allowSorting': false,
                'allowSortingBySummary': false,
                'allowFiltering': false,
                'allowExpandAll': false,
                'areaIndex': 1
            }
        };
        /*const summaryCell = new SummaryCell(
            [
                {
                    'value': '{"startDate":"2019-03-01T00:00:00.000Z","endDate":"2019-03-03T23:59:59.999Z","weekNumber":9}',
                    'text': '03.01 - 03.03',
                    index: 4
                },
                {
                    'value': 3,
                    'text': 'MAR',
                    index: 3
                },
                {
                    'value': 1,
                    'text': 'Q1',
                    index: 2
                },
                {
                    'value': 2019,
                    'text': '2019',
                    index: 1
                },
                {
                    'value': 1,
                    index: 0,
                    'text': 'CURRENT'
                }
            ],
            [
                {
                    'value': 'AN85972',
                    index: 0,
                    'text': 'HTML'
                },
                {
                    'value': 'CTB',
                    index: 1,
                    'text': 'STARTING BALANCE'
                }
            ],
            {
                values: [
                    [ 400, 1000 ],
                    [ 400, 1000 ],
                    [ 100, 400 ],
                    [ 25, 200 ],
                    [ 10, 100 ]
                ]
            },
            descriptions,
            0,
            fields
        );*/
    }));

    it('sortReportingGroup should correctly sort two items', inject([ CashflowService ], (service: CashflowService) => {
        let firstItem = {
            value: 'RGOtherIncomeExpense'
        };
        let secondItem = {
            value: 'RGCostOfSales'
        };
        expect(CashflowService.sortReportingGroup(firstItem, secondItem)).toBe(1);

        firstItem = {
            value: 'RGOtherIncomeExpense'
        };
        secondItem = {
            value: null
        };
        expect(CashflowService.sortReportingGroup(firstItem, secondItem)).toBe(-1);

        firstItem = {
            value: 'CA15'
        };
        secondItem = {
            value: 'CA18'
        };
        expect(CashflowService.sortReportingGroup(firstItem, secondItem)).toBe(0);
    }));

    it('test calculating of counts', inject([ CashflowService ], (service: CashflowService) => {
        const transactions: TransactionStatsDtoExtended[] = [
            new TransactionStatsDtoExtended({ categoryId: 36 }),
            new TransactionStatsDtoExtended({ categoryId: 49 }),
            new TransactionStatsDtoExtended({ categoryId: 115 }),
            new TransactionStatsDtoExtended({ categoryId: 98 }),
            new TransactionStatsDtoExtended({ categoryId: 59 }),
            new TransactionStatsDtoExtended({ categoryId: 68 }),
            new TransactionStatsDtoExtended({ categoryId: 73 })
        ];
        service.categoryTree = new GetCategoryTreeOutput({
            types: {},
            accountingTypes: {},
            categories: {
                '36': new CategoryDto({ parentId: 49, name: 'Business Bank Account', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                '115': new CategoryDto({ parentId: 49, name: 'Checking Account', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                '49': new CategoryDto({ parentId: 98, name: 'Bank', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                '98': new CategoryDto({ parentId: null, name: 'Revenue', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                '59': new CategoryDto({ parentId: null, name: 'Bank', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                '68': new CategoryDto({ parentId: 59, name: 'Business Bank Account', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                '73': new CategoryDto({ parentId: 59, name: 'Business Bank Account', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
            }
        });
        service.updateStatsCategoryTree(transactions);
        expect(service.statsCategoryTree).toEqual({
            36: 49,
            49: 98,
            115: 49,
            98: null,
            59: null,
            68: 59,
            73: 59
        });
        expect(service.statsCategoriesLevelsCount).toBe(3);
    }));

    it('test getTransactionCategoriesIds method', inject([ CashflowService ], (service: CashflowService) => {
        const categoryId = 45;
        const categoryTree = new GetCategoryTreeOutput({
            types: {},
            accountingTypes: {},
            categories: {
                45: new CategoryDto({ parentId: 67, name: 'Child category', accountingTypeId: 2, coAID: null, isActive: true, reportingCategoryId: null }),
                67: new CategoryDto({ parentId: 86, name: 'Child category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                86: new CategoryDto({ parentId: null, name: 'Parent category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null })
            }
        });
        const categoryIds = service.getTransactionCategoriesIds(categoryId, categoryTree);
        expect(categoryIds).toEqual([86, 67, 45]);
    }));

    it('getHighestCategoryParentId should work', inject([ CashflowService ], (service: CashflowService) => {
        const categoryTree: GetCategoryTreeOutput = new GetCategoryTreeOutput ({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {
                2: new AccountingTypeDto({typeId: 'E', name: 'Expense', isSystem: true})
            },
            categories: {
                77: new CategoryDto({ parentId: 67, name: 'Child category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                67: new CategoryDto({ parentId: 86, name: 'Child category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                86: new CategoryDto({ parentId: null, name: 'Parent category', accountingTypeId: 2, coAID: null, isActive: true, reportingCategoryId: null })
            }
        });
        const cashflowType = service.getHighestCategoryParentId(77, categoryTree);
        expect(cashflowType).toEqual(86);
    }));

    it('getCashFlowTypeByCategory should work', inject([ CashflowService ], (service: CashflowService) => {
        const categoryTree: GetCategoryTreeOutput = new GetCategoryTreeOutput ({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {
                2: new AccountingTypeDto({typeId: 'E', name: 'Expense', isSystem: true})
            },
            categories: {
                77: new CategoryDto({ parentId: 67, name: 'Child category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                67: new CategoryDto({ parentId: 86, name: 'Child category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                86: new CategoryDto({ parentId: null, name: 'Parent category', accountingTypeId: 2, coAID: null, isActive: true, reportingCategoryId: null })
            }
        });
        const cashflowType = service.getCashFlowTypeByCategory(77, categoryTree);
        expect(cashflowType).toEqual('E');
    }));

    it('getCategoryFullPath should work', inject([ CashflowService ], (service: CashflowService) => {
        const category = new CategoryDto({ parentId: 67, name: 'Child category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null });
        const categoryTree: GetCategoryTreeOutput = new GetCategoryTreeOutput ({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {
                2: new AccountingTypeDto({typeId: 'E', name: 'Expense', isSystem: true})
            },
            categories: {
                77: category,
                67: new CategoryDto({ parentId: 86, name: 'Child category', accountingTypeId: null, coAID: null, isActive: true, reportingCategoryId: null }),
                86: new CategoryDto({ parentId: null, name: 'Parent category', accountingTypeId: 2, coAID: null, isActive: true, reportingCategoryId: null })
            }
        });
        const categoryFullPath = service.getCategoryFullPath(77, categoryTree);
        expect(categoryFullPath).toEqual([ 'CTE', 'CA86', 'CA67', 'CA77' ]);
    }));

    it('getCategoryFullPath should work', inject([ CashflowService ], (service: CashflowService) => {
        const categoryTree: GetCategoryTreeOutput = new GetCategoryTreeOutput ({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {
                2: new AccountingTypeDto({
                    isSystem: false,
                    name: 'Income',
                    typeId: 'I'
                })
            },
            categories: {
                53997: new CategoryDto({
                    accountingTypeId: 2,
                    coAID: null,
                    isActive: true,
                    name: 'Design income',
                    parentId: null,
                    reportingCategoryId: null
                })
            }
        });
        service.userPreferencesService.localPreferences.value.showAccountingTypeTotals = true;
        const categoryFullPath = service.getCategoryFullPath(53997, categoryTree);
        expect(categoryFullPath).toEqual([ 'CTI', 'CA53997' ]);
    }));

    it('getCategoryFullPath should work event without mapping of accounting type to cashflowTypeId', inject([ CashflowService ], (service: CashflowService) => {
        const categoryTree: GetCategoryTreeOutput = new GetCategoryTreeOutput ({
            types: { I: new TypeDto({ name: 'Inflows'}), E: new TypeDto({name: 'Outflows'})},
            accountingTypes: {
                2: new AccountingTypeDto({
                    isSystem: false,
                    name: null,
                    typeId: null
                })
            },
            categories: {
                53997: new CategoryDto({
                    accountingTypeId: 2,
                    coAID: null,
                    isActive: true,
                    name: 'Design income',
                    parentId: null,
                    reportingCategoryId: null
                })
            }
        });
        service.userPreferencesService.localPreferences.value.showAccountingTypeTotals = true;
        const categoryFullPath = service.getCategoryFullPath(53997, categoryTree, 'I');
        expect(categoryFullPath).toEqual([ 'CTI', 'CA53997' ]);
    }));

    it('getCategoryValueByPrefix should return the deepest category in path', inject([ CashflowService ], (service: CashflowService) => {
        const categoryPath = [ 'CTE', 'AT5906', 'CA53944', 'CA53953' ];
        expect(service.getCategoryValueByPrefix(categoryPath, CategorizationPrefixes.Category)).toEqual('53953');
    }));
});
