/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ActivationEnd } from '@angular/router';

/** Third party libraries **/
 import { MatDialog } from '@angular/material';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { UserServiceProxy, ProfileServiceProxy, GetUserForEditOutput, CreateOrUpdateUserInput, TenantHostType, UpdateUserPermissionsInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { OperationsWidgetComponent } from './operations-widget.component';
import { PermissionTreeComponent } from './permission-tree/permission-tree.component';

@Component({
    selector: 'user-details',
    templateUrl: './user-details.component.html',
    styleUrls: ['./user-details.component.less']
})
export class UserDetailsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(OperationsWidgetComponent) toolbarComponent: OperationsWidgetComponent;
    @ViewChild('permissionTree') permissionTree: PermissionTreeComponent;

    userId: number;
    userData: GetUserForEditOutput = new GetUserForEditOutput();
    rightPanelOpened = true;

    navLinks = [
        { 'label': 'Contact Information', 'route': 'information' },
        { 'label': this.l('LoginAttempts'), 'route': 'login-attemps' }
    ];

    private rootComponent: any;
    private referrerParams;

    private readonly LOCAL_STORAGE = 0;

    constructor(injector: Injector,
        private _router: Router,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _userService: UserServiceProxy,
        private _profileService: ProfileServiceProxy) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.rootComponent = this.getRootComponent();
        _userService['data'] = { user: null, roles: null };
        this._route.params
            .subscribe(params => {
                this.userId = params['userId'];
                this.startLoading(true);
                forkJoin(
                    this._userService.getUserForEdit(this.userId),
                    this._userService.getUserPermissionsForEdit(this.userId)
                ).pipe(finalize(() => this.finishLoading(true)))
                    .subscribe(([userEditOutput, permissionsOutput]) => {
                        //user
                        this._userService['data'].user = userEditOutput.user;
                        userEditOutput.user['setRandomPassword'] = false;
                        userEditOutput.user['sendActivationEmail'] = false;
                        this._userService['data'].roles = userEditOutput.roles;
                        this.userData = userEditOutput;

                        this.setProfilePicture(userEditOutput.profilePictureId);

                        //permissions
                        this.permissionTree.setPermissionsData(permissionsOutput);
                    });
            });

        let optionTimeout = null;
        this._router.events.subscribe((event) => {
            if (event instanceof ActivationEnd && !optionTimeout)
                optionTimeout = setTimeout(() => {
                    optionTimeout = null;
                    let data = event.snapshot.data;
                    this.rightPanelOpened = data.hasOwnProperty(
                        'rightPanelOpened') ? data.rightPanelOpened : true;
                });
        });
    }

    setProfilePicture(profilePictureId: string) {
        if (!profilePictureId) {
            this._userService['data'].photo = null;
        } else {
            this._profileService.getProfilePictureById(profilePictureId).subscribe(result => {
                if (result && result.profilePicture) {
                    this._userService['data'].photo = 'data:image/jpeg;base64,' + result.profilePicture;
                }
            });
        }
    }

    close() {
        this._dialog.closeAll();
        this._router.navigate(['app/admin/users']);
    }

    ngOnInit() {
        this.rootComponent.overflowHidden(true);
        this.rootComponent.pageHeaderFixed();
    }

    ngOnDestroy() {
        this._dialog.closeAll();
        this.rootComponent.overflowHidden();
        this.rootComponent.pageHeaderFixed(true);
    }

    delete() {
        if (this.userData.user.userName === AppConsts.userManagement.defaultAdminUserName) {
            this.message.warn(this.l('{0}UserCannotBeDeleted', AppConsts.userManagement.defaultAdminUserName));
            return;
        }

        this.message.confirm(
            this.l('UserDeleteWarningMessage', this.userData.user.userName),
            (isConfirmed) => {
                if (isConfirmed) {
                    this.startLoading(true);
                    this._userService.deleteUser(this.userData.user.id)
                        .pipe(finalize(() => this.finishLoading(true)))
                        .subscribe(() => {
                            this.close();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }

    update() {
        let userInput = new CreateOrUpdateUserInput();
        userInput.user = this.userData.user;
        userInput.setRandomPassword = this.userData.user['setRandomPassword'];
        userInput.sendActivationEmail = this.userData.user['sendActivationEmail'];
        userInput.assignedRoleNames =
            _.map(
                _.filter(this.userData.roles, { isAssigned: true }), role => role.roleName
            );
        userInput.tenantHostType = <any>TenantHostType.PlatformUi;

        //input.organizationUnits = this.organizationUnitTree.getSelectedOrganizations();
        let permissionsInput = new UpdateUserPermissionsInput();
        permissionsInput.id = this.userId;
        permissionsInput.grantedPermissionNames = this.permissionTree.getGrantedPermissionNames();


        this.startLoading(true);
        this._userService.createOrUpdateUser(userInput)
            .subscribe(() => {
                this.startLoading(true);
                this._userService.updateUserPermissions(permissionsInput)
                    .pipe(finalize(() => this.finishLoading(true)))
                    .subscribe(() => {
                        this.close();
                        this.notify.info(this.l('SavedSuccessfully'));
                    });
            }, undefined, () => this.finishLoading(true));
    }
}
