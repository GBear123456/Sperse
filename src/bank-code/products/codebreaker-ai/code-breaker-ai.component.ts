import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProductsService } from '../products.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'code-breaker-ai',
    templateUrl: 'code-breaker-ai.component.html',
    styleUrls: ['./code-breaker-ai.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeBreakerAiComponent {
    hasSubscription$: Observable<boolean> = this.productsService.checkServiceSubscription('BANKPass');

    constructor(private productsService: ProductsService) {}
}
