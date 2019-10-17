/** Core imports */
import { Component, Inject, Injector, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatHorizontalStepper } from '@angular/material/stepper';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ModuleType, RoleServiceProxy, UserServiceProxy } from 'shared/service-proxies/service-proxies';
import { QuestionnaireComponent } from '@shared/shared-intro-steps/questionnaire/questionnaire.component';
import { ImportUsersStepComponent } from '@shared/shared-intro-steps/import-users-step/import-users-step.component';
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';

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
    readonly moduleType = ModuleType.CRM;
    moduleName: string;
    showImportUsersStep: boolean;
    maxAvailableUserCount: number;

    constructor(
        injector: Injector,
        private userService: UserServiceProxy,
        public appService: AppService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector);
        this.moduleName = AppConsts.modules.CRMModule;
        this.dialogRef = <any>injector.get(MatDialogRef);

        this.showImportUsersStep = (appService.isHostTenant || this.feature.isEnabled(AppFeatures.Admin))
            && this.permission.isGranted(AppPermissions.AdministrationUsers)
            && this.permission.isGranted(AppPermissions.AdministrationUsersCreate)
            && this.permission.isGranted(AppPermissions.AdministrationRoles);
    }

    ngOnInit() {
        this.stepper.selectedIndex = 1;
        if (this.showImportUsersStep) this.getAvailableUserCount();
    }

    onSubmit() {
        if (this.showImportUsersStep && this.importUsersStepComponent) {
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
        this.userService.getAvailableUserCount(ModuleType[this.moduleType]).subscribe(result => {
            this.maxAvailableUserCount = result;
        });
    }
}
