import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'selection-filter',
    templateUrl: './selection-filter.component.html',
    styleUrls: ['./selection-filter.component.less']
})
export class SelectionFilterComponent {
    @Input() title;
    @Input() allItemsText;
    @Input() selectionList = [];
    @Input() selectedItems: number[] = [];
    @Output() selectionChanged: EventEmitter<any> = new EventEmitter();

    public selectedItemsChange() {
        this.selectionChanged.emit(this.selectedItems);
    }
}
