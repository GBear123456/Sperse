import { Component, Input, Output, Injector, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'selection-filter',
    templateUrl: './selection-filter.component.html',
    styleUrls: ['./selection-filter.component.less']
})
export class SelectionFilterComponent extends AppComponentBase {
    @Input() title;
    @Input() allItemsText;
    @Input() selectionList = [];
    @Input() selectedItems: number[] = [];
    @Output() selectionChanged: EventEmitter<any> = new EventEmitter();

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    public selectedItemsChange() {
        this.selectionChanged.emit(this.selectedItems);
    }

    onMultiTagPreparing(e) {
        const totalCount = e.component.getDataSource().items().length;
        e.text = !totalCount || e.selectedItems.length === totalCount ? this.allItemsText
            : e.selectedItems.length + ' ' + this.l('of') + ' ' + totalCount + ' ' + this.l('selected');
    }
}
