import { Component, Input } from '@angular/core';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';

@Component({
    selector: 'bank-code-letter',
    templateUrl: './bank-code-letter.component.html',
    styleUrls: ['./bank-code-letter.component.less']
})
export class BankCodeLetterComponent {
    @Input() letter: BankCodeLetter;
    @Input() showDescriptionOnHover = false;
    @Input() allowEdit = false;

    constructor(public bankCodeService: BankCodeService) {}
}
