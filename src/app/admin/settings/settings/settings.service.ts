/** Core imports */
import { Injectable } from '@angular/core';

@Injectable()
export class SettingService {
    public isDarkMode: boolean = false;
    public hasSubmenu: boolean = false;

    constructor(
    ) {
    }

    getFullPath = (path: string) => '/app/admin/settings/' + path;

    toggleTheme = () => {
        this.isDarkMode = !this.isDarkMode;
    }

    alterSubmenu = (v: boolean) => {
        this.hasSubmenu = v;
    }
}