import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BaseFieldComponent } from '@app/pfm/offer-edit/base-field/base-field.component';

@Component({
    selector: 'from-to-field',
    templateUrl: './from-to-field.component.html',
    styleUrls: ['./from-to-field.component.less']
})
export class FromToFieldComponent extends BaseFieldComponent {
    @Input() isCurrency = false;
    @Input() fromName: string;
    @Input() toName: string;
    @Input() fromValue: string;
    @Input() toValue: string;
    @Output() fromValueChange: EventEmitter<string> = new EventEmitter<string>();
    @Output() toValueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor(public ls: AppLocalizationService) {
        super();
    }

    clearValues() {
        this.fromValueChange.emit('');
        this.toValueChange.emit('');
    }
}
