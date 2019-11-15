import {ChangeDetectionStrategy, Component, Injector, OnDestroy, OnInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'code-breaker-ai',
    templateUrl: 'code-breaker-ai.component.html',
    styleUrls: ['./code-breaker-ai.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeBreakerAiComponent extends AppComponentBase implements OnInit, OnDestroy {

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.getRootComponent().overflowHidden(true);
    }

    ngOnDestroy() {
        this.getRootComponent().overflowHidden();
    }
}
