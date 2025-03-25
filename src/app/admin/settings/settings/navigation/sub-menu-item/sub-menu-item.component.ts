import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MenuItem } from '../../settings.navigation';
import { CircleUser } from 'lucide-angular';
import { SettingService } from '../../settings.service';

@Component({
    selector: 'sub-menu-item',
    templateUrl: './sub-menu-item.component.html',
    styleUrls: ['./sub-menu-item.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubMenuItemComponent implements OnInit {
    readonly UserIcon = CircleUser;

    @Input() item: MenuItem;
    @Input() isActive: boolean;
    @Input() isDarkMode: boolean;
    @Input() handleSubItemClick: (item: MenuItem) => void;

    constructor(
        private settingService: SettingService
    ) {}

    ngOnInit(): void {
        
    }

    isSubActive = (item: MenuItem) => {
        return location.pathname === this.settingService.getFullPath(item.path);
    }
}
