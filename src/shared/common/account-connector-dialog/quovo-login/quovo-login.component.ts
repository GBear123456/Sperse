import { Component, EventEmitter, OnInit, Input, Output, Injector, OnDestroy } from '@angular/core';
import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import { CFOService } from '@shared/cfo/cfo.service';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { first, takeUntil, filter, switchMap } from 'rxjs/operators';

@Component({
    selector: 'quovo-login',
    template: ``
})
export class QuovoLoginComponent extends CFOComponentBase implements OnInit, OnDestroy {
    @Input() accountId: any;
    @Input() loadingContainerElement: Element;
    @Output() onClose: EventEmitter<any> = new EventEmitter();

    constructor(
        injector: Injector,
        private quovoService: QuovoService,
        public cfoService: CFOService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.startLoading(!this.loadingContainerElement, this.loadingContainerElement);

        /** Open quovo popup only after instance initialization - show the spinner until that moment */
        this.cfoService.statusActive
            .pipe(
                takeUntil(this.destroy$),
                filter(statusActive => statusActive),
                switchMap(() => this.quovoService.connect().pipe(filter(loaded => loaded))),
                first(),
                switchMap(() => this.quovoService.open(this.accountId))
            ).subscribe(() => {});

        this.quovoService.quovoClosed$
            .pipe(takeUntil(this.destroy$))
            .subscribe(e => this.onQuovoClose(e));

    }

    private onQuovoClose(e) {
        this.finishLoading(!this.loadingContainerElement, this.loadingContainerElement);
        this.onClose.emit(e);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
