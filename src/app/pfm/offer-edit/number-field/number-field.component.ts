import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import startCase from 'lodash/startCase';

@Component({
    selector: 'number-field',
    templateUrl: './number-field.component.html',
    styleUrls: ['./number-field.component.less']
})
export class NumberFieldComponent implements OnInit {
    @Input() name: string;
    @Input() label: string;
    @Input() readOnly = false;
    @Input() isCurrency = false;
    @Input() value: number;
    @Output() valueChange: EventEmitter<number> = new EventEmitter<number>();
    constructor(public ls: AppLocalizationService) { }

    ngOnInit() {
        if (!this.label) {
            this.label = startCase(this.name);
        }
    }

}
