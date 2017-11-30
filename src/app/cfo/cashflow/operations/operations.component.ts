import {Component, Injector, Output, EventEmitter} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'cashflow-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.less']
})

export class OperationsComponent extends AppComponentBase {
    @Output() refreshCashflow: EventEmitter<any> = new EventEmitter();
    @Output() onGroupBy: EventEmitter<any> = new EventEmitter();
    @Output() onToggleRows: EventEmitter<any> = new EventEmitter();
    @Output() handleFullscreen: EventEmitter<any> = new EventEmitter();
    @Output() download: EventEmitter<any> = new EventEmitter();
    @Output() showPreferences: EventEmitter<any> = new EventEmitter();

    toolbarConfig = [
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
        }, {
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

    preferences() {
        this.showPreferences.emit();
    }
}
