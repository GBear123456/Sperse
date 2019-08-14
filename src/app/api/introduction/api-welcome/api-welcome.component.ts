import { Component, EventEmitter, Output, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    selector: 'api-welcome',
    templateUrl: './api-welcome.component.html',
    styleUrls: ['./api-welcome.component.less']
})
export class ApiWelcomeComponent {
    @Input() small: false;
    @Output() onAddApiKey: EventEmitter<null> = new EventEmitter<null>();
    canManageApiKeys = this.permission.isGranted(AppPermissions.APIManageKeys);
    constructor(
        public ls: AppLocalizationService,
        private permission: AppPermissionService
    ) {}

    addApiKey() {
        this.onAddApiKey.emit();
    }
}
