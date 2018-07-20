import { Injectable, Injector  } from '@angular/core';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { InstanceServiceProxy, UserServiceProxy, ActivateUserForContactInput,
    SetupInput, TenantHostType } from '@shared/service-proxies/service-proxies';

@Injectable()
export class ClientService {
    private permission: PermissionCheckerService;
    private feature: FeatureCheckerService;
    private instanceServiceProxy: InstanceServiceProxy;
    private userServiceProxy: UserServiceProxy;

    constructor(injector: Injector) {
        this.permission = injector.get(PermissionCheckerService);
        this.feature = injector.get(FeatureCheckerService);
        this.instanceServiceProxy = injector.get(InstanceServiceProxy);
        this.userServiceProxy = injector.get(UserServiceProxy);
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
}
