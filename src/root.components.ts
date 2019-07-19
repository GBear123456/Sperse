import { Component, Inject, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';

import kebabCase from 'lodash/kebabCase';
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
                public hostElement: ElementRef,
                private _uiCustomizationService: AppUiCustomizationService,
                private title: Title
    ) {
        this.pageHeaderFixed(true);
    }

    public checkSetClasses(loggedUser) {
        let classList = this.hostElement.nativeElement.classList,
            loggedClass = this._uiCustomizationService.getAppModuleBodyClass().split(' ').filter(Boolean),
            accountClass = this._uiCustomizationService.getAccountModuleBodyClass().split(' ').filter(Boolean);
        classList.remove.apply(classList, accountClass.concat(accountClass));
        classList.add.apply(classList, loggedUser ? loggedClass : accountClass);
    }

    public pageHeaderFixed(value?: boolean) {
        this.hostElement.nativeElement.classList[
            value ? 'add' : 'remove']('page-header-fixed');
    }

    public overflowHidden(value?: boolean) {
        this.hostElement.nativeElement.classList[
            value ? 'add' : 'remove']('overflow-hidden');
    }

    public addScriptLink(src: String, type: String = 'text/javascript', callback = null): void {
        if (Array.prototype.some.call(this.document.scripts, (script) => {
            return script.src == src;
        })) return ;

        let script = this.document.createElement('script');
        script.type = type;
        script.src = src;
        if (callback)
            script.addEventListener('load', callback);
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
        let newTitle = (tenantName === '' ? AppConsts.defaultTenantName : tenantName) + ': ' + moduleName,
            ogTitle = document.head.querySelector('meta[property="og:title"]');
        if (ogTitle)
            ogTitle.setAttribute('content', newTitle);
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
    template: '<router-outlet></router-outlet>',
    styleUrls: ['./root.component.less']
})
export class AppRootComponent implements OnInit {
    constructor(@Inject(AppSessionService) private SS,
                @Inject(RootComponent) private parent) {}

    ngOnInit() {
        if (abp && abp.setting && abp.setting.values && abp.setting.values['Integrations:Google:MapsJavascriptApiKey'] && this.SS.userId)
            this.parent.addScriptLink(AppConsts.googleMapsApiUrl.replace('{KEY}', abp.setting.values['Integrations:Google:MapsJavascriptApiKey']));

        //tenant specific custom css
        let tenant = this.SS.tenant;
        if (tenant) {
            if (tenant.customCssId)
                this.parent.addStyleSheet('TenantCustomCss', AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/GetCustomCss/' + tenant.customCssId + '/' + tenant.id);

            if (tenant.customLayoutType && tenant.customLayoutType !== LayoutType.Default) {
                let layoutName = kebabCase(tenant.customLayoutType);
                this.parent.hostElement.nativeElement.classList.add(layoutName);
                this.parent.addStyleSheet(tenant.customLayoutType + 'Styles', AppConsts.appBaseHref +
                    'assets/common/styles/custom/' + layoutName + '/style.css');
            }

            this.checkSetGoogleAnalyticsCode(tenant);
        }
    }

    checkSetGoogleAnalyticsCode(tenant) {
        if (tenant.customLayoutType == LayoutType.LendSpace) {
            let tenantGACode = 'UA-129828500-1'; //!!VP should be used some tenant property
            this.parent.addScriptLink('https://www.googletagmanager.com/gtag/js?id=' + tenantGACode, '', () => {
                let dataLayer = window['dataLayer'] = window['dataLayer'] || [];
                dataLayer.push(['js', new Date()]);
                dataLayer.push(['config', tenantGACode]);
            });
        }
    }
}
