import { Component, Input, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Router, ActivatedRoute, ActivationEnd } from '@angular/router';
import { MatDialog } from '@angular/material';
import { OperationsWidgetComponent } from './operations-widget.component';
import { UserServiceProxy, ProfileServiceProxy, GetUserForEditOutput, CreateOrUpdateUserInput, TenantHostType } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
    selector: 'user-details',
    templateUrl: './user-details.component.html',
    styleUrls: ['./user-details.component.less']
})
export class UserDetailsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(OperationsWidgetComponent) toolbarComponent: OperationsWidgetComponent;

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
                this._userService.getUserForEdit(this.userId)
                    .finally(() => this.finishLoading(true))
                    .subscribe((result) => {
                        this._userService['data'].user = result.user;
                        result.user['setRandomPassword'] = false;
                        result.user['sendActivationEmail'] = false;
                        this._userService['data'].roles = result.roles;
                        this.userData = result;

                        this.setProfilePicture(result.profilePictureId);
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
                        .finally(() => this.finishLoading(true))
                        .subscribe(() => {
                            this.close();
                            this.notify.success(this.l('SuccessfullyDeleted'));
                        });
                }
            }
        );
    }

    update() {
        let input = new CreateOrUpdateUserInput();

        input.user = this.userData.user;
        input.setRandomPassword = this.userData.user['setRandomPassword'];
        input.sendActivationEmail = this.userData.user['sendActivationEmail'];
        input.assignedRoleNames =
            _.map(
                _.filter(this.userData.roles, { isAssigned: true }), role => role.roleName
            );

        //input.organizationUnits = this.organizationUnitTree.getSelectedOrganizations();

        this.startLoading(true);
        input.tenantHostType = <any>TenantHostType.PlatformUi;
        this._userService.createOrUpdateUser(input)
            .finally(() => this.finishLoading(true))
            .subscribe(() => {
                this.close();
                this.notify.info(this.l('SavedSuccessfully'));
            });
    }
}
