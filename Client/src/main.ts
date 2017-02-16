import './polyfills.ts';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode, ChangeDetectorRef } from '@angular/core';
import { environment } from './environments/environment';
import { AccountModule } from './account/account.module';
import { AppConsts } from './shared/AppConsts';
import { AppPreBootstrap } from './AppPreBootstrap';
import { AppModule } from './app/app.module';

import * as moment from 'moment';

import 'moment/min/locales.min';
import 'moment-timezone';

if (environment.production) {
    enableProdMode();
}

abp.ui.setBusy();
AppPreBootstrap.run(() => {
    if (abp.session.userId) {
        $('body').attr('class', 'page-md page-header-fixed page-sidebar-closed-hide-logo');
        AppPreBootstrap.bootstrap(AppModule).then(() => {
            abp.ui.clearBusy();
        });
    } else {
        $('body').attr('class', 'page-md login');
        AppPreBootstrap.bootstrap(AccountModule).then(() => {
            abp.ui.clearBusy();
        });
    }
});

//A workaround to make angular-cli finding the startup module!
var b = false; if (b) { platformBrowserDynamic().bootstrapModule(AccountModule); }