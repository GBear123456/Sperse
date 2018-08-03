import { Injectable, Injector  } from '@angular/core';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { NotifyService } from '@abp/notify/notify.service';
import { MessageService } from '@abp/message/message.service';
import { CustomerType } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InstanceServiceProxy, UserServiceProxy, ActivateUserForContactInput, SetupInput, TenantHostType,
    GetUserInstanceInfoOutputStatus, CustomersServiceProxy, UpdateCustomerStatusesInput } from '@shared/service-proxies/service-proxies';

@Injectable()
export class ClientService {
    private permission: PermissionCheckerService;
    private feature: FeatureCheckerService;
    private instanceServiceProxy: InstanceServiceProxy;
    private userServiceProxy: UserServiceProxy;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    private message: MessageService;
    private customersServiceProxy: CustomersServiceProxy;

    private crmLocalizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

    constructor(injector: Injector) {
        this.permission = injector.get(PermissionCheckerService);
        this.feature = injector.get(FeatureCheckerService);
        this.instanceServiceProxy = injector.get(InstanceServiceProxy);
        this.userServiceProxy = injector.get(UserServiceProxy);
        this.notify = injector.get(NotifyService);
        this.appLocalizationService = injector.get(AppLocalizationService);
        this.message = injector.get(MessageService);
        this.customersServiceProxy = injector.get(CustomersServiceProxy);
    }

    canSendVerificationRequest() {
        return this.feature.isEnabled('CFO.Partner') &&
            this.permission.isGranted('Pages.CRM.ActivateUserForContact') &&
            this.permission.isGranted('Pages.CFO.ClientActivation');
    }

    requestVerification(contactId: number) {
        abp.message.confirm(
            'Please confirm user activation',
            (isConfirmed) => {
                if (isConfirmed) {
                    let request = new ActivateUserForContactInput();
                    request.contactId = contactId;
                    request.tenantHostType = <any>TenantHostType.PlatformUi;
                    this.userServiceProxy.activateUserForContact(request).subscribe(result => {
                        let setupInput = new SetupInput({ userId: result.userId });
                        this.instanceServiceProxy.setupAndGrantPermissionsForUser(setupInput).subscribe(result => {
                            abp.notify.info('User was activated and email sent successfully');
                        });
                    });
                }
            }
        );
    }

    redirectToCFO(userId) {
        this.instanceServiceProxy.getUserInstanceInfo(userId).subscribe(result => {
            if (result && result.id && (result.status === GetUserInstanceInfoOutputStatus.Active))
                window.open(abp.appPath + 'app/cfo/' + result.id + '/start');
            else
                this.notify.error(this.appLocalizationService.ls(this.crmLocalizationSourceName, 'CFOInstanceInactive'));
        });
    }

    isCFOAvailable(userId) {
        return ((userId != null) && this.checkCFOClientAccessPermission());
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

    private checkCFOClientAccessPermission() {
        return this.permission.isGranted('Pages.CFO.ClientInstanceAdmin');
    }
}
