import { Injectable, Injector  } from '@angular/core';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { NotifyService } from '@abp/notify/notify.service';
import { MessageService } from '@abp/message/message.service';
import { ContactGroupType } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ContactGroupServiceProxy, UpdateContactGroupStatusesInput } from '@shared/service-proxies/service-proxies';

@Injectable()
export class ClientService {
    private permission: PermissionCheckerService;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    private message: MessageService;
    private contactGroupServiceProxy: ContactGroupServiceProxy;

    private crmLocalizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

    constructor(injector: Injector) {
        this.permission = injector.get(PermissionCheckerService);
        this.notify = injector.get(NotifyService);
        this.appLocalizationService = injector.get(AppLocalizationService);
        this.message = injector.get(MessageService);
        this.contactGroupServiceProxy = injector.get(ContactGroupServiceProxy);
    }

    updateContactGroupStatuses(contactGroupIds: number[], typeId: string, statusId: string, callback: (() => void)) {
        if (this.permission.isGranted('Pages.CRM.BulkUpdates')) {
            if (contactGroupIds && contactGroupIds.length) {
                this.showUpdateContactGroupStatusConfirmationDialog(contactGroupIds, typeId, statusId, callback);
            } else {
                this.message.warn(this.appLocalizationService.ls(this.crmLocalizationSourceName, 'NoRecordsToUpdate'));
            }
        }
    }

    private showUpdateContactGroupStatusConfirmationDialog(contactGroupIds: number[], typeId: string, statusId: string, callback: (() => void)) {
        let customerType = typeId == ContactGroupType.Partner ? 'Partner' : 'Client';
        this.message.confirm(
            this.appLocalizationService.ls(this.crmLocalizationSourceName, `${customerType}sUpdateStatusWarningMessage`),
            this.appLocalizationService.ls(this.crmLocalizationSourceName, `${customerType}StatusUpdateConfirmationTitle`),
            isConfirmed => {
                if (isConfirmed)
                    this.updateContactGroupStatusesInternal(contactGroupIds, statusId, callback);
            }
        );
    }

    private updateContactGroupStatusesInternal(contactGroupIds: number[], statusId: string, callback: (() => void)) {
        this.contactGroupServiceProxy.updateContactGroupStatuses(new UpdateContactGroupStatusesInput({
            contactGroupIds: contactGroupIds,
            statusId: statusId
        })).subscribe(() => {
            this.notify.success(this.appLocalizationService.ls(this.crmLocalizationSourceName, 'StatusSuccessfullyUpdated'));
            callback();
        });
    }
}
