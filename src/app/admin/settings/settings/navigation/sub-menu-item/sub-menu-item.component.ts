/** Core imports */
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { Observable } from 'rxjs';
/** Third party imports */
import { CircleUser } from 'lucide-angular';

/** Application imports */
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';
import { MenuItem } from '../../settings.navigation';
import { SettingService } from '../../settings.service';
import { ThemeService } from '@app/shared/services/theme.service';

@Component({
  selector: 'sub-menu-item',
  templateUrl: './sub-menu-item.component.html',
  styleUrls: ['./sub-menu-item.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubMenuItemComponent implements OnInit {
  readonly UserIcon = CircleUser;
  isDark$: Observable<boolean>;
  isDarkMode: boolean = false;

  @Input() item: MenuItem;
  @Input() isActive: boolean;
  @Input() handleSubItemClick: (item: MenuItem) => void;
  private supportedProviders = this.emailSmtpSettingsService.supportedProviders;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private settingService: SettingService,
    public emailSmtpSettingsService: EmailSmtpSettingsService,
    private themeService: ThemeService
  ) {
    this.settingService.initMenu().add(() => {
      this.changeDetector.detectChanges();
    });
    this.isDark$ = this.themeService.isDarkTheme$;
  }

  ngOnInit(): void {
    this.isDark$.subscribe(val => {
      this.isDarkMode = val;
      this.changeDetector.detectChanges();
    });
  }

  isSubActive = (item: MenuItem) => {
    return location.pathname === this.settingService.getFullPath(item.path);
  };

  getEmailIcon = (item: MenuItem) => {
    if (item.id === 'system') return 'system.svg';
    if (item.id === 'other') return 'email.svg';
    return this.supportedProviders.find(provider => provider.name === item.label)?.icon;
  };

  getPaymentIcon = (item: MenuItem) => {
    return this.settingService.supportedPaymentProviders.find(provider => provider.id === item.id)
      .iconUrl;
  };
}
