/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */

/** Application imports */
import { CfoModule } from '@app/cfo/cfo.module';
import { BankAccountsCommonModule } from '@shared/cfo/bank-accounts/bank-accounts-common.module';

import { LayoutService } from '@app/shared/layout/layout.service';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { UserOnlyCFOService } from '@shared/cfo/user-only.cfo.service';

@NgModule({
    imports: [
        CfoModule,
        BankAccountsCommonModule.forRoot()
    ],
    providers: [
        CfoPreferencesService,
        UserPreferencesService,
        {
            provide: CFOService,
            useClass: UserOnlyCFOService
        }
    ]
})

export class CfoPortalModule { 
    constructor(
        private _layoutService: LayoutService,
        private _cfoService: CFOService
    ) {
        _layoutService.showPlatformSelectMenu = false;
        _cfoService.instanceChangeProcess();
    }
}