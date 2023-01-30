/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    BugsnagSettingsDto,
    HostSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
    selector: 'bugsnag-settings',
    templateUrl: './bugsnag-settings.component.html',
    styleUrls: ['./bugsnag-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [HostSettingsServiceProxy]
})
export class BugsnagSettingsComponent extends SettingsComponentBase {
    bugsnagSettings: BugsnagSettingsDto = new BugsnagSettingsDto();

    constructor(
        _injector: Injector,
        private hostSettingsService: HostSettingsServiceProxy,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();
        this.hostSettingsService.getBugsnagSettings()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.bugsnagSettings = res;
                this.changeDetection.detectChanges();
            });
    }

    getSaveObs(): Observable<any> {

        return this.hostSettingsService.updateBugsnagSettings(this.bugsnagSettings);
    }
}