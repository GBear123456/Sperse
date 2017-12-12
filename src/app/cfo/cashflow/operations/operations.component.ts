import {Component, Injector, Input, Output, EventEmitter} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'cashflow-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.less']
})

export class OperationsComponent extends AppComponentBase {
    @Input('forecastModelsObj')
    set forecastModelsObj(forecastModelsObj) {
        this.initToolbarConfig(forecastModelsObj);
    }
    @Output() refreshCashflow: EventEmitter<any> = new EventEmitter();
    @Output() onGroupBy: EventEmitter<any> = new EventEmitter();
    @Output() onToggleRows: EventEmitter<any> = new EventEmitter();
    @Output() handleFullscreen: EventEmitter<any> = new EventEmitter();
    @Output() download: EventEmitter<any> = new EventEmitter();
    @Output() showPreferences: EventEmitter<any> = new EventEmitter();
    @Output() changeForecastModel: EventEmitter<any> = new EventEmitter();
    toolbarConfig = [];
    initToolbarConfig(forecastModelsObj: { items: Array<any>, selectedItemIndex: number} = { 'items' : [], 'selectedItemIndex': null}) {
        this.toolbarConfig = [
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
                        action: this.preferences.bind(this)
                    },
                    {
                        name: 'slider',
                        widget: 'dxGallery',
                        options: {
                            hint: this.l('Scenario'),
                            accessKey: 'cashflowForecastSwitcher',
                            items: forecastModelsObj.items,
                            showNavButtons: true,
                            showIndicator: false,
                            scrollByContent: true,
                            selectedIndex: forecastModelsObj.selectedItemIndex,
                            height: 39,
                            width: 138,
                            /** to change the default template for dxGallery with rendering of an image */
                            itemTemplate: itemData => {
                                return itemData.text;
                            },
                            onSelectionChanged: (e) => {
                                this.changeSelectedForecastModel(e);
                            }
                        }
                    },
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
                                text: this.l('Save as PDF'),
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
            {
                location: 'after',
                items: [
                    {
                        name: 'refresh',
                        action: this.refresh.bind(this)
                    }
                ]
            }
        ];
    }

    constructor(injector: Injector) {
        super(injector);
    }

    exportTo(event) {
        this.download.emit(event);
    }

    groupBy(event) {
        this.onGroupBy.emit(event);
    }

    refresh() {
        this.refreshCashflow.emit(null);
    }

    toggleRows(event) {
        this.onToggleRows.emit(event);
    }

    fullscreen() {
        this.handleFullscreen.emit();
    }

    changeSelectedForecastModel(event) {
        this.changeForecastModel.emit(event);
    }

    preferences() {
        this.showPreferences.emit();
    }
}
