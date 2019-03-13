/** Core imports */
import { Component, ElementRef, EventEmitter, Injector, OnInit, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    SubscribableEditionComboboxItemDto,
    TenantEditDto,
    TenantEditEditionDto,
    TenantServiceProxy
} from '@shared/service-proxies/service-proxies';
import { TenantsService } from '@admin/tenants/tenants.service';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';

@Component({
    selector: 'editTenantModal',
    templateUrl: './edit-tenant-modal.component.html',
    providers: [ TenantsService ]
})
export class EditTenantModalComponent extends AppModalDialogComponent implements OnInit {

    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('SubscriptionEndDateUtc') subscriptionEndDateUtc: ElementRef;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

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

    ngOnInit() {
        this.data.title = this.l('EditTenant');
        forkJoin(
            this._tenantsService.getEditionsGroups(),
            this._tenantService.getTenantForEdit(this.data.tenantId)
        ).subscribe(([editionsGroups, tenantResult]) => {
            this.editionsGroups = editionsGroups;
            this.tenant = tenantResult;
            this.editionsModels = this._tenantsService.getEditionsModels(editionsGroups, tenantResult);
        });
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
        this.dialogRef.close();
    }
}
