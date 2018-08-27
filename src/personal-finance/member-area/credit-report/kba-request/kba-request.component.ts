import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { KBAServiceProxy } from '@shared/service-proxies/service-proxies';
import { KbaInputModel } from './kba-request.model';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-kba',
    templateUrl: './kba-request.component.html',
    providers: [KBAServiceProxy],
    styleUrls: ['./kba-request.component.less']
})
export class KbaComponent extends AppComponentBase implements OnInit {
    model: KbaInputModel = new KbaInputModel();
    sourceUrl: SafeResourceUrl;
    error: string;

    constructor(
        injector: Injector,
        private sanitizer: DomSanitizer,
        private _KBAService: KBAServiceProxy
    ) {
        super(injector);
        this.model.redirectUrl = window.location.protocol + '//' + window.location.host + '/personal-finance/member-area/kba-result';
    }

    ngOnInit() {
        this.requestKba();
    }

    requestKba(): void {
        abp.ui.setBusy();
        this._KBAService.requestKBA(this.model)
            .pipe(finalize(() => { abp.ui.clearBusy(); }))
            .subscribe((result) => {
                this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(result.kbaUrl);
            });
    }
}
