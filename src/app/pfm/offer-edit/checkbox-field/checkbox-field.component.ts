import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { BaseFieldComponent } from '@app/pfm/offer-edit/base-field/base-field.component';

@Component({
    selector: 'checkbox-field',
    templateUrl: './checkbox-field.component.html',
    styleUrls: ['./checkbox-field.component.less']
})
export class CheckboxFieldComponent extends BaseFieldComponent implements OnInit {
    @Input() value: boolean;
    @Output() valueChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    ngOnInit() {
        super.ngOnInit();
    }
}
