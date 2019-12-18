import { Component, EventEmitter, Input, Output } from '@angular/core';
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
    @Input() key = '';
    @Output() onClick: EventEmitter<null> = new EventEmitter<null>();

    constructor(public bankCodeService: BankCodeService) {}

    click(e) {
        this.onClick.emit(e);
    }
}
