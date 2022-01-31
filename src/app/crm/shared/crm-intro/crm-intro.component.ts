/** Core imports */
import { Component, ElementRef, Inject, Injector, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatHorizontalStepper } from '@angular/material/stepper';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { ModuleType, ModuleType2, RoleServiceProxy, UserServiceProxy } from 'shared/service-proxies/service-proxies';
import { QuestionnaireComponent } from '@shared/shared-intro-steps/questionnaire/questionnaire.component';
import { ImportUsersStepComponent } from '@shared/shared-intro-steps/import-users-step/import-users-step.component';
import { AppService } from '@app/app.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { PermissionCheckerService } from 'abp-ng2-module';
import { FeatureCheckerService } from 'abp-ng2-module';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-crm-intro',
    templateUrl: './crm-intro.component.html',
    styleUrls: [
        '../../../../shared/common/styles/close-button.less',
        './crm-intro.component.less'
    ],
    providers: [ RoleServiceProxy, UserServiceProxy ]
})
export class CrmIntroComponent implements OnInit {
    @ViewChild('stepper', { static: true }) stepper: MatHorizontalStepper;
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
        private permission: PermissionCheckerService,
        private feature: FeatureCheckerService,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        public appService: AppService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
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

            this.loadingService.startLoading(this.elementRef.nativeElement);
            this.importUsersStepComponent.submitInviteUsers()
                .subscribe(
                   () => this.questionnaire.submitQuestionnaire(this.elementRef.nativeElement),
                   () => this.loadingService.finishLoading(this.elementRef.nativeElement)
                );
        } else {
            this.loadingService.startLoading(this.elementRef.nativeElement);
            this.questionnaire.submitQuestionnaire(this.elementRef.nativeElement);
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
        this.userService.getAvailableUserCount(ModuleType2[this.moduleType]).subscribe(result => {
            this.maxAvailableUserCount = result;
        });
    }
}
