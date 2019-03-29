import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpRequest, HttpResponse, HttpHandler, HttpHeaders } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class AppHttpInterceptor extends AbpHttpInterceptor {
    private _poolRequests = {};
    private readonly EXCEPTION_KEYS = [
        'CFO_BankAccounts_GetStats',
        'CFO_Dashboard_GetCategorizationStatus'
    ];

    constructor(public configuration: AppHttpConfiguration) {
        super(configuration);
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {        
        let key = this.getKeyFromUrl(request.url), 
            pool = this._poolRequests[key] || {request};

        this._poolRequests[key] = pool;
        if (pool.subject) {
            if (pool.request.urlWithParams == request.urlWithParams 
                && pool.request.body == request.body
            ) return pool.subject;

            if (request.method == 'GET') {        
                if (this.EXCEPTION_KEYS.every((item) => key.indexOf(item) < 0)) {
                    if (pool.subject.observers && pool.subject.observers.length)
                        pool.subject.observers.forEach((sub) => {
                            sub.unsubscribe();
                        });
                    pool.httpSubscriber.unsubscribe();
                    this._poolRequests[key] = pool;
                    pool.subject.complete();
                }
            }           
        }

        return pool.subject = this.interceptInternal(request, next);
    }

    private interceptInternal(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let key = this.getKeyFromUrl(request.url),
            interceptObservable = new Subject<HttpEvent<any>>(),
            modifiedRequest = this.normalizeRequestHeaders(request);
        
        this._poolRequests[key].httpSubscriber = next.handle(modifiedRequest)
            .pipe(finalize(() => {delete this._poolRequests[key];}))
            .subscribe((event: HttpEvent<any>) => {
                this.handleSuccessResponse(event, interceptObservable);                
            }, (error: any) => {
                return this.handleErrorResponse(error, interceptObservable);
            });

        return interceptObservable;
    }

    private getKeyFromUrl(url) {
        return url.split('?').shift().split('/').slice(3).join('_');
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