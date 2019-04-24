/** Core imports */
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { forkJoin } from 'rxjs';

/** Application imports */
import {
    SubscribableEditionComboboxItemDto,
    TenantEditDto,
    TenantEditEditionDto,
    TenantServiceProxy
} from '@shared/service-proxies/service-proxies';
import { TenantsService } from '@admin/tenants/tenants.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    selector: 'editTenantModal',
    templateUrl: './edit-tenant-modal.component.html',
    providers: [ TenantsService ]
})
export class EditTenantModalComponent implements OnInit {

    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('SubscriptionEndDateUtc') subscriptionEndDateUtc: ElementRef;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    saving = false;
    tenant: TenantEditDto;
    editionsModels: { [value: string]: TenantEditEditionDto } = {};
    editionsGroups: SubscribableEditionComboboxItemDto[][];
    title = this.ls.l('EditTenant');
    constructor(
        @Inject(MAT_DIALOG_DATA) private data: any,
        private _tenantService: TenantServiceProxy,
        private _tenantsService: TenantsService,
        public ls: AppLocalizationService,
        private _notifyService: NotifyService,
        private changeDetectorRef: ChangeDetectorRef,
        private _dialogRef: MatDialogRef<EditTenantModalComponent>
    ) {}

    ngOnInit() {
        forkJoin(
            this._tenantsService.getEditionsGroups(),
            this._tenantService.getTenantForEdit(this.data.tenantId)
        ).subscribe(([editionsGroups, tenantResult]) => {
            this.editionsGroups = editionsGroups;
            this.tenant = tenantResult;
            this.editionsModels = this._tenantsService.getEditionsModels(editionsGroups, tenantResult);
            this.changeDetectorRef.detectChanges();
        });
    }

    save(): void {
        this.saving = true;
        this.tenant.editions = this._tenantsService.getTenantEditions();
        this._tenantService.updateTenant(this.tenant)
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this._dialogRef.close();
    }
}
