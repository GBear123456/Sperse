import {Component, OnInit, Injector, Input, Output, EventEmitter} from '@angular/core';

import {
    InviteUserInput,
    RoleListDto,
    RoleServiceProxy,
    TenantHostType, UserServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from 'shared/common/app-component-base';
import { ImportUserData } from '@app/crm/shared/crm-intro/crm-intro.model';
import * as nameParser from 'parse-full-name';

@Component({
    selector: 'app-import-users-step',
    templateUrl: './import-users-step.component.html',
    styleUrls: ['./import-users-step.component.less'],
    providers: [RoleServiceProxy, UserServiceProxy]
})
export class ImportUsersStepComponent extends AppComponentBase implements OnInit {
    @Input() showImportUsersStep: boolean;
    importUsers: ImportUserData[] = [new ImportUserData(), new ImportUserData(), new ImportUserData()];
    importValidators: any[] = [];
    roles: RoleListDto[] = [];
    validationResult: boolean;

    constructor(
        injector: Injector,
        private _roleService: RoleServiceProxy,
        private _userService: UserServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this._roleService.getRoles(undefined).subscribe(result => {
            this.roles = result.items;
        });
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
                    tenantHostType: TenantHostType.PlatformUi
                }));
            }
        });

        return this._userService.inviteUsers(users);
    }

    validateUsers() {
        let result = true;
        this.importValidators.forEach((v) => { result = result && v.validate().isValid; });
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

    validateInviteUserGroup(index) {
        this.importValidators[index].validate();
    }

    onMultiTagPreparing(args) {
        args.text = args.selectedItems.map(x => x.displayName).join(', ');
    }

    onInviteUserValidationGroupInitialized(e) {
        this.importValidators.push(e.component);
    }

    addImportUser() {
        this.importUsers.push(new ImportUserData());
    }

    removeImportUser(index: number) {
        this.importUsers.splice(index, 1);
        this.importValidators.splice(index, 1);
    }
}
