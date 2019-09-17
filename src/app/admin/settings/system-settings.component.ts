/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { TenantSslCertificateServiceProxy, TenantHostServiceProxy, TenantHostType,
    TenantSslBindingInfo, DictionaryServiceProxy } from '@shared/service-proxies/service-proxies';
import { UploadSSLCertificateModalComponent } from './modals/upload-ssl-cert-modal.component';
import { AddOrEditSSLBindingModal } from './modals/add-or-edit-ssl-binding-modal.component';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';

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

    hostTypes = Object.keys(TenantHostType).map(item => {
        return {id: item, name: this.ls.l('HostType_' + item)};
    });

    orgUnits = this.dictionaryProxy.getOrganizationUnits(true);
    tenantHostsEnabled = abp.features.isEnabled(AppFeatures.AdminCustomizations)
        && this._permission.isGranted(AppPermissions.AdministrationTenantHosts);

    constructor(
        private dictionaryProxy: DictionaryServiceProxy,
        private _tenantSslCertificateService: TenantSslCertificateServiceProxy,
        private _tenantHostService: TenantHostServiceProxy,
        private _changeDetection: ChangeDetectorRef,
        private _notifyService: NotifyService,
        private _permission: AppPermissionService,
        public httpInterceptor: AppHttpInterceptor,
        public ls: AppLocalizationService
    ) {}

    ngOnInit(): void {
        if (this.tenantHostsEnabled) {
            this.refreshSSLGrid();
            this.refreshSSLBindingGrid();
        }
    }

    showSSLDialog() {
        this.uploadSSLCertificateModal.show();
    }

    showSSLBindingDialog(row) {
        let data: TenantSslBindingInfo;
        if (row) data = row.data;
        this.addOrEditSSLBindingModal.show(data);
        this._changeDetection.detectChanges();
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
                this._tenantHostService.deleteSslBinding(row.data.id)
                    .subscribe(() => {
                        this._notifyService.info(this.ls.l('SavedSuccessfully'));
                        this.refreshSSLBindingGrid();
                    });
            }
        });
    }
}