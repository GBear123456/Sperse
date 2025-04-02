/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

/** Application imports */
import { SettingService } from '@app/admin/settings/settings/settings.service';
import { mainNavigation, MenuItem } from '../../settings/settings.navigation';

@Component({
    templateUrl: './dashboard-settings.component.html',
    styleUrls: ['./dashboard-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardSettingComponent {
    searchQuery: string = '';

    constructor(
        private sanitizer: DomSanitizer,
        private settingService: SettingService,
        private router: Router
    ) {}

    categoryColors = [
        // Blues
        { bg: "blue-bg", border: "blue-border", icon: "blue-icon" },
        // Purples
        { bg: "purple-bg", border: "purple-border", icon: "purple-icon" },
        // Greens
        { bg: "green-bg", border: "green-border", icon: "green-icon" },
        // Ambers
        { bg: "amber-bg", border: "amber-border", icon: "amber-icon" },
        // Reds/Roses
        { bg: "red-bg", border: "red-border", icon: "red-icon" },
        // Teals
        { bg: "teal-bg", border: "teal-border", icon: "teal-icon" },
        // Pinks
        { bg: "pink-bg", border: "pink-border", icon: "pink-icon" },
        // Oranges
        { bg: "orange-bg", border: "orange-border", icon: "orange-icon" },
        // Lime
        { bg: "lime-bg", border: "lime-border", icon: "lime-icon" },
        // Cyan
        { bg: "cyan-bg", border: "cyan-border", icon: "cyan-icon" },
        // Fuchsia
        { bg: "fuchsia-bg", border: "fuchsia-border", icon: "fuchsia-icon" },
        // Sky
        { bg: "sky-bg", border: "sky-border", icon: "sky-icon" },
    ];

    filterNavigation = (q: string) => {
        if (!q.trim()) {
            return mainNavigation;
        }
  
        const query = q.toLowerCase().trim();
        
        const filtered = mainNavigation.filter(item => this.matchesSearch(item, query));
        
        return filtered;
    }

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
          case "localization":
            return "Customize language preferences, region settings, date/time formats, currency options, and number formats to match your regional requirements.";
          case "appearance":
            return "Customize your brand identity with logo uploads, favicon settings, color schemes, and fonts. Configure UI themes for CRM, customer portal, and landing pages. Adjust button styling, visual density, and dark/light modes.";
          case "domains":
            return "Manage custom domains, SSL certificates, DNS settings, domain verification, HTTPS enforcement, and security configurations.";
          default:
            return `Configure your ${item.label.toLowerCase()} options`;
        }
    };

    goToMain = (item: MenuItem) => {
        this.router.navigateByUrl(this.settingService.getFullPath(item.path))
        this.settingService.alterSubmenu(item?.submenu && item.submenu.length > 0);
    }

    goToSub = (item: MenuItem) => {
        this.router.navigateByUrl(this.settingService.getFullPath(item.path))
        this.settingService.alterSubmenu(true);
    }

    isNotSM = () => {
        return window.innerWidth >= 640;
    }

    getColorScheme = (index: number) => {
        return this.categoryColors[index % this.categoryColors.length]
    }
}