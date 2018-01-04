import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { AbpHttpConfiguration } from '@abp/abpHttp';

@Injectable()
export class httpConfiguration extends AbpHttpConfiguration {

    handleUnAuthorizedRequest(messagePromise: any, targetUrl?: string) {
        sessionStorage.setItem('redirectUrl', location.href);

        super.handleUnAuthorizedRequest(messagePromise, targetUrl);
    }

    handleError(error: any): Observable<any> {
        if (error['httpStatus'])
          error = <Response>{ 
              status: error['httpStatus']
          };

        return super.handleError(error);
    }

}