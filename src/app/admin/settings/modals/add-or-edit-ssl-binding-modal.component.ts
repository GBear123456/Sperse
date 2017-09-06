import { Component, ViewChild, Injector, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { TenantHostServiceProxy, AddSslBindingInput, TenantSslCertificateServiceProxy, TenantSslCertificateInfo } from '@shared/service-proxies/service-proxies';
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

    constructor(
        injector: Injector,
        private _tenantHostService: TenantHostServiceProxy,
        private _tenantSslCertificateService: TenantSslCertificateServiceProxy
    ) {
        super(injector);
    }

    show(): void {
        this.model = new AddSslBindingInput();

        this._tenantSslCertificateService.getTenantSslCertificates()
            .subscribe(result => {
                this.sslCertificates = result;

                this.active = true;
                this.modal.show();
            });
    }
    
    save(event): void {
        if (!this.validate(event)) return;
        this.saving = true;

        this._tenantHostService.addSslBinding(this.model)
            .finally(() => { this.saving = false; })
            .subscribe(result => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
        });
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    validate(event): boolean {
        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }
}
