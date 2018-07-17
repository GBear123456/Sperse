/** Core imports */
import { Component, Injector, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

/** Third party imports */
import { MatHorizontalStepper, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import * as nameParser from 'parse-full-name';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
    QuestionnaireServiceProxy, QuestionDto, QuestionnaireResponseDto, AnswerDto, RoleServiceProxy, RoleListDto, UserServiceProxy,
    InviteUserInput, TenantHostType
} from 'shared/service-proxies/service-proxies';
import { ImportUserData } from './crm-intro.model';


@Component({
    selector: 'app-crm-intro',
    templateUrl: './crm-intro.component.html',
    styleUrls: ['./crm-intro.component.less'],
    animations: [appModuleAnimation()],
    providers: [QuestionnaireServiceProxy, RoleServiceProxy, UserServiceProxy]
})
export class CrmIntroComponent extends AppComponentBase implements OnInit {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    dialogRef: MatDialogRef<CrmIntroComponent, any>;
    isLinear = false;
    readonly identifier = 'CRM-Instance-Setup';

    question: QuestionDto;
    roles: RoleListDto[] = [];
    importUsers: ImportUserData[] = [new ImportUserData(), new ImportUserData(), new ImportUserData()];
    importValidators: any[] = [];

    showImportUsersStep: boolean;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _questionnaireService: QuestionnaireServiceProxy,
        private _roleService: RoleServiceProxy,
        private _userService: UserServiceProxy
    ) {
        super(injector);
        this.dialogRef = <any>injector.get(MatDialogRef);
    }

    ngOnInit() {
        // this._questionnaireService.get(this.identifier)
        //     .subscribe(result => {
        //         this.question = result.questions[0];
        //     });

        // if (this.showImportUsersStep) {
        //     this._roleService.getRoles(undefined).subscribe(result => {
        //         this.roles = result.items;
        //     });
        // }
    }

    onSubmit() {
        if (this.showImportUsersStep) {
            if (!this.validateUsers())
                return;

            this.startLoading(true);
            this.submitInviteUsers()
                .subscribe(() => this.submitQuestionnaire(), () => this.finishLoading(true));
        } else {
            this.startLoading(true);
            this.submitQuestionnaire();
        }
    }

    submitQuestionnaire() {
        let response = new QuestionnaireResponseDto();
        response.identifier = this.identifier;
        response.answers = [];

        let selectedAnswerIds: number[] = [];
        this.question.options.forEach(v => {
            if (v['selected']) {
                selectedAnswerIds.push(v.id);
            }
        });

        if (selectedAnswerIds.length) {
            response.answers.push(new AnswerDto({
                questionId: this.question.id,
                options: selectedAnswerIds
            }));

            this._questionnaireService.submitResponse(response)
                .pipe(finalize(() => this.finishLoading(true)))
                .subscribe((result) => {
                    this.dialogRef.close({ isGetStartedButtonClicked: true });
                });
        } else {
            this.dialogRef.close({ isGetStartedButtonClicked: true });
            this.finishLoading(true);
        }
    }

    validateUsers() {
        let result = true;
        this.importValidators.forEach((v) => { result = result && v.validate().isValid; });
        return result;
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

    addImportUser() {
        this.importUsers.push(new ImportUserData());
    }

    removeImportUser(index: number) {
        this.importUsers.splice(index, 1);
        this.importValidators.splice(index, 1);
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

    validateFullName = (e) => {
        if (e.value) {
            let fullName = nameParser.parseFullName(e.value.trim());
            if (!fullName.first || !fullName.last)
                return false;
        }
        return true;
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

    goToStep(index) {
        this.stepper.selectedIndex = index;
    }
}
