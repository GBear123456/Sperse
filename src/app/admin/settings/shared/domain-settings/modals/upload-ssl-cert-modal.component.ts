/** Core imports */
import {Component, ViewChild, Inject } from '@angular/core';

/** Third party imports */
import { DxFileUploaderComponent } from 'devextreme-angular/ui/file-uploader';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotifyService } from 'abp-ng2-module';

/** Application imports */
import { TenantSslCertificateServiceProxy, AddTenantSslCertificateInput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';

@Component({
    selector: 'uploadSSLCertificateModal',
    templateUrl: 'upload-ssl-cert-modal.component.html',
    styleUrls: ['upload-ssl-cert-modal.component.less'],
    providers: [ TenantSslCertificateServiceProxy ]
})
export class UploadSSLCertificateModalComponent {
    @ViewChild('uploader') uploader: DxFileUploaderComponent;

    saving = false;
    model: AddTenantSslCertificateInput = new AddTenantSslCertificateInput();
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private sslService: TenantSslCertificateServiceProxy,
        private notify: NotifyService,
        public ls: AppLocalizationService,
        private dialogRef: MatDialogRef<UploadSSLCertificateModalComponent>,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    save(): void {
        this.saving = true;
        let file = this.uploader.value[0];
        let reader = new FileReader();
        reader.onloadend = () => {
            this.model.base64EncodedCertificate = btoa(reader.result as string);
            this.sslService.addTenantSslCertificate(this.model)
                .pipe(finalize(() => { this.saving = false; }))
                .subscribe(() => {
                    this.notify.info(this.ls.l('SavedSuccessfully'));
                    this.dialogRef.close(true);
                });
        };

        reader.readAsBinaryString(file);
    }

    validate(event): boolean {
        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }
}
