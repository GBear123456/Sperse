/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';

/** Application imports */
import { SettingService } from '@app/admin/settings/settings/settings.service';
import { MenuItem } from '../../settings/settings.navigation';
import { ThemeService } from '@app/shared/services/theme.service';
@Component({
  templateUrl: './dashboard-settings.component.html',
  styleUrls: ['./dashboard-settings.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSettingComponent {
  searchQuery: string = '';
  isDark$: Observable<boolean>;
  isDark: boolean = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private settingService: SettingService,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.settingService.initMenu().add(() => {
      this.changeDetector.detectChanges();
    });
    this.isDark$ = this.themeService.isDarkTheme$;
  }

  ngOnInit() {
    this.isDark$.subscribe(val => {
      this.isDark = val;
      this.changeDetector.detectChanges();
    });
  }

  categoryColors = [
    // Blues
    {
      bg: { light: 'blue-bg', dark: 'blue-bg-dark' },
      border: { light: 'blue-border', dark: 'blue-border-dark' },
      icon: { light: 'blue-icon', dark: 'blue-icon-dark' },
    },
    // Purples
    {
      bg: { light: 'purple-bg', dark: 'purple-bg-dark' },
      border: { light: 'purple-border', dark: 'purple-border-dark' },
      icon: { light: 'purple-icon', dark: 'purple-icon-dark' },
    },
    // Greens
    {
      bg: { light: 'green-bg', dark: 'green-bg-dark' },
      border: { light: 'green-border', dark: 'green-border-dark' },
      icon: { light: 'green-icon', dark: 'green-icon-dark' },
    },
    // Ambers
    {
      bg: { light: 'amber-bg', dark: 'amber-bg-dark' },
      border: { light: 'amber-border', dark: 'amber-border-dark' },
      icon: { light: 'amber-icon', dark: 'amber-icon-dark' },
    },
    // Reds/Roses
    {
      bg: { light: 'red-bg', dark: 'red-bg-dark' },
      border: { light: 'red-border', dark: 'red-border-dark' },
      icon: { light: 'red-icon', dark: 'red-icon-dark' },
    },
    // Teals
    {
      bg: { light: 'teal-bg', dark: 'teal-bg-dark' },
      border: { light: 'teal-border', dark: 'teal-border-dark' },
      icon: { light: 'teal-icon', dark: 'teal-icon-dark' },
    },
    // Pinks
    {
      bg: { light: 'pink-bg', dark: 'pink-bg-dark' },
      border: { light: 'pink-border', dark: 'pink-border-dark' },
      icon: { light: 'pink-icon', dark: 'pink-icon-dark' },
    },
    // Oranges
    {
      bg: { light: 'orange-bg', dark: 'orange-bg-dark' },
      border: { light: 'orange-border', dark: 'orange-border-dark' },
      icon: { light: 'orange-icon', dark: 'orange-icon-dark' },
    },
    // Lime
    {
      bg: { light: 'lime-bg', dark: 'lime-bg-dark' },
      border: { light: 'lime-border', dark: 'lime-border-dark' },
      icon: { light: 'lime-icon', dark: 'lime-icon-dark' },
    },
    // Cyan
    {
      bg: { light: 'cyan-bg', dark: 'cyan-bg-dark' },
      border: { light: 'cyan-border', dark: 'cyan-border-dark' },
      icon: { light: 'cyan-icon', dark: 'cyan-icon-dark' },
    },
    // Fuchsia
    {
      bg: { light: 'fuchsia-bg', dark: 'fuchsia-bg-dark' },
      border: { light: 'fuchsia-border', dark: 'fuchsia-border-dark' },
      icon: { light: 'fuchsia-icon', dark: 'fuchsia-icon-dark' },
    },
    // Sky
    {
      bg: { light: 'sky-bg', dark: 'sky-bg-dark' },
      border: { light: 'sky-border', dark: 'sky-border-dark' },
      icon: { light: 'sky-icon', dark: 'sky-icon-dark' },
    },
  ];

  filterNavigation = (q: string) => {
    if (!q.trim()) {
      return this.settingService.configuredNavs;
    }

    const query = q.toLowerCase().trim();

    const filtered = this.settingService.configuredNavs.filter(item =>
      this.matchesSearch(item, query)
    );

    return filtered;
  };

  matchesSearch = (item: MenuItem, query: string): boolean => {
    if (item.label.toLowerCase().includes(query)) {
      return true;
    }

    if (item.searchAliases?.some((alias: string) => alias.toLowerCase().includes(query))) {
      return true;
    }

    if (item.submenu) {
      return item.submenu.some((subItem: any) => this.matchesSearch(subItem, query));
    }

    return false;
  };

  highlightMatch = (text: string) => {
    if (!this.searchQuery.trim()) return text;

    const query = this.searchQuery.toLowerCase();
    const index = text.toLowerCase().indexOf(query);

    if (index === -1) return text;

    return this.sanitizer.bypassSecurityTrustHtml(`
            <ng-container>
                ${text.substring(0, index)}
                <span class="hightlighted">
                    ${text.substring(index, index + query.length)}
                </span>
                ${text.substring(index + query.length)}
            </ng-container>
        `);
  };

  getEnhancedDescription = (item: MenuItem) => {
    switch (item.id) {
      case 'localization':
        return 'Customize language preferences, region settings, date/time formats, currency options, and number formats to match your regional requirements.';
      case 'appearance':
        return 'Customize your brand identity with logo uploads, favicon settings, color schemes, and fonts. Configure UI themes for CRM, customer portal, and landing pages. Adjust button styling, visual density, and dark/light modes.';
      case 'domains':
        return 'Manage custom domains, SSL certificates, DNS settings, domain verification, HTTPS enforcement, and security configurations.';
      default:
        return `Configure your ${item.label.toLowerCase()} options`;
    }
  };

  goToMain = (item: MenuItem) => {
    if (item?.submenu && item.submenu.length > 0) {
      this.router.navigateByUrl(this.settingService.getFullPath(item.submenu[0].path));
      this.settingService.alterSubmenu(item?.submenu && item.submenu.length > 0);
    } else {
      this.router.navigateByUrl(this.settingService.getFullPath(item.path));
    }
  };

  goToSub = (item: MenuItem) => {
    this.router.navigateByUrl(this.settingService.getFullPath(item.path));
    this.settingService.alterSubmenu(true);
  };

  isNotSM = () => {
    return window.innerWidth >= 640;
  };

  getColorScheme = (index: number) => {
    const color = this.categoryColors[index % this.categoryColors.length];
    const theme = this.isDark ? 'dark' : 'light';

    return {
      bg: color.bg[theme],
      border: color.border[theme],
      icon: color.icon[theme],
    };
  };
}
