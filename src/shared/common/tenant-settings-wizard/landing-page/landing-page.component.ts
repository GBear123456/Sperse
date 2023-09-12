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
import { DxValidationGroupComponent } from 'devextreme-angular/ui/validation-group';

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
    LandingPageSettingsQuestionDto
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { UploaderComponent } from '@shared/common/uploader/uploader.component';
import { AppConsts } from '@shared/AppConsts';

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
    @ViewChild(DxValidationGroupComponent, { static: false }) validationGroup: DxValidationGroupComponent

    settings: GetLandingPageSettingsDto;

    private listFilterTimeout: any;
    contacts: EntityContactInfo[];

    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    tenantIdString: string = this.appSession.tenantId ? this.appSession.tenantId.toString() : '';
    coverLogoMaxSize = 10 * 1024 * 1024;
    initialCoverLogoId = null;

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

    constructor(
        private landingPageProxy: ContactLandingPageServiceProxy,
        private contactsServiceProxy: ContactServiceProxy,
        private appSession: AppSessionService,
        private productProxy: ProductServiceProxy,
        public profileService: ProfileService,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.landingPageProxy.getLandingPageSettings().subscribe(
            (settings) => {
                this.settings = settings;
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

    addQuestion() {
        this.settings.faq.push(new LandingPageSettingsQuestionDto());
    }

    removeQuestion(index: number) {
        this.settings.faq.splice(index, 1);
    }

    save(): Observable<any> {
        if (!this.validationGroup.instance.validate().isValid)
            return throwError('');

        let settings = LandingPageSettingsDto.fromJS(this.settings);
        let obersvables = [this.landingPageProxy.updateLandingPageSettings(settings)];
        if (this.coverLogoUploader.file)
            obersvables.push(this.coverLogoUploader.uploadFile());
        else if (this.initialCoverLogoId && !settings.coverLogoFileObjectId)
            obersvables.push(this.landingPageProxy.clearCoverLogo());

        return forkJoin(obersvables);
    }
}