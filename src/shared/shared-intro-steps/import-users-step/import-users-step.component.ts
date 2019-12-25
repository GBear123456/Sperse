/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DoCheck,
    ElementRef,
    HostListener,
    Input,
    OnInit
} from '@angular/core';
/** Third party imports */
import * as nameParser from 'parse-full-name';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
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
    providers: [ RoleServiceProxy, UserServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportUsersStepComponent implements DoCheck, OnInit {
    @Input() showImportUsersStep: boolean;
    @Input() maxAvailableUserCount: number;
    @Input() moduleType: ModuleType;
    importUsers: ImportUserData[] = [];
    importValidators: any[] = [];
    roles$: Observable<RoleListDto[]> = this.roleService.getRoles(undefined, this.moduleType).pipe(
        pluck('items')
    );
    validationResult: boolean;
    emailRegEx = AppConsts.regexPatterns.email;
    skipUserGroupValidation = false;
    scrollHeight = this.getScrollHeight();
    isMobile: boolean = AppConsts.isMobile;

    constructor(
        private roleService: RoleServiceProxy,
        private userService: UserServiceProxy,
        private elementRef: ElementRef,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.setImportUsers();
    }

    ngDoCheck() {
        this.updateScrollHeight();
    }

    private updateScrollHeight() {
        const newScrollHeight = this.getScrollHeight();
        if (newScrollHeight !== this.scrollHeight) {
            this.scrollHeight = newScrollHeight;
            this.changeDetectorRef.detectChanges();
        }
    }

    private getScrollHeight() {
        const inviteListElement = this.elementRef.nativeElement.querySelector('.invite-list');
        return inviteListElement ? inviteListElement.offsetHeight - (AppConsts.isMobile ? 29 : 0) : 0;
    }

    setImportUsers() {
        while (this.maxAvailableUserCount > 0 && this.importUsers.length < 3) {
            this.importUsers.push(new ImportUserData());
            this.maxAvailableUserCount--;
            this.changeDetectorRef.detectChanges();
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

    validateInviteUserGroup(index) {
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
        this.changeDetectorRef.detectChanges();
    }

    removeImportUser(index: number) {
        this.importUsers.splice(index, 1);
        this.importValidators.splice(index, 1);
        this.validateUsers();
        this.changeDetectorRef.detectChanges();
    }

    onEmailKeyPress(i: number) {
        if (!this.importUsers[i].roleNames) {
            this.skipUserGroupValidation = true;
            this.importUsers[i].roleNames = [this.moduleType + ' User'];
            this.changeDetectorRef.detectChanges();
        }
    }
}
