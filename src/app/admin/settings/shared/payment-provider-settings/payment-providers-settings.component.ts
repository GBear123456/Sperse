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
import { environment } from '@root/environments/environment';

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

    hideGatewayTypes = [
        'stripe',
        'stripe_payment_intents',
        'paypal',
        'paypal_commerce_platform',
        'payflow_pro',
        'braintree'
    ];

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

    enableDisable(data: SpreedlyGatewayConnectionDto) {
        this.startLoading();
        this.paymentSettingsService.setActiveSpreedlyGatewayConnection(data.id, !data.isActive)
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(() => {
                this.getConfiguredProviders();
            });
    }

    delete(data: SpreedlyGatewayConnectionDto) {
        this.message.confirm('', this.l('DeleteConfiramtion'), result => {
            if (result) {
                this.startLoading();
                this.paymentSettingsService.deleteSpreedlyGatewayConnection(data.id)
                    .pipe(
                        finalize(() => this.finishLoading())
                    )
                    .subscribe(() => {
                        this.getConfiguredProviders();
                        this.notify.info(this.l('SuccessfullyDeleted'));
                    });
            }
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
            this.spreedlyAllProviders = this.processGateways(val.gateways);
            this.changeDetection.detectChanges();
        });
    }

    processGateways(spreedlyGateways: any[]): any[] {
        spreedlyGateways = spreedlyGateways.filter(v => !this.hideGatewayTypes.includes(v.gateway_type));
        if (environment.releaseStage == 'production') {
            let testGatewayIndex = spreedlyGateways.findIndex(g => g.gateway_type == 'test');
            spreedlyGateways.splice(testGatewayIndex, 1);
        } else {
            let testGateway = spreedlyGateways.find(g => g.gateway_type == 'test');
            testGateway.name = 'Test Gateway';
        }

        return spreedlyGateways;
    }
}