import { Component, Input } from '@angular/core';

@Component({
    selector: 'subscription',
    templateUrl: 'subscription.component.html',
    styleUrls: ['./subscription.component.less']
})
export class SubscriptionComponent {
    @Input() pricePerMonth = 59;
    @Input() annualSave = 228;
    @Input() offerId = 718;
    @Input() productName = 'ai';
    constructor() {}
}
