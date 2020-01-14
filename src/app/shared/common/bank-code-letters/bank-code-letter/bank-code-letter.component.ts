import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';

@Component({
    selector: 'bank-code-letter',
    templateUrl: './bank-code-letter.component.html',
    styleUrls: ['./bank-code-letter.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCodeLetterComponent {
    @Input() letter: BankCodeLetter;
    @Input() showDescriptionOnHover = false;
    @Input() allowEdit = false;
    @Input() key = '';
    @Input() active = true;
    @Output() onClick: EventEmitter<null> = new EventEmitter<null>();
    letters = BankCodeLetter;

    constructor(private bankCodeService: BankCodeService) {}

    click(e) {
        this.onClick.emit(e);
    }

    getColorsByLetter(letter) {
        let colors = this.bankCodeService.getColorsByLetter(letter);
        if (colors && colors.background && !this.active) {
            colors['border'] = '1px solid ' + colors.background;
            delete colors.background;
        }
        return colors;
    }
}
