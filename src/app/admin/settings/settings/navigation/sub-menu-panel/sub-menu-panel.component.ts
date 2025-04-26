/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { ArrowLeft } from 'lucide-angular';

/** Application imports */
import { SettingService } from '@app/admin/settings/settings/settings.service';
import { MenuItem } from '../../settings.navigation';

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
        private settingService: SettingService,
        private changeDetector: ChangeDetectorRef
    ) {
        this.settingService.initMenu()
            .add(() => {
                this.changeDetector.detectChanges()
            });
    }

    ngOnInit(): void {
        
    }

    isActive = (subItem: MenuItem) => {
        return location.pathname === this.settingService.getFullPath(subItem.path);
    }

    handleSubItemClick = (subItem: MenuItem) => {
        subItem.path && this.router.navigateByUrl(this.settingService.getFullPath(subItem.path))
    }
}
