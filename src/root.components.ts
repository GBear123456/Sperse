import { Component, HostBinding, Inject, ElementRef, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';

import * as _ from 'underscore';

/*
	Root Document Component (Body Selector)
*/
@Component({
    selector: 'body',
    template: '<app-root></app-root>'
})
export class RootComponent implements AfterViewInit {
	@HostBinding('class') public cssClass = 'page-md';

  private readonly LOGGED_CLASSES = ['page-header-fixed'];
  private readonly LOGGED_OUT_CLASSES = ['login'];

  constructor (
    @Inject(DOCUMENT) private document, 
    private hostElement: ElementRef
  ) {  }

  public checkSetClasses(loggedUser) {
    let classList = this.hostElement.nativeElement.classList;
    classList.remove.apply(classList, this.LOGGED_CLASSES.concat(this.LOGGED_OUT_CLASSES));
    classList.add.apply(classList, this[loggedUser ? 'LOGGED_CLASSES': 'LOGGED_OUT_CLASSES']);
  }

  public pageHeaderFixed(value) {
    this.hostElement.nativeElement.classList[
      value ? 'add': 'remove']('page-header-fixed');
  }

  public overflowHidden(value) {
    this.hostElement.nativeElement.classList[
      value ? 'add': 'remove']('overflow-hidden');
  }

  public addScriptLink(src: String, type: String = "text/javascript"): void {
		let script = this.document.createElement('script');
    script.type = type;
    script.src = src;
 		this.document.head.append(script);
  }

	public addStyleSheet(id: String, href: String, rel: String = 'stylesheet'): void {
		let link = this.document.createElement('link');
		_.mapObject({id: id, href: href, rel: rel}, 
			(val, key) => {
				link.setAttribute(key, val);			
			}
		);
		this.document.head.append(link);
	}

  ngAfterViewInit() {
    this.checkSetClasses(abp.session.userId);
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
    if (this.SS.tenant) {
      if (abp && abp.setting && abp.setting.values && abp.setting.values['Integrations:Google:MapsJavascriptApiKey'])
        this.parent.addScriptLink(AppConsts.googleMapsApiUrl.replace('{KEY}', abp.setting.values['Integrations:Google:MapsJavascriptApiKey']));

    	//tenant specific custom css
		  this.SS.tenant.customCssId && this.parent.addStyleSheet('TenantCustomCss',
			  AppConsts.remoteServiceBaseUrl + '/TenantCustomization/GetCustomCss?id=' + this.SS.tenant.customCssId);
    }
  }    
}