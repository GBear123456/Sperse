/** Core imports */
import { Component, ElementRef, EventEmitter, Injector, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { ModalDirective } from 'ngx-bootstrap';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    SubscribableEditionComboboxItemDto,
    TenantEditDto,
    TenantEditEditionDto,
    TenantServiceProxy
} from '@shared/service-proxies/service-proxies';
import { TenantsService } from '@admin/tenants/tenants.service';

@Component({
    selector: 'editTenantModal',
    templateUrl: './edit-tenant-modal.component.html',
    providers: [ TenantsService ]
})
export class EditTenantModalComponent extends AppComponentBase {

    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('editModal') modal: ModalDirective;
    @ViewChild('SubscriptionEndDateUtc') subscriptionEndDateUtc: ElementRef;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    tenant: TenantEditDto;
    editionsModels: { [value: string]: TenantEditEditionDto } = {};
    editionsGroups: SubscribableEditionComboboxItemDto[][];

    constructor(
        injector: Injector,
        private _tenantService: TenantServiceProxy,
        private _tenantsService: TenantsService
    ) {
        super(injector);
    }

    show(tenantId: number): void {
        this.active = true;
        forkJoin(
            this._tenantsService.getEditionsGroups(),
            this._tenantService.getTenantForEdit(tenantId)
        ).subscribe(([editionsGroups, tenantResult]) => {
            this.editionsGroups = editionsGroups;
            this.tenant = tenantResult;
            this.editionsModels = this._tenantsService.getEditionsModels(editionsGroups, tenantResult);
            this.modal.show();
        });
    }

    onShown(): void {
        $(this.nameInput.nativeElement).focus();
    }

    save(): void {
        this.saving = true;
        this.tenant.editions = this._tenantsService.getTenantEditions();
        this._tenantService.updateTenant(this.tenant)
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
