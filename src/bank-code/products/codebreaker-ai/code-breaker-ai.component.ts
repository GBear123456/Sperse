import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProductsService } from '../products.service';
import { Observable } from 'rxjs';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';

@Component({
    selector: 'code-breaker-ai',
    templateUrl: 'code-breaker-ai.component.html',
    styleUrls: ['./code-breaker-ai.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeBreakerAiComponent {
    hasSubscription$: Observable<boolean> = this.productsService.checkServiceSubscription(BankCodeServiceType.BANKPass);

    constructor(private productsService: ProductsService) {}
}
