import { inject, TestBed } from '@angular/core/testing';
import * as moment from 'moment-timezone';
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
    TransactionStatsDto,
    TypeDto,
    ReportSectionDto,
    SectionGroup
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
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { RootStoreModule } from '@root/store/root-store.module';
import { CurrencyPipe } from '@angular/common';
import { SummaryCell } from 'devextreme/ui/pivot_grid/ui.pivot_grid.summary_display_modes.js';
import { TransactionStatsDtoExtended } from '@app/cfo/cashflow/models/transaction-stats-dto-extended';

describe('CashflowService', () => {
    beforeEach(() => {
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
        TestBed.configureTestingModule({
            imports: [
                RootStoreModule
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
                CurrencyPipe
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
        const transaction: TransactionStatsDto = new TransactionStatsDto({
            cashflowTypeId: 'I',
            accountingTypeId: 2,
            adjustmentType: null,
            accountId: 63,
            amount: 40,
            categoryId: 5566,
            subCategoryId: 5632,
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
            categories: {}
        });
        service.reportSections = new GetReportTemplateDefinitionOutput({
            sections: {
                11: new ReportSectionDto({
                    name: 'Expense',
                    group: SectionGroup.Expense
                })
            },
            categorySectionMap: {
                5632: 11
            }
        });
        let levels = service.addCategorizationLevels(transaction).levels;
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'AT2',
            level2: 'CA5566',
            level3: 'SC5632',
            level4: 'TDdescriptor'
        });
        service.userPreferencesService.localPreferences.value.showReportingSectionTotals = true;
        levels = service.addCategorizationLevels(transaction).levels;
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'RGExpense',
            level2: 'RS11',
            level3: 'AT2',
            level4: 'CA5566',
            level5: 'SC5632',
            level6: 'TDdescriptor'
        });

        /** Add N/A reporting group if category doesn't belong to some group */
        transaction.subCategoryId = 777;
        transaction.accountingTypeId = null;
        levels = service.addCategorizationLevels(transaction).levels;
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'RGN/A',
            level2: 'CA5566',
            level3: 'SC777',
            level4: 'TDdescriptor'
        });
        transaction.categoryId = null;
        transaction.subCategoryId = null;
        levels = service.addCategorizationLevels(transaction).levels;
        expect(levels).toEqual({
            level0: 'CTI',
            level1: 'RGN/A',
            level2: null,
            level3: 'TDdescriptor'
        });
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
                columnPath: [ '0', '2018', '3', '10' ],
                rowPath: [ 'CTI', 'RGExpense', 'RS3' ]
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
                subCategoryId: 2,
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
        const summaryCell = new SummaryCell(
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
        );
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
});
