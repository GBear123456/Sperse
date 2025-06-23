import { Injectable } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LayoutType, ModuleType, NavPosition } from '@shared/service-proxies/service-proxies';
import { AppFeatures } from '@shared/AppFeatures';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class LayoutService {
    public showPageLogo = true;
    public showPlatformSelectMenu = true;
    public showNotificationsButton = true;
    public showChatButton = true;
    public showUserProfileMenu = true;
    public showTopBar = true;
    public showLeftBar = false;
    public isWideView = false;

    get showModernLayout(): boolean {
        return this.showLeftBar;
    }

    defaultHeaderBgColor: string = AppConsts.defaultHeaderBgColor;
    defaultHeaderTextColor: string = AppConsts.defaultHeaderTextColor;
    defaultHeaderUnderlineColor: string = AppConsts.defaultHeaderUnderlineColor;
    defaultButtonColor: string = AppConsts.defaultButtonColor;
    defaultButtonTextColor: string = AppConsts.defaultButtonTextColor;
    defaultButtonHighlightedColor: string = AppConsts.defaultButtonHighlightedColor;
    defaultLeftSideMenuColor: string = AppConsts.defaultLeftSideMenuColor;
    defaultFontName: string = AppConsts.defaultFontName;
    defaultTabularFontName: string = AppConsts.defaultTabularFontName;
    defaultBorderRadius: string = AppConsts.defaultBorderRadius;

    layoutColors = {
        [LayoutType.Default]: {
            historicalCredit: '#00aeef',
            historicalDebit: '#f05b2a',
            historicalNetChange: '#fab800',
            endingBalance: '#F9E784',
            forecastCredit: '#a9e3f9',
            forecastDebit: '#fec6b3',
            forecastNetChange: '#a82aba',
            forecastEndingBalance: '#f9c4e4',
            green: '#8bd553',
            blue: '#00AEEF',
            orange: '#F9B74B',
            purple: '#8487e7',
            totalSales: '#8487e7',
            totalLeads: '#00AEEF',
            totalClients: '#f4ae55',
            clientsCount: '#8487e7',
            navBackground: this.getNavBarColor('NavBackground', this.defaultHeaderBgColor),
            navTextColor: this.getNavBarColor('NavTextColor', this.defaultHeaderTextColor),
            navUnderlineColor: this.getNavBarColor('NavTextColor', this.defaultHeaderUnderlineColor)
        },
        [LayoutType.AdvicePeriod]: {
            historicalCredit: '#86c5dc',
            historicalDebit: '#e47822',
            historicalNetChange: '#5b5f97',
            endingBalance: '#fed142',
            forecastCredit: '#3d8ba9',
            forecastDebit: '#99c24d',
            forecastNetChange: '#7F7F7F',
            forecastEndingBalance: '#817c97',
            green: '#99c24d',
            blue: '#86c5dc',
            orange: '#e47822',
            purple: '#3d8ba9',
            totalSales: '#e47822',
            totalLeads: '#86c5dc',
            totalClients: '#99c24d',
            clientsCount: '#5b5f97',
            navBackground: this.getNavBarColor('NavBackground', this.defaultHeaderBgColor),
            navTextColor: this.getNavBarColor('NavTextColor', this.defaultHeaderTextColor),
            navUnderlineColor: this.getNavBarColor('NavTextColor', this.defaultHeaderUnderlineColor)
        }
    };
    mapPalette = {
        [LayoutType.Default]: [ '#c1b9ff', '#b6abff', '#aa9eff', '#9e91ff', '#9383ff', '#8776ff', '#7b69ff', '#705bff' ],
        [LayoutType.AdvicePeriod]: [ '#9fcbdc', '#91c4d7', '#84bdd2', '#76b5cd', '#68aec9', '#5aa6c4', '#4d9fbf', '#4296b7' ]
    };

    public supportLeftNavigationModules = ['ADMIN', 'API', ModuleType.CRM, ModuleType.CFO];

    toggleHeadlineButtonSubject: Subject<boolean> = new Subject();
    expandedLeftBarSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(private appSessionService: AppSessionService) {}

    displayDefaultPageHeader(value: boolean = false) {
        this.showPageLogo = this.showPlatformSelectMenu = this.showNotificationsButton = this.showChatButton = this.showUserProfileMenu = value;
    }

    getLayoutColor(colorFor: string): string {
        const layoutType = this.appSessionService.layoutType;
        return this.layoutColors[layoutType]
            ? this.layoutColors[layoutType][colorFor]
            : this.layoutColors[LayoutType.Default][colorFor];
    }

    getMapPalette(): string[] {
        return this.mapPalette[this.appSessionService.layoutType] || this.mapPalette[LayoutType.Default];
    }
    
    getNavBarColor(property: string, defaultColor: string) {
        if (abp.features.isEnabled(AppFeatures.AdminCustomizations))
            return abp.setting.get('App.Appearance.' + property) || defaultColor;
        else
            return defaultColor; 
    }

    checkSetModuleSettings(moduleName: string) {
        if (this.supportLeftNavigationModules.includes(moduleName.toUpperCase())) {
            let navPosition = abp.setting.get('App.Appearance.NavPosition');
            this.showTopBar = !navPosition || navPosition == NavPosition.Horizontal;        
            this.showLeftBar = !this.showTopBar;
        } else {
            this.showTopBar = true;
            this.showLeftBar = false;
        }        
    }

    getWelcomePageUri(): string {
        let pageUri = abp.setting.get('App.Appearance.WelcomePageAppearance');
        if (!pageUri)
            pageUri = AppConsts.defaultWelcomePageUri;
        return pageUri;        
    }
}