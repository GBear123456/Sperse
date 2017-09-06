import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TenantSslCertificateServiceProxy, TenantHostServiceProxy } from '@shared/service-proxies/service-proxies';
import { DxFileUploaderComponent, DxTextBoxComponent, DxButtonComponent, DxDataGridComponent } from 'devextreme-angular';
import { UploadSSLCertificateModalComponent } from './modals/upload-ssl-cert-modal.component';
import { AddOrEditSSLBindingModal } from './modals/add-or-edit-ssl-binding-modal.component';

@Component({
    templateUrl: "./system-settings.component.html",
    animations: [appModuleAnimation()],
    providers: [TenantSslCertificateServiceProxy, TenantHostServiceProxy ]
})
export class SystemSettingsComponent extends AppComponentBase implements OnInit {

    @ViewChild('customDomainsGrid') customDomainsGrid: DxDataGridComponent;
    @ViewChild('addOrEditSSLBindingModal') addOrEditSSLBindingModal: AddOrEditSSLBindingModal;
    
    @ViewChild('sslGrid') sslGrid: DxDataGridComponent;
    @ViewChild('uploadSSLCertificateModal') uploadSSLCertificateModal: UploadSSLCertificateModalComponent;

    public sslGridDataSource: any;
    public sslBindingsDataSource: any;

    public hostTypes: any = [
        { "Id": 0, "Name": "Platform API" },
        { "Id": 1, "Name": "Platform UI" },
        { "Id": 2, "Name": "Funding UI" }
    ];

    constructor(
        injector: Injector,
        private _tenantSslCertificateService: TenantSslCertificateServiceProxy,
        private _tenantHostService: TenantHostServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._tenantSslCertificateService.getTenantSslCertificates()
            .subscribe(result => {
                this.sslGridDataSource = result;
            });
        this._tenantHostService.getSslBindings()
            .subscribe(result => {
                this.sslBindingsDataSource = result;
            });
    }

    showSSLDialog() {
        this.uploadSSLCertificateModal.show();
    }

    showSSLBindingDialog() {
        this.addOrEditSSLBindingModal.show();
    }

    refreshSSLGrid() {
        this.sslGrid.instance.refresh();
    }

    refreshSSLBindingGrid() {
        this.customDomainsGrid.instance.refresh();
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

    deleteSSLBinding(event) {
        let d = $.Deferred();

        this._tenantHostService.deleteSslBinding(event.data.hostType)
            .subscribe(result => {
                d.resolve();
                this.notify.info(this.l('SavedSuccessfully'));
            }, (error) => {
                d.reject(error);
            });
        event.cancel = d.promise();
    }
}
