/** Core imports */
import { Component, Injector, Inject, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatHorizontalStepper } from '@angular/material/stepper';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { InstanceType, ModuleType, UserServiceProxy } from 'shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { QuestionnaireComponent } from '@shared/shared-intro-steps/questionnaire/questionnaire.component';
import { ImportUsersStepComponent } from '@shared/shared-intro-steps/import-users-step/import-users-step.component';
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';

@Component({
    selector: 'app-cfo-intro',
    templateUrl: './cfo-intro.component.html',
    styleUrls: [
        '../../../../shared/common/styles/close-button.less',
        './cfo-intro.component.less'
    ],
    animations: [appModuleAnimation()],
    providers: [UserServiceProxy]
})
export class CfoIntroComponent extends CFOComponentBase implements OnInit {
    @ViewChild('stepper', { static: true }) stepper: MatHorizontalStepper;
    @ViewChild(QuestionnaireComponent) questionnaire: QuestionnaireComponent;
    @ViewChild(ImportUsersStepComponent) importUsersStepComponent: ImportUsersStepComponent;
    dialogRef: MatDialogRef<CfoIntroComponent, any>;
    readonly identifier = 'CFO-Instance-Setup';
    readonly moduleType = ModuleType.CFO;
    moduleName: string;
    showImportUsersStep: boolean;
    maxAvailableUserCount: number;

    constructor(
        injector: Injector,
        private userService: UserServiceProxy,
        public appService: AppService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        super(injector);
        this.moduleName = AppConsts.modules.CFOModule;
        this.dialogRef = <any>injector.get(MatDialogRef);
        this.showImportUsersStep = this.instanceType == InstanceType.Main &&
            (appService.isHostTenant || this.feature.isEnabled(AppFeatures.Admin))
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
