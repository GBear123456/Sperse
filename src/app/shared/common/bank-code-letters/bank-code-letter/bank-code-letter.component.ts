import { Component, Input } from '@angular/core';

@Component({
    selector: 'bank-code-letter',
    templateUrl: './bank-code-letter.component.html',
    styleUrls: ['./bank-code-letter.component.less']
})
export class BankCodeLetterComponent {
    @Input() letter: string;
}
