import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';

@Component({
    selector: 'code-breaker-ai',
    templateUrl: 'code-breaker-ai.component.html',
    styleUrls: ['./code-breaker-ai.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeBreakerAiComponent implements OnInit, OnDestroy {
    hasCrmCustomersPermission = false;
    constructor() {}

    ngOnInit(): void {}

    getAccess() {}

    ngOnDestroy() {}
}
