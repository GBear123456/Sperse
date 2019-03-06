import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import startCase from 'lodash/startCase';

@Component({
    selector: 'rating-field',
    templateUrl: './rating-field.component.html',
    styleUrls: ['./rating-field.component.less']
})
export class RatingFieldComponent implements OnInit {
    @Input() name: string;
    @Input() label: string;
    @Input() value: string;
    @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor() { }

    ngOnInit() {
        if (!this.label) {
            this.label = startCase(this.name);
        }
    }

}
