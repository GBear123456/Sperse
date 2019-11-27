import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'code-breaker-ai',
    templateUrl: 'code-breaker-ai.component.html',
    styleUrls: ['./code-breaker-ai.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeBreakerAiComponent implements OnInit, OnDestroy {
    hasCrmCustomersPermission = false;
    constructor(
        @Inject(DOCUMENT) private document
    ) {}

    ngOnInit(): void {
        this.document.body.classList.add('overflow-hidden');
    }

    getAccess() {}

    ngOnDestroy() {
        this.document.body.classList.remove('overflow-hidden');
    }
}
