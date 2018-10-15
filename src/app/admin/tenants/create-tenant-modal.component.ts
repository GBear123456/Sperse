/** Core imports */
import { Component, ElementRef, EventEmitter, Injector, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { ModalDirective } from 'ngx-bootstrap';
import { values } from 'lodash';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
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

@Component({
    selector: 'createTenantModal',
    templateUrl: './create-tenant-modal.component.html',
    providers: [ TenantsService ]
})
export class CreateTenantModalComponent extends AppComponentBase {

    @ViewChild('tenancyNameInput') tenancyNameInput: ElementRef;
    @ViewChild('createModal') modal: ModalDirective;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
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

    show() {
        this.active = true;
        this.init();

        this._profileService.getPasswordComplexitySetting().subscribe(result => {
            this.passwordComplexitySetting = result.setting;
            this.modal.show();
        });
    }

    onShown(): void {
        $('#TenancyName').focus();
    }

    init(): void {
        this.tenant = new CreateTenantInput();
        this.tenant.isActive = true;
        this.tenant.shouldChangePasswordOnNextLogin = true;
        this.tenant.sendActivationEmail = true;
        this.editionsGroups$ = this._tenantsService.getEditionsGroupsWithDefaultEdition();
        this.editionsModels = this._tenantsService.editionsModels;
    }

    save(): void {
        this.saving = true;

        if (this.setRandomPassword) {
            this.tenant.adminPassword = null;
        }

        this.tenant.editions = values(this.editionsModels);
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
        this.active = false;
        this.modal.hide();
    }

}
