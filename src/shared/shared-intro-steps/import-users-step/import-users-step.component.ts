/** Core imports */
import { Component, Input, OnInit } from '@angular/core';

/** Third party imports */
import * as nameParser from 'parse-full-name';

/** Application imports */
import {
    InviteUserInput,
    ModuleType,
    RoleListDto,
    RoleServiceProxy,
    TenantHostType,
    UserServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ImportUserData } from '@app/crm/shared/crm-intro/crm-intro.model';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-import-users-step',
    templateUrl: './import-users-step.component.html',
    styleUrls: ['./import-users-step.component.less'],
    providers: [ RoleServiceProxy, UserServiceProxy ]
})
export class ImportUsersStepComponent implements OnInit {
    @Input() showImportUsersStep: boolean;
    @Input() maxAvailableUserCount: number;
    @Input() moduleType: ModuleType;
    importUsers: ImportUserData[] = [];
    importValidators: any[] = [];
    roles: RoleListDto[] = [];
    validationResult: boolean;
    emailRegEx = AppConsts.regexPatterns.email;
    skipUserGroupValidation = false;

    constructor(
        private roleService: RoleServiceProxy,
        private userService: UserServiceProxy,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.roleService.getRoles(undefined, this.moduleType).subscribe(result => {
            this.roles = result.items;
        });
        this.setImportUsers();
    }

    setImportUsers() {
        while (this.maxAvailableUserCount > 0 && this.importUsers.length < 3) {
            this.importUsers.push(new ImportUserData());
            this.maxAvailableUserCount--;
        }
    }

    submitInviteUsers() {
        let users: InviteUserInput[] = [];
        this.importUsers.forEach(v => {
            if (v.email) {
                let parsedName = nameParser.parseFullName(v.fullName.trim());
                users.push(InviteUserInput.fromJS({
                    emailAddress: v.email,
                    name: parsedName.first,
                    surname: parsedName.last,
                    assignedRoleNames: v.roleNames,
                    tenantHostType: TenantHostType.PlatformApp,
                    moduleType: ModuleType[this.moduleType]
                }));
            }
        });

        return this.userService.inviteUsers(users);
    }

    validateUsers(validateAll = false) {
        let result = true;
        this.importValidators.forEach((v) => {
            if (validateAll) {
                result = v.validate().isValid && result;
            } else {
                result = result && v.validate().isValid;
            }
        });
        return this.validationResult = result;
    }

    validateFullName = (e) => {
        if (e.value) {
            let fullName = nameParser.parseFullName(e.value.trim());
            if (!fullName.first || !fullName.last)
                return false;
        }
        return true;
    }

    validateInviteUserRow = (e) => {
        let rowIndex = e.validator.element().parentElement.getAttribute('index');
        let user = this.importUsers[rowIndex];

        let validFields = 0;
        if (user.email) validFields++;
        if (user.fullName) validFields++;
        if (user.roleNames && user.roleNames.length) validFields++;

        if (validFields % 3 == 0 || (e.value && e.value.length)) {
            return true;
        }

        return false;
    }

    validateDuplicatedEmails = (e) => {
        if (!e.value)
            return true;

        let rowIndex = e.validator.element().parentElement.getAttribute('index');

        for (let i = 0; i < this.importUsers.length; i++) {
            if (i != rowIndex &&
                this.importUsers[i].email && this.importUsers[i].email.trim().toLowerCase() == e.value.trim().toLowerCase()) {
                return false;
            }
        }

        return true;
    }

    validateInviteUserGroup(e, index) {
        if (!this.skipUserGroupValidation) {
            this.importValidators[index].validate();
        } else {
            this.skipUserGroupValidation = false;
        }
    }

    onMultiTagPreparing(args) {
        args.text = args.selectedItems.map(x => x.displayName).join(', ');
    }

    onInviteUserValidationGroupInitialized(e) {
        this.importValidators.push(e.component);
    }

    addImportUser() {
        this.importUsers.push(new ImportUserData());
        this.maxAvailableUserCount--;
    }

    removeImportUser(index: number) {
        this.importUsers.splice(index, 1);
        this.importValidators.splice(index, 1);
        this.validateUsers();
    }

    onEmailKeyPress(i: number) {
        if (!this.importUsers[i].roleNames) {
            this.skipUserGroupValidation = true;
            this.importUsers[i].roleNames = [this.moduleType + ' User'];
        }
    }
}
