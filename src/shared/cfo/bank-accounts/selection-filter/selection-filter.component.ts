import { Component, Input, Output, EventEmitter } from '@angular/core';
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
    @Input() selectedItems: any[] = [];
    @Input() itemsText = this.localization.l('entities');
    @Output() selectionChanged: EventEmitter<any> = new EventEmitter();

    constructor(
        private localization: AppLocalizationService
    ) {}

    public selectedItemsChange() {
        this.selectionChanged.emit(this.selectedItems);
    }

    getSelectedTitle() {
        let selectedCount = this.selectedItems.length;
        return selectedCount ? selectedCount + ' ' + this.itemsText : this.allItemsText;
    }

    onMultiTagPreparing(e) {
        e.text = this.getSelectedTitle();
    }

    selectAllValueChanged($event) {
        $event.component._$list.find('.dx-list-select-all-label').text(
            ($event.value ? this.localization.l('Clear') : this.localization.l('Select')) + ' ' + this.localization.l('All'));
    }
}
