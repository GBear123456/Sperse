import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MemberAreaLink } from '@shared/common/area-navigation/member-area-link.enum';

@Component({
    selector: 'sidebar',
    templateUrl: 'sidebar.component.html',
    styleUrls: ['./sidebar.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
    @Input() sidebarTitle: string;
    @Input() items: MemberAreaLink[];
}
