/** Core imports */
import { Component, ViewEncapsulation } from '@angular/core';

/** Application imports */
import { RootComponent } from '@root/root.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'zapier',
    templateUrl: 'zapier.component.html',
    styleUrls: ['./zapier.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class ZapierComponent {
    showElement = false;
    constructor(
        private rootComponent: RootComponent,
        private loadingService: LoadingService,
        public ls: AppLocalizationService
    ) {
        this.loadingService.startLoading();
        this.rootComponent.addScriptLink('https://cdn.zapier.com/packages/partner-sdk/v0/zapier-elements/zapier-elements.esm.js', 'module', () => {
            this.loadingService.finishLoading();
            this.showElement = true;
        });
    }
}