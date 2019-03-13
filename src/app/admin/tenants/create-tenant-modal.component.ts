/** Core imports */
import { Component, ElementRef, EventEmitter, Injector, Output, OnInit, ViewChild, Inject } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    CommonLookupServiceProxy,
    CreateTenantInput,
    PasswordComplexitySetting,
    ProfileServiceProxy,
    TenantServiceProxy,
    TenantHostType,
    TenantEditEditionDto,
    SubscribableEditionComboboxItemDto
} from '@shared/service-proxies/service-proxies';
import { TenantsService } from '@admin/tenants/tenants.service';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';

@Component({
    selector: 'createTenantModal',
    templateUrl: './create-tenant-modal.component.html',
    providers: [ TenantsService ]
})
export class CreateTenantModalComponent extends AppModalDialogComponent implements OnInit {
    @ViewChild('tenancyNameInput') tenancyNameInput: ElementRef;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    saving = false;
    setRandomPassword = true;
    tenant: CreateTenantInput;
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    editionsGroups$: Observable<SubscribableEditionComboboxItemDto[][]>;
    editionsModels: { [value: string]: TenantEditEditionDto } = {};

    constructor(
        injector: Injector,
        private _tenantService: TenantServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _profileService: ProfileServiceProxy,
        private _tenantsService: TenantsService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data.title = this.l('CreateNewTenant');
        this.init();
        this._profileService.getPasswordComplexitySetting().subscribe(result => {
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
        this.saving = true;

        if (this.setRandomPassword) {
            this.tenant.adminPassword = null;
        }

        this.tenant.editions = this._tenantsService.getTenantEditions();
        this.tenant.tenantHostType = <any>TenantHostType.PlatformApp;
        this._tenantService.createTenant(this.tenant)
            .pipe(finalize(() => this.saving = false))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this.dialogRef.close();
    }

}
