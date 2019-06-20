import { Injectable } from '@angular/core';

@Injectable()
export class LayoutService {
    public showPageLogo = true;
    public showPlatformSelectMenu = true;
    public showNotificationsButton = true;
    public showChatButton = true;
    public showUserProfileMenu = true;

    hideDefaultPageHeader() {
        this.showPageLogo = this.showPlatformSelectMenu = this.showNotificationsButton = this.showChatButton = this.showUserProfileMenu = false;
    }
}
