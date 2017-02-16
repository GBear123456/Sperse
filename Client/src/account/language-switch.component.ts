import { Injector, Component, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'languageSwitch',
    templateUrl: './language-switch.component.html'
})
export class LanguageSwitchComponent extends AppComponentBase implements OnInit {

    currentLanguage: abp.localization.ILanguageInfo;
    languages: abp.localization.ILanguageInfo[] = [];

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {
        this.languages = abp.localization.languages;
        this.currentLanguage = abp.localization.currentLanguage;
    }

    changeLanguage(language: abp.localization.ILanguageInfo) {
        abp.utils.setCookieValue(
            "Abp.Localization.CultureName",
            language.name,
            new Date(new Date().getTime() + 5 * 365 * 86400000), //5 year
            abp.appPath
        );

        location.reload();
    }
}