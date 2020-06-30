import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'types-dropdown',
    templateUrl: 'types-dropdown.component.html',
    styleUrls: ['./types-dropdown.component.less']
})
export class TypesDropdownComponent {
    @Input() items;
    @Input() totalCount: number;
    @Input() value;
    @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();
    @Output() onValueChanged: EventEmitter<any> = new EventEmitter<any>();

    valueChanged(e) {
        this.valueChange.emit(e.value);
        this.onValueChanged.emit(e);
    }
}