import { Component, Injector, OnInit, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'app-pages-footer',
    templateUrl: './pages-footer.component.html',
    styleUrls: ['./pages-footer.component.less']
})
export class PagesFooterComponent extends AppComponentBase {
    @HostBinding('class.pfm-app') hasPfmAppFeature: boolean = false;

    appMenuItems = [
        { url: '/personal-finance/products', name: 'Products' },
        { url: '/personal-finance/features', name: 'Features' },
        { url: '/account/about-us', name: 'About' },
        { url: '/personal-finance/contact-us', name: 'Contact us' }
    ];
    defaultMenuItems = [
        { url: '/personal-finance/about-us', name: 'AboutUs' },
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
        this.footerMenuItems = this.hasPfmAppFeature ? this.appMenuItems: this.defaultMenuItems;
    }
}