import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import startCase from 'lodash/startCase';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'text-field',
    templateUrl: './text-field.component.html',
    styleUrls: ['./text-field.component.less']
})
export class TextFieldComponent implements OnInit {
    @Input() name: string;
    @Input() label: string;
    @Input() readOnly = false;
    @Input() value: string;
    @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor(public ls: AppLocalizationService) { }

    ngOnInit() {
        if (!this.label) {
            this.label = startCase(this.name);
        }
    }

}
