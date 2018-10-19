/** Core imports */
import { Component, Inject, Injector, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef, MatHorizontalStepper } from '@angular/material';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ModuleType, RoleServiceProxy, UserServiceProxy } from 'shared/service-proxies/service-proxies';
import { QuestionnaireComponent } from '@shared/shared-intro-steps/questionnaire/questionnaire.component';
import { ImportUsersStepComponent } from '@shared/shared-intro-steps/import-users-step/import-users-step.component';


@Component({
    selector: 'app-crm-intro',
    templateUrl: './crm-intro.component.html',
    styleUrls: ['./crm-intro.component.less'],
    animations: [appModuleAnimation()],
    providers: [RoleServiceProxy, UserServiceProxy]
})
export class CrmIntroComponent extends AppComponentBase implements OnInit {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    @ViewChild(QuestionnaireComponent) questionnaire: QuestionnaireComponent;
    @ViewChild(ImportUsersStepComponent) importUsersStepComponent: ImportUsersStepComponent;
    dialogRef: MatDialogRef<CrmIntroComponent, any>;
    readonly identifier = 'CRM-Setup';
    moduleName: string;
    showImportUsersStep: boolean;
    maxAvailableUserCount: number;

    constructor(
        injector: Injector,
        private _userService: UserServiceProxy,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this.moduleName = AppConsts.modules.CRMModule;
        this.dialogRef = <any>injector.get(MatDialogRef);

        this.showImportUsersStep = (!abp.session.tenantId || this.feature.isEnabled('Admin'))
            && this.permission.isGranted('Pages.Administration.Users')
            && this.permission.isGranted('Pages.Administration.Users.Create')
            && this.permission.isGranted('Pages.Administration.Roles');
    }

    ngOnInit() {
        this.stepper.selectedIndex = 1;
        if (this.showImportUsersStep) this.getAvailableUserCount();
    }

    onSubmit() {
        if (this.showImportUsersStep) {
            this.importUsersStepComponent.validateUsers();
            if (!this.importUsersStepComponent.validationResult)
                return;

            this.startLoading(true);
            this.importUsersStepComponent.submitInviteUsers()
                .subscribe(() => this.questionnaire.submitQuestionnaire(), () => this.finishLoading(true));
        } else {
            this.startLoading(true);
            this.questionnaire.submitQuestionnaire();
        }
    }

    closeDialog() {
        this.dialogRef.close();
    }

    goToStep(index) {
        this.stepper.selectedIndex = index;
    }

    // GetAvailableUserCount
    getAvailableUserCount() {
        this._userService.getAvailableUserCount(ModuleType.CRM).subscribe(result => {
            this.maxAvailableUserCount = result;
        });
    }
}
