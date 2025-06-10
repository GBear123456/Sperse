import { Component } from '@angular/core';
import { BankPassComponent } from '@root/bank-code/products/bank-pass/bank-pass.component';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { BANKCodeServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'bank-pass-host',
    templateUrl: '../../bank-code/products/bank-pass/bank-pass.component.html',
    styleUrls: [
        '../../bank-code/products/bank-pass/bank-pass.component.less',
        './bank-pass-host.component.less'
    ],
    providers: [ BANKCodeServiceProxy, LifecycleSubjectsService ]
})
export class BankPassHostComponent extends BankPassComponent {}
