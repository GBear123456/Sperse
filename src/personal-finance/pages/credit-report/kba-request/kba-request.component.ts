import { Component, OnInit } from '@angular/core';
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
export class KbaComponent implements OnInit {
    model: KbaInputModel = new KbaInputModel();
    sourceUrl: SafeResourceUrl;
    error: string;

    constructor(
        private sanitizer: DomSanitizer,
        private _KBAService: KBAServiceProxy
    ) {
        this.model.redirectUrl = window.location.protocol + '//' + window.location.host + '/personal-finance/kba-result';
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
