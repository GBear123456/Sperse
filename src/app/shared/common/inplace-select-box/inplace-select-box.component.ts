import { Component, Injector, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { InplaceSelectBoxModel } from './inplace-select-box.model';

@Component({
    selector: 'inplace-select',
    templateUrl: './inplace-select-box.component.html',
    styleUrls: ['./inplace-select-box.component.less']
})
export class InplaceSelectBoxComponent extends AppComponentBase {
    @Input()
    data: any = {};

    @Output()
    valueChanged: EventEmitter<any> = new EventEmitter();

    constructor(injector: Injector) {
        super(injector);
    }

    updateValue(event) {
        //MB: validation should be added & tested in this approch
        if(!event.validationGroup || event.validationGroup.validate().isValid) {
            if (this.valueChanged)
                this.valueChanged.emit(event.value);
        }      
    }
}