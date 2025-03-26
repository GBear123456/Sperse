import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MenuItem } from '../../settings.navigation';
import { CircleUser } from 'lucide-angular';
import { SettingService } from '../../settings.service';
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';

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
    private supportedProviders = this.emailSmtpSettingsService.supportedProviders;

    constructor(
        private settingService: SettingService,
        public emailSmtpSettingsService: EmailSmtpSettingsService
    ) {}

    ngOnInit(): void {
    }

    isSubActive = (item: MenuItem) => {
        return location.pathname === this.settingService.getFullPath(item.path);
    }

    getEmailIcon = (item: MenuItem) => {
        if (item.id === 'system') return 'system.svg'
        if (item.id === 'other') return 'email.svg'
        return this.supportedProviders.find(provider => provider.name === item.label)?.icon
    }
}
