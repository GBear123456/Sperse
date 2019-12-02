/** Core imports */
import { Injectable } from '@angular/core';

/** Application imports */
import { LocalizationService } from '@abp/localization/localization.service';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class AppLocalizationService extends LocalizationService {
    localizationSourceName;
    l(key: string, ...args: any[]): string {
        let source: string = AppConsts.localization.defaultLocalizationSourceName;
        if (this.localizationSourceName)
            source = this.localizationSourceName;

        args.unshift(key);
        args.unshift(source);
        return this.ls.apply(this, args);
    }

    ls(sourcename: string, key: string, ...args: any[]): string {
        let source = abp.localization.values[sourcename];
        if (!source || !source[key])
            sourcename = AppConsts.localization.defaultLocalizationSourceName;

        let localizedText = this.localize(key, sourcename);
        if (!localizedText)
            localizedText = key;

        if (!args || !args.length)
            return localizedText;

        args.unshift(localizedText);
        return abp.utils.formatString.apply(this, args);
    }

    lr(key: string) {
        return this.l(key) + '*';
    }
}
