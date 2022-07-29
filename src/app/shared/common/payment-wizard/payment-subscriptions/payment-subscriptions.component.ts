/** Core imports */
import { 
    Component,     
    ChangeDetectionStrategy,
    ChangeDetectorRef, 
    Injector
} from '@angular/core';

/** Application imports */
import { ProductServiceProxy, ProductInfo } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'payment-subscriptions',
    templateUrl: './payment-subscriptions.component.html',
    styleUrls: ['./payment-subscriptions.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentSubscriptionsComponent extends AppComponentBase {
    formatting = AppConsts.formatting;
    products: ProductInfo[] = [];

    constructor(
        injector: Injector,
        public appService: AppService,
        private productServiceProxy: ProductServiceProxy,
        private changeDetectionRef: ChangeDetectorRef
    ) {
        super(injector);
        this.productServiceProxy.getSubscriptionProductsByGroupName(
            'signup'
        ).subscribe((products: ProductInfo[]) => {
            this.products = products;
            this.changeDetectionRef.detectChanges();
            console.log(this.products);
        });
    }

    getProductImage(data) {
        let product = this.products.find(product => product.id == data.productId);
        return product && product.imageUrl || 'assets/common/images/product.png';
    }

    cancelSubscription(data) {
    }
}