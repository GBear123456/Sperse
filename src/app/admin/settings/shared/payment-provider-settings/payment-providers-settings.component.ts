/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    SpreedlyGatewayConnectionDto,
    TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from '../settings-base.component';
import { AppFeatures } from '@shared/AppFeatures';

@Component({
    selector: 'payment-providers-settings',
    templateUrl: './payment-providers-settings.component.html',
    styleUrls: ['./payment-providers-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class PaymentProvidersSettingsComponent extends SettingsComponentBase {
    isPaymentsEnabled: boolean = this.feature.isEnabled(AppFeatures.CRMPayments);
    providers: SpreedlyGatewayConnectionDto[] = [];

    constructor(
        _injector: Injector,
        private paymentSettingsService: TenantPaymentSettingsServiceProxy
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        if (!this.isPaymentsEnabled)
            return;

        this.getProviders();
    }

    getProviders() {
        this.startLoading();
        this.paymentSettingsService.getSpreedlyGatewayConnections()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.providers = res;
                this.changeDetection.detectChanges();
            });
    }

    addProvider() {
        this.startLoading();
        this.paymentSettingsService.createSpreedlyGatewayConnection()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(() => {
                this.getProviders();
            });
    }

    getSaveObs(): Observable<any> {
        return of(true);
    }
}