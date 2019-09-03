import { Component, Input } from '@angular/core';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';

@Component({
    selector: 'bank-code-letter',
    templateUrl: './bank-code-letter.component.html',
    styleUrls: ['./bank-code-letter.component.less']
})
export class BankCodeLetterComponent {
    @Input() letter: string;
    @Input() showDescriptionOnHover = false;
    @Input() allowEdit = false;

    constructor(public bankCodeService: BankCodeService) {}
}
