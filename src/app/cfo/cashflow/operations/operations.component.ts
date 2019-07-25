/** Core imports */
import { Component, Injector, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from '@app/app.service';
import { BankAccountsSelectDialogComponent } from 'app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CFOService } from '@shared/cfo/cfo.service';

@Component({
    selector: 'cashflow-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.less']
})

export class OperationsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() repaintCashflow: EventEmitter<any> = new EventEmitter();
    @Output() onGroupBy: EventEmitter<any> = new EventEmitter();
    @Output() onToggleRows: EventEmitter<any> = new EventEmitter();
    @Output() handleFullscreen: EventEmitter<any> = new EventEmitter();
    @Output() download: EventEmitter<any> = new EventEmitter();
    @Output() showPreferencesDialog: EventEmitter<any> = new EventEmitter();
    @Output() onSearchValueChange: EventEmitter<any> = new EventEmitter();
    @Output() onRefresh: EventEmitter<any> = new EventEmitter();
    @Output() onSelectedBankAccountsChange: EventEmitter<any> = new EventEmitter();

    bankAccountCount: string;
    totalCount = 3;
    selectedGroupByIndex = 0;

    constructor(injector: Injector,
        private _filtersService: FiltersService,
        private _appService: AppService,
        private _cfoService: CFOService,
        private _bankAccountsService: BankAccountsService,
        private _dialog: MatDialog
    ) {
        super(injector);
    }

    ngOnInit() {
        this._bankAccountsService.accountsAmountWithApply$.subscribe( amount => {
            this.bankAccountCount = amount;
        });
    }

    initToolbarConfig() {
        this._appService.updateToolbar([
            {
                location: 'before',
                items: [
                    {
                        name: 'filters',
                        visible: !this._cfoService.hasStaticInstance,
                        action: () => {
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
                        name: 'select-box',
                        text: this.ls('CFO', 'CashflowToolbar_Group_By'),
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('CashflowToolbar_Group_By'),
                            width: 175,
                            selectedIndex: this.selectedGroupByIndex,
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
                            ],
                            onSelectionChanged: (e) => {
                                if (e) {
                                    this.selectedGroupByIndex = e.itemIndex;
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
                        name: 'bankAccountSelect',
                        widget: 'dxButton',
                        action: this.openBankAccountsSelectDialog.bind(this),
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
                    {
                        name: 'comments',
                        visible: !this._cfoService.hasStaticInstance,
                    },
                    {
                        name: 'fullscreen',
                        visible: !this._cfoService.hasStaticInstance,
                        action: this.fullscreen.bind(this)
                    }
                ]
            },
        ]);
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

    filterByBankAccounts() {
        this.onSelectedBankAccountsChange.emit();
    }

    openBankAccountsSelectDialog() {
        this._dialog.open(BankAccountsSelectDialogComponent, {
            panelClass: 'slider',
        }).componentInstance.onApply.subscribe(() => {
            this.filterByBankAccounts();
        });
    }

    ngOnDestroy() {
        this._appService.updateToolbar(null);
    }
}
