import { Component, OnInit, HostBinding, Injector } from '@angular/core';
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
                iconSrc: 'assets/common/images/icons/back-arrow.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: this.l('Edit'),
                iconSrc: 'assets/common/icons/edit-pencil.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: this.l('Rules'),
                iconSrc: 'assets/common/icons/rules.svg',
                onClick: Function()
            }
        }, {
            location: 'before',
            widget: 'dxButton',
            options: {
                text: this.l('Expand all'),
                iconSrc: 'assets/common/icons/expand-all.svg',
                onClick: Function()
            }
        }, {
            location: 'center',
            widget: 'dxButton',
            options: {
                hint: 'Refresh',
                icon: 'icon icon-refresh',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Export to Excel',
                iconSrc: 'assets/common/images/icons/download-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Column chooser',
                iconSrc: 'assets/common/images/icons/clmn-chooser-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Pipeline',
                iconSrc: 'assets/common/images/icons/pipeline-icon.svg',
                onClick: Function()
            }
        }, {
            location: 'after',
            widget: 'dxButton',
            options: {
                hint: 'Grid',
                iconSrc: 'assets/common/images/icons/table-icon.svg',
                onClick: Function()
            }
        }];
    }

    ngOnInit() {
    }

}
