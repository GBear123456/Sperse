import { Input, OnInit } from '@angular/core';
import startCase from 'lodash/startCase';

export class BaseFieldComponent implements OnInit {
    @Input() name: string;
    @Input() label: string;
    @Input() readOnly = false;

    constructor() {}

    ngOnInit() {
        if (!this.label) {
            this.label = startCase(this.name);
        }
    }
}
