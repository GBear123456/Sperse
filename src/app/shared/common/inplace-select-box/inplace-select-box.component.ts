/** Core imports */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { InplaceSelectBox } from '@app/shared/common/inplace-select-box/inplace-select-box.interface';

@Component({
    selector: 'inplace-select',
    templateUrl: './inplace-select-box.component.html',
    styleUrls: ['./inplace-select-box.component.less']
})
export class InplaceSelectBoxComponent {
    @Input() data: InplaceSelectBox;
    @Input() width = 'auto';
    @Input() height = 'auto';
    @Output() valueChanged: EventEmitter<any> = new EventEmitter();

    updateValue(event) {
        //MB: validation should be added & tested in this approach
        if (!event.validationGroup || event.validationGroup.validate().isValid) {
            this.valueChanged.emit(event.value);
        }
    }

    onCustomItemCreating(e) {
        e.customItem = {
            id: e.text,
            name: e.text
        };
        this.valueChanged.emit(e.text);
    }
}
