import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { AppConsts } from '@shared/AppConsts';
import { AbpHttpConfigurationService } from 'abp-ng2-module';
import { MessageService } from 'abp-ng2-module';
import { LogService } from 'abp-ng2-module';

@Injectable()
export class AppHttpConfiguration extends AbpHttpConfigurationService {
    avoidErrorHandling = false;
    private readonly avoidErrorHandlingKeys = [
        'CRM/Dashboard/GetContactsByCompanySize',
        'CRM/Dashboard/GetRecentlyCreatedLeads',
        'CRM/Dashboard/GetContactAndLeadStats',
        'CRM/Dashboard/GetContactsByRegion',
        'Platform/User/GetUserCount',
        'CRM/Dashboard/GetTotals',
        'odata/SubscriptionSlice',
        'odata/OrderCount'
    ];

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

    handleNonAbpErrorResponse(response: HttpResponse<any>) {
        if ([401, 403, 404].indexOf(response.status) >= 0) {
            super.handleNonAbpErrorResponse(response);
        } else {
            this.showError(response.body);
        }
    }
}