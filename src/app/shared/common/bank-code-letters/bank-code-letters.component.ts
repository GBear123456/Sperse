import { Component, Input } from '@angular/core';

@Component({
    selector: 'bank-code-letters',
    templateUrl: './bank-code-letters.component.html',
    styleUrls: ['./bank-code-letters.component.less']
})
export class BankCodeLettersComponent {
    @Input() bankCode: string;
    @Input() showDescriptionsOnHover = false;
}
