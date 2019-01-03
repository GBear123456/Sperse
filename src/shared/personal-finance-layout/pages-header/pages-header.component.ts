import { Component, Injector } from '@angular/core';
import { AppComponentBase } from 'shared/common/app-component-base';
import { Router, NavigationEnd } from '@angular/router';
import { AppConsts } from 'shared/AppConsts';

@Component({
    selector: 'app-pages-header',
    templateUrl: './pages-header.component.html',
    styleUrls: ['./pages-header.component.less']
})
export class PagesHeaderComponent extends AppComponentBase {
    signUpWizard = false;

    menuItems = [
        { url: '/personal-finance/about', title: 'About us' },
        { url: '/personal-finance/contact-us', title: 'Contact us' },
        { url: '/account/login', title: 'Login' }
    ];
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;

    constructor(injector: Injector,
        public router: Router
    ) {
        super(injector);

        router.events.subscribe(event => {
            if (event instanceof NavigationEnd)
                this.signUpWizard = location.pathname.includes('signup');
        });
    }
}
