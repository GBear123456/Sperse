import { Component, Injector, HostBinding } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'app-pages-footer',
    templateUrl: './pages-footer.component.html',
    styleUrls: ['./pages-footer.component.less']
})
export class PagesFooterComponent extends AppComponentBase {
    @HostBinding('class.pfm-app') hasPfmAppFeature = false;
    domain = AppConsts.LENDSPACE_DOMAIN;

    appMenuItems = [
        {
            name: 'Terms of Use',
            url: this.domain + '/terms',
            action: this.openConditionsDialog.bind(this, {
                title: 'Terms of Use',
                bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/terms.html',
                downloadDisabled: true
            })
        },
        {
            name: 'Privacy Policy',
            url: this.domain + '/privacy',
            action: this.openConditionsDialog.bind(this, {
                title: 'Privacy Policy',
                bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/policy.html',
                downloadDisabled: true
            })
        },
        {
            name: 'Lender Terms',
            url: this.domain + '/lenderterms',
            action: this.openConditionsDialog.bind(this, {
                title: 'Lender Terms',
                bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/lender.html',
                downloadDisabled: true
            })
        },
        {
            name: 'Disclosures',
            url: this.domain + '/disclosures',
            action: this.openConditionsDialog.bind(this, {
                title: 'Disclosures',
                bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/disclosures.html',
                downloadDisabled: true
            })
        },
        {
            name: 'About Us',
            url: this.domain + '/aboutus',
            action: this.openConditionsDialog.bind(this, {
                title: 'About Us',
                bodyUrl: AppConsts.LENDSPACE_DOMAIN + '/documents/about.html',
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
        private dialog: MatDialog
    ) {
        super(injector);

        this.loggedUserId = this.appSession.userId;
        this.hasPfmAppFeature = this.feature.isEnabled('PFM.Applications');
        this.footerMenuItems = this.hasPfmAppFeature ? this.appMenuItems : this.defaultMenuItems;
    }

    openConditionsDialog(data: any) {
        this.dialog.open(ConditionsModalComponent, {panelClass: ['slider', 'footer-slider'], data: data});
    }
}