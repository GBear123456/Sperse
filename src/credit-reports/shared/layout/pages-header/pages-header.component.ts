import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'app-pages-header',
    templateUrl: './pages-header.component.html',
    styleUrls: ['./pages-header.component.less']
})
export class PagesHeaderComponent extends AppComponentBase implements OnInit {
    menuItems = [
        { url: '/credit-reports/about-us', title: 'About us' },
        { url: '/credit-reports/contact-us', title: 'Contact us' },
        { url: '/account/login', title: 'Login' }
    ];
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }
}
