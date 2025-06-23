import { Component, Injector, HostBinding } from '@angular/core';

/** Third party imports */

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { environment } from 'environments/environment';
import { AppFeatures } from '@shared/AppFeatures';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';

@Component({
    selector: 'app-pages-footer',
    templateUrl: './pages-footer.component.html',
    styleUrls: ['./pages-footer.component.less']
})
export class PagesFooterComponent extends AppComponentBase {
    @HostBinding('class.pfm-app') hasPfmAppFeature = false;
    domain = environment.LENDSPACE_DOMAIN;

    appMenuItems = [
        {
            url: '',
            name: 'Terms of Use',
            action: this.openConditionsDialog.bind(this, {
                title: 'Terms of Use',
                bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/terms.html',
                downloadDisabled: true
            })
        },
        {
            url: '',
            name: 'Privacy Policy',
            action: this.openConditionsDialog.bind(this, {
                title: 'Privacy Policy',
                bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/policy.html',
                downloadDisabled: true
            })
        },
        {
            url: '',
            name: 'Lender Terms',
            action: this.openConditionsDialog.bind(this, {
                title: 'Lender Terms',
                bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/lender.html',
                downloadDisabled: true
            })
        },
        {
            url: '',
            name: 'Disclosures',
            action: this.openConditionsDialog.bind(this, {
                title: 'Disclosures',
                bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/disclosures.html',
                downloadDisabled: true
            })
        },
        {
            url: '',
            name: 'About Us',
            action: this.openConditionsDialog.bind(this, {
                title: 'About Us',
                bodyUrl: environment.LENDSPACE_DOMAIN + '/documents/about.html',
                downloadDisabled: true
            })
        }
    ];
    defaultMenuItems = [
        {url: '/personal-finance/about', name: 'AboutUs'},
        {url: '/personal-finance/contact-us', name: 'ContactUs'},
        {url: '/account/login', name: 'LoginBtn'},
        {url: '/personal-finance/', name: 'GetStarted'}
    ];
    footerMenuItems = [];
    loggedUserId: number;
    currentYear = new Date().getFullYear();

    constructor(
        injector: Injector,
        public conditionsModalService: ConditionsModalService,
    ) {
        super(injector);

        this.loggedUserId = this.appSession.userId;
        this.hasPfmAppFeature = this.feature.isEnabled(AppFeatures.PFMApplications);
        this.footerMenuItems = this.hasPfmAppFeature ? this.appMenuItems : this.defaultMenuItems;
    }

    openConditionsDialog(data: any) {
        this.conditionsModalService.openModal({
            panelClass: ['slider', 'footer-slider'],
            data: data
        });
    }
}
