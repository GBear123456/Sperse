import { Directive, ElementRef, Input, AfterViewInit } from '@angular/core';

@Directive({
    selector: '[busyIf]'
})
export class BusyIfDirective implements AfterViewInit {

    @Input() set busyIf(isBusy: boolean) {
        this.refreshState(isBusy);
    }

    private _$elm: JQuery;

    constructor(
        private _element: ElementRef
    ) {
    }

    ngAfterViewInit(): void {
        this._$elm = $(this._element.nativeElement);
    }

    refreshState(isBusy: boolean): void {
        if (!this._$elm) {
            return;
        }

        if (isBusy) {
            abp.ui.setBusy(this._$elm);
        } else {
            abp.ui.clearBusy(this._$elm);
        }
    }
}