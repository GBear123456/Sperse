import { Component, Inject, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { DOCUMENT, Title } from '@angular/platform-browser';
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';

import * as _ from 'underscore';

/*
	Root Document Component (Body Selector)
*/
@Component({
    selector: 'body',
    template: '<app-root></app-root>'
})
export class RootComponent implements AfterViewInit {
    constructor(@Inject(DOCUMENT) private document,
                private hostElement: ElementRef,
                private _uiCustomizationService: AppUiCustomizationService,
                private title: Title) { }

    public checkSetClasses(loggedUser) {
        let classList = this.hostElement.nativeElement.classList,
            loggedClass = this._uiCustomizationService.getAppModuleBodyClass().split(' ').filter(Boolean),
            accountClass = this._uiCustomizationService.getAccountModuleBodyClass().split(' ').filter(Boolean);
        classList.remove.apply(classList, accountClass.concat(accountClass));
        classList.add.apply(classList, loggedUser ? loggedClass : accountClass);
    }

    public pageHeaderFixed(value) {
        this.hostElement.nativeElement.classList[
            value ? 'add' : 'remove']('page-header-fixed');
    }

    public overflowHidden(value) {
        this.hostElement.nativeElement.classList[
            value ? 'add' : 'remove']('overflow-hidden');
    }

    public addScriptLink(src: String, type: String = 'text/javascript'): void {
        let script = this.document.createElement('script');
        script.type = type;
        script.src = src;
        this.document.head.append(script);
    }

    public removeScriptLink(src: String): void {
        let script = this.document.querySelector('script[src="' + src + '"]');
        if (script) script.remove();
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

    public setTitle(tenantName: string, moduleName: string) {
        let newTitle = (tenantName === '' ? 'Sperse' : tenantName) + ': ' + moduleName;
        this.title.setTitle(newTitle);
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
    template: `<router-outlet></router-outlet>`
})
export class AppRootComponent implements OnInit {
    constructor(@Inject(AppSessionService) private SS,
                @Inject(RootComponent) private parent) {}

    ngOnInit() {
        if (abp && abp.setting && abp.setting.values && abp.setting.values['Integrations:Google:MapsJavascriptApiKey'])
            this.parent.addScriptLink(AppConsts.googleMapsApiUrl.replace('{KEY}', abp.setting.values['Integrations:Google:MapsJavascriptApiKey']));

        //tenant specific custom css
        if (this.SS.tenant && this.SS.tenant.customCssId) {
            this.parent.addStyleSheet('TenantCustomCss', AppConsts.remoteServiceBaseUrl + '/TenantCustomization/GetCustomCss?id=' + this.SS.tenant.customCssId);
        }
    }
}
