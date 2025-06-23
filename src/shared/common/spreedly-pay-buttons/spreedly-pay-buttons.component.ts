/** Core imports */
import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CurrencyPipe, getCurrencySymbol } from '@angular/common';

/** Third party imports */

/** Application imports */
import { DomHelper } from '@shared/helpers/DomHelper';
import { KeyValuePairOfInt32String } from '../../service-proxies/service-proxies';
import { SpreedlyExpressOptions, SpreedlyExpressPaymentMethodParams } from './spreedly-pay-buttons.interface';

declare const SpreedlyExpress: any;

@Component({
    selector: 'spreedly-pay-buttons',
    templateUrl: 'spreedly-pay-buttons.component.html',
    styleUrls: ['./spreedly-pay-buttons.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CurrencyPipe]
})
export class SpreedlyPayButtonsComponent implements OnInit, OnDestroy {
    @Input() environmentKey: string;
    @Input() gateways: KeyValuePairOfInt32String[] = [];
    @Input() disabled: boolean = false;
    @Output() onButtonClick: EventEmitter<{ component: SpreedlyPayButtonsComponent, providerId: number }> = new EventEmitter();
    @Output() onPaymentMethod: EventEmitter<{ providerId: number, token: string }> = new EventEmitter();

    spreedlyJsLoaded: boolean = false;
    spreedlyPopupInit: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private currencyPipe: CurrencyPipe
    ) { }

    ngOnInit() {
        this.initializeSpreedly();
    }

    initializeSpreedly() {
        if (!this.environmentKey || !this.gateways.length)
            return;

        if ((<any>window).SpreedlyExpress) {
            this.spreedlyJsLoaded = true;
            return;
        }

        DomHelper.addScriptLink('https://core.spreedly.com/iframe/express-3.min.js', 'text/javascript', () => {
            this.spreedlyJsLoaded = true;
            this.changeDetector.detectChanges();
        });
    }

    onClick(spreedlyProviderId: number) {
        if (!SpreedlyExpress || !spreedlyProviderId)
            return;

        this.onButtonClick.emit({ component: this, providerId: spreedlyProviderId });
    }

    formatAmount(goalAmount: number, currencyId: string): string | null {
        return getCurrencySymbol(currencyId, 'narrow') + this.currencyPipe.transform(goalAmount, currencyId, '', '1.2-2');
    }

    showBankCardPopup(spreedlyProviderId: number, displayOptions: SpreedlyExpressOptions, paymentMethodParams: SpreedlyExpressPaymentMethodParams) {
        if (!SpreedlyExpress || !spreedlyProviderId)
            return;

        if (this.spreedlyPopupInit)
            SpreedlyExpress.unload();

        SpreedlyExpress.init(this.environmentKey, displayOptions, paymentMethodParams);
        SpreedlyExpress.onPaymentMethod((token, paymentMethod) => {
            this.onPaymentMethod.emit({ providerId: spreedlyProviderId, token });
        });
        SpreedlyExpress.onInit(() => {
            this.spreedlyPopupInit = true;
            SpreedlyExpress.openView();
        });
    }

    ngOnDestroy() {
        if (SpreedlyExpress && this.spreedlyPopupInit)
            SpreedlyExpress.unload();
    }
}
