import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'from-to-field',
    templateUrl: './from-to-field.component.html',
    styleUrls: ['./from-to-field.component.less']
})
export class FromToFieldComponent implements OnInit {
    @Input() isCurrency = false;
    @Input() fromName: string;
    @Input() toName: string;
    @Input() label;
    @Input() readOnly = false;
    @Input() fromValue: string;
    @Input() toValue: string;
    @Output() fromValueChange: EventEmitter<string> = new EventEmitter<string>();
    @Output() toValueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor(public ls: AppLocalizationService) { }

    ngOnInit() {}

    clearValues() {
        this.fromValueChange.emit('');
        this.toValueChange.emit('');
    }
}
