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
    @Input() showDescriptionOnClick = false;
    @Input() showDescriptionOnHover = false;
    @Input() allowEdit = false;
    @Input() key = '';
    @Input() active = true;
    @Output() onClick: EventEmitter<null> = new EventEmitter<null>();
    letters = BankCodeLetter;
    showTooltip = false;
    showPopup = false;

    constructor(private bankCodeService: BankCodeService) {}

    click(event) {
        if (this.showDescriptionOnClick) {
            event.stopPropagation();
            this.showPopup = true;
        } else
            this.onClick.emit(event);
    }

    toggleTooltip() {
        if (this.showDescriptionOnHover) {
            this.showTooltip = !this.showTooltip;
        }
    }

    getStylesByLetter(letter) {
        let styles: any = this.bankCodeService.getColorsByLetter(letter);
        if (styles && styles.background && !this.active) {
            styles['border'] = '1px solid ' + styles.background;
            delete styles.background;
        }
        if (this.showDescriptionOnClick) {
            styles = {
                ...styles,
                cursor: 'pointer'
            };
        }
        return styles;
    }
}