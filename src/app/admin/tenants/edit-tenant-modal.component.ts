/** Core imports */
import {
    ChangeDetectorRef,
    ChangeDetectionStrategy,
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
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { finalize } from '@node_modules/rxjs/internal/operators';
import { ModulesEditionsSelectComponent } from './modules-edtions-select.component.ts/modules-editions-select.component';

@Component({
    selector: 'editTenantModal',
    templateUrl: './edit-tenant-modal.component.html',
    styleUrls: [ './modal.less' ],
    providers: [ TenantsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditTenantModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('SubscriptionEndDateUtc') subscriptionEndDateUtc: ElementRef;
    @ViewChild(ModulesEditionsSelectComponent) editionsSelect: ModulesEditionsSelectComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    tenant: TenantEditDto;
    editionsModels: { [value: string]: TenantEditEditionDto } = {};
    editionsGroups: SubscribableEditionComboboxItemDto[][];
    title = this.ls.l('EditTenant');
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        @Inject(MAT_DIALOG_DATA) private data: any,
        private _tenantService: TenantServiceProxy,
        private _tenantsService: TenantsService,
        private _notifyService: NotifyService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _dialogRef: MatDialogRef<EditTenantModalComponent>,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        forkJoin(
            this._tenantsService.getEditionsGroups(),
            this._tenantService.getTenantForEdit(this.data.tenantId)
        ).pipe(finalize(() => this.modalDialog.finishLoading()))
        .subscribe(([editionsGroups, tenantResult]) => {
            this.editionsGroups = editionsGroups;
            this.tenant = tenantResult;
            this.editionsModels = this._tenantsService.getEditionsModels(editionsGroups, tenantResult);
            this._changeDetectorRef.detectChanges();
        });
    }

    save(): void {
        if (!this.editionsSelect.validateModel())
            return;
        
        this.modalDialog.startLoading();
        this.tenant.editions = this._tenantsService.getTenantEditions();
        this._tenantService.updateTenant(this.tenant)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this._dialogRef.close(true);
                this.modalSave.emit(null);
            });
    }

}
