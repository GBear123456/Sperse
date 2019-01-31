import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
    ChooserDesign,
    ChooserType
} from '@root/personal-finance/shared/offers/filters/filters-settings/chooser-filter-setting';

export class ChooserOption {
    name: string;
    iconSrc?: string;
    selected?: boolean;
    value: any;
}

@Component({
    selector: 'chooser-filter',
    templateUrl: './chooser-filter.component.html',
    styleUrls: [ './chooser-filter.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooserFilterComponent {
    @Input() options: ChooserOption [];
    @Input() type: ChooserType = ChooserType.Single;
    @Input() design: ChooserDesign = ChooserDesign.Combined;
    @Output() selectionChange: EventEmitter<ChooserOption[]> = new EventEmitter<ChooserOption[]>();
    chooseOption(option: ChooserOption ) {
        if (this.type === ChooserType.Single) {
            this.options.forEach(option => option.selected = false);
        }
        option.selected = !option.selected;
        this.selectionChange.emit(this.options.filter(option => option.selected));
    }
}
