<<<<<<< HEAD
/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import {
    TenantSslCertificateServiceProxy, TenantHostServiceProxy, TenantHostType,
    TenantSslBindingInfo, DictionaryServiceProxy, TenantSslCertificateInfo
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { AddOrEditSSLBindingModalComponent } from './modals/add-or-edit-ssl-binding-modal.component';
import { UploadSSLCertificateModalComponent } from './modals/upload-ssl-cert-modal.component';
import { AppConsts } from '@shared/AppConsts';
import { AppService } from '@app/app.service';

@Component({
    selector: 'domain-settings',
    templateUrl: './domain-settings.component.html',
    styleUrls: ['../../../../shared/common/styles/checkbox-radio.less', './domain-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSslCertificateServiceProxy, TenantHostServiceProxy]
})
export class DomainSettingsComponent implements OnInit {
    @ViewChild('customDomainsGrid') customDomainsGrid: DxDataGridComponent;
    @ViewChild('sslGrid') sslGrid: DxDataGridComponent;
    public sslGridDataSource: TenantSslCertificateInfo[];
    public sslBindingsDataSource: TenantSslBindingInfo[];

    hostTypes = Object.keys(TenantHostType)
        .filter(item => item != TenantHostType.LandingPage)
        .map(item => {
            return { id: item, name: this.ls.l('HostType_' + item) };
        });

    orgUnits = [];
    tenantHostsEnabled = abp.features.isEnabled(AppFeatures.AdminCustomizations)
        && this.permission.isGranted(AppPermissions.AdministrationTenantHosts);
    formatting = AppConsts.formatting;

    constructor(
        private dictionaryProxy: DictionaryServiceProxy,
        private tenantSslCertificateService: TenantSslCertificateServiceProxy,
        private tenantHostService: TenantHostServiceProxy,
        private changeDetection: ChangeDetectorRef,
        private notifyService: NotifyService,
        private permission: AppPermissionService,
        private appService: AppService,
        private dialog: MatDialog,
        public httpInterceptor: AppHttpInterceptor,
        public ls: AppLocalizationService
    ) {
        this.dictionaryProxy.getOrganizationUnits(
            undefined, undefined, true
        ).subscribe(res => this.orgUnits = res);
    }

    ngOnInit(): void {
        this.appService.isClientSearchDisabled = true;
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
        dialogRef.afterClosed().subscribe((result) => {
            if (result)
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
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.refreshSSLGrid();
                this.refreshSSLBindingGrid();
            }
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

    getOrgUnitName(id) {
        if (id) {
            for (let i = 0; i < this.orgUnits.length; i++)
                if (this.orgUnits[i].id == id)
                    return this.orgUnits[i].displayName;
        }
        return this.ls.l('AllOrganizationUnits');
    }
=======
/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import {
    TenantSslCertificateServiceProxy, TenantHostServiceProxy, TenantHostType,
    TenantSslBindingInfo, DictionaryServiceProxy, TenantSslCertificateInfo
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { AddOrEditSSLBindingModalComponent } from './modals/add-or-edit-ssl-binding-modal.component';
import { UploadSSLCertificateModalComponent } from './modals/upload-ssl-cert-modal.component';
import { AppConsts } from '@shared/AppConsts';
import { AppService } from '@app/app.service';

@Component({
    selector: 'domain-settings',
    templateUrl: './domain-settings.component.html',
    styleUrls: ['../../../../shared/common/styles/checkbox-radio.less', './domain-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSslCertificateServiceProxy, TenantHostServiceProxy]
})
export class DomainSettingsComponent implements OnInit {
    @ViewChild('customDomainsGrid') customDomainsGrid: DxDataGridComponent;
    @ViewChild('sslGrid') sslGrid: DxDataGridComponent;
    public sslGridDataSource: TenantSslCertificateInfo[];
    public sslBindingsDataSource: TenantSslBindingInfo[];

    hostTypes = Object.keys(TenantHostType)
        .filter(item => item != TenantHostType.LandingPage)
        .map(item => {
            return { id: item, name: this.ls.l('HostType_' + item) };
        });

    orgUnits = [];
    tenantHostsEnabled = abp.features.isEnabled(AppFeatures.AdminCustomizations)
        && this.permission.isGranted(AppPermissions.AdministrationTenantHosts);
    formatting = AppConsts.formatting;

    constructor(
        private dictionaryProxy: DictionaryServiceProxy,
        private tenantSslCertificateService: TenantSslCertificateServiceProxy,
        private tenantHostService: TenantHostServiceProxy,
        private changeDetection: ChangeDetectorRef,
        private notifyService: NotifyService,
        private permission: AppPermissionService,
        private appService: AppService,
        private dialog: MatDialog,
        public httpInterceptor: AppHttpInterceptor,
        public ls: AppLocalizationService
    ) {
        this.dictionaryProxy.getOrganizationUnits(
            undefined, undefined, true
        ).subscribe(res => this.orgUnits = res);
    }

    ngOnInit(): void {
        this.appService.isClientSearchDisabled = true;
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
        dialogRef.afterClosed().subscribe((result) => {
            if (result)
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
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.refreshSSLGrid();
                this.refreshSSLBindingGrid();
            }
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

    getOrgUnitName(id) {
        if (id) {
            for (let i = 0; i < this.orgUnits.length; i++)
                if (this.orgUnits[i].id == id)
                    return this.orgUnits[i].displayName;
        }
        return this.ls.l('AllOrganizationUnits');
    }
>>>>>>> f999b481882149d107812286d0979872df712626
}