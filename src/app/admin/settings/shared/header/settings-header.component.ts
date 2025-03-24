/** Core imports */
import { Component, ViewEncapsulation, OnInit, Input } from '@angular/core';
import { ArrowLeft } from 'lucide-angular';
import { Router } from '@angular/router';
import { SettingService } from '../../settings/settings.service';

@Component({
    selector: 'settings-header',
    templateUrl: './settings-header.component.html',
    styleUrls: ['./settings-header.component.less'],
    providers: [],
    encapsulation: ViewEncapsulation.None,
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