import { Component, OnInit, AfterViewInit, OnDestroy, Injector, Inject, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

import { AppService } from '@app/app.service';
import { ActivatedRoute } from '@angular/router';

import { TransactionsServiceProxy,
         BankAccountDto,
         InstanceType,
         ClassificationServiceProxy,
         UpdateTransactionsCategoryInput,
         BankDto,
         AutoClassifyDto,
         ResetClassificationDto,
         BankAccountsServiceProxy } from '@shared/service-proxies/service-proxies';

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
import { CategorizationComponent } from 'app/cfo/transactions/categorization/categorization.component';
import { ChooseResetRulesComponent } from './choose-reset-rules/choose-reset-rules.component';
import { BankAccountFilterComponent } from 'shared/filters/bank-account-filter/bank-account-filter.component';
import { BankAccountFilterModel } from 'shared/filters/bank-account-filter/bank-account-filter.model';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { TransactionDetailInfoComponent } from '@app/cfo/shared/transaction-detail-info/transaction-detail-info.component';

@Component({
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.less'],
    animations: [appModuleAnimation()],
    providers: [TransactionsServiceProxy, ClassificationServiceProxy, BankAccountsServiceProxy]
})
export class TransactionsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(CategorizationComponent) categorizationComponent: CategorizationComponent;
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    @ViewChild(TransactionDetailInfoComponent) transactionInfo: TransactionDetailInfoComponent;
    resetRules = new ResetClassificationDto();
    private autoClassifyData = new AutoClassifyDto();

    noRefreshedAfterSync: boolean;
    items: any;
    transactionId: any;
    defaultCreditTooltipVisible = false;
    defaultDebitTooltipVisible = false;
    defaultTotalTooltipVisible = false;
    defaultSubaccountTooltipVisible = false;

    private readonly dataSourceURI = 'Transaction';
    private readonly totalDataSourceURI = 'TransactionTotal';
    private filters: FilterModel[];
    private rootComponent: any;
    private cashFlowCategoryFilter = [];
    public transactionsFilterQuery: any[];

    public dragInProgress = false;
    public selectedCashflowCategoryKey: any;

    public bankAccountCount: number;
    public bankAccounts: number[];
    public creditTransactionCount = 0;
    public creditTransactionTotal = 0;
    public creditTransactionTotalCent = 0;
    public creditClassifiedTransactionCount = 0;

    public debitTransactionCount = 0;
    public debitTransactionTotal = 0;
    public debitTransactionTotalCent = 0;
    public debitClassifiedTransactionCount = 0;

    public transactionCount = 0;
    public transactionTotal = 0;
    public transactionTotalCent = 0;

    public adjustmentTotal = 0;
    public adjustmentStartingBalanceTotal = 0;
    public adjustmentStartingBalanceTotalCent = 0;
    headlineConfig: any;

    private _categoriesShowedBefore = true;
    private _categoriesShowed = true;
    public set categoriesShowed(value: boolean) {
        this._categoriesShowedBefore = this._categoriesShowed;
        if (this._categoriesShowed = value) {
            this.filtersService.fixed = false;
            this.filtersService.disable();
        }
    }

    public get categoriesShowed(): boolean {
        return this._categoriesShowed;
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Transactions')],
            onRefresh: this.refreshDataGrid.bind(this),
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
                            this.filtersService.fixed =
                                !this.filtersService.fixed;
                            if (this.filtersService.fixed)
                                this.categoriesShowed = false;
                            else
                                this.categoriesShowed =
                                    this._categoriesShowedBefore;
                            this.filtersService.enable();
                        },
                        options: {
                            checkPressed: () => {
                                return this.filtersService.fixed;
                            },
                            mouseover: (event) => {
                                this.filtersService.enable();
                            },
                            mouseout: (event) => {
                                if (!this.filtersService.fixed)
                                    this.filtersService.disable();
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
                location: 'before',
                items: [
                    {
                        name: 'searchAll',
                        action: this.searchAllClick.bind(this),
                        options: {
                            text: this.l('Search All')
                        },
                        attr: {
                            'filter-selected': ((this.searchValue && this.searchValue.length > 0) && (this.filtersService.hasFilterSelected || this.selectedCashflowCategoryKey) )? true : false,
                            'custaccesskey': 'search-container'
                        }
                    }
                ]
            },
            {
                location: 'after', items: [
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
        private _classificationServiceProxy: ClassificationServiceProxy,
        private _bankAccountsServiceProxy: BankAccountsServiceProxy,
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
            template: 'bankAccountTotal'
        }, {
                location: 'after',
                template: 'startBalanceTotal'
            }, {
                location: 'after',
                template: 'creditTotal'
            }, {
                location: 'after',
                template: 'debitTotal'
            }, {
                location: 'after',
                template: 'transactionTotal'
            });
    }

    getTotalValues() {
        let totals = this.totalDataSource.items();
        let selectedRows = this.dataGrid.instance ? this.dataGrid.instance.getSelectedRowsData() : [];

        if (selectedRows.length) {
            let creditTotal = this.creditTransactionTotal = 0;
            let creditCount = this.creditTransactionCount = 0;
            let creditClassifiedCount = this.creditClassifiedTransactionCount = 0;

            let debitTotal = this.debitTransactionTotal = 0;
            let debitCount = this.debitTransactionCount = 0;
            let debitClassifiedCount = this.debitClassifiedTransactionCount = 0;

            this.adjustmentStartingBalanceTotal = 0;
            this.adjustmentTotal = 0;

            let bankAccounts = [];

            _.each(selectedRows, function (row) {
                bankAccounts.push(row.BankAccountId);

                if (row.Amount >= 0) {
                    creditTotal += row.Amount;
                    creditCount++;
                    if (row.CashflowCategoryId)
                        creditClassifiedCount++;
                } else {
                    debitTotal += row.Amount;
                    debitCount++;
                    if (row.CashflowCategoryId)
                        debitClassifiedCount++;
                }
            });
            this.bankAccounts = _.uniq(bankAccounts);
            this.bankAccountCount = this.bankAccounts.length;

            this.creditTransactionTotal = creditTotal;
            this.creditTransactionCount = creditCount;
            this.creditClassifiedTransactionCount = creditClassifiedCount;

            this.debitTransactionTotal = debitTotal;
            this.debitTransactionCount = debitCount;
            this.debitClassifiedTransactionCount = debitClassifiedCount;

            this.transactionTotal = this.creditTransactionTotal + this.debitTransactionTotal;
            this.transactionCount = this.creditTransactionCount + this.debitTransactionCount;
        } else if (totals && totals.length) {
                this.creditTransactionTotal = totals[0].creditTotal;
                this.creditTransactionCount = totals[0].creditCount;
                this.creditClassifiedTransactionCount = totals[0].classifiedCreditTransactionCount;

                this.debitTransactionTotal = totals[0].debitTotal;
                this.debitTransactionCount = totals[0].debitCount;
                this.debitClassifiedTransactionCount = totals[0].classifiedDebitTransactionCount;
                if (totals[0].bankAccounts) {
                    this.bankAccountCount = totals[0].bankAccounts.length;
                    this.bankAccounts = totals[0].bankAccounts;
                } else {
                    this.bankAccountCount = 0;
                    this.bankAccounts = [];
                }

                this.adjustmentStartingBalanceTotal = totals[0].adjustmentStartingBalanceTotal;
                this.adjustmentTotal = totals[0].adjustmentTotal;

                this.transactionTotal = this.creditTransactionTotal + this.debitTransactionTotal + this.adjustmentTotal + this.adjustmentStartingBalanceTotal;
                this.transactionCount = this.creditTransactionCount + this.debitTransactionCount;
            } else {
                this.creditTransactionTotal = 0;
                this.creditTransactionCount = 0;

                this.debitTransactionTotal = 0;
                this.debitTransactionCount = 0;

                this.bankAccountCount = 0;
                this.bankAccounts = [];

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

        this.totalDataSource.load();
        this.dataGrid.instance.refresh();
        this.categorizationComponent.refreshCategories();
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];

        this.processFilterInternal();
        this.initToolbarConfig();
    }

    searchAllClick() {
        this.cashFlowCategoryFilter = [];
        this.categorizationComponent.clearSelection(false);

        this.filtersService.clearAllFilters();
        this.selectedCashflowCategoryKey = null;
        this.initToolbarConfig();
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
    toggleSubaccountsDetails() {
        this.defaultSubaccountTooltipVisible = !this.defaultSubaccountTooltipVisible;
    }
    applyTotalFilters(classified: boolean, credit: boolean, debit: boolean) {
        let classifiedFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption === 'classified'; });
        let amountFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption === 'Amount'; });

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

    clearClassifiedFilter() {
        let classifiedFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption === 'classified'; });
        classifiedFilter.items['yes'].setValue(false, classifiedFilter);
        classifiedFilter.items['no'].setValue(false, classifiedFilter);
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

        Observable.forkJoin(
            this._TransactionsServiceProxy.getTransactionTypesAndCategories(),
            this._TransactionsServiceProxy.getFiltersInitialData(InstanceType[this.instanceType], this.instanceId),
            this._bankAccountsServiceProxy.getBankAccounts(InstanceType[this.instanceType], this.instanceId, 'USD')
        ).subscribe(result => {

            this.filtersService.setup(
                this.filters = [
                    new FilterModel({
                        component: FilterCalendarComponent,
                        operator: { from: 'ge', to: 'le' },
                        caption: 'Date',
                        field: 'Date',
                        items: { from: new FilterItemModel(), to: new FilterItemModel() },
                        options: { method: 'getFilterByDate' }
                    }),
                    new FilterModel({
                        component: BankAccountFilterComponent,
                        caption: 'Account',
                        items: {
                            element: new BankAccountFilterModel(
                                {
                                    dataSource: result[2],
                                    nameField: 'name',
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
            let classifiedFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption === 'classified'; });
            if (this.selectedCashflowCategoryKey && classifiedFilter.items['no'].value === true && classifiedFilter.items['yes'].value !== true) {
                this.cashFlowCategoryFilter = [];
                this.categorizationComponent.clearSelection(false);
                this.processFilterInternal();
                this.selectedCashflowCategoryKey = null;
            } else {
                this.processFilterInternal();
            }
        });
    }

    setDataSource() {
        this.dataGrid.dataSource = this.dataSource;
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
    }

    applyTotalBankAccountFilter(data) {
        this.setDataSource();
        let accountFilter: FilterModel = _.find(this.filters, function (f: FilterModel) { return f.caption.toLowerCase() === 'account'; });
        if (!accountFilter) {
            setTimeout(() => {
                this.applyTotalBankAccountFilter(data);
            }, 300);
        } else {
            if (data.bankAccountIds) {
                accountFilter.items['element'].setValue(data.bankAccountIds, accountFilter);
            } else {
                accountFilter.items['element'].setValue([], accountFilter);
            }
            this.filtersService.change(accountFilter);
        }
    }

    processFilterInternal() {
        let filterQuery = this.processODataFilter(this.dataGrid.instance,
            this.dataSourceURI, this.cashFlowCategoryFilter.concat(this.filters),
            (filter) => {
                if (filter.caption && filter.caption.toLowerCase() === 'account') {
                    this.bankAccountSelector.setSelectedBankAccounts(filter.items.element.value);
                }
                let filterMethod = this['filterBy' +
                    this.capitalize(filter.caption)];
                if (filterMethod)
                    return filterMethod.call(this, filter);
            }
        );
        this.totalDataSource['_store']['_url'] = this.getODataURL(this.totalDataSourceURI, filterQuery);
        this.totalDataSource.load();

        this.transactionsFilterQuery = _.reject(filterQuery, (x) => _.has(x, 'AccountingTypeId')
            || (_.has(x, 'CashflowCategoryId') && typeof x['CashflowCategoryId'] == 'number')
            || _.has(x, 'CashflowSubCategoryId'));
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

    filterByAccount(filter) {
        let data = {};
        if (filter.items.element) {
            let filterData = [];
            filter.items.element.dataSource.forEach((syncAccount, i) => {
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    if (bankAccount['selected']) {
                        filterData.push({
                            BankAccountId: + bankAccount.id
                        });
                    }
                });
            });
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
            else if (isNaN(data.key))
                field['AccountingTypeId'] = new FilterItemModel(parseInt(data.key));
            else if (isNaN(data.parent))
                field['CashflowCategoryId'] = new FilterItemModel(parseInt(data.key));
            else
                field['CashflowSubCategoryId'] = new FilterItemModel(parseInt(data.key));

            this.cashFlowCategoryFilter = [
                new FilterModel({
                    items: field
                })
            ];
            this.clearClassifiedFilter();
            this.processFilterInternal();
        } else if (this.selectedCashflowCategoryKey) {
            this.cashFlowCategoryFilter = [];
            this.processFilterInternal();
        }

        this.selectedCashflowCategoryKey = data && data.key;
        this.initToolbarConfig();
    }

    onSelectionChanged($event, initial = false) {
        let img = new Image(),
            transactionKeys = this.dataGrid.instance ? this.dataGrid.instance.getSelectedRowKeys() : [];
        img.src = 'assets/common/icons/drag-icon.svg';
        if (!initial && (Boolean(this.selectedCashflowCategoryKey) || Boolean(transactionKeys.length)))
            this.categoriesShowed = true;
        let element = <any>$($event.element);
        element.find('tr.dx-data-row').removeAttr('draggable').off('dragstart').off('dragend')
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

    onCellClick($event) {
        if ($event.rowType === 'data') {
            if (($event.column.dataField == 'CashflowCategoryName' && $event.data.CashflowCategoryId) ||
                ($event.column.dataField == 'CashflowSubCategoryName' && $event.data.CashflowSubCategoryId)) {
                this.dialog.open(RuleDialogComponent, {
                    panelClass: 'slider',
                    data: {
                        instanceId: this.instanceId,
                        instanceType: this.instanceType,
                        categoryId: $event.column.dataField == 'CashflowCategoryName' ? $event.data.CashflowCategoryId : $event.data.CashflowSubCategoryId,
                        categoryCashflowTypeId: $event.CashFlowTypeId,
                        transactions: [$event.data],
                        transactionIds: [$event.data.Id],
                        refershParent: this.refreshDataGrid.bind(this)
                    }
                }).afterClosed().subscribe(result => { });
            }
        }
        if ($event.rowType === 'data' && $event.column.dataField == 'Description') {
            $event.cellElement.setAttribute('class', 'transactionDetailTarget'); // @TODO: need update this to dynamicaly target
            this.transactionId = $event.data.Id;
            this.transactionInfo.toggleTransactionDetailsInfo();
        }
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data') {
            if ($event.column.dataField == 'CashflowCategoryName' && !$event.data.CashflowCategoryName) {
                let parentRow = <HTMLTableRowElement>$event.cellElement.parentElement;
                if (parentRow) {
                    let rowIndex = parentRow.rowIndex;
                    let rows = $event.cellElement.closest('.dx-datagrid-rowsview').querySelectorAll(`tr:nth-of-type(${rowIndex + 1})`);
                    /** add uncategorized class to both checkbox and row (hack) */
                    for (let i = 0; i < rows.length; i++) {
                        rows[i].classList.add(`uncategorized`);
                    }
                }
            } else if ($event.column.dataField == 'CashflowSubCategoryName' && $event.data.CashflowSubCategoryName) {
                $event.cellElement.classList.add('clickable-item');
            }
        }
    }

    onContentReady($event) {
        this.onSelectionChanged($event, true);
    }

    categorizeTransactions($event) {
        let transactions = this.dataGrid
            .instance.getSelectedRowKeys();
        let transactionIds = transactions.map(t => t.Id);

        if ($event.categoryId) {
            let updateTransactionCategoryMethod = (suppressCashflowTypeMismatch: boolean = false) => {
                this._classificationServiceProxy.updateTransactionsCategory(
                    InstanceType[this.instanceType],
                    this.instanceId,
                    new UpdateTransactionsCategoryInput({
                        transactionIds: transactionIds,
                        categoryId: $event.categoryId,
                        standardDescriptor: null,
                        descriptorAttributeTypeId: null,
                        suppressCashflowMismatch: suppressCashflowTypeMismatch
                    })
                ).subscribe(() => {
                    if (this.filtersService.hasFilterSelected || this.selectedCashflowCategoryKey) {
                        this.refreshDataGrid();
                    } else {
                        let gridItems = this.dataGrid.instance.getDataSource().items().filter((v) => _.some(transactionIds, x => x == v.Id));
                        let selectedRowIndexes: number[] = [];
                        let totalTransactionsSource = this.totalDataSource.items()[0];
                        let categoryTreeTransactionCountSource = this.categorizationComponent.transactionsCountDataSource.items()[0];
                        gridItems.forEach(
                            (i) => {
                                if (i.CashflowCategoryId) {
                                    let previousCategory = i.CashflowSubCategoryId || i.CashflowCategoryId;
                                    if (categoryTreeTransactionCountSource[previousCategory])
                                        categoryTreeTransactionCountSource[previousCategory]--;
                                }
                                if (categoryTreeTransactionCountSource[$event.categoryId])
                                    categoryTreeTransactionCountSource[$event.categoryId]++;
                                else
                                    categoryTreeTransactionCountSource[$event.categoryId] = 1;

                                if (!i.CashflowCategoryId) {
                                    if (i.Amount > 0)
                                        totalTransactionsSource.classifiedCreditTransactionCount++;
                                    else
                                        totalTransactionsSource.classifiedDebitTransactionCount++;
                                }

                                i.CashflowSubCategoryId = $event.parentId ? $event.categoryId : null;
                                i.CashflowSubCategoryName = $event.parentId ? $event.categoryName : null;
                                i.CashflowCategoryId = $event.parentId ? $event.parentId : $event.categoryId;
                                i.CashflowCategoryName = $event.parentId ? $event.parentName : $event.categoryName;
                                i.CashFlowTypeId = $event.categoryCashType;
                                i.CashFlowTypeName = $event.categoryCashType == 'I' ? 'Inflows' : 'Outflows';

                                selectedRowIndexes.push(this.dataGrid.instance.getRowIndexByKey(i));
                            }
                        );

                        this.dataGrid.instance.selectRows(gridItems, false);
                        this.dataGrid.instance.repaintRows(selectedRowIndexes);

                        this.getTotalValues();
                        this.categorizationComponent.setTransactionsCount();
                    }

                    if ($event.showRuleDialog) {
                        this.dialog.open(RuleDialogComponent, {
                            panelClass: 'slider',
                            data: {
                                instanceId: this.instanceId,
                                instanceType: this.instanceType,
                                categoryId: $event.categoryId,
                                categoryCashflowTypeId: $event.categoryCashType,
                                transactions: transactions,
                                transactionIds: transactionIds,
                                refershParent: this.refreshDataGrid.bind(this)
                            }
                        }).afterClosed().subscribe(result => { });
                    }
                });
            };

            if (_.some(transactions, x => x.CashFlowTypeId != $event.categoryCashType)) {
                abp.message.confirm(this.l('RuleDialog_ChangeCashTypeMessage'), this.l('RuleDialog_ChangeCashTypeTitle'),
                    (result) => {
                        if (result) {
                            updateTransactionCategoryMethod(true);
                        }
                    });
            } else {
                updateTransactionCategoryMethod(false);
            }
        }
    }


    autoClassify(param): void {
        switch (param) {
            case 'credit':
                this.toggleCreditDefault();
                break;
            case 'debit':
                this.toggleDebitDefault();
                break;
            case 'total':
                this.toggleTotalDefault();
                break;
        }
        this.notify.info('Auto-classification has started');
        this._classificationServiceProxy.autoClassify(InstanceType[this.instanceType], this.instanceId, this.autoClassifyData)
            .subscribe((result) => {
                this.notify.info('Auto-classification has ended');
                return result;
            });
    }

    openDialog(param): void {
        switch (param) {
            case 'credit':
                this.toggleCreditDefault();
                break;
            case 'debit':
                this.toggleDebitDefault();
                break;
            case 'total':
                this.toggleTotalDefault();
                break;
        }
        let dialogRef = this.dialog.open(ChooseResetRulesComponent, {
            width: '450px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.resetRules = result;
                this.reset();
            }
        });
    }

    reset(): void {
        this.notify.info('Reset process has started');
        this._classificationServiceProxy.reset(InstanceType[this.instanceType], this.instanceId, this.resetRules)
            .subscribe((result) => {
                this.notify.info('Reset process has ended');
                return result;
            });
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
