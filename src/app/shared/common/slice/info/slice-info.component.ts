import { ChangeDetectionStrategy, Component, OnInit, Input } from '@angular/core';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';

@Component({
    selector: 'slice-info',
    templateUrl: 'slice-info.component.html',
    styleUrls: ['./slice-info.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliceInfoComponent implements OnInit {
    @Input() items: InfoItem[];
    constructor() {}

    ngOnInit() {}

    ngOnChanges(changes) {
        console.log(changes);
    }
}
