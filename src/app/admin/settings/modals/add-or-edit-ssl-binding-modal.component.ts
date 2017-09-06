import { Component, ViewChild, Injector, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import {
    TenantHostServiceProxy, AddSslBindingInput, TenantSslCertificateServiceProxy,
    TenantSslCertificateInfo, TenantSslBindingInfo, UpdateSslBindingCertificateInput
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'addOrEditSSLBindingModal',
    templateUrl: 'add-or-edit-ssl-binding-modal.component.html',
    styleUrls: ['add-or-edit-ssl-binding-modal.component.less'],
    providers: [TenantHostServiceProxy, TenantSslCertificateServiceProxy]
})
export class AddOrEditSSLBindingModal extends AppComponentBase {
    
    @ViewChild('createOrEditModal') modal: ModalDirective;
    @Input() hostTypes: any;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active: boolean = false;
    saving: boolean = false;

    model: AddSslBindingInput = new AddSslBindingInput();
    sslCertificates: TenantSslCertificateInfo[];
    editing: boolean = false;
    titleText: string;

    constructor(
        injector: Injector,
        private _tenantHostService: TenantHostServiceProxy,
        private _tenantSslCertificateService: TenantSslCertificateServiceProxy
    ) {
        super(injector);
    }

    show(data: TenantSslBindingInfo): void {
        this.model = new AddSslBindingInput();
        this.editing = !!data;
        this.titleText = this.editing ? this.l('EditSSLBinding') : this.l('AddSSLBinding');

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
            });
    }
    
    save(event): void {
        if (!this.validate(event)) return;
        this.saving = true;

        if (this.editing) {
            let updateModel: UpdateSslBindingCertificateInput = new UpdateSslBindingCertificateInput();
            updateModel.tenantHostType = <any>this.model.tenantHostType;
            updateModel.sslCertificateId = this.model.sslCertificateId;

            this._tenantHostService.updateSslBindingCertificate(updateModel)
                .finally(() => { this.saving = false; })
                .subscribe(result => {
                    this.closeSuccess();
            });
        }
        else
        {
            this._tenantHostService.addSslBinding(this.model)
            .finally(() => { this.saving = false; })
            .subscribe(result => {
                this.closeSuccess();
            });
        }
    }

    close(): void {
        this.active = false;
        this.modal.hide();
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
