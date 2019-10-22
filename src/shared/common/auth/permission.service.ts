import { Injectable } from '@angular/core';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppPermissions } from '@shared/AppPermissions';

@Injectable()
export class AppPermissionService {
    constructor(
        private permissionChecker: PermissionCheckerService
    ) {}

    isGranted(permission: AppPermissions | string): boolean {
        return !permission || permission.split('|').some((item) => {
            return item.split('&').every((key) => this.permissionChecker.isGranted(key));
        });
    }
}
