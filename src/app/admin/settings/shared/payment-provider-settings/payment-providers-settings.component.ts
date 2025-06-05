/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import {
    SpreedlyGatewayConnectionDto,
    TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from '../settings-base.component';
import { AppFeatures } from '@shared/AppFeatures';
import { AddSpreedlyProviderDialog } from './add-spreedly-provider-dialog/add-spreedly-provider-dialog.component';

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
    spreedlyAllProviders: any[];

    constructor(
        _injector: Injector,
        private paymentSettingsService: TenantPaymentSettingsServiceProxy,
        private dialog: MatDialog,
        private http: HttpClient
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        if (!this.isPaymentsEnabled)
            return;

        this.getConfiguredProviders();
        this.getSpreedlyProviders();
    }

    getConfiguredProviders() {
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
        if (!this.spreedlyAllProviders)
            return;

        const dialogData = {
            fullHeigth: true,
            spreedlyProviders: this.spreedlyAllProviders
        };

        this.dialog.open(AddSpreedlyProviderDialog, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: dialogData
        }).afterClosed().subscribe(
            (refresh) => {
                if (refresh)
                    this.getConfiguredProviders();
            }
        );

        return;
    }

    getSaveObs(): Observable<any> {
        return of(true);
    }

    getSpreedlyProviders() {
        this.http.get<any>('https://core.spreedly.com/v1/gateways_options.json').subscribe(val => {
            this.spreedlyAllProviders = val.gateways;
            this.changeDetection.detectChanges();
        });
    }
}