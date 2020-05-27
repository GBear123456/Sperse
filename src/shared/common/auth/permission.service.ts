/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import invert from 'lodash/invert';

/** Application imports */
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppPermissions } from '@shared/AppPermissions';
import { ContactGroup, ContactGroupPermission } from '@shared/AppEnums';

@Injectable()
export class AppPermissionService {
    readonly CONTACT_GROUP_KEYS = invert(ContactGroup);
    constructor(
        private permissionChecker: PermissionCheckerService
    ) {}

    isGranted(permission: AppPermissions | string): boolean {
        return !permission || permission.split('|').some((item) => {
            return item.split('&').every((key) => this.permissionChecker.isGranted(key));
        });
    }

    getCGPermissionKey(contactGroup: ContactGroup, permission = ''): string {
        return ContactGroupPermission[
            this.CONTACT_GROUP_KEYS[contactGroup ? contactGroup.toString() : undefined]
            ] + (permission ? '.' : '') + permission;
    }

    checkCGPermission(contactGroup: ContactGroup, permission = 'Manage') {
        return this.permissionChecker.isGranted(this.getCGPermissionKey(contactGroup, permission) as AppPermissions);
    }
}
