/** Core imports */
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

/** Third party imports */
import { Home, Moon, Sun } from 'lucide-angular'

/** Application imports */
import { MenuItem } from '../../settings.navigation'
import { SettingService } from '@app/admin/settings/settings/settings.service';

@Component({
    selector: 'main-menu-panel',
    templateUrl: './main-menu-panel.component.html',
    styleUrls: ['./main-menu-panel.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainMenuPanelComponent implements OnInit {
    readonly HomeIcon = Home;
    readonly MoonIcon = Moon;
    readonly SunIcon = Sun;

    @Input() items: MenuItem[];
    @Input() isDarkMode: boolean;
    @Input() selectedMainItem: string | null;
    @Input() hasSubmenu: boolean;
    @Input() toggleTheme: () => void;
    @Input() handleMainItemClick: () => void;
    @Input() navigateToWelcome: () => void;

    constructor(
        private settingService: SettingService
    ) {}

    ngOnInit(): void {
        
    }

    isActive = (item: MenuItem) => {
        return this.selectedMainItem === item.id || (item.path && location.pathname.startsWith(this.settingService.getFullPath(item.path)))
    }
}
