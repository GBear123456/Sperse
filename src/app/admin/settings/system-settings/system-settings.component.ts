/** Core imports */
import {Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, Input} from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
    TenantSslCertificateServiceProxy, TenantHostServiceProxy, TenantHostType,
    TenantSslBindingInfo, DictionaryServiceProxy, TenantSslCertificateInfo
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { AddOrEditSSLBindingModalComponent } from '../modals/add-or-edit-ssl-binding-modal.component';
import { UploadSSLCertificateModalComponent } from '../modals/upload-ssl-cert-modal.component';

@Component({
    selector: 'system-settings',
    templateUrl: './system-settings.component.html',
    styleUrls: ['../../../shared/common/styles/checkbox-radio.less', './system-settings.component.less'],
    animations: [appModuleAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ TenantSslCertificateServiceProxy, TenantHostServiceProxy ]
})
export class SystemSettingsComponent implements OnInit {
    @ViewChild('customDomainsGrid', { static: false }) customDomainsGrid: DxDataGridComponent;
    @ViewChild('sslGrid', { static: false }) sslGrid: DxDataGridComponent;
    public sslGridDataSource: any;
    public sslBindingsDataSource: any;

    hostTypes = Object.keys(TenantHostType).map(item => {
        return {id: item, name: this.ls.l('HostType_' + item)};
    });

    orgUnits = this.dictionaryProxy.getOrganizationUnits(true);
    tenantHostsEnabled = abp.features.isEnabled(AppFeatures.AdminCustomizations)
        && this.permission.isGranted(AppPermissions.AdministrationTenantHosts);

    constructor(
        private dictionaryProxy: DictionaryServiceProxy,
        private tenantSslCertificateService: TenantSslCertificateServiceProxy,
        private tenantHostService: TenantHostServiceProxy,
        private changeDetection: ChangeDetectorRef,
        private notifyService: NotifyService,
        private permission: AppPermissionService,
        public httpInterceptor: AppHttpInterceptor,
        private dialog: MatDialog,
        public ls: AppLocalizationService
    ) {}

    ngOnInit(): void {
        if (this.tenantHostsEnabled) {
            this.refreshSSLGrid();
            this.refreshSSLBindingGrid();
        }
    }

    showSSLDialog() {
        const dialogRef = this.dialog.open(UploadSSLCertificateModalComponent, {
            panelClass: 'slider',
            data: {}
        });
        dialogRef.afterClosed().subscribe(() => {
            this.refreshSSLGrid();
        });
    }

    showSSLBindingDialog(item) {
        let data: TenantSslBindingInfo;
        if (item) data = item.data;
        const dialogRef = this.dialog.open(AddOrEditSSLBindingModalComponent, {
            panelClass: 'slider',
            data: {
                hostTypes: this.hostTypes,
                orgUnits: this.orgUnits,
                item: data
            }
        });
        dialogRef.afterClosed().subscribe(() => {
            this.refreshSSLBindingGrid();
        });
        this.changeDetection.detectChanges();
    }

    refreshSSLGrid() {
        this.tenantSslCertificateService.getTenantSslCertificates()
            .subscribe((result: TenantSslCertificateInfo[]) => {
                this.sslGridDataSource = result;
                this.sslGrid.instance.refresh();
                this.changeDetection.detectChanges();
            });
    }

    refreshSSLBindingGrid() {
        this.tenantHostService.getSslBindings()
            .subscribe((result: TenantSslBindingInfo[]) => {
                this.sslBindingsDataSource = result;
                this.customDomainsGrid.instance.refresh();
                this.changeDetection.detectChanges();
            });
    }

    deleteCertificate(row) {
        abp.message.confirm('', this.ls.l('DeleteConfiramtion'), result => {
            if (result) {
                this.tenantSslCertificateService.deleteTenantSslCertificate(row.data.id)
                    .subscribe(() => {
                        this.notifyService.info(this.ls.l('SavedSuccessfully'));
                        this.refreshSSLGrid();
                    });
            }
        });
    }

    deleteSSLBinding(row) {
        abp.message.confirm('', this.ls.l('DeleteConfiramtion'), result => {
            if (result) {
                this.tenantHostService.deleteSslBinding(row.data.id)
                    .subscribe(() => {
                        this.notifyService.info(this.ls.l('SavedSuccessfully'));
                        this.refreshSSLBindingGrid();
                    });
            }
        });
    }
}