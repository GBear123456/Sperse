import { Component, Injector, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from '@app/app.service';

@Component({
    selector: 'cashflow-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.less']
})

export class OperationsComponent extends AppComponentBase implements OnDestroy {
    private initTimeout: any;
    @Input('forecastModelsObj')
    set forecastModelsObj(forecastModelsObj) {
        clearTimeout(this.initTimeout);
        this.initTimeout = setTimeout(() => {
            this.initToolbarConfig(forecastModelsObj);
        }, 300);
    }
    @Output() repaintCashflow: EventEmitter<any> = new EventEmitter();
    @Output() onGroupBy: EventEmitter<any> = new EventEmitter();
    @Output() onToggleRows: EventEmitter<any> = new EventEmitter();
    @Output() handleFullscreen: EventEmitter<any> = new EventEmitter();
    @Output() download: EventEmitter<any> = new EventEmitter();
    @Output() showPreferencesDialog: EventEmitter<any> = new EventEmitter();

    initToolbarConfig(forecastModelsObj: { items: Array<any>, selectedItemIndex: number} = { 'items' : [], 'selectedItemIndex': null}) {
        this._appService.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'filters',
                        action: (event) => {
                            setTimeout(this.repaint.bind(this), 1000);
                            event.element.attr('filter-pressed',
                                this._filtersService.fixed =
                                    !this._filtersService.fixed);
                        },
                        options: {
                            mouseover: (event) => {
                                this._filtersService.enable();
                            },
                            mouseout: (event) => {
                                if (!this._filtersService.fixed)
                                    this._filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this._filtersService.hasFilterSelected,
                            'filter-pressed': this._filtersService.fixed
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
                            width: '300',
                            mode: 'search',
                            placeholder: this.l('Search') + ' '
                                + this.l('Transaction').toLowerCase()
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'select-box',
                        text: this.l('Group By'),
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
                            }, {
                                action: this.groupBy.bind(this),
                                text: 'Days'
                            }]
                        }
                    }
                ]
            },
            {
                location: 'before',
                items: [
                    {
                        name: 'expandRows',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Expand rows'),
                            items: [{
                                action: this.toggleRows.bind(this),
                                text: this.l('Level 1'),
                            }, {
                                action: this.toggleRows.bind(this),
                                text: this.l('Level 2'),
                            }, {
                                action: this.toggleRows.bind(this),
                                text: this.l('Level 3'),
                            }, {
                                action: this.toggleRows.bind(this),
                                text: this.l('All'),
                            }, {
                                action: this.toggleRows.bind(this),
                                text: this.l('None'),
                            }]
                        }
                    },
                    {
                        name: 'rules',
                        action: this.preferencesDialog.bind(this)
                    }
                ]
            },
            {
                location: 'after',
                items: [
                    {
                        name: 'flag',
                        widget: 'dxDropDownMenu',
                        options: {
                            width: 62,
                            hint: this.l('Flags'),
                            items: [{
                                action: Function(),
                                text: 'Item one'
                            }, {
                                action: Function(),
                                text: 'Item two'
                            }]
                        }
                    },
                    {
                        name: 'pen',
                        widget: 'dxDropDownMenu',
                        options: {
                            width: 62,
                            hint: this.l('Tags'),
                            items: [{
                                action: Function(),
                                text: 'Item one'
                            }, {
                                action: Function(),
                                text: 'Item two'
                            }]
                        }
                    },
                    {
                        name: 'more',
                        widget: 'dxDropDownMenu',
                        text: this.l('More'),
                        options: {
                            width: 66,
                            hint: this.l('More'),
                            items: [{
                                action: Function(),
                                text: 'Item one'
                            }, {
                                action: Function(),
                                text: 'Item two'
                            }]
                        }
                    }
                ]
            },
            {
                location: 'after',
                items: [
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [{
                                action: Function(),
                                text: this.l('SaveAs', 'PDF'),
                                icon: 'pdf',
                            }, {
                                action: this.exportTo.bind(this),
                                text: this.l('Export to Excel'),
                                icon: 'xls',
                            }, {
                                action: Function(),
                                text: this.l('Export to CSV'),
                                icon: 'sheet'
                            }, {
                                action: this.exportTo.bind(this),
                                text: this.l('Export to Google Sheets'),
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

    ngOnDestroy() {
        this._appService.toolbarConfig = null;
    }
}
