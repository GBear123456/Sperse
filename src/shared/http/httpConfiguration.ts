import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { Observable } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';

import { AbpHttpConfiguration } from '@abp/abpHttpInterceptor';
import { MessageService } from '@abp/message/message.service';
import { LogService } from '@abp/log/log.service';
import { throwError } from 'rxjs';

@Injectable()
export class httpConfiguration extends AbpHttpConfiguration {

    constructor(
        _messageService: MessageService,
        _logService: LogService
    ) {
        super(_messageService, _logService);

        this.defaultError.details = AppConsts.defaultErrorMessage;
    }

    handleUnAuthorizedRequest(messagePromise: any, targetUrl?: string) {
        sessionStorage.setItem('redirectUrl', location.href);
        abp.multiTenancy.setTenantIdCookie();

        super.handleUnAuthorizedRequest(messagePromise, targetUrl);
    }

    handleError(error: any): Observable<any> {
        if (error['httpStatus'])
          error = <Response>{
              status: error['httpStatus']
          };

        let ajaxResponse = this.getAbpAjaxResponseOrNull(error);
        if (ajaxResponse != null) {
            this.handleAbpResponse(error, ajaxResponse);
            return throwError(ajaxResponse.error);
        } else {
            this.handleNonAbpErrorResponse(error);
            return throwError('HTTP error: ' + error.status + ', ' + error.statusText);
        }
    }

}
