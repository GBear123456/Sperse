/** Core imports */
import { Component, Injector, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { Store } from '@ngrx/store';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from '@app/app.service';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { ReportPeriodComponent } from '@app/cfo/shared/report-period/report-period.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CfoStore, CurrenciesStoreActions } from '@app/cfo/store';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Component({
    selector: 'cashflow-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.less']
})

export class OperationsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    @ViewChild(ReportPeriodComponent) reportPeriodSelector: ReportPeriodComponent;
    private initReportPeriodTimeout: any;
    @Input('reportPeriod')
    set reportPeriod(reportPeriod) {
        clearTimeout(this.initReportPeriodTimeout);
        this.initReportPeriodTimeout = setTimeout(() => {
            this.sliderReportPeriod = reportPeriod;
        }, 300);
    }
    @Output() repaintCashflow: EventEmitter<any> = new EventEmitter();
    @Output() onGroupBy: EventEmitter<any> = new EventEmitter();
    @Output() onToggleRows: EventEmitter<any> = new EventEmitter();
    @Output() handleFullscreen: EventEmitter<any> = new EventEmitter();
    @Output() download: EventEmitter<any> = new EventEmitter();
    @Output() showPreferencesDialog: EventEmitter<any> = new EventEmitter();
    @Output() onSearchValueChange: EventEmitter<any> = new EventEmitter();
    @Output() onRefresh: EventEmitter<any> = new EventEmitter();
    @Output() onReportPeriodChange: EventEmitter<any> = new EventEmitter();
    @Output() onSelectedBankAccountsChange: EventEmitter<any> = new EventEmitter();

    bankAccountCount: string;
    visibleAccountCount = 0;
    sliderReportPeriod = {
        start: null,
        end: null,
        minDate: null,
        maxDate: null
    };
    totalCount = 3;

    constructor(injector: Injector,
        private _filtersService: FiltersService,
        private _appService: AppService,
        private _bankAccountsService: BankAccountsService,
        private cfoPreferencesService: CfoPreferencesService,
        private store$: Store<CfoStore.State>
    ) {
        super(injector);
    }

    ngOnInit() {
        this._bankAccountsService.accountsAmount$.subscribe( amount => {
            this.bankAccountCount = amount;
        });
    }

    initToolbarConfig() {
        this.cfoPreferencesService.getCurrenciesAndSelectedIndex()
            .subscribe(([currencies, selectedCurrencyIndex]) => {
                this._appService.updateToolbar([
                    {
                        location: 'before',
                        items: [
                            {
                                name: 'filters',
                                action: (event) => {
                                    setTimeout(this.repaint.bind(this), 1000);
                                    this._filtersService.fixed = !this._filtersService.fixed;
                                },
                                options: {
                                    checkPressed: () => {
                                        return this._filtersService.fixed;
                                    },
                                    mouseover: () => {
                                        this._filtersService.enable();
                                    },
                                    mouseout: () => {
                                        if (!this._filtersService.fixed)
                                            this._filtersService.disable();
                                    }
                                },
                                attr: {
                                    'filter-selected': this._filtersService.hasFilterSelected
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
                                    + this.l('Transaction').toLowerCase(),
                                    onValueChanged: this.searchValueChange.bind(this)
                                }
                            }
                        ]
                    },
                    {
                        location: 'before',
                        locateInMenu: 'auto',
                        items: [
                            {
                                name: 'reportPeriod',
                                action: this.toggleReportPeriodFilter.bind(this),
                                options: {
                                    id: 'reportPeriod',
                                    icon: './assets/common/icons/report-period.svg'
                                }
                            },
                            {
                                name: 'select-box',
                                text: this.ls('CFO', 'CashflowToolbar_Group_By'),
                                widget: 'dxDropDownMenu',
                                options: {
                                    width: 175,
                                    items: [
                                        {
                                            action: this.groupBy.bind(this),
                                            text: 'Years'
                                        }, {
                                            action: this.groupBy.bind(this),
                                            text: 'Quarters'
                                        }, {
                                            action: this.groupBy.bind(this),
                                            text: 'Months'
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    {
                        location: 'before',
                        locateInMenu: 'auto',
                        items: [
                            {
                                name: 'bankAccountSelect',
                                widget: 'dxButton',
                                action: this.toggleBankAccountTooltip.bind(this),
                                options: {
                                    id: 'bankAccountSelect',
                                    text: this.l('Accounts'),
                                    icon: './assets/common/icons/accounts.svg'
                                },
                                attr: {
                                    'custaccesskey': 'bankAccountSelect',
                                    'accountCount': this.bankAccountCount
                                }
                            },
                        ]
                    },
                    {
                        location: 'before',
                        locateInMenu: 'auto',
                        items: [
                            {
                                name: 'select-box',
                                text: '',
                                widget: 'dxDropDownMenu',
                                accessKey: 'currencySwitcher',
                                options: {
                                    hint: this.l('Currency'),
                                    accessKey: 'currencySwitcher',
                                    items: currencies,
                                    selectedIndex: selectedCurrencyIndex,
                                    height: 39,
                                    width: 220,
                                    onSelectionChanged: (e) => {
                                        if (e) {
                                            this.store$.dispatch(new CurrenciesStoreActions.ChangeCurrencyAction(e.itemData.id));
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    {
                        location: 'before',
                        locateInMenu: 'auto',
                        items: [
                            {
                                name: 'rules',
                                action: this.preferencesDialog.bind(this)
                            }
                        ]
                    },
                    {
                        location: 'after',
                        locateInMenu: 'auto',
                        items: [
                            {
                                name: 'download',
                                widget: 'dxDropDownMenu',
                                options: {
                                    hint: this.l('Download'),
                                    items: [{
                                        action: Function(),
                                        text: this.l('SaveAs', 'PDF'),
                                        format: 'pdf',
                                        icon: 'pdf',
                                    }, {
                                        action: this.exportTo.bind(this),
                                        text: this.l('Export to Excel'),
                                        format: 'xls',
                                        icon: 'xls',
                                    }, {
                                        action: Function(),
                                        text: this.l('Export to CSV'),
                                        format: 'csv',
                                        icon: 'sheet'
                                    }, {
                                        action: this.exportTo.bind(this),
                                        text: this.l('Export to Google Sheets'),
                                        format: 'gs',
                                        icon: 'sheet'
                                    }]
                                }
                            },
                            {
                                name: 'print',
                                options: {
                                    width: 58
                                }
                            }
                        ]
                    },
                    {
                        location: 'after',
                        locateInMenu: 'auto',
                        items: [
                            { name: 'comments' },
                            { name: 'fullscreen', action: this.fullscreen.bind(this) }
                        ]
                    },
                ]);
            });
    }

    exportTo(event) {
        this.download.emit(event);
    }

    groupBy(event) {
        this.onGroupBy.emit(event);
    }

    repaint() {
        this.repaintCashflow.emit(null);
    }

    toggleRows(event) {
        this.onToggleRows.emit(event);
    }

    fullscreen() {
        this.handleFullscreen.emit();
    }

    preferencesDialog() {
        this.showPreferencesDialog.emit();
    }

    searchValueChange(event) {
        this.searchValue = event['value'];
        this.onSearchValueChange.emit(this.searchValue);
        this.initToolbarConfig();
    }

    refresh() {
        this.onRefresh.emit();
    }

    toggleReportPeriodFilter() {
        this.reportPeriodSelector.toggleReportPeriodFilter();
    }

    reportPeriodChange(period) {
        this.onReportPeriodChange.emit(period);
    }

    filterByBankAccounts(data) {
        this.onSelectedBankAccountsChange.emit(data);
    }

    toggleBankAccountTooltip() {
        this.bankAccountSelector.toggleBankAccountTooltip();
    }

    ngOnDestroy() {
        this._appService.updateToolbar(null);
    }
}
