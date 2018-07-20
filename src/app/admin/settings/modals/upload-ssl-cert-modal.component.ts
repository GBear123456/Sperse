import { Component, ViewChild, Injector, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { TenantSslCertificateServiceProxy, AddTenantSslCertificateInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DxFileUploaderComponent } from 'devextreme-angular';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'uploadSSLCertificateModal',
    templateUrl: 'upload-ssl-cert-modal.component.html',
    styleUrls: ['upload-ssl-cert-modal.component.less'],
    providers: [ TenantSslCertificateServiceProxy ]
})
export class UploadSSLCertificateModalComponent extends AppComponentBase {
    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('uploader') uploader: DxFileUploaderComponent;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    model: AddTenantSslCertificateInput = new AddTenantSslCertificateInput();
    constructor(
        injector: Injector,
        private _sslService: TenantSslCertificateServiceProxy
    ) {
        super(injector);
    }

    show(): void {
        this.model = new AddTenantSslCertificateInput();
        this.active = true;
        this.modal.show();
    }

    save(event): void {
        if (!this.validate(event)) return;
        this.saving = true;

        let file = this.uploader.value[0];
        let reader = new FileReader();

        reader.onloadend = e => {
            this.model.base64EncodedCertificate = btoa(reader.result);

            this._sslService.addTenantSslCertificate(this.model)
                .pipe(finalize(() => { this.saving = false; }))
                .subscribe(result => {
                    this.notify.info(this.l('SavedSuccessfully'));
                    this.close();
                    this.modalSave.emit(null);
                });
        };

        reader.readAsBinaryString(file);
    }

    close(): void {
        this.active = false;
        this.modal.hide();
        setTimeout( window.scrollTo(0, 0));
    }

    validate(event): boolean {
        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }
}
