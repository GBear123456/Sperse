import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IExpandItem } from '@app/shared/common/expand-button/expand-item.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { DxSelectBoxComponent } from '@root/node_modules/devextreme-angular';

@Component({
    selector: 'expand-button',
    templateUrl: './expand-button.component.html',
    styleUrls: ['./expand-button.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpandButtonComponent {
    @ViewChild(DxSelectBoxComponent) selectBox: DxSelectBoxComponent;
    @Input() items: IExpandItem[];
    @Output() onExpand: EventEmitter<string> = new EventEmitter<string>();
    constructor(
        public ls: AppLocalizationService
    ) {}

    changeOptionsPopupWidth(e) {
        e.component._popup.option('width', 200);
    }

    itemClicked(e) {
        this.onExpand.emit(e.itemData.key);
        this.selectBox.instance.close();
    }

}
