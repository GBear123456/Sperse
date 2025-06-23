import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ISortItem } from '@app/shared/common/sort-button/sort-item.interface';

@Component({
    selector: 'sort-button',
    templateUrl: './sort-button.component.html',
    styleUrls: ['./sort-button.component.less']
})
export class SortButtonComponent {
    @Input() items: ISortItem[];
    @Output() onChange: EventEmitter<ISortItem> = new EventEmitter<ISortItem>();
    constructor(public ls: AppLocalizationService) { }

    changeOptionsPopupWidth(e) {
        e.component._popup.option('width', 200);
    }

    changeSorting(e) {
        this.items.forEach((sortItem: ISortItem) => {
            if (sortItem.key === e.itemData.key) {
                e.itemData.direction = sortItem.direction = !e.itemData.direction ? 'asc' : (e.itemData.direction === 'asc' ? 'desc' : 'asc');
            } else {
                sortItem.direction = undefined;
            }
        });
        this.onChange.emit(e.itemData);
    }

}
