/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { forkJoin, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import DataSource from 'devextreme/data/data_source';
import { MessageService } from 'abp-ng2-module';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    ContactLandingPageServiceProxy,
    LandingPageSettingsDto,
    GetLandingPageSettingsDto,
    ContactServiceProxy,
    EntityContactInfo,
    ProductDto,
    ProductServiceProxy,
    LandingPageOnlineStatus,
    LandingPageSettingsDomainDto,
    AddVercelDomainInput
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { AppConsts } from '@shared/AppConsts';
import { WordingListComponent } from './wording-list/wording-list.component';
import { DateHelper } from '@shared/helpers/DateHelper';
import { DxTagBoxComponent } from 'devextreme-angular';

@Component({
    selector: 'landing-page',
    templateUrl: 'landing-page.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'landing-page.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ContactLandingPageServiceProxy, ContactServiceProxy, ProductServiceProxy]
})
export class LandingPageComponent implements ITenantSettingsStepComponent {
    @ViewChild('contactsList') contactsList: StaticListComponent;
    @ViewChild('coverLogoUploader') coverLogoUploader: UploaderComponent;
    @ViewChild('faq', { static: false }) faqComponent: WordingListComponent;
    @ViewChild('tabs', { static: false }) tabsComponent: WordingListComponent;

    settings: GetLandingPageSettingsDto;

    private listFilterTimeout: any;
    contacts: EntityContactInfo[];

    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    tenantIdString: string = this.appSession.tenantId ? this.appSession.tenantId.toString() : '';
    coverLogoMaxSize = 10 * 1024 * 1024;
    initialCoverLogoId = null;

    isDeployInitiating = false;
    isDeployInitiated = false;
    isNewDomainAdding = false;

    metaKeywords: string[] = [];

    products$: Observable<DataSource<ProductDto, number>> = this.productProxy.getProducts(undefined)
        .pipe(
            map(v => {
                let data = v.filter(p => p.isPublished == true).map(x => {
                    x.group = x.group || "No Group";
                    x.name = `${x.name} (${x.type})`;
                    return x;
                });
                let dataSource = new DataSource(data);
                dataSource.loadOptions().group = 'group';
                return dataSource;
            })
        );

    onlineStatusOptions = Object.keys(LandingPageOnlineStatus).map(item => {
        return {
            id: LandingPageOnlineStatus[item],
            text: item
        };
    });

    constructor(
        private landingPageProxy: ContactLandingPageServiceProxy,
        private contactsServiceProxy: ContactServiceProxy,
        private appSession: AppSessionService,
        private productProxy: ProductServiceProxy,
        private message: MessageService,
        public profileService: ProfileService,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.landingPageProxy.getLandingPageSettings().subscribe(
            (settings) => {
                if (settings.memberSince)
                    settings.memberSince = DateHelper.addTimezoneOffset(new Date(settings.memberSince), true);
                this.settings = settings;
                this.setMetaKeywords();
                this.initialCoverLogoId = settings.coverLogoFileObjectId;
                this.changeDetectorRef.detectChanges();
            }
        );
    }

    onContactSelected(e) {
        this.settings.contactId = e.id;
        this.settings.contactFullName = e.name;
        this.settings.contactPhotoId = e.photoPublicId;
        this.contactsList.toggle();
    }

    removeContact() {
        this.settings.contactId = null;
        this.settings.contactFullName = null;
        this.settings.contactPhotoId = null;
    }

    onListFiltered(event) {
        clearTimeout(this.listFilterTimeout);
        this.listFilterTimeout = setTimeout(() => {
            let value = event.element.getElementsByTagName('input')[0].value;

            this.getAllByPhraseObserverable(value)
                .subscribe(res => {
                    this.contacts = res;
                    this.changeDetectorRef.detectChanges();
                });
        }, 1000);
    }

    toggleContactLists() {
        if (this.contacts) {
            this.contactsList.toggle();
            this.changeDetectorRef.detectChanges();
        } else {
            this.getAllByPhraseObserverable()
                .subscribe(res => {
                    this.contacts = res;
                    this.contactsList.toggle();
                    this.changeDetectorRef.detectChanges();
                });
        }
    }

    getAllByPhraseObserverable(search = undefined) {
        return this.contactsServiceProxy.getAllByPhrase(search, 20, undefined, undefined, false, false);
    }

    clearCoverLogo() {
        this.settings.coverLogoFileObjectId = null;
        this.changeDetectorRef.detectChanges();
    }

    setMetaKeywords() {
        if (this.settings.metaKeywords && this.settings.metaKeywords.length) {
            this.metaKeywords = this.settings.metaKeywords.split(', ');
        }
    }

    metaKeywordChanged(event) {
        if (event.value.length == 10)
            event.component.option("acceptCustomValue", false);
        else
            event.component.option("acceptCustomValue", true);
    }

    getMetaKeywordsString(): string {
        if (this.metaKeywords.length)
            return this.metaKeywords.join(', ');
        return null;
    }

    deployPage() {
        if (this.settings.isDeployed || this.isDeployInitiating || this.isDeployInitiated)
            return;

        this.isDeployInitiating = true;
        this.landingPageProxy.deployToVercel()
            .subscribe(domains => {
                this.settings.landingPageDomains = domains;
                this.isDeployInitiated = true;
                this.isDeployInitiating = false;
                this.changeDetectorRef.detectChanges();
            }, () => {
                this.isDeployInitiating = false;
                this.changeDetectorRef.detectChanges();
            })
    }

    addDomain(inputComponent) {
        inputComponent.value = inputComponent.value.trim();
        if (this.settings.landingPageDomains.find(v => v.name.toLowerCase() == inputComponent.value.toLowerCase())) {
            this.message.warn(`${inputComponent.value} is already added`);
            return;
        }

        this.isNewDomainAdding = true;
        inputComponent.disabled = true;

        this.landingPageProxy.addVercelDomain(new AddVercelDomainInput({ domainName: inputComponent.value }))
            .subscribe(res => {
                let domainDto = new LandingPageSettingsDomainDto({
                    name: inputComponent.value,
                    isValid: res.isValid
                });
                domainDto['configRecords'] = res.configRecords;
                this.settings.landingPageDomains.unshift(domainDto);
                inputComponent.value = '';
                this.isNewDomainAdding = false;
                inputComponent.disabled = false;
                this.settings.landingPageDomains.unshift();

                this.changeDetectorRef.detectChanges();
            }, () => {
                this.isNewDomainAdding = false;
                inputComponent.disabled = false;
                this.changeDetectorRef.detectChanges();
            });
    }

    verifyDomain(domain: LandingPageSettingsDomainDto) {
        if (domain.isValid || domain['isValidating'] || domain['isDeleting'])
            return;

        domain['isValidating'] = true;
        this.landingPageProxy.validateDomain(domain.name)
            .subscribe(configInfo => {
                domain['isValidating'] = false;
                domain.isValid = configInfo.isValid;
                domain['configRecords'] = configInfo.configRecords;

                this.changeDetectorRef.detectChanges();
            }, () => {
                domain['isValidating'] = false;
                this.changeDetectorRef.detectChanges();
            });
    }

    deleteDomain(domain: LandingPageSettingsDomainDto, index: number) {
        if (domain['isDeleting'])
            return;

        domain['isDeleting'] = true;
        this.landingPageProxy.deleteDomain(domain.name)
            .subscribe(() => {
                this.settings.landingPageDomains.splice(index, 1);
                this.changeDetectorRef.detectChanges();
            }, () => {
                domain['isDeleting'] = false;
                this.changeDetectorRef.detectChanges();
            })
    }

    save(): Observable<any> {
        if (this.isDeployInitiating || !this.faqComponent.isValid() || !this.tabsComponent.isValid())
            return throwError('');

        let settings = LandingPageSettingsDto.fromJS(this.settings);
        settings.metaKeywords = this.getMetaKeywordsString();
        if (settings.memberSince)
            settings.memberSince = DateHelper.removeTimezoneOffset(new Date(settings.memberSince), true);
        let obersvables = [this.landingPageProxy.updateLandingPageSettings(settings)];
        if (this.coverLogoUploader.file)
            obersvables.push(this.coverLogoUploader.uploadFile());
        else if (this.initialCoverLogoId && !settings.coverLogoFileObjectId)
            obersvables.push(this.landingPageProxy.clearCoverLogo());

        return forkJoin(obersvables);
    }
}