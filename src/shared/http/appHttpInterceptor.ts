/** Core imports */
import { Injectable } from '@angular/core';
import { HttpEvent, HttpRequest, HttpHandler, HttpHeaders, HttpParams } from '@angular/common/http';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

/** Application imports */
import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from '@shared/helpers/UrlHelper';

@Injectable()
export class AppHttpInterceptor extends AbpHttpInterceptor {
    private _poolRequests = {};
    private readonly EXCEPTION_KEYS = [
        'CFO_BankAccounts_GetStats',
        'CRM_Lead_GetStageChecklistPoints',
        'CFO_Dashboard_GetCategorizationStatus',
        'CRM_ContactCommunication_GetMessages',
        'CRM_Country_GetCountryStates',
        'odata_LeadSlice',
        'odata_SalesSlice',
        'odata_ContactSlice',
        'odata_SubscriptionSlice',
        'Localization_GetLocalizationSource',
        'Profile_GetFriendProfilePictureById'
    ];

    constructor(public configuration: AppHttpConfiguration) {
        super(configuration);
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let key = this.getKeyFromUrl(request);
        if (this.EXCEPTION_KEYS.some(item => key.includes(item)))
            return super.intercept(request, next);

        let poolRequest = this._poolRequests[key];
        if (!poolRequest) {
            poolRequest = this._poolRequests[key] = {request};
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
            poolRequest.subject.complete();
        }

        return poolRequest.subject = this.interceptInternal(request, next);
    }

    private interceptInternal(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let key = this.getKeyFromUrl(request),
            interceptObservable = new Subject<HttpEvent<any>>(),
            modifiedRequest = this.normalizeRequestHeaders(request);

        this._poolRequests[key].httpSubscriber = next.handle(modifiedRequest)
            .pipe(finalize(() => delete this._poolRequests[key]))
            .subscribe(
                (event: HttpEvent<any>) => this.handleSuccessResponse(event, interceptObservable),
                (error: any) => this.handleErrorResponse(error, interceptObservable)
            );

        return interceptObservable;
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

    handleError(error) {
        if (error['errorDetails'])
            error.error = new Blob([JSON.stringify(error.errorDetails)]);
        if (error['httpStatus'])
            error.status = error['httpStatus'];

        return this.handleErrorResponse(error, new Subject());
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

    protected handleErrorResponse(response, interceptObservable: Subject<HttpEvent<any>>): Observable<any> {
        if (this.configuration['avoidErrorHandling']) {
            this.configuration.blobToText(response.error).subscribe((error) => {
                interceptObservable.error(JSON.parse(error).error);
                interceptObservable.complete();
            });
            return interceptObservable;
        } else {
            return super.handleErrorResponse(response, interceptObservable);
        }
    }
}
