/** Core imports */
import { Component, Injector, Inject, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MatHorizontalStepper, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import * as nameParser from 'parse-full-name';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
    RoleServiceProxy, RoleListDto, UserServiceProxy,
    InviteUserInput, TenantHostType
} from 'shared/service-proxies/service-proxies';
import { ImportUserData } from './crm-intro.model';
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
    isLinear = false;
    readonly identifier = 'CRM-Setup';
    moduleName: string;
    showImportUsersStep: boolean;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
        this.moduleName = AppConsts.modules.CRMModule;
        this.dialogRef = <any>injector.get(MatDialogRef);
    }

    ngOnInit() {
        this.stepper.selectedIndex = 1;
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
}
