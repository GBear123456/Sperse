import { Component, Injector, OnInit, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'app-pages-footer',
    templateUrl: './pages-footer.component.html',
    styleUrls: ['./pages-footer.component.less']
})
export class PagesFooterComponent extends AppComponentBase {
    @HostBinding('class.pfm-app') hasPfmAppFeature = false;

    appMenuItems = [
        { url: '/personal-finance/about', name: 'About Us' },
        { url: '/personal-finance/privacy-policy', name: 'Privacy Policy' },
        { url: '/personal-finance/terms', name: 'Terms of Use' },
        { url: '/personal-finance/trademarks', name: 'Trademarks' },
        { url: '/personal-finance/disclaimers', name: 'Disclaimers' }
    ];
    defaultMenuItems = [
        { url: '/personal-finance/about', name: 'AboutUs' },
        { url: '/personal-finance/contact-us', name: 'ContactUs' },
        { url: '/account/login', name: 'LoginBtn' },
        { url: '/personal-finance/', name: 'GetStarted' }
    ];
    footerMenuItems = [];
    loggedUserId: number;
    currentYear = new Date().getFullYear();
    constructor(
        injector: Injector
    ) {
        super(injector);

        this.loggedUserId = this.appSession.userId;
        this.hasPfmAppFeature = this.feature.isEnabled('PFM.Applications');
        this.footerMenuItems = this.hasPfmAppFeature ? this.appMenuItems : this.defaultMenuItems;
    }
}
