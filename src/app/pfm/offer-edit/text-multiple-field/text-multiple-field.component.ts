import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BaseFieldComponent } from '@app/pfm/offer-edit/base-field/base-field.component';

@Component({
    selector: 'text-multiple-field',
    templateUrl: './text-multiple-field.component.html',
    styleUrls: ['./text-multiple-field.component.less']
})
export class TextMultipleFieldComponent extends BaseFieldComponent implements OnInit {
    @Input() value: any;
    @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor(public ls: AppLocalizationService) {
        super();
    }

    ngOnInit() {
        super.ngOnInit();
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
