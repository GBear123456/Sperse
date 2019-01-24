import { Component, EventEmitter, Output, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

@Component({
    selector: 'api-welcome',
    templateUrl: './api-welcome.component.html',
    styleUrls: ['./api-welcome.component.less']
})
export class ApiWelcomeComponent {
    @Input() small: false;
    @Output() onAddApiKey: EventEmitter<null> = new EventEmitter<null>();
    canManageApiKeys = this.permission.isGranted('Pages.API.ManageKeys');
    constructor(
        public ls: AppLocalizationService,
        private permission: PermissionCheckerService
    ) {}

    addApiKey() {
        this.onAddApiKey.emit();
    }
}
