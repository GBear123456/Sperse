/** Core imports */
import { Component, ViewChild, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import { DxFileUploaderComponent } from 'devextreme-angular/ui/file-uploader';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { TenantSslCertificateServiceProxy, AddTenantSslCertificateInput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '../../../shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';

@Component({
    selector: 'uploadSSLCertificateModal',
    templateUrl: 'upload-ssl-cert-modal.component.html',
    styleUrls: ['upload-ssl-cert-modal.component.less'],
    providers: [ TenantSslCertificateServiceProxy ]
})
export class UploadSSLCertificateModalComponent {
    @ViewChild('createOrEditModal', { static: false }) modal: ModalDirective;
    @ViewChild('uploader', { static: false }) uploader: DxFileUploaderComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    model: AddTenantSslCertificateInput = new AddTenantSslCertificateInput();

    constructor(
        private sslService: TenantSslCertificateServiceProxy,
        private notify: NotifyService,
        public ls: AppLocalizationService
    ) {}

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
        reader.onloadend = () => {
            this.model.base64EncodedCertificate = btoa(reader.result as string);
            this.sslService.addTenantSslCertificate(this.model)
                .pipe(finalize(() => { this.saving = false; }))
                .subscribe(() => {
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                    this.close();
                    this.modalSave.emit(null);
                });
        };

        reader.readAsBinaryString(file);
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
