/** Core imports */
import { ChangeDetectionStrategy, Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

/** Third party imports */
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

/** Application imports */
import { SettingService } from '@app/admin/settings/settings/settings.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { AppComponentBase } from '@root/shared/common/app-component-base';
import { MenuItem, mainNavigation } from './settings.navigation'
import { LayoutService } from '@app/shared/layout/layout.service';

@Component({
    templateUrl: './settings.new.component.html',
    styleUrls: ['./settings.new.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsNewComponent extends AppComponentBase implements OnInit, OnDestroy {
    sidebarOpen: boolean = true;
    selectedMenu: MenuItem = null;
    selectedMainItem: string = null;

    saveSubject: Subject<any> = new Subject();
    title: string;

    public headlineButtons: HeadlineButton[] = [
      {
        enabled: true,
        icon: 'la la la-floppy-o',
        action: () => {
            this.saveSubject.next();
        },
        label: this.l('Save Settings')
      }
    ];
  
    constructor(
        injector: Injector,
        private router: Router, 
        private settingService: SettingService,
        public layoutService: LayoutService,
    ) {
      super(injector);

      this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event) => {
        this.selectedMenu = this.settingService.configuredNavs.find(nav => location.pathname.startsWith(this.settingService.getFullPath(nav.path) || ''))
        this.selectedMainItem = this.selectedMenu?.id;
        this.settingService.alterSubmenu(this.selectedMenu?.submenu && this.selectedMenu.submenu.length > 0);

        if (location.pathname !== this.settingService.getFullPath('dashboard')) {
          if (this.selectedMenu.submenu) {
            const subMenu = this.selectedMenu.submenu.find(sub => location.pathname.startsWith(this.settingService.getFullPath(sub.path) || ''));
            if (subMenu?.submenu) {
              this.title = subMenu.submenu.find(sub => this.settingService.getFullPath(sub.path) === location.pathname)?.label;
            } else this.title = subMenu.label;
          } else this.title = this.selectedMenu.label;
        }

        // navigation page css configuration
      })
    }

    ngOnInit(): void {
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = () => {
        this.sidebarOpen = (window.innerWidth >= 768);
    };

    handleMainItemClick = (item: MenuItem) => {
        this.selectedMainItem = item.id;
        this.settingService.alterSubmenu(item.submenu && item.submenu.length > 0);
        this.selectedMenu = this.settingService.configuredNavs.find(nav => nav.id === item.id)
        
        // If the item has submenu items, navigate to the first submenu item's path
        if (item.submenu && item.submenu.length > 0) {
          const firstSubItem = item.submenu[0];
          if (firstSubItem.path) {
            this.router.navigateByUrl(this.settingService.getFullPath(firstSubItem.path));
          }
        } else if (item.path) {
          // If no submenu, navigate to the item's own path
          this.router.navigateByUrl(this.settingService.getFullPath(item.path));
        }

        if (window.innerWidth < 768) {
            this.sidebarOpen = false;
        }
      };

      handleBackClick = () => {
        this.selectedMainItem = null;
      };

      navigateToWelcome = () => {
        this.router.navigateByUrl(this.settingService.getFullPath('dashboard'));
        this.selectedMainItem = null;
      };

      isDashboardSettings = () => {
        return location.pathname === this.settingService.getFullPath('dashboard');
      }
}
