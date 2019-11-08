import { Component, OnInit } from '@angular/core';
import ILanguageInfo = abp.localization.ILanguageInfo;

@Component({
    selector: 'language-switch',
    templateUrl: './language-switch.component.html'
})
export class LanguageSwitchComponent implements OnInit {

    currentLanguage: abp.localization.ILanguageInfo;
    languages: abp.localization.ILanguageInfo[] = [];

    ngOnInit(): void {
        this.languages = abp.localization.languages.filter((l: ILanguageInfo) => l.isDisabled === false);
        this.currentLanguage = abp.localization.currentLanguage;
    }

    changeLanguage(language: abp.localization.ILanguageInfo) {
        abp.utils.setCookieValue(
            'Abp.Localization.CultureName',
            language.name,
            new Date(new Date().getTime() + 5 * 365 * 86400000), // 5 year
            abp.appPath
        );

        location.reload();
    }
}
