import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';

@Component({
    selector: 'slice-info',
    templateUrl: 'info.component.html',
    styleUrls: ['./info.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoComponent {
    @Input() items: InfoItem[];
}
