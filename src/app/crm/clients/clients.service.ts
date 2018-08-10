import { Injectable, Injector  } from '@angular/core';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { NotifyService } from '@abp/notify/notify.service';
import { MessageService } from '@abp/message/message.service';
import { CustomerType } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CustomersServiceProxy, UpdateCustomerStatusesInput } from '@shared/service-proxies/service-proxies';

@Injectable()
export class ClientService {
    private permission: PermissionCheckerService;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    private message: MessageService;
    private customersServiceProxy: CustomersServiceProxy;

    private crmLocalizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

    constructor(injector: Injector) {
        this.permission = injector.get(PermissionCheckerService);
        this.notify = injector.get(NotifyService);
        this.appLocalizationService = injector.get(AppLocalizationService);
        this.message = injector.get(MessageService);
        this.customersServiceProxy = injector.get(CustomersServiceProxy);
    }

    updateCustomerStatuses(customerIds: number[], customerTypeId: string, statusId: string, callback: (() => void)) {
        if (this.permission.isGranted('Pages.CRM.BulkUpdates')) {
            if (customerIds && customerIds.length) {
                this.showUpdateCustomerStatusConfirmationDialog(customerIds, customerTypeId, statusId, callback);
            } else {
                this.message.warn(this.appLocalizationService.ls(this.crmLocalizationSourceName, 'NoRecordsToUpdate'));
            }
        }
    }

    private showUpdateCustomerStatusConfirmationDialog(customerIds: number[], customerTypeId: string, statusId: string, callback: (() => void)) {
        let customerType = customerTypeId == CustomerType.Partner ? 'Partner' : 'Client';
        this.message.confirm(
            this.appLocalizationService.ls(this.crmLocalizationSourceName, `${customerType}sUpdateStatusWarningMessage`),
            this.appLocalizationService.ls(this.crmLocalizationSourceName, `${customerType}StatusUpdateConfirmationTitle`),
            isConfirmed => {
                if (isConfirmed)
                    this.updateCustomerStatusesInternal(customerIds, statusId, callback);
            }
        );
    }

    private updateCustomerStatusesInternal(customerIds: number[], statusId: string, callback: (() => void)) {
        this.customersServiceProxy.updateCustomerStatuses(new UpdateCustomerStatusesInput({
            customerIds: customerIds,
            statusId: statusId
        })).subscribe(() => {
            this.notify.success(this.appLocalizationService.ls(this.crmLocalizationSourceName, 'StatusSuccessfullyUpdated'));
            callback();
        });
    }
}
