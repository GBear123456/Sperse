/** Core imports */
import { Injector, Injectable } from '@angular/core';
import { HttpEvent, HttpRequest, HttpHandler, HttpHeaders, HttpParams } from '@angular/common/http';

/** Third party imports */
import { finalize, map, switchMap, catchError, takeUntil, first } from 'rxjs/operators';
import { Observable, Subject, throwError } from 'rxjs';

/** Application imports */
import { AbpHttpInterceptor } from 'abp-ng2-module';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { MessageService } from 'abp-ng2-module';

@Injectable()
export class AppHttpInterceptor extends AbpHttpInterceptor {
    private _poolRequests = {};
    private readonly EXCEPTION_KEYS = [
        'CFO_BankAccounts_GetStats',
        'CRM_Lead_GetStageChecklistPoints',
        'CFO_Dashboard_GetCategorizationStatus',
        'CRM_ContactCommunication_GetMessages',
        'CRM_Country_GetCountryStates',
        'CRM_DocumentTemplates_GetUrl',
        'odata_LeadSlice',
        'odata_SalesSlice',
        'odata_ContactSlice',
        'odata_SubscriptionSlice',
        'Localization_GetLocalizationSource',
        'Profile_GetFriendProfilePictureById'
    ];

    constructor(
        private injector: Injector,
        public configuration: AppHttpConfiguration,
        public message: MessageService
    ) {
        super(configuration, injector);
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (request.urlWithParams && request.urlWithParams.length > 2048) {
            this.message.error('Too long request');
            return throwError('Too long request');
        }

        let key = this.getKeyFromUrl(request);

        if (this.EXCEPTION_KEYS.some(item => key.includes(item))) {
            return super.intercept(request, next);
        }

        let poolRequest = this._poolRequests[key];
        if (!poolRequest) {
            poolRequest = this._poolRequests[key] = { request };
            poolRequest.destroy$ = new Subject<boolean>();
            return poolRequest.subject = this.interceptInternal(request, next);
        }

        if (poolRequest.request.urlWithParams == request.urlWithParams
            && poolRequest.request.body == request.body
        ) {
            return poolRequest.subject;
        }

        if (request.method == 'GET') {
            if (poolRequest.subject.observers && poolRequest.subject.observers.length)
                poolRequest.subject.observers.forEach(sub => {
                    sub.unsubscribe();
                });
            poolRequest.httpSubscriber.unsubscribe();
            poolRequest.destroy$.next(true);
            poolRequest.subject.complete();

            this._poolRequests[key] = poolRequest;
        }

        return poolRequest.subject = this.interceptInternal(request, next);
    }

    private interceptInternal(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let key = this.getKeyFromUrl(request),
            interceptObservable = new Subject<HttpEvent<any>>();
            
        this._poolRequests[key].httpSubscriber = next.handle(
             this.normalizeRequestHeaders(request)
        ).pipe(
            takeUntil(this._poolRequests[key].destroy$),
            finalize(() => delete this._poolRequests[key]),
            catchError((error: any) => this.handleErrorResponseInternal(error)),
            switchMap((event: HttpEvent<any>) => this.handleSuccessResponse(event))
        ).subscribe((res: any) => {
            if (res && res.status == 200)
                interceptObservable.next(res);
            else if (res.error)
                interceptObservable.error(res.error);
        }, error => {
            interceptObservable.error(error);
        });

        return interceptObservable.pipe(first());
    }

    private getKeyFromUrl(request: HttpRequest<any>): string {
        const path = request.url.split('?').shift().split('/').slice(3).join('_');
        const paramsKey = this.getParamsKey(path, request.params);
        return path + (paramsKey ? '_' + paramsKey : '');
    }

    private getParamsKey(path: string, params: HttpParams) {
        if (['odata_Lead', 'odata_Contact'].includes(path))
            return params.get('contactGroupId');
    }

    addAuthorizationHeaders(header: HttpHeaders): HttpHeaders {
        let headers = super.addAuthorizationHeaders(header);
        let originalReferer = sessionStorage.getItem('OriginalReferer');
        if (originalReferer)
            headers = headers.set('OriginalReferer', originalReferer);
        return headers;
    }

    handleError(error: any) {
        if (error.url || error.httpStatus == 0) { //!! dxDataGrid && OData error handling
            error.name = error.url ? error.name : '';
            error.message = this.configuration.defaultError.message;
            error.url = '';
        } else if (error.requestOptions && error.requestOptions.url.indexOf('odata') > 0) {
            error.url = '';
            error.name = error.name;
            error.message = this.configuration.defaultError.message;
        }

        if (!error.error)
            error.error = new Blob([JSON.stringify(error.errorDetails || error)]);
        if (error.httpStatus)
            error.status = error.httpStatus;
        return this.handleErrorResponseInternal(error);
    }

    protected normalizeRequestHeaders(request: HttpRequest<any>): HttpRequest<any> {
        const isAssetsRequest = request.url.indexOf(AppConsts.appBaseHref + 'assets') === 0;
        if (isAssetsRequest || request.url.includes('api/Localization/GetLocalizationSource')) {
            let modifiedHeaders = new HttpHeaders();

            this.addXRequestedWithHeader(modifiedHeaders);
            if (!isAssetsRequest) {
                this.addAuthorizationHeaders(modifiedHeaders);
            }
            this.addAspNetCoreCultureHeader(modifiedHeaders);
            this.addAcceptLanguageHeader(modifiedHeaders);
            this.addTenantIdHeader(modifiedHeaders);
            return request.clone({
                headers: modifiedHeaders
            });
        } else {
            request = super.normalizeRequestHeaders(request);
            const queryParams = UrlHelper.getQueryParameters();
            if (queryParams['user-key']) {
                request = request.clone({
                    headers: request.headers.append('user-key', queryParams['user-key']),
                    params: queryParams['tenantId']
                        ? request.params.append('tenantId', queryParams['tenantId'])
                        : request.params
                });
            }
            return request;
        }
    }

    protected handleErrorResponseInternal(response): Observable<any> {
        let keys = this.configuration['avoidErrorHandlingKeys'];
        if (this.configuration['avoidErrorHandling'] || (response.url &&
            keys && keys.some(key => response.url.toLowerCase().includes(key.toLowerCase()))
        )) {
            if (!(response.error instanceof Blob))
                return throwError(response);

            return this.configuration.blobToText(response.error).pipe(map(error => {
                return JSON.parse(error);
            }));
        } else {
            return super.handleErrorResponse(response);
        }
    }
}