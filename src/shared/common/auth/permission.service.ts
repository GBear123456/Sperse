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

    getCGPermissionKey(contactGroupKey: ContactGroup, permission = ''): string {
        return ContactGroupPermission[
            this.CONTACT_GROUP_KEYS[contactGroupKey ? contactGroupKey.toString() : undefined]
            ] + (permission ? '.' : '') + permission;
    }

    checkCGPermission(contactGroupKey: ContactGroup, permission = 'Manage') {
        return this.permissionChecker.isGranted(this.getCGPermissionKey(contactGroupKey, permission) as AppPermissions);
    }

    getFirstAvailableCG(): ContactGroup {
        for (let contactGroup of Object.keys(ContactGroup)) {
            if (this.checkCGPermission(ContactGroup[contactGroup], ''))
                return ContactGroup[contactGroup];
        }

        return null;
    }
}
