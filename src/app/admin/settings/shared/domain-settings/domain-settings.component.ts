/** Core imports */
import { Component, OnInit, ViewChild, Injector, ChangeDetectionStrategy, Input } from '@angular/core';

/** Third party imports */
import { throwError, Observable, of } from 'rxjs';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialog } from '@angular/material/dialog';
import { switchMap, finalize, map, tap } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import {
    GetLandingPageSettingsDto, CheckHostNameDnsMappingInput, TenantSslCertificateServiceProxy,
    TenantHostServiceProxy, TenantHostType, TenantSslBindingInfo, DictionaryServiceProxy,
    TenantSslCertificateInfo, AddSslBindingInput, UpdateSslBindingInput, LandingPageSettingsDomainDto,
    ContactLandingPageServiceProxy, LandingPageSettingsDto, AddVercelDomainInput, HostingType, DomainConfigDto,
} from '@shared/service-proxies/service-proxies';
import { environment } from '@root/environments/environment';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { AddOrEditSSLBindingModalComponent } from './modals/add-or-edit-ssl-binding-modal.component';
import { UploadSSLCertificateModalComponent } from './modals/upload-ssl-cert-modal.component';
import { SettingsComponentBase } from './../settings-base.component';
import { AppConsts } from '@shared/AppConsts';
import { PortalType } from '@shared/AppEnums';
import { AppService } from '@app/app.service';
import { Grid, House, Shield, ShoppingCart, Users } from 'lucide-angular';

@Component({
    selector: 'domain-settings',
    templateUrl: './domain-settings.component.html',
    styleUrls: ['../../../../shared/common/styles/checkbox-radio.less', './domain-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSslCertificateServiceProxy, TenantHostServiceProxy, ContactLandingPageServiceProxy]
})
export class DomainSettingsComponent extends SettingsComponentBase implements OnInit {
    readonly HouseIcon = House;
    readonly GridIcon = Grid;
    readonly UsersIcon = Users;
    readonly CartIcon = ShoppingCart;
    readonly ShieldIcon = Shield;

    @ViewChild('customDomainsGrid') customDomainsGrid: DxDataGridComponent;
    @ViewChild('sslGrid') sslGrid: DxDataGridComponent;
    public sslGridDataSource: TenantSslCertificateInfo[];
    public sslBindingsDataSource: TenantSslBindingInfo[];
    public portalVercelDataSource: TenantSslBindingInfo[] = [];

    public readonly HostType_PlatformApp = TenantHostType.PlatformApp;
    public readonly HostType_LandingPage = TenantHostType.LandingPage;

    domainIsValid = false;
    isNewLandingDomainAdding = false;
    landingSettings: GetLandingPageSettingsDto;
    defaultTenantName = AppConsts.defaultTenantName;

    model: any;
    orgUnits: any[] = [{
        id: -1,
        displayName: this.l('AllOrganizationUnits')
    }];

    portalTypes: { id: PortalType, displayName: string }[] = [];
    selectedPortalType: PortalType;
    PortalType = PortalType;
    isNewPortalVercelDomainAdding = false;

    isDomainMappingValid;
    regexPatterns = AppConsts.regexPatterns;
    sslCertificates: TenantSslCertificateInfo[];
    get editing(): boolean {
        return this.model && this.model.id && (this.selectedTabIndex > 0);
    }

    envHost = environment;
    lendingPageEnabled = abp.features.isEnabled(AppFeatures.CRMTenantLandingPage)
        && this.permission.isGranted(AppPermissions.AdministrationUsers);
    tenantHostsEnabled = abp.features.isEnabled(AppFeatures.AdminCustomizations)
        && this.permission.isGranted(AppPermissions.AdministrationTenantHosts);

    isTenantHostCreateGranted = this.permission.isGranted(AppPermissions.AdministrationTenantHostsCreate);
    isTenantHostEditGranted = this.permission.isGranted(AppPermissions.AdministrationTenantHostsEdit);
    isTenantHostDeleteGranted = this.permission.isGranted(AppPermissions.AdministrationTenantHostsDelete);

    hostTypes = Object.keys(TenantHostType)
        .map(item => {
            return { id: item, name: this.l('HostType_' + item) };
        });

    formatting = AppConsts.formatting;
    selectedTabIndex = 0;
    prevTabIndex = 0;
    rowData: any;

    readonly INTRO_TAB = 0;
    readonly APP_DOMAIN_TAB = 1;
    readonly PORTAL_DOMAIN_TAB = 2;
    readonly LANDING_DOMAIN_TAB = 3;
    readonly SSL_CONFIG_TAB = 4;

    scrollableAreaHeight = `calc(100vh - ${this.layoutService.showTopBar ? 275 : 200}px`;

    constructor(
        _injector: Injector,
        private landingPageProxy: ContactLandingPageServiceProxy,
        private dictionaryProxy: DictionaryServiceProxy,
        private tenantSslCertificateService: TenantSslCertificateServiceProxy,
        private tenantHostService: TenantHostServiceProxy,
        private appService: AppService,
        private dialog: MatDialog,
        public clipboardService: ClipboardService,
        public httpInterceptor: AppHttpInterceptor
    ) {
        super(_injector);

        if ((this.isTenantHostCreateGranted || this.isTenantHostEditGranted) &&
            (
                this.permission.isGranted(AppPermissions.CRM)
                ||
                this.permission.isGranted(AppPermissions.AdministrationUsers)
            )
        )
            this.dictionaryProxy.getOrganizationUnits(
                undefined, undefined, false
            ).subscribe(res => this.orgUnits = this.orgUnits.concat(res));

        this.initPortalTypes();
        if (this.lendingPageEnabled)
            this.landingPageProxy.getLandingPageSettings().subscribe(
                (settings) => {
                    settings.landingPageDomains.map((domain, index) => {
                        domain['index'] = index;
                        return domain;
                    });

                    this.landingSettings = settings;
                    this.changeDetection.detectChanges();
                }
            );

        this.getTenantSslCertificates();
    }

    ngOnInit(): void {
        this.appService.isClientSearchDisabled = true;
        if (this.tenantHostsEnabled) {
            this.refreshSSLGrid();
            this.refreshSSLBindingGrid();
        }
    }

    getSaveObs(): Observable<any> {
        if (this.isAppOrPortalTab(this.selectedTabIndex)) {
            if (this.isDomainMappingValid) {
                if (this.selectedTabIndex == this.PORTAL_DOMAIN_TAB && this.selectedPortalType == PortalType.Vercel && !this.editing)
                    return of(null);
                return this.saveHostNameDnsMapping();
            } else {
                this.notify.error(this.l('HostName_NotMapped'));
            }
        }
        return this.isAppOrPortalTab(this.selectedTabIndex) ? throwError(this.l('HostName_NotMapped')) : of(null);
    }

    afterSave() {
        if (this.isAppOrPortalTab(this.selectedTabIndex)) {
            this.initBindingModal(this.INTRO_TAB);
            this.refreshSSLBindingGrid();
        }
    }

    initPortalTypes() {
        if (this.envHost.showNextJSPortal)
            this.portalTypes.push({ id: PortalType.Vercel, displayName: 'NextJS' });
        if (this.envHost.showAngularPortal)
            this.portalTypes.push({ id: PortalType.Angular, displayName: 'Angular' });
        this.selectedPortalType = this.portalTypes[0].id;
    }

    initBindingModal(index, data?) {
        this.selectedTabIndex = index;
        this.prevTabIndex = this.selectedTabIndex;
        if (!this.isAppOrPortalTab(index))
            return;

        this.model = undefined;
        this.changeDetection.detectChanges();

        setTimeout(() => {
            if (data && data.id) {
                if (data.hostType == TenantHostType.MemberPortal)
                    this.selectedPortalType = data.hostingProvider == HostingType.Vercel ? PortalType.Vercel : PortalType.Angular;

                this.model = new UpdateSslBindingInput({
                    id: data.id,
                    organizationUnitId: data.organizationUnitId || -1,
                    sslCertificateId: data.sslCertificateId,
                    isActive: data.isActive
                });
                this.model.tenantHostType = <TenantHostType>data.hostType;
                this.model.domainName = data.hostName;
                this.model.sslCertificateId = data.sslCertificateId || -1;
                this.isDomainMappingValid = true;
                this.domainIsValid = true;
                this.rowData = data;
            } else {
                this.model = new AddSslBindingInput();
                this.model.organizationUnitId = -1;
                this.model.tenantHostType = this.selectedTabIndex == this.APP_DOMAIN_TAB
                    ? TenantHostType.PlatformApp : TenantHostType.MemberPortal;
                this.model.sslCertificateId = -1;
                this.selectedPortalType = this.portalTypes[0].id;
                this.isDomainMappingValid = this.model.tenantHostType == TenantHostType.MemberPortal && this.selectedPortalType == PortalType.Vercel ? true : undefined;
                this.domainIsValid = false;
                this.rowData = undefined;
            }
            this.changeDetection.detectChanges();
        });
    }

    isModelDataChanged() {
        if (this.model) {
            return !this.model.id && (
                this.model.organizationUnitId != -1 ||
                this.model.tenantHostType != (this.prevTabIndex == this.APP_DOMAIN_TAB ? TenantHostType.PlatformApp : TenantHostType.MemberPortal) ||
                this.model.sslCertificateId != -1 ||
                this.model.domainName
            ) || this.rowData && (
                this.model.organizationUnitId != (this.rowData.organizationUnitId || -1) ||
                this.model.tenantHostType != this.rowData.hostType ||
                this.model.sslCertificateId != (this.rowData.sslCertificateId || -1) ||
                this.model.domainName != this.rowData.hostName
            )
        }

        return false;
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
                this.sslBindingsDataSource = result.filter(item =>
                    this.lendingPageEnabled || item.hostType != TenantHostType.LandingPage
                );
                this.portalVercelDataSource = result.filter(item =>
                    item.hostType == TenantHostType.MemberPortal && item.hostingProvider == HostingType.Vercel
                );
                this.portalVercelDataSource.forEach(item => item['name'] = item.hostName);
                this.customDomainsGrid.instance.refresh();
                this.changeDetection.detectChanges();
            });
    }

    deleteCertificate(row) {
        abp.message.confirm('', this.l('DeleteConfiramtion'), result => {
            if (result) {
                this.tenantSslCertificateService.deleteTenantSslCertificate(row.data.id)
                    .subscribe(() => {
                        this.notify.info(this.l('SavedSuccessfully'));
                        this.refreshSSLGrid();
                    });
            }
        });
    }

    deleteSSLBinding(row) {
        abp.message.confirm('', this.l('DeleteConfiramtion'), result => {
            if (result) {
                if (row.data.hostType == TenantHostType.LandingPage) {
                    this.landingSettings.landingPageDomains.some((item, index) => {
                        if (row.data.hostName == item.name) {
                            this.deleteDomain(item, index);
                            return true;
                        }
                    });
                } else
                    this.tenantHostService.deleteSslBinding(row.data.id)
                        .subscribe(() => {
                            this.notify.info(this.l('SavedSuccessfully'));
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
        return this.l('AllOrganizationUnits');
    }

    copyToClipboard(value: string) {
        this.clipboardService.copyFromContent(value.trim());
        this.notify.info(this.l('SavedToClipboard'));
    }

    checkHostNameDnsMapping = (data) => {
        if (this.model.id)
            return Promise.resolve(true);

        this.startLoading();
        return new Promise((approve, reject) => {
            (data.value ?
                this.tenantHostService.checkHostNameDnsMapping(
                    new CheckHostNameDnsMappingInput({
                        tenantHostType: this.model.tenantHostType,
                        hostName: data.value,
                        hostingProvider: HostingType.Azure
                    })
                ).pipe(map(res => res.hostNameDnsMapped)) : of(true)
            ).pipe(
                finalize(() => this.finishLoading()),
                tap(isValid => {
                    this.isDomainMappingValid = isValid;
                    this.changeDetection.detectChanges();
                })
            ).subscribe(approve, reject);
        });
    }

    checkMappingValid = (data) => {
        return Promise.resolve(this.isDomainMappingValid == undefined ? true : this.isDomainMappingValid);
    }

    onValueChanged(event) {
        this.domainIsValid = this.model && this.model.domainName &&
            event.component.option('isValid');

        if (this.domainIsValid && (this.model.domainName.includes('http') || this.model.domainName.includes('/'))) {
            setTimeout(() => {
                this.model.domainName = this.model.domainName.replace(
                    /^([Hh][Tt][Tt][Pp][Ss]?:\/\/)?/g, ''
                ).split('/')[0].trim();
                this.changeDetection.detectChanges();
            });
        }
    }

    onLaningPageDomainChanged(event) {
        if (event.component.option('isValid') && (event.value.includes('http') || event.value.includes('/'))) {
            setTimeout(() => {
                event.component.option('value', event.value.replace(
                    /^([Hh][Tt][Tt][Pp][Ss]?:\/\/)?/g, ''
                ).split('/')[0].trim());
                this.changeDetection.detectChanges();
            });
        }
    }

    onSelectedPortalTypeChanged(event) {
        this.isDomainMappingValid = this.selectedPortalType == PortalType.Vercel ? true : undefined;
        setTimeout(() => this.changeDetection.detectChanges());
    }

    getTenantSslCertificates() {
        this.tenantSslCertificateService.getTenantSslCertificates()
            .subscribe(result => {
                this.sslCertificates = result;
                this.sslCertificates.unshift(new TenantSslCertificateInfo({
                    id: -1,
                    hostNames: this.l('LetsEncrypt_FreeSSLCertificate'),
                    expiration: undefined,
                    thumbprint: undefined
                }));

                this.changeDetection.markForCheck();
            });
    }

    saveHostNameDnsMapping(): Observable<any> {
        if (!this.isModelDataChanged())
            return of(null);

        return this.editing ?
            this.tenantHostService.updateSslBinding(new UpdateSslBindingInput({
                ...this.model,
                organizationUnitId: this.model.organizationUnitId == -1
                    ? null : this.model.organizationUnitId,
                sslCertificateId: this.model.sslCertificateId == -1
                    ? null : this.model.sslCertificateId
            })) : this.tenantHostService.addSslBinding(new AddSslBindingInput({
                ...this.model,
                organizationUnitId: this.model.organizationUnitId == -1
                    ? null : this.model.organizationUnitId,
                sslCertificateId: this.model.sslCertificateId == -1
                    ? null : this.model.sslCertificateId,
                hostingProvider: this.model.tenantHostType == TenantHostType.MemberPortal && this.selectedPortalType == PortalType.Vercel ? HostingType.Vercel : HostingType.Azure
            }));
    }

    addPortalVercelDomain(inputComponent) {
        if (!this.model.domainName)
            return;

        if (this.portalVercelDataSource.find(v => v.hostName.toLowerCase() == this.model.domainName.toLowerCase())) {
            this.message.warn(`${this.model.domainName} is already added`);
            return;
        }

        this.isNewPortalVercelDomainAdding = true;
        inputComponent.disabled = true;
        this.saveHostNameDnsMapping().pipe(
            finalize(() => {
                this.isNewPortalVercelDomainAdding = false;
                inputComponent.disabled = false;
                this.changeDetection.detectChanges();
            })
        ).subscribe(res => {
            this.refreshSSLBindingGrid();
            inputComponent.value = '';
            this.initBindingModal(this.selectedTabIndex);
            this.changeDetection.detectChanges();
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    deletePortalVercelDomain(domain: TenantSslBindingInfo) {
        if (domain['isDeleting'])
            return;

        domain['isDeleting'] = true;
        this.tenantHostService.deleteSslBinding(domain.id)
            .pipe(finalize(() => {
                domain['isDeleting'] = false;
                this.changeDetection.detectChanges();
            }))
            .subscribe(() => {
                this.refreshSSLBindingGrid();
                this.notify.info(this.l('SuccessfullyDeleted'));
            });
    }

    getTabIndexByType(data) {
        if (data.hostType == TenantHostType.PlatformApp)
            return this.APP_DOMAIN_TAB;
        if (data.hostType == TenantHostType.MemberPortal)
            return this.PORTAL_DOMAIN_TAB;
        if (data.hostType == TenantHostType.LandingPage)
            return this.LANDING_DOMAIN_TAB;
    }

    onTabChange() {
        if (this.isTenantHostCreateGranted || this.isTenantHostEditGranted) {
            if (!this.isAppOrPortalTab(this.prevTabIndex)) {
                return this.initBindingModal(this.selectedTabIndex);
            }

            if (this.selectedTabIndex != this.prevTabIndex) {
                if (this.isModelDataChanged())
                    this.message.confirm(
                        this.l('Unsaved changes have been detected'),
                        this.l('AreYouSure'),
                        confirmed => {
                            if (confirmed) {
                                this.initBindingModal(this.selectedTabIndex);
                            } else {
                                this.selectedTabIndex = this.prevTabIndex;
                                this.changeDetection.detectChanges();
                            }
                        }
                    );
                else {
                    this.initBindingModal(this.selectedTabIndex);
                }
            }
        }
    }

    isAppOrPortalTab(index): boolean {
        return [this.APP_DOMAIN_TAB, this.PORTAL_DOMAIN_TAB].includes(index);
    }

    generateDomain() {
        if (this.landingSettings && this.landingSettings.landingPageDomains.length || this.isNewLandingDomainAdding)
            return;

        let savePageObs = this.saveLandingPageSettings();
        this.isNewLandingDomainAdding = true;
        savePageObs.pipe(
            switchMap(() => this.landingPageProxy.generateVercelDomain()),
            finalize(() => {
                this.isNewLandingDomainAdding = false;
                this.changeDetection.detectChanges();
            })
        ).subscribe(res => {
            let domainDto = new LandingPageSettingsDomainDto({
                name: res.domainName,
                isValid: res.isValid
            });
            domainDto['configRecords'] = res.configRecords;
            this.landingSettings.landingPageDomains.unshift(domainDto);
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    addDomain(inputComponent) {
        inputComponent.value = inputComponent.value.trim();
        if (this.landingSettings.landingPageDomains.find(v => v.name.toLowerCase() == inputComponent.value.toLowerCase())) {
            this.message.warn(`${inputComponent.value} is already added`);
            return;
        }

        let savePageObs = this.saveLandingPageSettings();
        this.isNewLandingDomainAdding = true;
        inputComponent.disabled = true;
        savePageObs.pipe(
            switchMap(() => this.landingPageProxy.addVercelDomain(new AddVercelDomainInput({ domainName: inputComponent.value }))),
            finalize(() => {
                this.isNewLandingDomainAdding = false;
                inputComponent.disabled = false;
                this.changeDetection.detectChanges();
            })
        ).subscribe(res => {
            let domainDto = new LandingPageSettingsDomainDto({
                name: inputComponent.value,
                isValid: res.isValid
            });
            domainDto['configRecords'] = res.configRecords;
            this.landingSettings.landingPageDomains.unshift(domainDto);
            inputComponent.value = '';
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    verifyDomain(cell, grid, isVercelClientPortal) {
        let domain = cell.data;
        if (domain.isValid || domain['isValidating'] || domain['isDeleting'])
            return;

        domain['isValidating'] = true;

        let obs = isVercelClientPortal ? this.tenantHostService.checkHostNameDnsMapping(new CheckHostNameDnsMappingInput({
            tenantHostType: TenantHostType.MemberPortal,
            hostName: domain.name,
            hostingProvider: HostingType.Vercel
        })).pipe(map(v => {
            return new DomainConfigDto({ isValid: v.hostNameDnsMapped, configRecords: v.configRecords });
        })) : this.landingPageProxy.validateDomain(domain.name);

        obs.pipe(finalize(() => {
            domain['isValidating'] = false;
            this.changeDetection.detectChanges();
        }))
            .subscribe(configInfo => {
                domain.isValid = configInfo.isValid;
                domain['configRecords'] = configInfo.configRecords;
                this.toogleMasterDatails(cell, grid);
            });
    }

    deleteDomain(domain: LandingPageSettingsDomainDto, index: number) {
        if (domain['isDeleting'])
            return;

        domain['isDeleting'] = true;
        this.landingPageProxy.deleteDomain(domain.name)
            .pipe(finalize(() => {
                domain['isDeleting'] = false;
                this.changeDetection.detectChanges();
            }))
            .subscribe(() => {
                this.refreshSSLBindingGrid();
                this.landingSettings.landingPageDomains.splice(index, 1);
                this.notify.info(this.l('SuccessfullyDeleted'));
            });
    }

    saveLandingPageSettings(): Observable<any> {
        if (this.isNewLandingDomainAdding) {
            this.notify.warn('Please correct invalid values');
            return throwError('');
        }

        let settings = LandingPageSettingsDto.fromJS(this.landingSettings);

        return this.landingPageProxy.updateLandingPageSettings(settings);
    }

    toogleMasterDatails(cell, dataGrid) {
        if (cell.data['configRecords'] && cell.data['configRecords'].length) {
            let instance = dataGrid.instance,
                isExpanded = instance.isRowExpanded(cell.key);
            if (!isExpanded)
                instance.expandRow(cell.key);
            setTimeout(() => {
                let row = instance.getRowElement(cell.rowIndex)[0];
                if (isExpanded)
                    row.classList.remove('expanded');
                else
                    row.classList.add('expanded');
            }, 100);
        }
    }
}