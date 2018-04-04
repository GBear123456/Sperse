import { Component, Injector, Input, Output, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from '@app/app.service';
import { DxRangeSliderComponent } from 'devextreme-angular';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';

@Component({
    selector: 'cashflow-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.less']
})

export class OperationsComponent extends AppComponentBase implements OnDestroy {
    @ViewChild(BankAccountsSelectComponent) bankAccountSelector: BankAccountsSelectComponent;
    private initTimeout: any;
    private initReportPeriodTimeout: any;
    private initSelectedBankAccountsTimeout: any;
    @Input('reportPeriod')
    set reportPeriod(reportPeriod) {
        clearTimeout(this.initReportPeriodTimeout);
        this.initReportPeriodTimeout = setTimeout(() => {
            this.sliderReportPeriod = reportPeriod;
        }, 300);
    }
    @Input('selectedBankAccounts')
    set selectedBankAccounts(selectedBankAccounts) {
        clearTimeout(this.initSelectedBankAccountsTimeout);
        this.initSelectedBankAccountsTimeout = setTimeout(() => {
            this.bankAccountSelector.setSelectedBankAccounts(selectedBankAccounts);
            if (!selectedBankAccounts.length)
                this.bankAccountCount = '';
            else
                this.bankAccountCount = selectedBankAccounts.length;
            this.initToolbarConfig();
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

    bankAccountCount = '';
    reportPeriodTooltipVisible: boolean = false;
    sliderReportPeriod = {
        start: null,
        end: null,
        minDate: null,
        maxDate: null
    };
    totalCount = 3;

    initToolbarConfig() {
        this._appService.toolbarIsAdaptive = true;
        this._appService.toolbarConfig = [
            {
                location: 'before',
                items: [
                    {
                        name: 'filters',
                        adaptive: false,
                        action: (event) => {
                            setTimeout(this.repaint.bind(this), 1000);
                            this._filtersService.fixed = !this._filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this._filtersService.fixed;
                            },
                            mouseover: (event) => {
                                this._filtersService.enable();
                            },
                            mouseout: (event) => {
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
                        adaptive: false,
                        widget: 'dxTextBox',
                        options: {
                            value: this.searchValue,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' '
                            + this.l('Transaction').toLowerCase(),
                            onValueChanged: this.searchValueChange.bind(this),
                            onKeyPress: this.searchKeyPress.bind(this)
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'reportPeriod',
                        action: this.reportPeriodFilter.bind(this),
                        options: {
                            id: 'reportPeriod',
                            icon: 'assets/common/icons/report-period.svg'
                        }
                    },
                    {
                        name: 'select-box',
                        text: this.ls('CFO', 'CashflowToolbar_Group_By'),
                        widget: 'dxDropDownMenu',
                        options: {
                            width: 175,
                            items: [{
                                action: this.groupBy.bind(this),
                                text: 'Years'
                            }, {
                                action: this.groupBy.bind(this),
                                text: 'Quarters'
                            }, {
                                action: this.groupBy.bind(this),
                                text: 'Months'
                            }]
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'bankAccountSelect',
                        widget: 'dxButton',
                        action: this.toggleBankAccountTooltip.bind(this),
                        options: {
                            id: 'bankAccountSelect',
                            text: this.l('Accounts'),
                            icon: 'assets/common/icons/accounts.svg'
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
                items: [
                    //{
                    //    name: 'expandRows',
                    //    options: {
                    //        hint: this.l('Expand rows'),
                    //        items: [{
                    //            action: this.toggleRows.bind(this),
                    //            text: this.l('Level 1'),
                    //        }, {
                    //            action: this.toggleRows.bind(this),
                    //            text: this.l('Level 2'),
                    //        }, {
                    //            action: this.toggleRows.bind(this),
                    //            text: this.l('Level 3'),
                    //        }, {
                    //            action: this.toggleRows.bind(this),
                    //            text: this.l('All'),
                    //        }, {
                    //            action: this.toggleRows.bind(this),
                    //            text: this.l('None'),
                    //        }]
                    //    }
                    //},
                    {
                        name: 'rules',
                        action: this.preferencesDialog.bind(this)
                    }
                ]
            },
            // {
            //     location: 'after',
            //     items: [
            //         {
            //             name: 'flag',
            //             widget: 'dxDropDownMenu',
            //             options: {
            //                 width: 62,
            //                 hint: this.l('Flags'),
            //                 items: [{
            //                     action: Function(),
            //                     text: 'Item one'
            //                 }, {
            //                     action: Function(),
            //                     text: 'Item two'
            //                 }]
            //             }
            //         },
            //         {
            //             name: 'pen',
            //             widget: 'dxDropDownMenu',
            //             options: {
            //                 width: 62,
            //                 hint: this.l('Tags'),
            //                 items: [{
            //                     action: Function(),
            //                     text: 'Item one'
            //                 }, {
            //                     action: Function(),
            //                     text: 'Item two'
            //                 }]
            //             }
            //         },
            //         {
            //             name: 'more',
            //             widget: 'dxDropDownMenu',
            //             text: this.l('More'),
            //             options: {
            //                 width: 66,
            //                 hint: this.l('More'),
            //                 items: [{
            //                     action: Function(),
            //                     text: 'Item one'
            //                 }, {
            //                     action: Function(),
            //                     text: 'Item two'
            //                 }]
            //             }
            //         }
            //     ]
            // },
            {
                location: 'after',
                items: [
                    {
                        name: 'refresh',
                        action: this.refresh.bind(this)
                    },
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
                location: 'after', items: [
                {name: 'comments'},
                {name: 'fullscreen', action: this.fullscreen.bind(this)}
            ]
            },
        ];
    }

    constructor(injector: Injector,
        private _filtersService: FiltersService,
        private _appService: AppService
    ) {
        super(injector);

        this.initToolbarConfig();
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
    }

    searchKeyPress(event) {
        if (this.searchValue && event.event.charCode === 13)
            this.onSearchValueChange.emit(this.searchValue);
    }

    refresh() {
        this.onRefresh.emit();
    }

    reportPeriodFilter() {
        this.reportPeriodTooltipVisible = !this.reportPeriodTooltipVisible;
    }

    reportPeriodChange() {
        let period = {
            start: this.sliderReportPeriod.start,
            end: this.sliderReportPeriod.end
        };

        this.onReportPeriodChange.emit(period);
    }

    clear() {
        this.onReportPeriodChange.emit({});
        this.reportPeriodTooltipVisible = false;
    }

    apply() {
        this.reportPeriodChange();
        this.reportPeriodTooltipVisible = false;
    }

    filterByBankAccounts(data) {
        this.onSelectedBankAccountsChange.emit(data);
    }

    toggleBankAccountTooltip() {
        this.bankAccountSelector.toggleBankAccountTooltip();
    }

    ngOnDestroy() {
        this._appService.toolbarConfig = null;
    }
}
