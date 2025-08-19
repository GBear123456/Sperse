/** Core imports */
import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { ArrowLeft } from 'lucide-angular';

/** Application imports */
import { SettingService } from '../../settings/settings.service';

@Component({
    selector: 'settings-header',
    templateUrl: './settings-header.component.html',
    styleUrls: ['./settings-header.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsHeaderComponent implements OnInit {
    // readonly SaveIcon = Save;
    readonly LeftIcon = ArrowLeft;

    @Input() title: string;
    @Input() isDarkMode: boolean;

    constructor(
        private router: Router,
        private settingService: SettingService
    ) { }

    ngOnInit(): void {
    }

    goBack = () => {
        this.router.navigateByUrl(this.settingService.getFullPath('dashboard'))
    }
}