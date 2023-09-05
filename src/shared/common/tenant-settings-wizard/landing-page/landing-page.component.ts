/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    ContactLandingPageServiceProxy,
    ContactLandingPageSettingDto,
    ContactLandingPageSetting,
    ContactServiceProxy,
    EntityContactInfo
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'landing-page',
    templateUrl: 'landing-page.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'landing-page.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ContactLandingPageServiceProxy, ContactServiceProxy]
})
export class LandingPageComponent implements ITenantSettingsStepComponent {
    @ViewChild('contactsList') contactsList: StaticListComponent;

    settings: ContactLandingPageSettingDto;

    private listFilterTimeout: any;
    contacts: EntityContactInfo[];

    constructor(
        private landingPageProxy: ContactLandingPageServiceProxy,
        private contactsServiceProxy: ContactServiceProxy,
        public profileService: ProfileService,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.landingPageProxy.getLandingPageSettings().subscribe(
            (settings) => {
                this.settings = settings;
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

    save(): Observable<any> {
        let settings = ContactLandingPageSetting.fromJS(this.settings);
        return this.landingPageProxy.updateLandingPageSettings(settings);
    }
}