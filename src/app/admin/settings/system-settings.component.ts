import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TenantSslCertificateServiceProxy } from '@shared/service-proxies/service-proxies';
import { DxFileUploaderComponent, DxTextBoxComponent, DxButtonComponent, DxDataGridComponent } from 'devextreme-angular';
import { UploadSSLCertificateModalComponent } from './upload-ssl-cert-modal.component';

@Component({
    templateUrl: "./system-settings.component.html",
    animations: [appModuleAnimation()],
    providers: [ TenantSslCertificateServiceProxy ]
})
export class SystemSettingsComponent extends AppComponentBase implements OnInit {

    @ViewChild('sslGrid') sslGrid: DxDataGridComponent;
    @ViewChild('uploadSSLCertificateModal') uploadSSLCertificateModal: UploadSSLCertificateModalComponent;
    
    constructor(
        injector: Injector,
        private _tenantSslCertificateService: TenantSslCertificateServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._tenantSslCertificateService.getTenantSslCertificates()
            .subscribe(result => {
                this.dataSource = result;
            });
    }

    showSSLDialog() {
        this.uploadSSLCertificateModal.show();
    }

    refreshSSLGrid() {
        this.sslGrid.instance.refresh();
    }

    deleteCertificate(event) {
        let d = $.Deferred();
        
        this._tenantSslCertificateService.deleteTenantSslCertificate(event.data.id)
            .subscribe(result => {
                d.resolve();
                this.notify.info(this.l('SavedSuccessfully'));
            }, (error) => {
                d.reject(error);
            });
        event.cancel = d.promise();
    }
}
