/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    ElementRef,
    EventEmitter,
    Output,
    OnInit,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    CommonLookupServiceProxy,
    CreateTenantInput,
    PasswordComplexitySetting,
    ProfileServiceProxy,
    TenantServiceProxy,
    TenantEditEditionDto,
    SubscribableEditionComboboxItemDto
} from '@shared/service-proxies/service-proxies';
import { TenantsService } from '@admin/tenants/tenants.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'createTenantModal',
    templateUrl: './create-tenant-modal.component.html',
    styleUrls: [ '../../../shared/metronic/m-checkbox.less' ],
    providers: [ TenantsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTenantModalComponent implements OnInit {
    @ViewChild('tenancyNameInput') tenancyNameInput: ElementRef;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    setRandomPassword = true;
    tenant: CreateTenantInput;
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    editionsGroups$: Observable<SubscribableEditionComboboxItemDto[][]>;
    editionsModels: { [value: string]: TenantEditEditionDto } = {};
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
        private _tenantService: TenantServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _profileService: ProfileServiceProxy,
        private _tenantsService: TenantsService,
        private _notifyService: NotifyService,
        private _dialogRef: MatDialogRef<CreateTenantModalComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.init();
        this._profileService.getPasswordComplexitySetting()
            .pipe(finalize(() => {
                this.modalDialog.finishLoading();
                this._changeDetectorRef.detectChanges();
            }))
            .subscribe(result => {
                this.passwordComplexitySetting = result.setting;
            });
    }

    init(): void {
        this.tenant = new CreateTenantInput();
        this.tenant.isActive = true;
        this.tenant.shouldChangePasswordOnNextLogin = true;
        this.tenant.sendActivationEmail = true;
        this.editionsGroups$ = this._tenantsService.getEditionsGroups();
        this.editionsModels = this._tenantsService.editionsModels;
    }

    save(): void {
        this.modalDialog.startLoading();
        if (this.setRandomPassword) {
            this.tenant.adminPassword = null;
        }
        this.tenant.editions = this._tenantsService.getTenantEditions();
        this._tenantService.createTenant(this.tenant)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this._dialogRef.close(true);
                this.modalSave.emit(null);
            });
    }

}
