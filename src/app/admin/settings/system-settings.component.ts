import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TenantSslCertificateServiceProxy, TenantHostServiceProxy, TenantSslBindingInfo } from '@shared/service-proxies/service-proxies';
import { DxFileUploaderComponent, DxTextBoxComponent, DxButtonComponent, DxDataGridComponent } from 'devextreme-angular';
import { UploadSSLCertificateModalComponent } from './modals/upload-ssl-cert-modal.component';
import { AddOrEditSSLBindingModal } from './modals/add-or-edit-ssl-binding-modal.component';

@Component({
    templateUrl: './system-settings.component.html',
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
        { 'Id': 0, 'Name': 'Platform API' },
        { 'Id': 1, 'Name': 'Platform UI' },
        { 'Id': 2, 'Name': 'Funding UI' }
    ];

    constructor(
        injector: Injector,
        private _tenantSslCertificateService: TenantSslCertificateServiceProxy,
        private _tenantHostService: TenantHostServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.refreshSSLGrid();
        this.refreshSSLBindingGrid();
    }

    showSSLDialog() {
        this.uploadSSLCertificateModal.show();
    }

    showSSLBindingDialog(row) {
        let data: TenantSslBindingInfo;
        if (row) data = row.data;
        this.addOrEditSSLBindingModal.show(data);
    }

    refreshSSLGrid() {
        this._tenantSslCertificateService.getTenantSslCertificates()
        .subscribe(result => {
            this.sslGridDataSource = result;
            this.sslGrid.instance.refresh();
        });
    }

    refreshSSLBindingGrid() {
        this._tenantHostService.getSslBindings()
            .subscribe(result => {
                this.sslBindingsDataSource = result;
                this.customDomainsGrid.instance.refresh();
            });
    }

    deleteCertificate(row) {
        abp.message.confirm('', this.l('DeleteConfiramtion'), result => {
            if (result) {
                this._tenantSslCertificateService.deleteTenantSslCertificate(row.data.id)
                    .subscribe(result => {
                        this.notify.info(this.l('SavedSuccessfully'));
                        this.refreshSSLGrid();
                    });
            }
        });
    }

    deleteSSLBinding(row) {
        abp.message.confirm('', this.l('DeleteConfiramtion'), result => {
            if (result) {
                this._tenantHostService.deleteSslBinding(row.data.hostType)
                    .subscribe(result => {
                        this.notify.info(this.l('SavedSuccessfully'));
                        this.refreshSSLBindingGrid();
                    });
            }
        });
    }
}
