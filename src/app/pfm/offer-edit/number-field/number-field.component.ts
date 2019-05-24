import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BaseFieldComponent } from '@app/pfm/offer-edit/base-field/base-field.component';

@Component({
    selector: 'number-field',
    templateUrl: './number-field.component.html',
    styleUrls: ['./number-field.component.less']
})
export class NumberFieldComponent extends BaseFieldComponent implements OnInit {
    @Input() isCurrency = false;
    @Input() value: number;
    @Output() valueChange: EventEmitter<number> = new EventEmitter<number>();
    constructor(public ls: AppLocalizationService) {
        super();
    }

    ngOnInit() {
        super.ngOnInit();
    }

}
