import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import startCase from 'lodash/startCase';

@Component({
    selector: 'checkbox-field',
    templateUrl: './checkbox-field.component.html',
    styleUrls: ['./checkbox-field.component.less']
})
export class CheckboxFieldComponent implements OnInit {
    @Input() name: string;
    @Input() label: string;
    @Input() readOnly = false;
    @Input() value: boolean;
    @Output() valueChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    constructor() { }

    ngOnInit() {
        if (!this.label) {
            this.label = startCase(this.name);
        }
    }

}
