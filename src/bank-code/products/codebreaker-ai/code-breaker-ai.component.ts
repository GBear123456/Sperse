import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

@Component({
    selector: 'code-breaker-ai',
    templateUrl: 'code-breaker-ai.component.html',
    styleUrls: ['./code-breaker-ai.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeBreakerAiComponent {
    hasCrmCustomersPermission: boolean = this.permissionChecker.isGranted(AppPermissions.CRMCustomers);
    offerId = 718;

    constructor(private permissionChecker: PermissionCheckerService) {}
}
