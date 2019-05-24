import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BaseFieldComponent } from '@app/pfm/offer-edit/base-field/base-field.component';

@Component({
    selector: 'dropdown-field',
    templateUrl: './dropdown-field.component.html',
    styleUrls: ['./dropdown-field.component.less']
})
export class DropdownFieldComponent extends BaseFieldComponent implements OnInit {
    @Input() dataSource: any[];
    @Input() value: string;
    @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

    constructor(public ls: AppLocalizationService) {
        super();
    }

    ngOnInit() {
        super.ngOnInit();
    }

}
