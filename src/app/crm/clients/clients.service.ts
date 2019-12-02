import { Injectable, Injector  } from '@angular/core';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { NotifyService } from '@abp/notify/notify.service';
import { MessageService } from '@abp/message/message.service';
import { ContactGroup } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ContactServiceProxy, UpdateContactStatusesInput } from '@shared/service-proxies/service-proxies';
import { AppPermissions} from '@shared/AppPermissions';

@Injectable()
export class ClientService {
    private permission: AppPermissionService;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    private message: MessageService;
    private contactServiceProxy: ContactServiceProxy;
    private crmLocalizationSourceName = AppConsts.localization.CRMLocalizationSourceName;

    constructor(injector: Injector) {
        this.permission = injector.get(AppPermissionService);
        this.notify = injector.get(NotifyService);
        this.appLocalizationService = injector.get(AppLocalizationService);
        this.message = injector.get(MessageService);
        this.contactServiceProxy = injector.get(ContactServiceProxy);
    }

    updateContactStatuses(contactIds: number[], groupId: string, statusId: string, callback: (() => void)) {
        if (this.permission.isGranted(AppPermissions.CRMBulkUpdates)) {
            if (contactIds && contactIds.length) {
                this.showUpdateContactStatusConfirmationDialog(contactIds, groupId, statusId, callback);
            } else {
                this.message.warn(this.appLocalizationService.ls(this.crmLocalizationSourceName, 'NoRecordsToUpdate'));
            }
        }
    }
    private showUpdateContactStatusConfirmationDialog(contactIds: number[], groupId: string, statusId: string, callback: (() => void)) {
        let contactGroup = groupId == ContactGroup.Partner ? 'Partner' : 'Client';
        this.message.confirm(
            this.appLocalizationService.ls(this.crmLocalizationSourceName, `${contactGroup}sUpdateStatusWarningMessage`),
            this.appLocalizationService.ls(this.crmLocalizationSourceName, `${contactGroup}StatusUpdateConfirmationTitle`),
            isConfirmed => {
                if (isConfirmed)
                    this.updateContactStatusesInternal(contactIds, statusId, callback);
            }
        );
    }

    private updateContactStatusesInternal(contactIds: number[], statusId: string, callback: (() => void)) {
        this.contactServiceProxy.updateContactStatuses(new UpdateContactStatusesInput({
            contactIds: contactIds,
            statusId: statusId
        })).subscribe(() => {
            this.notify.success(this.appLocalizationService.ls(this.crmLocalizationSourceName, 'StatusSuccessfullyUpdated'));
            callback();
        });
    }
}
