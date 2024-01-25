/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { Observable, throwError } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import DataSource from 'devextreme/data/data_source';
import { MessageService, NotifyService } from 'abp-ng2-module';

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
    AddVercelDomainInput,
    LandingPageColorScheme
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { AppConsts } from '@shared/AppConsts';
import { WordingListComponent } from './wording-list/wording-list.component';
import { DateHelper } from '@shared/helpers/DateHelper';

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
    @ViewChild('logoUploader') logoUploader: UploaderComponent;
    @ViewChild('coverLogoUploader') coverLogoUploader: UploaderComponent;
    @ViewChild('faq', { static: false }) faqComponent: WordingListComponent;
    @ViewChild('tabs', { static: false }) tabsComponent: WordingListComponent;

    settings: GetLandingPageSettingsDto;

    private listFilterTimeout: any;
    contacts: EntityContactInfo[];

    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    tenantIdString: string = this.appSession.tenantId ? this.appSession.tenantId.toString() : '';
    logoMaxSize = 5 * 1024 * 1024;
    coverLogoMaxSize = 10 * 1024 * 1024;
    initialLogoId = null;
    initialCoverLogoId = null;

    isNewDomainAdding = false;

    metaKeywords: string[] = [];

    products$: Observable<DataSource<ProductDto, number>> = this.productProxy.getProducts(undefined, false)
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

    defaultSchemeOptions = Object.keys(LandingPageColorScheme).map(item => {
        return {
            id: LandingPageColorScheme[item],
            text: this.ls.l(item)
        };
    });
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
        private notify: NotifyService,
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
                this.initialLogoId = settings.logoFileObjectId;
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

    openContactLink() {
        if (!this.settings.contactId)
            return;

        window.open(location.origin + `/app/crm/contact/${this.settings.contactId}`, '_blank');
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

    clearLogo() {
        this.settings.logoFileObjectId = null;
        this.changeDetectorRef.detectChanges();
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
        let changed = false;
        let totalLength = 0;
        event.value.forEach((val: string, i, arr: string[]) => {
            totalLength += val.length;
            if (val.indexOf(",") >= 0) {
                arr[i] = arr[i].replace(/,/g, "");
                changed = true;
            }
        });
        if (changed)
            event.component.repaint();
        totalLength += (event.value.length * 2 - 2);

        if (event.value.length == 10 || totalLength > 170)
            event.component.option("acceptCustomValue", false);
        else
            event.component.option("acceptCustomValue", true);
    }

    metaKeywordKeyDown(event) {
        if (event.event.keyCode == 188) { //comma
            event.event.preventDefault();
        }
    }

    getMetaKeywordsString(): string {
        if (this.metaKeywords.length)
            return this.metaKeywords.join(', ');
        return null;
    }

    generateDomain() {
        if (this.settings.landingPageDomains.length || this.isNewDomainAdding)
            return;

        let savePageObs = this.save();
        this.isNewDomainAdding = true;
        savePageObs.pipe(
            switchMap(() => this.landingPageProxy.generateVercelDomain()),
            finalize(() => {
                this.isNewDomainAdding = false;
                this.changeDetectorRef.detectChanges();
            })
        ).subscribe(res => {
            let domainDto = new LandingPageSettingsDomainDto({
                name: res.domainName,
                isValid: res.isValid
            });
            domainDto['configRecords'] = res.configRecords;
            this.settings.landingPageDomains.unshift(domainDto);
            this.notify.info(this.ls.l('SavedSuccessfully'));
        });
    }

    addDomain(inputComponent) {
        inputComponent.value = inputComponent.value.trim();
        if (this.settings.landingPageDomains.find(v => v.name.toLowerCase() == inputComponent.value.toLowerCase())) {
            this.message.warn(`${inputComponent.value} is already added`);
            return;
        }

        let savePageObs = this.save();
        this.isNewDomainAdding = true;
        inputComponent.disabled = true;
        savePageObs.pipe(
            switchMap(() => this.landingPageProxy.addVercelDomain(new AddVercelDomainInput({ domainName: inputComponent.value }))),
            finalize(() => {
                this.isNewDomainAdding = false;
                inputComponent.disabled = false;
                this.changeDetectorRef.detectChanges();
            })
        ).subscribe(res => {
            let domainDto = new LandingPageSettingsDomainDto({
                name: inputComponent.value,
                isValid: res.isValid
            });
            domainDto['configRecords'] = res.configRecords;
            this.settings.landingPageDomains.unshift(domainDto);
            inputComponent.value = '';
            this.notify.info(this.ls.l('SavedSuccessfully'));
        });
    }

    verifyDomain(domain: LandingPageSettingsDomainDto) {
        if (domain.isValid || domain['isValidating'] || domain['isDeleting'])
            return;

        domain['isValidating'] = true;
        this.landingPageProxy.validateDomain(domain.name)
            .pipe(finalize(() => {
                domain['isValidating'] = false;
                this.changeDetectorRef.detectChanges();
            }))
            .subscribe(configInfo => {
                domain.isValid = configInfo.isValid;
                domain['configRecords'] = configInfo.configRecords;
            });
    }

    deleteDomain(domain: LandingPageSettingsDomainDto, index: number) {
        if (domain['isDeleting'])
            return;

        domain['isDeleting'] = true;
        this.landingPageProxy.deleteDomain(domain.name)
            .pipe(finalize(() => {
                domain['isDeleting'] = false;
                this.changeDetectorRef.detectChanges();
            }))
            .subscribe(() => {
                this.settings.landingPageDomains.splice(index, 1);
                this.notify.info(this.ls.l('SuccessfullyDeleted'));
            });
    }

    save(): Observable<any> {
        if (this.isNewDomainAdding || !this.faqComponent.isValid() || !this.tabsComponent.isValid()) {
            this.notify.warn('Please correct invalid values');
            return throwError('');
        }

        let settings = LandingPageSettingsDto.fromJS(this.settings);
        settings.metaKeywords = this.getMetaKeywordsString();
        if (settings.memberSince)
            settings.memberSince = DateHelper.removeTimezoneOffset(new Date(settings.memberSince), true);

        let obs = this.landingPageProxy.updateLandingPageSettings(settings);
        if (this.logoUploader.file)
            obs = obs.pipe(switchMap(() => this.logoUploader.uploadFile()));
        else if (this.initialLogoId && !settings.logoFileObjectId)
            obs = obs.pipe(switchMap(() => this.landingPageProxy.clearLogo()));
        if (this.coverLogoUploader.file)
            obs = obs.pipe(switchMap(() => this.coverLogoUploader.uploadFile()));
        else if (this.initialCoverLogoId && !settings.coverLogoFileObjectId)
            obs = obs.pipe(switchMap(() => this.landingPageProxy.clearCoverLogo()));

        return obs;
    }
}