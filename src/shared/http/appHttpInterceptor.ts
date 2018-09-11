import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { Subject } from '@node_modules/rxjs';

@Injectable()
export class AppHttpInterceptor extends AbpHttpInterceptor {
    constructor(configuration: AppHttpConfiguration) {
        super(configuration);
    }

    handleError(error) {
        if (error['httpStatus']) {
            error = {
                ...error,
                ...<HttpResponse<any>>{ status: error['httpStatus'] }
            };
        }

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
