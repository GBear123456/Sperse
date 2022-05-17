/** Core imports */
import { AfterViewInit, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import * as moment from 'moment-timezone';
import kebabCase from 'lodash/kebabCase';
import startCase from 'lodash/startCase';
import * as _ from 'underscore';

/** Core imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { LayoutType, CustomCssType, HostSettingsServiceProxy, MaintenanceSettingsDto } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';

/*
    Root App Component (App Selector)
*/
@Component({
    selector: 'app-root',
    templateUrl: 'root.component.html',
    styleUrls: ['./root.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class RootComponent implements OnInit, AfterViewInit {    
    maintenanceSettings: MaintenanceSettingsDto;
    hideMaintenanceMessage: Boolean = false;
    currentDate = moment();

    constructor(
        private router: Router,
        private loadingService: LoadingService,
        private hostSettingsProxy: HostSettingsServiceProxy,
        private uiCustomizationService: AppUiCustomizationService,
        @Inject(AppSessionService) private SS,
        @Inject(DOCUMENT) private document
    ) {
        this.pageHeaderFixed(true);
        let subscription = router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.document.body.querySelectorAll('div.initial').forEach(elm => {
                    setTimeout(() => this.document.body.removeChild(elm), 1000);
                });
                subscription.unsubscribe();
            }
        });

        this.hostSettingsProxy.getMaintenanceSettings().subscribe((res: MaintenanceSettingsDto) => {
            this.maintenanceSettings = res;
        });

        let hideMaintenanceMessage = localStorage.getItem('hideMaintenanceMessage');
        if (hideMaintenanceMessage != null)
            this.hideMaintenanceMessage = Boolean(hideMaintenanceMessage);
    }

    ngOnInit() {
        if (abp && abp.setting && abp.setting.values && abp.setting.values['Integrations:Google:MapsJavascriptApiKey'] && this.SS.userId)
            this.addScriptLink(AppConsts.googleMapsApiUrl.replace('{KEY}', abp.setting.values['Integrations:Google:MapsJavascriptApiKey']));

        //tenant specific custom css
        let tenant = this.SS.tenant;
        if (tenant) {
            let customCss = abp.session.userId ? tenant.customCssId : tenant.loginCustomCssId;
            if (customCss)
                this.addStyleSheet(`${CustomCssType.Platform}CustomCss`, AppConsts.remoteServiceBaseUrl + 
                    '/api/TenantCustomization/GetCustomCss/' + customCss + '/' + tenant.id);

            if (tenant.customLayoutType && tenant.customLayoutType !== LayoutType.Default) {
                let layoutName = kebabCase(tenant.customLayoutType);
                this.document.body.classList.add(layoutName);
                this.addStyleSheet(tenant.customLayoutType + 'Styles', AppConsts.appBaseHref +
                    'assets/common/styles/custom/' + layoutName + '/style.css');
            }

            this.checkSetGoogleAnalyticsCode(tenant);
        }
    }

    ngAfterViewInit() {
        this.checkSetClasses(abp.session.userId);
    }

    public checkSetClasses(loggedUser) {
        let classList = this.document.body.classList,
            loggedClass = this.uiCustomizationService.getAppModuleBodyClass().split(' ').filter(Boolean),
            accountClass = this.uiCustomizationService.getAccountModuleBodyClass().split(' ').filter(Boolean);
        classList.remove.apply(classList, accountClass.concat(accountClass));
        classList.add.apply(classList, loggedUser ? loggedClass : accountClass);
    }

    public pageHeaderFixed(value?: boolean) {
        this.document.body.classList[
            value ? 'add' : 'remove']('page-header-fixed');
    }

    public overflowHidden(value?: boolean) {
        this.uiCustomizationService.overflowHidden(value);
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

    checkSetGoogleAnalyticsCode(tenant) {
        if (tenant.customLayoutType == LayoutType.LendSpace) {
            let tenantGACode = 'UA-129828500-1'; //!!VP should be used some tenant property
            this.addScriptLink('https://www.googletagmanager.com/gtag/js?id=' + tenantGACode, '', () => {
                let dataLayer = window['dataLayer'] = window['dataLayer'] || [];
                dataLayer.push(['js', new Date()]);
                dataLayer.push(['config', tenantGACode]);
            });
        }
    }

    getMaintenanceMessageLink() {
        let message = this.maintenanceSettings.maintenanceMessage,
            email = this.maintenanceSettings.maintenanceEmailAddress;
        if (this.maintenanceSettings.showMaintenanceMessage && message) {
            if (email) {
                if (message.indexOf('{0}') >= 0)            
                    return message.replace('{0}', this.getEmailLink(email, email));
                else
                    return this.getEmailLink(email, message);
            } else 
                return message;
        }
        return '';
    }

    getEmailLink(email, text) {
        return '<a target="_blank" href="mailto:' + email + '?subject=New Request from ' + (this.SS.tenantName
            || AppConsts.defaultTenantName) + ' - ' + this.getModuleName() + '">' + text + '</a>';
    }

    getModuleName() {
        let path = document.location.href.match(/\/[app|account]{3,7}\/(\w*)[\/|$]?/);
        return path ? startCase(path[1]) : AppConsts.modules.platformModule;
    }

    toogleMaintenanceMessage() {
        this.hideMaintenanceMessage = !this.hideMaintenanceMessage;
        localStorage.setItem('hideMaintenanceMessage', this.hideMaintenanceMessage ? '1' : '');
    }
}