import { Injectable } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';

@Injectable()
export class LayoutService {
    public showPageLogo = true;
    public showPlatformSelectMenu = true;
    public showNotificationsButton = true;
    public showChatButton = true;
    public showUserProfileMenu = true;
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
            orange: '#F9B74B'
        },
        [LayoutType.AdvicePeriod]: {
            historicalCredit: '#86c5dc',
            historicalDebit: '#e47822',
            historicalNetChange: '#ffab3e',
            endingBalance: '#fed142',
            forecastCredit: '#3d8ba9',
            forecastDebit: '#99c24d',
            forecastNetChange: '#5b5f97',
            forecastEndingBalance: '#817c97',
            green: '#99c24d',
            blue: '#86c5dc',
            orange: '#e47822'
        }
    };

    constructor(private appSessionService: AppSessionService) {}

    hideDefaultPageHeader() {
        this.showPageLogo = this.showPlatformSelectMenu = this.showNotificationsButton = this.showChatButton = this.showUserProfileMenu = false;
    }

    getLayoutColor(colorFor: string): string {
        const layoutType = this.appSessionService.tenant && this.appSessionService.tenant.customLayoutType
            ? this.appSessionService.tenant.customLayoutType
            : LayoutType.Default;
        return this.layoutColors[layoutType][colorFor];
    }

    /**
     * hex — a hex color value such as “#abc” or “#123456” (the hash is optional)
       lum — the luminosity factor, i.e. -0.1 is 10% darker, 0.2 is 20% lighter, etc.
     * @param hex
     * @param lum
     */
    colorLuminance(hex, lum) {

        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        let rgb = '#', c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ('00' + c).substr(c.length);
        }

        return rgb;
    }
}
