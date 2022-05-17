/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    EventEmitter,
    Output,
    OnInit,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    CreateTenantInput,
    PasswordComplexitySetting,
    ProfileServiceProxy,
    TenantServiceProxy,
    TenantEditEditionDto,
    SubscribableEditionComboboxItemDto,
    GetPasswordComplexitySettingOutput
} from '@shared/service-proxies/service-proxies';
import { TenantsService } from '@admin/tenants/tenants.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ModulesEditionsSelectComponent } from '../modules-edtions-select.component.ts/modules-editions-select.component';

//!!VP should be reimplemnted to use Dx text box instead of inputs
@Component({
    selector: 'createTenantModal',
    templateUrl: './create-tenant-modal.component.html',
    styleUrls: [
        '../modal.less',
        './create-tenant-modal.component.less'
    ],
    providers: [ TenantsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTenantModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild(ModulesEditionsSelectComponent) editionsSelect: ModulesEditionsSelectComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    setRandomPassword = true;
    tenant: CreateTenantInput;
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    editionsGroups$: Observable<SubscribableEditionComboboxItemDto[][]>;
    editionsModels: { [value: string]: TenantEditEditionDto } = {};
    nameRegEx = AppConsts.regexPatterns.fullName;
    emailRegEx = AppConsts.regexPatterns.email;
    title = this.ls.l('CreateNewTenant');
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private tenantService: TenantServiceProxy,
        private profileService: ProfileServiceProxy,
        private tenantsService: TenantsService,
        private notifyService: NotifyService,
        private dialogRef: MatDialogRef<CreateTenantModalComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.init();
        this.profileService.getPasswordComplexitySetting()
            .pipe(finalize(() => {
                this.modalDialog.finishLoading();
                this.changeDetectorRef.detectChanges();
            }))
            .subscribe((result: GetPasswordComplexitySettingOutput) => {
                this.passwordComplexitySetting = result.setting;
            });
    }

    init(): void {
        this.tenant = new CreateTenantInput();
        this.tenant.isActive = true;
        this.tenant.shouldChangePasswordOnNextLogin = true;
        this.tenant.sendActivationEmail = true;
        this.editionsGroups$ = this.tenantsService.getEditionsGroups();
        this.editionsModels = this.tenantsService.editionsModels;
    }

    save(): void {
        if (!this.editionsSelect.validateModel())
            return;

        this.modalDialog.startLoading();
        if (this.setRandomPassword) {
            this.tenant.adminPassword = null;
        }
        this.tenant.editions = this.tenantsService.getTenantEditions();
        this.tenantService.createTenant(this.tenant)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.dialogRef.close(true);
                this.modalSave.emit(null);
            });
    }
}
