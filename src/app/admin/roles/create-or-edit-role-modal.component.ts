/** Core imports */
import {
    AfterViewChecked,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Output,
    OnInit,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
CreateOrUpdateRoleInput,
GetRoleForEditOutput,
RoleEditDto,
RoleServiceProxy
} from '@shared/service-proxies/service-proxies';
import { PermissionTreeComponent } from '../shared/permission-tree.component';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'createOrEditRoleModal',
    templateUrl: './create-or-edit-role-modal.component.html'
})
export class CreateOrEditRoleModalComponent implements AfterViewChecked, OnInit {

    @ViewChild('roleNameInput') roleNameInput: ElementRef;
    @ViewChild('permissionTree') permissionTree: PermissionTreeComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    editData: GetRoleForEditOutput;
    role: RoleEditDto = new RoleEditDto();
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];
    constructor(
        private _roleService: RoleServiceProxy,
        private _dialogRef: MatDialogRef<CreateOrEditRoleModalComponent>,
        private _notifyService: NotifyService,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this._roleService.getRoleForEdit(this.data.roleId).subscribe(result => {
            this.role = result.role;
            this.data.title = this.role.id ? this.ls.l('EditRole') + ': ' + this.role.displayName : this.ls.l('CreateNewRole');
            this.editData = result;
            this._changeDetectorRef.detectChanges();
        });
    }

    ngAfterViewChecked(): void {
        //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
        $('tabset ul.nav').addClass('m-tabs-line');
        $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
    }

    save(): void {
        const input = new CreateOrUpdateRoleInput();
        input.role = this.role;
        input.grantedPermissionNames = this.permissionTree.getGrantedPermissionNames();
        this.saving = true;
        this._roleService.createOrUpdateRole(input)
            .pipe(finalize(() => this.saving = false))
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this._dialogRef.close();
    }
}
