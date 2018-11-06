import { Component, OnInit } from '@angular/core';
import { SyncServiceProxy, InstanceType, GetProviderUITokenOutput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { DomSanitizer } from '@angular/platform-browser';
import { CFOService } from '@shared/cfo/cfo.service.ts';
import { Observable, BehaviorSubject, forkJoin } from '../../../../../node_modules/rxjs';


declare const Quovo: any;

@Component({
    selector: 'app-quovo-pfm',
    templateUrl: './quovo-pfm.component.html',
    styleUrls: ['./quovo-pfm.component.less']
})
export class QuovoPfmComponent implements OnInit {
    private quovoLoaded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private tokenLoading$: Observable<GetProviderUITokenOutput>;

    constructor(
        private _syncServiceProxy: SyncServiceProxy,
        private sanitizer: DomSanitizer,
        private _cfoService: CFOService
    ) {
        this.tokenLoading$ = this._syncServiceProxy.createProviderUIToken(InstanceType[this._cfoService.instanceType], this._cfoService.instanceId, 'Q');
    }

    ngOnInit() {
        /** Load quovo script (jquery getScript to observable) */
        const quovoLoading$ = new Observable(observer => {
            jQuery.getScript('https://app.quovo.com/ui.js').done(() => {
                observer.next();
                observer.complete();
            });
        });

        forkJoin(
            this.tokenLoading$,
            quovoLoading$
        ).subscribe(
            res => {
                let token = res[0].token;
                Quovo.embed({
                    token: token.toString(),
                    elementId: 'quovo-accounts-module',
                    moduleName: 'dashboard',
                });
            }
        );
    }
}
