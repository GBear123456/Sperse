import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import startCase from 'lodash/startCase';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'dropdown-field',
    templateUrl: './dropdown-field.component.html',
    styleUrls: ['./dropdown-field.component.less']
})
export class DropdownFieldComponent implements OnInit {
    @Input() name: string;
    @Input() label: string;
    @Input() readOnly = false;
    @Input() dataSource: any[];
    @Input() value: string;
    @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor(public ls: AppLocalizationService) { }

    ngOnInit() {
        if (!this.label) {
            this.label = startCase(this.name);
        }
    }

}
