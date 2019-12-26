import { Component, ViewEncapsulation } from '@angular/core';
import { BankPassComponent } from '@root/bank-code/products/bank-pass/bank-pass.component';

@Component({
    selector: 'bank-pass-host',
    templateUrl: '../../../../../src/bank-code/products/bank-pass/bank-pass.component.html',
    styleUrls: [
        '../../../../../src/app/shared/core.less',
        '../../../../../src/assets/metronic/dist/html/blue/assets/demo/blue/base/style.bundle.light.css',
        '../../../../../src/node_modules/devextreme/dist/css/dx.common.css',
        '../../../../../src/node_modules/devextreme/dist/css/dx.light.css',
        '../../../../../src/bank-code/products/bank-pass/bank-pass.component.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class BankPassHostComponent extends BankPassComponent {}
