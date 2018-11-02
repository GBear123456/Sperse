/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Subject, Observable, forkJoin, of, throwError, iif } from 'rxjs';
import { switchMap, delay, first, filter, map, retryWhen, concatMap } from 'rxjs/operators';

/** Application imports */
import { GetProviderUITokenOutput, InstanceType, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppConsts } from '@shared/AppConsts';
import { CFOService } from '@shared/cfo/cfo.service';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

declare const Quovo: any;

@Injectable()
export class QuovoService {
    private cfoService: CFOService;
    private permissionChecker: PermissionCheckerService;
    private quovo: any;
    private token: string;
    private iframe: HTMLIFrameElement;
    private quovoLoaded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public quovoOpened$: Subject<any> = new Subject<boolean>();
    public quovoClosed$: Subject<any> = new Subject<boolean>();
    public quovoSynced$: Subject<any> = new Subject<boolean>();
    private tokenLoading$: Observable<GetProviderUITokenOutput>;

    constructor(
        injector: Injector,
        private syncService: SyncServiceProxy,
        private syncProgressService: SynchProgressService,
        private notify: NotifyService,
        private localizationService: AppLocalizationService
    ) {
        this.cfoService = injector.get(CFOService);
        this.tokenLoading$ = this.syncService.createProviderUIToken(InstanceType[this.cfoService.instanceType], this.cfoService.instanceId, 'Q');
        this.permissionChecker = injector.get(PermissionCheckerService);
    }

    connect() {
        /** Load quovo script (jquery getScript to observable) */
        const quovoLoading$ = new Observable(observer => {
            jQuery.getScript('https://app.quovo.com/ui.js').done(() => {
                observer.next();
                observer.complete();
            });
        });

        if (!this.quovo) {
            forkJoin(
                this.tokenLoading$,
                quovoLoading$
            ).subscribe(
                res => {
                    this.token = res[0].token;
                    this.quovo = this.createQuovo(this.token);
                },
                () => this.onQuovoClose()
            );
        }
        return this.quovoLoaded$;
    }

    private updateToken() {
        /** Load the new token and change token in iframe */
        return this.tokenLoading$.pipe(
            map((newTokenOutput: GetProviderUITokenOutput) => {
                let src = this.iframe.getAttribute('src');
                src = src.replace(this.token, newTokenOutput.token.toString());
                this.token = newTokenOutput.token;
                this.iframe.setAttribute('src', 'about:blank');
                this.iframe.setAttribute('src', src);
                return 'iframe changed';
            })
        );
    }

    private createQuovo(token) {
        return Quovo.create({
            token: token,
            userCss: AppConsts.appBaseHref + 'assets/cfo-css/quovo.css',
            topInstitutions: 'all',
            confirmClose: false,
            search: { testInstitutions: true },
            onLoad: this.onQuovoLoad.bind(this),
            onOpen: this.onQuovoOpen.bind(this),
            onClose: this.onQuovoClose.bind(this),
            onSync: this.onQuovoSync.bind(this)
        });
    }

    /**
     * Create and return quovo open observable with 3 times and 2 sec retry handler in a case of error
     */
    private getQuovoOpenObservable(accountId = null) {
        return new Observable((observer) => {
            try {
                this.quovo.open(accountId ? { connectionId: +accountId } : undefined);
                observer.next();
                observer.complete();
            } catch (err) {
                console.log(this.handleQuovoError(err));
                this.updateToken().subscribe();
                observer.error(err);
            }
        }).pipe(
            retryWhen(errors => errors.pipe(
                // Use concat map to keep the errors in order and make sure they
                // aren't executed in parallel
                concatMap((e, i) =>
                    // Executes a conditional Observable depending on the result
                    // of the first argument
                    iif(
                        () => i > 2,
                        // If the condition is true we throw the error (the last error)
                        throwError(e),
                        // Otherwise we pipe this back into our stream and delay the retry
                        of(e).pipe(delay(2000))
                    )
                )
            ))
        );
    }

    open(accountId: number = null) {
        this.quovoLoaded$.pipe(
            filter(loaded => loaded),
            first(),
            switchMap(() => this.getQuovoOpenObservable(accountId))
        ).subscribe(
            x => {},
            /** Close quovo in a case of failed connection */
            () => {
                this.onQuovoClose();
                /** Show the notification about failed quovo connection */
                this.notify.error(this.localizationService.ls('Platform', 'QuovoConnectionError'));
            }
        );
        return this.quovoOpened$;
    }

    private handleQuovoError(err) {
        let errorMessage;
        switch (err.name) {
            case 'EventOriginError' : errorMessage = `Quovo.EventOriginError ${err.message} reconnecting...`; break;
            case 'ElementNotFoundError' : errorMessage = `Quovo.EventOriginError ${err.message} reconnecting...`; break;
            case 'InputError' : errorMessage = `Quovo.InputError ${err.message} reconnecting...`; break;
            case 'TimingError' : errorMessage = `Quovo.TimingError ${err.message} reconnecting...`; break;
            case 'TokenError' : errorMessage = `Quovo.TokenError ${err.message} reconnecting...`; break;
            case 'ElementNotFoundError' : errorMessage = `Quovo.ElementNotFoundError ${err.message} reconnecting...`; break;
            case 'ConnectError': errorMessage = `Quovo.ConnectError ${err.message} reconnecting...`; break;
            default: errorMessage = `Quovo ${err.message} reconnecting...`;
        }
        return errorMessage;
    }

    private onQuovoLoad() {
        this.quovoLoaded$.next(true);
        /** Save quovo iframe element */
        if (!this.iframe) {
            let frames = document.querySelectorAll('[id|=q-frame]');
            this.iframe = frames.length === 1 ? frames[frames.length - 1] as HTMLIFrameElement : null;
        }
    }

    private onQuovoOpen() {
        this.quovoOpened$.next();
    }

    private onQuovoClose() {
        this.quovoClosed$.next();
        if (this.quovo) {
            this.quovo.close();
        }
        if (this.iframe) {
            this.iframe.style.display = 'none';
        }
    }

    private onQuovoSync() {
        this.quovoSynced$.next();
        this.syncProgressService.startSynchronization(true, true);
    }
}
