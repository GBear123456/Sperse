import { Component, Input, Output, Injector, EventEmitter } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

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

    constructor(
        private localization: AppLocalizationService
    ) { }

    public selectedItemsChange() {
        this.selectionChanged.emit(this.selectedItems);
    }

    getSelectedTitle() {
        let totalCount = this.selectionList.length,
            selectedCount = this.selectedItems.length;
        return totalCount && selectedCount ? 
            (selectedCount != totalCount ? selectedCount + ' ' + this.localization.l('of') + ' ' : '') 
                + totalCount + ' ' + this.localization.l('entities')
            : this.allItemsText;
    }

    onMultiTagPreparing(e) {
        e.text = this.getSelectedTitle();
    }
}