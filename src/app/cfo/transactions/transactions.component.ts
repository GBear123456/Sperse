import { Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';

import { AppService } from '@app/app.service';
import { ActivatedRoute } from '@angular/router';

import { TransactionsServiceProxy, BankAccountDto, InstanceType } from '@shared/service-proxies/service-proxies';

import { FiltersService } from '@shared/filters/filters.service';
import { FilterHelpers } from '../shared/helpers/filter.helper';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterInputsComponent } from '@shared/filters/inputs/filter-inputs.component';
import { FilterCalendarComponent } from '@shared/filters/calendar/filter-calendar.component';
import { FilterCBoxesComponent } from '@shared/filters/cboxes/filter-cboxes.component';

import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { RuleDialogComponent } from '../rules/rule-edit-dialog/rule-edit-dialog.component';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DxDataGridComponent } from 'devextreme-angular';
import { MatDialog } from '@angular/material';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import 'devextreme/data/odata/store';
import * as _ from 'underscore';
import * as moment from 'moment';

import query from 'devextreme/data/query';
import DataSource from 'devextreme/data/data_source';


@Component({
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.less'],
    animations: [appModuleAnimation()],
    providers: [TransactionsServiceProxy]
})
export class TransactionsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    
    noRefreshedAfterSync: boolean;
    items: any;
    defaultCreditTooltipVisible = false;
    defaultDebitTooltipVisible = false;
    defaultTotalTooltipVisible = false;
    private readonly dataSourceURI = 'Transaction';
    private readonly totalDataSourceURI = 'TransactionTotal';
    private filters: FilterModel[];
    private rootComponent: any;
    private cashFlowCategoryFilter = [];

    public dragInProgress = false;
    public selectedCashflowCategoryKey: any;

    public accountCount: number;
    public portfolioCount: number;
    public creditTransactionCount: number = 0;
    public creditTransactionTotal: number = 0;
    public creditTransactionTotalCent: number = 0;
    public creditClassifiedTransactionCount: number = 0;

    public debitTransactionCount: number = 0;
    public debitTransactionTotal: number = 0;
    public debitTransactionTotalCent: number = 0;
    public debitClassifiedTransactionCount: number = 0;

    public transactionCount: number = 0;
    public transactionTotal: number = 0;
    public transactionTotalCent: number = 0;

    public adjustmentTotal: number = 0;
    public adjustmentStartingBalanceTotal: number = 0;
    public adjustmentStartingBalanceTotalCent: number = 0;
    headlineConfig: any;

    private _categoriesShowed = true;
    public set categoriesShowed(value: boolean) {
        if (this._categoriesShowed = value) {
            this.filtersService.fixed = false;
            this.filtersService.disable();
            this.initToolbarConfig();
        }
    }

    public get categoriesShowed(): boolean {
        return this._categoriesShowed;
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Transactions')],
            iconSrc: 'assets/common/icons/credit-card-icon.svg',
            buttons: [
                {
                    enabled: this.noRefreshedAfterSync,
                    action: this.refreshDataGrid.bind(this),
                    lable: this.l('Refresh'),
                    icon: 'refresh',
                    class: 'btn-default back-button'
                }
            ]
        };
    }

    initToolbarConfig() {
        this._appService.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: (event) => {
                            setTimeout(() => {
                                this.dataGrid.instance.repaint();
                            }, 1000);
                            this.filtersService.fixed =
                                !this.filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this.filtersService.fixed;
                            },
                            mouseover: (event) => {
                                this.filtersService.enable();
                                this.categoriesShowed = false;
                            },
                            mouseout: (event) => {
                                if (!this.filtersService.fixed) {
                                    this.filtersService.disable();
                                    this.categoriesShowed = true;
                                }
                            }
                        },
                        attr: {
                            'filter-selected': this.filtersService.hasFilterSelected
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'search',
                        widget: 'dxTextBox',
                        options: {
                            value: this.searchValue,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' '
                            + this.l('Transactions').toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
                    }
                ]
            },
            {
                location: 'after', items: [
                    { name: 'refresh', action: this.refreshDataGrid.bind(this) },
                    { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [{
                                action: Function(),
                                text: this.l('Save as PDF'),
                                icon: 'pdf',
                            }, {
                                action: this.exportToXLS.bind(this),
                                text: this.l('Export to Excel'),
                                icon: 'xls',
                            }, {
                                action: this.exportToCSV.bind(this),
                                text: this.l('Export to CSV'),
                                icon: 'sheet'
                            }, {
                                action: this.exportToGoogleSheet.bind(this),
                                text: this.l('Export to Google Sheets'),
                                icon: 'sheet'
                            }, { type: 'downloadOptions' }]
                        }
                    },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            }
        ];
    }

    constructor(injector: Injector,
        public dialog: MatDialog,
        private _appService: AppService,
        private _activatedRoute: ActivatedRoute,
        private _TransactionsServiceProxy: TransactionsServiceProxy,
        public filtersService: FiltersService
    ) {
        super(injector);

        this.filtersService.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;

        if (filtersService.fixed)
            this._categoriesShowed = false;
        this.initToolbarConfig();

        this.searchColumns = ['Description', 'CashflowSubCategoryName', 'CashflowCategoryName', 'Descriptor'];
        this.searchValue = '';
    }

    onToolbarPreparing(e) {
        e.toolbarOptions.items.unshift({
            location: 'after',
            template: 'accountTotal'
        },{
            location: 'after',
            template: 'portfolioTotal'
            }, {
        }, {
            location: 'after',
            template: 'startBalanceTotal'
        }, {
            location: 'after',
            template: 'debitTotal'
        }, {
            location: 'after',
            template: 'creditTotal'
        },{
            location: 'after',
            template: 'transactionTotal'
        });
    }

    getTotalValues() {
        let totals = this.totalDataSource.items();
        let selectedRows = this.dataGrid.instance.getSelectedRowsData();

        if (selectedRows.length) {
            let creditTotal = this.creditTransactionTotal = 0;
            let creditCount = this.creditTransactionCount = 0;
            let creditClassifiedCount = this.creditClassifiedTransactionCount = 0;

            let debitTotal = this.debitTransactionTotal = 0;
            let debitCount = this.debitTransactionCount = 0;
            let debitClassifiedCount = this.debitClassifiedTransactionCount = 0;

            this.adjustmentStartingBalanceTotal = 0;
            this.adjustmentTotal = 0;

            let portfolios = [];
            let accounts = [];

            _.each(selectedRows, function (row) {
                portfolios.push(row.BankAccountId);
                accounts.push(row.SyncAccountId);

                if (row.Amount > 0) {
                    creditTotal += row.Amount;
                    creditCount++;
                    if (row.CashflowCategoryId)
                        creditClassifiedCount++;
                }
                else {
                    debitTotal += row.Amount;
                    debitCount++;
                    if (row.CashflowCategoryId)
                        debitClassifiedCount++;
                }
            });
            this.portfolioCount = _.uniq(portfolios).length;
            this.accountCount = _.uniq(accounts).length;

            this.creditTransactionTotal = creditTotal;
            this.creditTransactionCount = creditCount;
            this.creditClassifiedTransactionCount = creditClassifiedCount;

            this.debitTransactionTotal = debitTotal;
            this.debitTransactionCount = debitCount;
            this.debitClassifiedTransactionCount = debitClassifiedCount;

            this.transactionTotal = this.creditTransactionTotal + this.debitTransactionTotal;
            this.transactionCount = this.creditTransactionCount + this.debitTransactionCount;
        }
        else
        if (totals && totals.length) {
            this.creditTransactionTotal = totals[0].creditTotal;
            this.creditTransactionCount = totals[0].creditCount;
            this.creditClassifiedTransactionCount = totals[0].classifiedCreditTransactionCount;

            this.debitTransactionTotal = totals[0].debitTotal;
            this.debitTransactionCount = totals[0].debitCount;
            this.debitClassifiedTransactionCount = totals[0].classifiedDebitTransactionCount;

            this.portfolioCount = totals[0].portfolioCount;
            this.accountCount = totals[0].accountCount;

            this.adjustmentStartingBalanceTotal = totals[0].adjustmentStartingBalanceTotal;
            this.adjustmentTotal = totals[0].adjustmentTotal;

            this.transactionTotal = this.creditTransactionTotal + this.debitTransactionTotal + this.adjustmentTotal + this.adjustmentStartingBalanceTotal;
            this.transactionCount = this.creditTransactionCount + this.debitTransactionCount;
        }
        else {
            this.creditTransactionTotal = 0;
            this.creditTransactionCount = 0;

            this.debitTransactionTotal = 0;
            this.debitTransactionCount = 0;

            this.portfolioCount = 0;
            this.accountCount = 0;

            this.transactionTotal = 0;
            this.transactionCount = 0;

            this.adjustmentStartingBalanceTotal = 0;
            this.adjustmentTotal = 0;
        }

        this.adjustmentStartingBalanceTotalCent = this.getFloatPart(this.adjustmentStartingBalanceTotal);
        this.adjustmentStartingBalanceTotal = Math.trunc(this.adjustmentStartingBalanceTotal);
        this.creditTransactionTotalCent = this.getFloatPart(this.creditTransactionTotal);
        this.creditTransactionTotal = Math.trunc(this.creditTransactionTotal);
        this.debitTransactionTotalCent = this.getFloatPart(this.debitTransactionTotal);
        this.debitTransactionTotal = Math.trunc(this.debitTransactionTotal);
        this.transactionTotalCent = this.getFloatPart(this.transactionTotal);
        this.transactionTotal = Math.trunc(this.transactionTotal);
    }

    getFloatPart(value) {
        let x = Math.abs(value);
        let int_part = Math.trunc(x);
        let float_part = (x - int_part) * 100;
        return float_part;
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    showRefreshButton() {
        this.noRefreshedAfterSync = true;
        this.initHeadlineConfig();
    }

    refreshDataGrid() {
        this.noRefreshedAfterSync = false;
        this.initHeadlineConfig();

        this.dataGrid.instance.refresh();
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];

        this.initToolbarConfig();
        this.processFilterInternal();
    }

    toggleCreditDefault() {
        this.defaultCreditTooltipVisible = !this.defaultCreditTooltipVisible;
    }
    toggleDebitDefault() {
        this.defaultDebitTooltipVisible = !this.defaultDebitTooltipVisible;
    }
    toggleTotalDefault() {
        this.defaultTotalTooltipVisible = !this.defaultTotalTooltipVisible;
    }
    applyTotalFilters(classified: boolean, credit: boolean, debit: boolean) {
        var classifiedFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption === 'classified'; });
        var amountFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption === 'Amount'; });

        if (classified) {
            classifiedFilter.items['yes'].setValue(true, classifiedFilter);
            classifiedFilter.items['no'].setValue(false, classifiedFilter);
        } else {
            classifiedFilter.items['yes'].setValue(false, classifiedFilter);
            classifiedFilter.items['no'].setValue(true, classifiedFilter);
        }

        if (credit) {
            amountFilter.items['from'].setValue('0', amountFilter);
            amountFilter.items['to'].setValue('', amountFilter);
            this.defaultCreditTooltipVisible = false;
        } else if (debit) {
            amountFilter.items['to'].setValue('0', amountFilter);
            amountFilter.items['from'].setValue('', amountFilter);
            this.defaultDebitTooltipVisible = false;
        } else {
            amountFilter.items['to'].setValue('', amountFilter);
            amountFilter.items['from'].setValue('', amountFilter);
            this.defaultTotalTooltipVisible = false;
        }

        this.filtersService.change(classifiedFilter);
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.initHeadlineConfig();

        this.dataSource = {
            store: {
                type: 'odata',
                url: this.getODataURL(this.dataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                }
            }
        };

        this.totalDataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataURL(this.totalDataSourceURI),
                version: this.getODataVersion(),
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.headers['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie();
                }
            },
            onChanged: this.getTotalValues.bind(this)
        });
        this.totalDataSource.load();

        Observable.forkJoin(
            this._TransactionsServiceProxy.getTransactionTypesAndCategories(),
            this._TransactionsServiceProxy.getFiltersInitialData(InstanceType[this.instanceType], this.instanceId)
        ).subscribe(result => {
            this.filtersService.setup(
                this.filters = [
                    new FilterModel({
                        component: FilterCalendarComponent,
                        operator: { from: 'ge', to: 'le' },
                        caption: 'Date',
                        field: 'Date',
                        items: { from: new FilterItemModel(), to: new FilterItemModel() }
                    }),
                    new FilterModel({
                        component: FilterCheckBoxesComponent,
                        caption: 'Account',
                        items: {
                            element: new FilterCheckBoxesModel(
                                {
                                    dataSource: FilterHelpers.ConvertBanksToTreeSource(result[1].banks),
                                    nameField: 'name',
                                    parentExpr: 'parentId',
                                    keyExpr: 'id'
                                })
                        }
                    }),
                    new FilterModel({
                        component: FilterInputsComponent,
                        operator: 'contains',
                        caption: 'Description',
                        items: { Description: new FilterItemModel() }
                    }),
                    new FilterModel({
                        component: FilterInputsComponent,
                        operator: { from: 'ge', to: 'le' },
                        caption: 'Amount',
                        field: 'Amount',
                        items: { from: new FilterItemModel(), to: new FilterItemModel() }
                    }),
                    new FilterModel({
                        component: FilterCheckBoxesComponent,
                        field: 'CategoryId',
                        caption: 'TransactionCategory',
                        items: {
                            element: new FilterCheckBoxesModel({
                                dataSource: result[0].categories,
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                        }
                    }),
                    new FilterModel({
                        component: FilterCheckBoxesComponent,
                        field: 'TypeId',
                        caption: 'TransactionType',
                        items: {
                            element: new FilterCheckBoxesModel({
                                dataSource: result[0].types,
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                        }
                    }),
                    new FilterModel({
                        component: FilterCBoxesComponent,
                        caption: 'classified',
                        field: 'CashflowCategoryId',
                        items: { yes: new FilterItemModel(), no: new FilterItemModel() }
                    }),
                    new FilterModel({
                        component: FilterCheckBoxesComponent,
                        field: 'CurrencyId',
                        caption: 'Currency',
                        items: {
                            element: new FilterCheckBoxesModel({
                                dataSource: result[1].currencies,
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                        }
                    }),
                    new FilterModel({
                        component: FilterCheckBoxesComponent,
                        field: 'BusinessEntityId',
                        caption: 'BusinessEntity',
                        items: {
                            element: new FilterCheckBoxesModel({
                                dataSource: result[1].businessEntities,
                                nameField: 'name',
                                keyExpr: 'id'
                            })
                        }
                    }),
                    new FilterModel({
                        component: FilterInputsComponent,
                        //operator: 'contains',
                        caption: 'CheckNumber',
                        //items: { BusinessEntity: '' }
                    }),
                    new FilterModel({
                        component: FilterInputsComponent,
                        //operator: 'contains',
                        caption: 'Reference',
                        //items: { BusinessEntity: '' }
                    })
                ], this._activatedRoute.snapshot.queryParams
            );
        });

        this.filtersService.apply(() => {
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element()[0].classList.toggle('grid-compact-view');
    }

    processFilterInternal() {
        let filterQuery = this.processODataFilter(this.dataGrid.instance,
            this.dataSourceURI, this.cashFlowCategoryFilter.concat(this.filters),
            (filter) => {
                let filterMethod = this['filterBy' +
                    this.capitalize(filter.caption)];
                if (filterMethod)
                    return filterMethod.call(this, filter);
            }
        );
        this.totalDataSource['_store']['_url'] = this.getODataURL(this.totalDataSourceURI, filterQuery);
        this.totalDataSource.load();
    }

    filterByClassified(filter: FilterModel) {
        let isYes = filter.items.yes.value;
        let isNo = filter.items.no.value;

        if (isYes ^ isNo) {
            let obj = {};
            obj[filter.field] = {};
            if (isYes) {
                obj[filter.field]['ne'] = null;
            } else {
                obj[filter.field] = null;
            }
            return obj;
        }
    }

    filterByDate(filter) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (item: FilterItemModel, key) => {
            if (item && item.value) {
                let date = moment.utc(item.value, 'YYYY-MM-DDT');
                if (key.toString() === 'to') {
                    date.add(1, 'd').add(-1, 's');
                }

                data[filter.field][filter.operator[key]] = date.toDate();
            }
        });

        return data;
    }

    filterByAccount(filter) {
        let data = {};
        if (filter.items.element) {
            let filterData = [];
            if (filter.items.element.value) {
                filter.items.element.value.forEach((id) => {
                    let parts = id.split(':');
                    filterData.push(parts.length == 2 ? {
                        BankId: +parts[0],
                        BankAccountId: +parts[1]
                    } : { BankId: +id });
                });
            }

            data = {
                or: filterData
            };
        }

        return data;
    }

    filterByAmount(filter) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (item: FilterItemModel, key) => {
            item && item.value && (data[filter.field][filter.operator[key]] = +item.value);
        });
        return data;
    }

    filterByTransactionCategory(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByCurrency(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByTransactionType(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByBusinessEntity(filter) {
        return this.filterByFilterElement(filter);
    }

    filterByFilterElement(filter) {
        let data = {};
        if (filter.items.element && filter.items.element.value) {
            let filterData = _.map(filter.items.element.value, x => {
                let el = {};
                el[filter.field] = x;
                return el;
            });

            data = {
                or: filterData
            };
        }

        return data;
    }

    filterByCashflowCategory(data) {
        if (data && data.key) {
            let field = {};
            if (!parseInt(data.key))
                field['CashFlowTypeId'] = new FilterItemModel(data.key);
            else if (!parseInt(data.key.split('').reverse().join('')))
                field['accountingTypeId'] = new FilterItemModel(parseInt(data.key));
            else if (data.parent.split && !parseInt(data.parent.split('').reverse().join('')))
                field['CashflowCategoryId'] = new FilterItemModel(parseInt(data.key));
            else
                field['CashflowSubCategoryId'] = new FilterItemModel(parseInt(data.key));

            this.cashFlowCategoryFilter = [
                new FilterModel({
                    items: field
                })
            ];

            this.processFilterInternal();
        }
        else if (this.selectedCashflowCategoryKey) {
            this.cashFlowCategoryFilter = [];
            this.processFilterInternal();
        }

        this.selectedCashflowCategoryKey = data && data.key;
    }

    onSelectionChanged($event, initial = false) {
        let img = new Image(),
            transactionKeys = this.dataGrid.instance.getSelectedRowKeys();
        img.src = 'assets/common/images/transactions.png';
        if (!initial && (Boolean(this.selectedCashflowCategoryKey) || Boolean(transactionKeys.length)))
            this.categoriesShowed = true;
        $event.element.find('tr.dx-data-row').removeAttr('draggable').off('dragstart').off('dragend')
            .filter('.dx-selection').attr('draggable', true).on('dragstart', (e) => {
                this.dragInProgress = true;
                e.originalEvent.dataTransfer.setData('Text', transactionKeys.join(','));
                e.originalEvent.dataTransfer.setDragImage(img, -10, -10);
                e.originalEvent.dropEffect = 'move';
            }).on('dragend', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                this.dragInProgress = false;
            }).on('click', (e) => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();

                this.dragInProgress = false;
            });
        this.getTotalValues();
    }

    onContentReady($event) {
        this.onSelectionChanged($event, true);
    }

    openCategorizationWindow($event) {
        let transactions = this.dataGrid
            .instance.getSelectedRowKeys();

        this.dialog.open(RuleDialogComponent, {
            panelClass: 'slider',
            data: {
                instanceId: this.instanceId,
                instanceType: this.instanceType,
                categoryId: $event.categoryId,
                transactions: transactions,
                transactionIds: transactions
                    .map((obj) => {
                        return obj.Id;
                    }),
                refershParent: this.refreshDataGrid.bind(this)
            }
        }).afterClosed().subscribe(result => { });
    }

    ngAfterViewInit(): void {
        this.showCompactRowsHeight();

        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this._appService.toolbarConfig = null;
        this.filtersService.localizationSourceName
            = AppConsts.localization.defaultLocalizationSourceName;
        this.filtersService.unsubscribe();
        this.rootComponent.overflowHidden();

        super.ngOnDestroy();
    }
}
