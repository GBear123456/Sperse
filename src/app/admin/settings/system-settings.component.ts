/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { TenantSslCertificateServiceProxy, TenantHostServiceProxy, TenantSslBindingInfo } from '@shared/service-proxies/service-proxies';
import { UploadSSLCertificateModalComponent } from './modals/upload-ssl-cert-modal.component';
import { AddOrEditSSLBindingModal } from './modals/add-or-edit-ssl-binding-modal.component';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';

@Component({
    selector: 'system-settings',
    templateUrl: './system-settings.component.html',
    styleUrls: ['../../shared/common/styles/checkbox-radio.less', './system-settings.component.less'],
    animations: [appModuleAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSslCertificateServiceProxy, TenantHostServiceProxy ]
})
export class SystemSettingsComponent implements OnInit {
    @ViewChild('customDomainsGrid') customDomainsGrid: DxDataGridComponent;
    @ViewChild('addOrEditSSLBindingModal') addOrEditSSLBindingModal: AddOrEditSSLBindingModal;
    @ViewChild('sslGrid') sslGrid: DxDataGridComponent;
    @ViewChild('uploadSSLCertificateModal') uploadSSLCertificateModal: UploadSSLCertificateModalComponent;
    public sslGridDataSource: any;
    public sslBindingsDataSource: any;
    public hostTypes: any = [
        { 'Id': 1, 'Name': 'Platform App' }
    ];

    constructor(
        private _tenantSslCertificateService: TenantSslCertificateServiceProxy,
        private _tenantHostService: TenantHostServiceProxy,
        private _changeDetection: ChangeDetectorRef,
        private _notifyService: NotifyService,
        public httpInterceptor: AppHttpInterceptor,
        public ls: AppLocalizationService
    ) {}

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
                this._changeDetection.detectChanges();
            });
    }

    refreshSSLBindingGrid() {
        this._tenantHostService.getSslBindings()
            .subscribe(result => {
                this.sslBindingsDataSource = result;
                this.customDomainsGrid.instance.refresh();
                this._changeDetection.detectChanges();
            });
    }

    deleteCertificate(row) {
        abp.message.confirm('', this.ls.l('DeleteConfiramtion'), result => {
            if (result) {
                this._tenantSslCertificateService.deleteTenantSslCertificate(row.data.id)
                    .subscribe(() => {
                        this._notifyService.info(this.ls.l('SavedSuccessfully'));
                        this.refreshSSLGrid();
                    });
            }
        });
    }

    deleteSSLBinding(row) {
        abp.message.confirm('', this.ls.l('DeleteConfiramtion'), result => {
            if (result) {
                this._tenantHostService.deleteSslBinding(row.data.hostType)
                    .subscribe(() => {
                        this._notifyService.info(this.ls.l('SavedSuccessfully'));
                        this.refreshSSLBindingGrid();
                    });
            }
        });
    }
}
