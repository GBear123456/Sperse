import { Component, OnInit, Injector, ChangeDetectionStrategy, Input } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'pay-pal',
    templateUrl: './pay-pal.component.html',
    styleUrls: ['./pay-pal.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayPalComponent extends AppComponentBase implements OnInit {
    @Input() descriptionText = this.l('PayPalPaymentDescriptionText');

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }
}
