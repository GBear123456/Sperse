import { Component, Injector, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'cashflow-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.less']
})

export class OperationsComponent extends AppComponentBase {
    toolbarItems: any;
    @Output() refreshCashflow: EventEmitter<any> = new EventEmitter();
    @Output() onGroupBy: EventEmitter<any> = new EventEmitter();
    @Output() handleFullscreen: EventEmitter<any> = new EventEmitter();

    toolbarConfig = [
        {
            location: 'before',
            items: [
                { name: 'back' }
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
        }, {
            location: 'before',
            items: [
                { name: 'edit' },
                { name: 'rules' },
                {
                    name: 'expand',
                    options: {
                        text: this.l('Expand All')
                    }
                }
            ]
        },
        {
            location: 'before',
            items: [
                { name: 'flag' },
                {
                    name: 'pen',
                    options: {
                        hint: this.l('Label')
                    }
                }
            ]
        },
        {
            location: 'before',
            items: [
                { name: 'more' }
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
        },
        {
            location: 'after',
            items: [
                { name: 'download' },
                { name: 'print' }
            ]
        },
        {
            location: 'after', items: [
                {name: 'comments'},
                {name: 'fullscreen', action: this.fullscreen.bind(this)}
            ]
        }
    ];

    constructor(injector: Injector) {
        super(injector);
    }

    groupBy(event) {
      this.onGroupBy.emit(event);
    }

    refresh() {
        this.refreshCashflow.emit(null);
    }

    fullscreen() {
        this.handleFullscreen.emit();
    }
}
