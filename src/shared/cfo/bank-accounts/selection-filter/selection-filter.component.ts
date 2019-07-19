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
    @Input() allSelectedTitle = false;
    @Input() selectedItems: any[] = [];
    @Input() itemsText = this.localization.l('entity');
    @Input() popupWidth: string;
    @Output() selectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onClosed: EventEmitter<any> = new EventEmitter();

    constructor(
        private localization: AppLocalizationService
    ) {}

    public selectedItemsChange() {
        this.selectionChanged.emit(this.selectedItems);
    }

    getSelectedTitle() {
        let selectedCount = this.selectedItems.length,
            totalCount = this.selectionList.length;
        return selectedCount ? (this.allSelectedTitle && selectedCount == totalCount
            ? this.allItemsText : this.localization.l('Any') + ' ' + this.itemsText) : this.allItemsText;
    }

    onMultiTagPreparing(e) {
        e.text = this.getSelectedTitle();
    }

    changePopupWidth(e) {
        if (this.popupWidth) {
            e.component._popup.option('width', this.popupWidth);
        }
    }

    selectAllValueChanged($event) {
        $event.component._$list.find('.dx-list-select-all-label').text(
            ($event.value ? this.localization.l('Clear') : this.localization.l('Select')) + ' ' + this.localization.l('All')
        );
    }
}
