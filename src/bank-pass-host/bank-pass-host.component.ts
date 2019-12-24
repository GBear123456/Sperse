import { Component, ViewEncapsulation } from '@angular/core';
import { BankPassComponent } from '@root/bank-code/products/bank-pass/bank-pass.component';

@Component({
    selector: 'bank-pass-host',
    templateUrl: '../bank-code/products/bank-pass/bank-pass.component.html',
    styleUrls: [
        '../app/shared/core.less',
        '../assets/metronic/dist/html/blue/assets/demo/blue/base/style.bundle.light.css',
        '../node_modules/devextreme/dist/css/dx.common.css',
        '../node_modules/devextreme/dist/css/dx.light.css',
        '../bank-code/products/bank-pass/bank-pass.component.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class BankPassHostComponent extends BankPassComponent {}