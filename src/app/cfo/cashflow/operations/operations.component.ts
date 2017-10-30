import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'cashflow-operations',
    templateUrl: './operations.component.html',
    styleUrls: ['./operations.component.less']
})

export class OperationsComponent extends AppComponentBase implements OnInit {
    toolbarItems: any;
    constructor(injector: Injector) {
        super(injector);
        this.toolbarItems = [{
            location: 'before',
            widget: 'dxButton',
            options: {
                hint: this.l('Back'),
                iconSrc: 'assets/common/icons/back-arrow.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: this.l('Edit'),
                iconSrc: 'assets/common/icons/edit-pencil-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: this.l('Rules'),
                iconSrc: 'assets/common/icons/rules-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: this.l('Expand all'),
                iconSrc: 'assets/common/icons/expand-all-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'center',
            widget: 'dxButton',
            options: {
                hint: this.l('Flag'),
                iconSrc: 'assets/common/icons/flag-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'center',
            widget: 'dxButton',
            options: {
                hint: this.l('Label'),
                iconSrc: 'assets/common/icons/label-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'center',
            widget: 'dxButton',
            options: {
                hint: this.l('More'),
                text: 'More',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: this.l('Download'),
                iconSrc: 'assets/common/icons/download-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: this.l('Print'),
                iconSrc: 'assets/common/icons/print-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: this.l('Box'),
                iconSrc: 'assets/common/icons/box-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: this.l('Pipeline'),
                iconSrc: 'assets/common/icons/pipeline-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: this.l('Grid'),
                iconSrc: 'assets/common/icons/table-icon.svg',
                onClick: Function()
            }
        }];
    }

    ngOnInit() {
    }

}
