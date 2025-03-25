import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MenuItem } from '../../settings.navigation';
import { ArrowLeft } from 'lucide-angular';
import { Router } from '@angular/router';
import { SettingService } from '@app/admin/settings/settings/settings.service';

@Component({
    selector: 'sub-menu-panel',
    templateUrl: './sub-menu-panel.component.html',
    styleUrls: ['./sub-menu-panel.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubMenuPanelComponent  implements OnInit {
    readonly ArrowIcon = ArrowLeft;

    @Input() selectedMenu: MenuItem | undefined;
    @Input() selectedMainItem: string | null;
    @Input() isDarkMode: boolean;
    @Input() hasSubmenu: boolean;
    @Input() handleBackClick: () => void;

    constructor(
        private router: Router,
        private settingService: SettingService
    ) {}

    ngOnInit(): void {
        
    }

    isActive = (subItem: MenuItem) => {
        return location.pathname === this.settingService.getFullPath(subItem.path);
    }

    handleSubItemClick = (subItem: MenuItem) => {
        subItem.path && this.router.navigateByUrl(this.settingService.getFullPath(subItem.path))
    }
}
