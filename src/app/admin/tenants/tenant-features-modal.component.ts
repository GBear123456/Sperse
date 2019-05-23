/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, Inject, ViewChild, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { EntityDto, TenantServiceProxy, UpdateTenantFeaturesInput } from '@shared/service-proxies/service-proxies';
import { FeatureTreeComponent } from '../shared/feature-tree.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MessageService } from '@abp/message/message.service';
import { NotifyService } from '@abp/notify/notify.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';

@Component({
    selector: 'tenantFeaturesModal',
    templateUrl: './tenant-features-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantFeaturesModalComponent implements OnInit {

    @ViewChild('featureTree') featureTree: FeatureTreeComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    saving = false;
    resettingFeatures = false;
    tenantId: number;
    title = this.ls.l('Features');
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('ResetSpecialFeatures'),
            class: 'default',
            hint: this.ls.l('ResetFeaturesTooltip'),
            action: this.resetFeatures.bind(this)
        },
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private _tenantService: TenantServiceProxy,
        private _messageService: MessageService,
        private _notifyService: NotifyService,
        private _dialogRef: MatDialogRef<TenantFeaturesModalComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.tenantId = this.data.tenantId;
        this.loadFeatures();
    }

    loadFeatures(): void {
        this.modalDialog.startLoading();
        const self = this;
        self._tenantService.getTenantFeaturesForEdit(this.tenantId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result) => {
                self.featureTree.editData = result;
                this._changeDetectorRef.detectChanges();
            });
    }

    save(): void {
        if (!this.featureTree.areAllValuesValid()) {
            this._messageService.warn(this.ls.l('InvalidFeaturesWarning'));
            return;
        }
        this.modalDialog.startLoading();
        const input = new UpdateTenantFeaturesInput();
        input.id = this.tenantId;
        input.featureValues = this.featureTree.getGrantedFeatures();
        this._tenantService.updateTenantFeatures(input)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this.close();
            });
    }

    resetFeatures(): void {
        this.modalDialog.startLoading();
        const input = new EntityDto();
        input.id = this.tenantId;
        this.resettingFeatures = true;
        this._tenantService.resetTenantSpecificFeatures(input)
            .pipe(finalize(() => {
                this.modalDialog.finishLoading();
                this.resettingFeatures = false;
                this._changeDetectorRef.detectChanges();
            }))
            .subscribe(() => {
                this._notifyService.info(this.ls.l('ResetSuccessfully'));
                this.loadFeatures();
            });
    }

    close(): void {
        this._dialogRef.close();
    }
}
