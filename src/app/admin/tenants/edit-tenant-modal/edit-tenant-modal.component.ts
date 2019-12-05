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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import {
    EntityDto,
    GetTenantFeaturesEditOutput,
    SubscribableEditionComboboxItemDto,
    TenantEditDto,
    TenantEditEditionDto,
    TenantServiceProxy,
    UpdateTenantFeaturesInput
} from '@shared/service-proxies/service-proxies';
import { TenantsService } from '@admin/tenants/tenants.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ModulesEditionsSelectComponent } from '../modules-edtions-select.component.ts/modules-editions-select.component';
import { FeatureTreeComponent } from '@admin/shared/feature-tree.component';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { MessageService } from '@abp/message/message.service';

@Component({
    selector: 'editTenantModal',
    templateUrl: './edit-tenant-modal.component.html',
    styleUrls: [ '../modal.less' ],
    providers: [ TenantsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditTenantModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('SubscriptionEndDateUtc') subscriptionEndDateUtc: ElementRef;
    @ViewChild(ModulesEditionsSelectComponent) editionsSelect: ModulesEditionsSelectComponent;
    @ViewChild(FeatureTreeComponent) featureTree: FeatureTreeComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    tenant: TenantEditDto;
    initialTenant: TenantEditDto;
    editionsModels: { [value: string]: TenantEditEditionDto } = {};
    editionsGroups: SubscribableEditionComboboxItemDto[][];
    title = this.ls.l('EditTenant');
    resettingFeatures = false;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];
    tenantId: number = this.data.tenantId;
    features$: Observable<GetTenantFeaturesEditOutput> = this.tenantService.getTenantFeaturesForEdit(this.tenantId);

    constructor(
        private tenantService: TenantServiceProxy,
        private tenantsService: TenantsService,
        private notifyService: NotifyService,
        private changeDetectorRef: ChangeDetectorRef,
        private dialogRef: MatDialogRef<EditTenantModalComponent>,
        private messageService: MessageService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        forkJoin(
            this.tenantsService.getEditionsGroups(),
            this.tenantService.getTenantForEdit(this.tenantId),
        ).pipe(
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe(([editionsGroups, tenantResult]) => {
            this.editionsGroups = editionsGroups;
            this.initialTenant = tenantResult;
            this.tenant = cloneDeep(tenantResult);
            this.editionsModels = this.tenantsService.getEditionsModels(editionsGroups, tenantResult);
            this.changeDetectorRef.detectChanges();
        });
    }

    resetFeatures(e): void {
        this.modalDialog.startLoading();
        const input = new EntityDto();
        input.id = this.data.tenantId;
        this.resettingFeatures = true;
        this.tenantService.resetTenantSpecificFeatures(input)
            .pipe(finalize(() => {
                this.modalDialog.finishLoading();
                this.resettingFeatures = false;
                this.changeDetectorRef.detectChanges();
            }))
            .subscribe(() => {
                this.notifyService.info(this.ls.l('ResetSuccessfully'));
                this.loadFeatures();
            });
        e.preventDefault();
    }

    private loadFeatures(): void {
        this.modalDialog.startLoading();
        this.features$ = this.tenantService.getTenantFeaturesForEdit(this.tenantId)
            .pipe(finalize(() => this.modalDialog.finishLoading()));
    }

    save(): void {
        if (!this.editionsSelect.validateModel())
            return;

        this.modalDialog.startLoading();
        this.tenant.editions = this.tenantsService.getTenantEditions();
        const savings: Observable<any>[] = [];
        /** If tenant properties changed */
        const tenantChanged = JSON.stringify(this.initialTenant) !== JSON.stringify(this.tenant);
        if (tenantChanged) {
            savings.push(this.tenantService.updateTenant(this.tenant));
        }

        /** if features changed */
        const featureValues = this.featureTree.getGrantedFeatures();
        if (ArrayHelper.dataChanged(this.featureTree.initialGrantedFeatures, featureValues)) {
            if (!this.featureTree.areAllValuesValid()) {
                this.messageService.warn(this.ls.l('InvalidFeaturesWarning'));
                return;
            }
            const updateFeaturesInput = new UpdateTenantFeaturesInput();
            updateFeaturesInput.id = this.tenantId;
            updateFeaturesInput.featureValues = featureValues;
            savings.push(this.tenantService.updateTenantFeatures(updateFeaturesInput));
        }

        forkJoin(savings).pipe(
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe(
            () => {},
            () => {},
            () => {
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.dialogRef.close(tenantChanged);
                this.modalSave.emit(null);
            }
        );
    }

}
