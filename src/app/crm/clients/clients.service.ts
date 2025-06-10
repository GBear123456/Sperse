import { Injectable, Injector  } from '@angular/core';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { NotifyService } from 'abp-ng2-module';
import { MessageService } from 'abp-ng2-module';
import { ContactGroup, ContactStatus } from '@root/shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ContactServiceProxy, UpdateContactStatusesInput } from '@shared/service-proxies/service-proxies';
import { AppPermissions} from '@shared/AppPermissions';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import invert from 'lodash/invert';

@Injectable()
export class ClientService {
    private permission: AppPermissionService;
    private notify: NotifyService;
    private appLocalizationService: AppLocalizationService;
    private message: MessageService;
    private contactServiceProxy: ContactServiceProxy;
    private crmLocalizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    private ls: AppLocalizationService;

    constructor(injector: Injector) {
        this.permission = injector.get(AppPermissionService);
        this.notify = injector.get(NotifyService);
        this.appLocalizationService = injector.get(AppLocalizationService);
        this.message = injector.get(MessageService);
        this.contactServiceProxy = injector.get(ContactServiceProxy);
        this.ls = injector.get(AppLocalizationService);
    }

    updateContactStatuses(contactIds: number[], groupId: string, isActive: boolean, callback: (() => void)) {
        if (this.permission.isGranted(AppPermissions.CRMBulkUpdates)) {
            if (contactIds && contactIds.length) {
                this.showUpdateContactStatusConfirmationDialog(contactIds, groupId, isActive, callback);
            } else {
                this.message.warn(this.appLocalizationService.ls(this.crmLocalizationSourceName, 'NoRecordsToUpdate'));
            }
        }
    }
    private showUpdateContactStatusConfirmationDialog(contactIds: number[], groupId: string, isActive: boolean, callback: (() => void)) {
        let contactGroup = invert(ContactGroup)[groupId];
        ContactsHelper.showConfirmMessage(
            this.appLocalizationService.ls(this.crmLocalizationSourceName, `${contactGroup}StatusUpdateConfirmationTitle`),
            (isConfirmed: boolean, [ notifyUsers, processLeads ]: boolean[]) => {
                if (isConfirmed)
                    this.updateContactStatusesInternal(contactIds, groupId, isActive, callback, notifyUsers, processLeads);
            },
            [
                { text: this.ls.l('SendCancellationEmailPlural'), visible: !isActive, checked: false },
                { text: this.ls.l('FinalizeLeadIfNotCompleted'), visible: isActive, checked: true }
            ],
            this.appLocalizationService.ls(this.crmLocalizationSourceName, `${contactGroup}sUpdateStatusWarningMessage`)
        );
    }

    private updateContactStatusesInternal(contactIds: number[], groupId: string, isActive: boolean, callback: (() => void), notifyUsers: boolean, processLeads: boolean) {
        this.contactServiceProxy.updateContactStatuses(new UpdateContactStatusesInput({
            contactIds: contactIds,
            groupId: groupId,
            notifyUsers: notifyUsers,
            isActive: isActive,
            processLeads: processLeads
        })).subscribe(() => {
            this.notify.success(this.appLocalizationService.ls(this.crmLocalizationSourceName, 'StatusSuccessfullyUpdated'));
            callback();
        });
    }
}