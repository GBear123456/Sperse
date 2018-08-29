import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'app-pages-footer',
    templateUrl: './pages-footer.component.html',
    styleUrls: ['./pages-footer.component.less']
})
export class PagesFooterComponent extends AppComponentBase implements OnInit {
    footerMenuItems = [
        { url: '/personal-finance/about-us', name: 'AboutUs' },
        { url: '/personal-finance/contact-us', name: 'ContactUs' },
        { url: '/account/login', name: 'LoginBtn' },
        { url: '/personal-finance/', name: 'GetStarted' }
    ];
    currentYear = new Date().getFullYear();

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() { }
}
