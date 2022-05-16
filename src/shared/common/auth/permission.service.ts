/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import invert from 'lodash/invert';

/** Application imports */
import { PermissionCheckerService } from 'abp-ng2-module';
import { ContactGroupInfo } from '@shared/service-proxies/service-proxies';
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

    getCGPermissionKey(contactGroups: ContactGroup[], permission = ''): string {
        return contactGroups.map((group: ContactGroup) => {
            return ContactGroupPermission[
                this.CONTACT_GROUP_KEYS[group ? group.toString() : undefined]
            ] + (permission ? '.' : '') + permission;
        }).join(
            permission.includes('Manage') || permission.includes('UserInformation') ? '&' : '|'
        );
    }

    checkCGPermission(contactGroups: ContactGroup[] | ContactGroupInfo[], permission = 'Manage') {
        if (contactGroups && contactGroups.length) {
            let activeGroups: ContactGroup[] = [], inactiveGroups: ContactGroup[] = [];
            contactGroups.forEach(group => {
                if (group) {
                    if (!group['groupId'] || group['isActive'])
                        activeGroups.push(<ContactGroup>(group['groupId'] || group));
                    else
                        inactiveGroups.push(<ContactGroup>(group['groupId']));
                }
            });
            return this.isGranted(this.getCGPermissionKey(
                activeGroups.length ? activeGroups : inactiveGroups, permission
            ));
        }
        return false;
    }

    getFirstAvailableCG(): ContactGroup {
        for (let contactGroup of Object.keys(ContactGroup)) {
            if (this.checkCGPermission([ContactGroup[contactGroup]], ''))
                return ContactGroup[contactGroup];
        }

        return null;
    }

    getFirstManageCG(): boolean {
        for (let contactGroup of Object.keys(ContactGroup)) {
            if (this.checkCGPermission([ContactGroup[contactGroup]]))
                return ContactGroup[contactGroup];
        }

        return null;
    }
}