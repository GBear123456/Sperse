import {Component, Injector, OnInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';
import {AppConsts} from '@shared/AppConsts';

@Component({
    selector: 'app-main-nav',
    templateUrl: './main-nav.component.html',
    styleUrls: ['./main-nav.component.less']
})
export class MainNavComponent extends AppComponentBase implements OnInit {
    menuItems = [
        {url: '/about-us', title: 'About us'},
        {url: '/contact-us', title: 'Contact us'},
        {url: '/account/login', title: 'Login'}
    ];
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
