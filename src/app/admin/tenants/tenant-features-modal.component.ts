import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { EntityDto, TenantServiceProxy, UpdateTenantFeaturesInput } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import { FeatureTreeComponent } from '../shared/feature-tree.component';
import { finalize } from 'rxjs/operators';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';

@Component({
    selector: 'tenantFeaturesModal',
    templateUrl: './tenant-features-modal.component.html'
})
export class TenantFeaturesModalComponent extends AppModalDialogComponent implements OnInit {

    @ViewChild('tenantFeaturesModal') modal: ModalDirective;
    @ViewChild('featureTree') featureTree: FeatureTreeComponent;

    saving = false;
    resettingFeatures = false;
    tenantId: number;

    constructor(
        injector: Injector,
        private _tenantService: TenantServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data.title = this.l('Features');
        this.tenantId = this.data.tenantId;
        this.loadFeatures();
    }

    loadFeatures(): void {
        const self = this;
        self._tenantService.getTenantFeaturesForEdit(this.tenantId).subscribe((result) => {
            self.featureTree.editData = result;
        });
    }

    save(): void {
        if (!this.featureTree.areAllValuesValid()) {
            this.message.warn(this.l('InvalidFeaturesWarning'));
            return;
        }


        const input = new UpdateTenantFeaturesInput();
        input.id = this.tenantId;
        input.featureValues = this.featureTree.getGrantedFeatures();

        this.saving = true;
        this._tenantService.updateTenantFeatures(input)
            .pipe(finalize(() => this.saving = false))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
            });
    }

    resetFeatures(): void {
        const input = new EntityDto();
        input.id = this.tenantId;

        this.resettingFeatures = true;
        this._tenantService.resetTenantSpecificFeatures(input)
            .pipe(finalize(() => this.resettingFeatures = false))
            .subscribe(() => {
                this.notify.info(this.l('ResetSuccessfully'));
                this.loadFeatures();
            });
    }

    close(): void {
        this.dialogRef.close();
    }
}
