import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BaseFieldComponent } from '@app/pfm/offer-edit/base-field/base-field.component';

@Component({
    selector: 'rating-field',
    templateUrl: './rating-field.component.html',
    styleUrls: ['./rating-field.component.less']
})
export class RatingFieldComponent extends BaseFieldComponent implements OnInit {
    @Input() value: string;
    @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor() {
        super();
    }

    ngOnInit() {
        super.ngOnInit();
    }

}
