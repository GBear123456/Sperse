import { Injectable } from '@angular/core';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppPermissions } from '@shared/AppPermissions';

@Injectable()
export class AppPermissionService {
    constructor(
        private _permissionChecker: PermissionCheckerService
    ) {}

    isGranted(permission: AppPermissions): boolean {
        return !permission || permission.split('|').some((item) => {
            return item.split('&').every((key) => this._permissionChecker.isGranted(key));
        });
    }
}
