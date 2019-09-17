import { Component, ViewChild, Injector, Input, Output, EventEmitter, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import {
    TenantHostServiceProxy, AddSslBindingInput, TenantSslCertificateServiceProxy,
    TenantSslCertificateInfo, TenantSslBindingInfo, UpdateSslBindingInput
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'addOrEditSSLBindingModal',
    templateUrl: 'add-or-edit-ssl-binding-modal.component.html',
    styleUrls: ['add-or-edit-ssl-binding-modal.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantHostServiceProxy, TenantSslCertificateServiceProxy ]
})
export class AddOrEditSSLBindingModal extends AppComponentBase {
    @ViewChild('createOrEditModal') modal: ModalDirective;
    @Input() hostTypes: any;
    @Input() orgUnits: any;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    model: any;

    sslCertificates: TenantSslCertificateInfo[];
    editing = false;
    titleText: string;

    constructor(
        injector: Injector,
        private changeDetection: ChangeDetectorRef,
        private _tenantHostService: TenantHostServiceProxy,
        private _tenantSslCertificateService: TenantSslCertificateServiceProxy
    ) {
        super(injector);
    }

    show(data: TenantSslBindingInfo): void {
        this.model = {
            id: undefined,
            sslCertificateId: undefined,
            organizationUnitId: undefined,
            isActive: undefined,
            tenantHostType: undefined,
            domainName: undefined
        };

        if (this.editing = Boolean(data && data.id)) {
            this.model.id = data.id;
            this.model.tenantHostType = data.hostType;
            this.model.isActive = data.isActive;
            this.titleText = this.l('EditSSLBinding');
        } else
            this.titleText = this.l('AddSSLBinding');

        this._tenantSslCertificateService.getTenantSslCertificates()
            .subscribe(result => {
                this.sslCertificates = result;

                if (data) {
                    this.model.tenantHostType = <any>data.hostType;
                    this.model.domainName = data.hostName;
                    this.model.sslCertificateId = data.sslCertificateId;
                }

                this.active = true;
                this.modal.show();

                this.changeDetection.markForCheck();
            });
    }

    save(event): void {
        if (!this.validate(event)) return;
        this.saving = true;

        if (this.editing) {
            this._tenantHostService.updateSslBinding(new UpdateSslBindingInput(this.model))
                .pipe(finalize(() => { this.saving = false; }))
                .subscribe(result => {
                    this.closeSuccess();
            });
        } else {
            this._tenantHostService.addSslBinding(new AddSslBindingInput(this.model))
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(result => {
                this.closeSuccess();
            });
        }
    }

    close(): void {
        this.active = false;
        this.modal.hide();

        this.changeDetection.markForCheck();
    }

    closeSuccess(): void {
        this.notify.info(this.l('SavedSuccessfully'));
        this.close();
        this.modalSave.emit(null);
    }

    validate(event): boolean {
        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }
}