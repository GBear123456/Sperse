import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import startCase from 'lodash/startCase';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'text-multiple-field',
    templateUrl: './text-multiple-field.component.html',
    styleUrls: ['./text-multiple-field.component.less']
})
export class TextMultipleFieldComponent implements OnInit {
    @Input() name: string;
    @Input() label: string;
    @Input() readOnly = false;
    @Input() value: any;
    @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor(public ls: AppLocalizationService) { }

    ngOnInit() {
        if (!this.label) {
            this.label = startCase(this.name);
        }
    }

    addNew(model: any[]) {
        model.push('');
    }

    remove(item: any[], i: number) {
        item.splice(i, 1);
    }

    keys(obj: Object): string[] {
        return Object.keys(obj);
    }
}
