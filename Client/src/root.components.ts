import * as _ from 'underscore';

import { Component, HostBinding, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';

/*
	Root Document Component (Body Selector)
*/
@Component({
    selector: 'body',
    template: '<app-root></app-root>'
})
export class RootComponent {
	@HostBinding('class') public cssClass = abp.session.userId ? 
		'page-md page-header-fixed page-sidebar-closed-hide-logo': 'page-md login';

    constructor (@Inject(DOCUMENT) private document) { }

	public addStyleSheet(id: String, href: String, rel: String = 'stylesheet'): void {
		var link = this.document.createElement('link');
		_.mapObject({id: id, href: href, rel: rel}, 
			(val, key) => {
				link.setAttribute(key, val);			
			}
		);
		this.document.head.append(link);
	}
}

/*
	Root App Component (App Selector)
*/
@Component({
    selector: 'app-root',
    template:  `<router-outlet></router-outlet>`
})
export class AppRootComponent {
	constructor (
		@Inject(AppSessionService) private SS, 
		@Inject(RootComponent) private parent
	) {}

    ngOnInit() {
    	//tenant specific custom css
		this.SS.tenant && this.SS.tenant.customCssId && this.parent.addStyleSheet('TenantCustomCss',
			AppConsts.remoteServiceBaseUrl + '/TenantCustomization/GetCustomCss?id=' + this.SS.tenant.customCssId);
    }    
}