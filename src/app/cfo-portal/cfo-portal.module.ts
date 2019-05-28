/** Core imports */
import { NgModule } from '@angular/core';

/** Third party imports */

/** Application imports */
import { InstanceType } from 'shared/service-proxies/service-proxies';
import { CfoModule } from '@app/cfo/cfo.module';
import { LayoutService } from '@app/shared/layout/layout.service';
import { CFOService } from '@shared/cfo/cfo.service';

@NgModule({
    imports: [
        CfoModule
    ]
})

export class CfoPortalModule {
    constructor(
        private _layoutService: LayoutService,
        private _cfoService: CFOService
    ) {
        _layoutService.showPlatformSelectMenu = false;

        _cfoService.hasStaticInstance = true;
        _cfoService.instanceType = InstanceType.User;
    }
}