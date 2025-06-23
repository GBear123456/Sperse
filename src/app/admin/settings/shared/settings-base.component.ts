/** Core imports */
import { ChangeDetectorRef, Directive, Injector, OnDestroy } from '@angular/core';

/** Third party imports */
import { Observable, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { SettingsComponent } from '../settings/settings.component';

@Directive()
export abstract class SettingsComponentBase extends AppComponentBase implements OnDestroy {
    changeDetection: ChangeDetectorRef;
    clipboardService: ClipboardService;

    abstract getSaveObs(): Observable<any>;

    private parentComponent: SettingsComponent;
    private _destroy: Subject<any> = new Subject();

    constructor(
        _injector: Injector
    ) {
        super(_injector);
        this.changeDetection = _injector.get(ChangeDetectorRef);
        this.clipboardService = _injector.get(ClipboardService);
        this.parentComponent = _injector.get(SettingsComponent);

        this.parentComponent.saveSubject.pipe(
            takeUntil(this._destroy.asObservable())
        ).subscribe(() => {
            this.save();
        });
    }

    isValid(): boolean {
        return true;
    }

    save() {
        if (!this.isValid())
            return;

        this.startLoading();
        this.getSaveObs()
            .pipe(
                finalize(() => this.finishLoading())
            )
            .subscribe(res => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.afterSave();
            });
    }

    afterSave() {
    }

    copyToClipboard(event) {
        this.clipboardService.copyFromContent(event.target.parentNode.innerText.trim());
        this.notify.info(this.l('SavedToClipboard'));
    }

    get isHost(): boolean {
        return !this.appSession.tenantId;
    }

    ngOnDestroy() {
        this._destroy.next();
    }
}