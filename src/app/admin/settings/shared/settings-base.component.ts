/** Core imports */
import { ChangeDetectorRef, Directive, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';

@Directive()
export abstract class SettingsComponentBase extends AppComponentBase {
    changeDetection: ChangeDetectorRef;
    clipboardService: ClipboardService;

    abstract getSaveObs(): Observable<any>;

    constructor(
        _injector: Injector
    ) {
        super(_injector);
        this.changeDetection = _injector.get(ChangeDetectorRef);
        this.clipboardService = _injector.get(ClipboardService);
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
}