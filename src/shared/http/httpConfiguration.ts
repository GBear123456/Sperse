import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { AppConsts } from '@shared/AppConsts';

import { AbpHttpConfiguration } from '@abp/abpHttp';
import { MessageService } from '@abp/message/message.service';
import { LogService } from '@abp/log/log.service';

@Injectable()
export class httpConfiguration extends AbpHttpConfiguration {

    constructor(
        _messageService: MessageService,
        _logService: LogService) {
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

        return super.handleError(error);
    }

}
