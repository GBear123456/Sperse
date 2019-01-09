import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Subject } from '@node_modules/rxjs';

@Injectable()
export class AppHttpInterceptor extends AbpHttpInterceptor {
    constructor(public configuration: AppHttpConfiguration) {
        super(configuration);
    }

    addAuthorizationHeaders(header: HttpHeaders): HttpHeaders {
        let headers = super.addAuthorizationHeaders(header);
        headers = headers.set('InitialReferrer', abp.utils.getCookieValue('InitialReferrer'));
        return headers;
    }

    handleError(error) {
        if (error['errorDetails'])
            error.error = new Blob([JSON.stringify(error.errorDetails)]);
        if (error['httpStatus'])
            error.status = error['httpStatus'];

        return this.handleErrorResponse(error, new Subject());
    }

    handleErrorResponse(response, interceptObservable: Subject<HttpEvent<any>>) {
        if (this.configuration['avoidErrorHandling']) {
            this.configuration.blobToText(response.error).subscribe((error) => {
                interceptObservable.error(JSON.parse(error).error);
                interceptObservable.complete();
            });
            return interceptObservable;
        } else {
            super.handleErrorResponse(response, interceptObservable);
        }
    }
}
