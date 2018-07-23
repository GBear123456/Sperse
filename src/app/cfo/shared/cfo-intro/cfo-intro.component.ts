/** Core imports */
import { Component, Injector, Inject, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatHorizontalStepper, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

/** Application imports */
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { InstanceType } from 'shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { QuestionnaireComponent } from '@shared/shared-intro-speps/questionnaire/questionnaire.component';
import { ImportUsersStepComponent } from '@shared/shared-intro-speps/import-users-step/import-users-step.component';

@Component({
    selector: 'app-cfo-intro',
    templateUrl: './cfo-intro.component.html',
    styleUrls: ['./cfo-intro.component.less'],
    animations: [appModuleAnimation()]
})
export class CfoIntroComponent extends CFOComponentBase implements OnInit {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    @ViewChild(QuestionnaireComponent) questionnaire: QuestionnaireComponent;
    @ViewChild(ImportUsersStepComponent) importUsersStepComponent: ImportUsersStepComponent;
    dialogRef: MatDialogRef<CfoIntroComponent, any>;
    isLinear = false;
    readonly identifier = 'CFO-Instance-Setup';
    moduleName: string;
    showImportUsersStep: boolean;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        super(injector);
        this.moduleName = AppConsts.modules.CFOModule;
        this.dialogRef = <any>injector.get(MatDialogRef);

        this.showImportUsersStep = this.instanceType == InstanceType.Main &&
            (!abp.session.tenantId || this.feature.isEnabled('Admin'))
            && this.permission.isGranted('Pages.Administration.Users')
            && this.permission.isGranted('Pages.Administration.Users.Create')
            && this.permission.isGranted('Pages.Administration.Roles');
    }

    ngOnInit() {}

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
}
