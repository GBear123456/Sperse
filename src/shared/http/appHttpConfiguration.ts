import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AbpHttpConfiguration } from '@abp/abpHttpInterceptor';
import { MessageService } from '@abp/message/message.service';
import { LogService } from '@abp/log/log.service';

@Injectable()
export class AppHttpConfiguration extends AbpHttpConfiguration {
    avoidErrorHandling = false;
    constructor(
        _messageService: MessageService,
        _logService: LogService
    ) {
        super(_messageService, _logService);
        this.defaultError.details = AppConsts.defaultErrorMessage;
    }

    handleUnAuthorizedRequest(messagePromise: any, targetUrl?: string) {
        if (!targetUrl || targetUrl == '/')
            targetUrl = location.origin;        

        sessionStorage.setItem('redirectUrl', location.href);
        abp.multiTenancy.setTenantIdCookie();

        super.handleUnAuthorizedRequest(messagePromise, targetUrl);
    }

}