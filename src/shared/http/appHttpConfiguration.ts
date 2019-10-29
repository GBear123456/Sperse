import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AbpHttpConfiguration } from '@abp/abpHttpInterceptor';
import { MessageService } from '@abp/message/message.service';
import { LogService } from '@abp/log/log.service';

@Injectable()
export class AppHttpConfiguration extends AbpHttpConfiguration {
    avoidErrorHandling = false;
    constructor(
        messageService: MessageService,
        logService: LogService
    ) {
        super(messageService, logService);
        this.defaultError.details = AppConsts.defaultErrorMessage;
    }

    getTargetURL(value) {
        if (!value || value == '/')
            return location.origin;
        return value;
    }

    handleUnAuthorizedRequest(messagePromise: any, targetUrl?: string) {
        if (!targetUrl || targetUrl == '/')
            targetUrl = location.origin;

        sessionStorage.setItem('redirectUrl', location.href);
        abp.multiTenancy.setTenantIdCookie();

        super.handleUnAuthorizedRequest(messagePromise, this.getTargetURL(targetUrl));
    }
}
