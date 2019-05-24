import { AfterViewChecked, Component, ElementRef, EventEmitter, Injector, Output, OnInit, ViewChild } from '@angular/core';
import {
    CreateOrUpdateRoleInput,
    GetRoleForEditOutput,
    RoleEditDto,
    RoleServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import { PermissionTreeComponent } from '../shared/permission-tree.component';
import { finalize } from 'rxjs/operators';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';

@Component({
    selector: 'createOrEditRoleModal',
    templateUrl: './create-or-edit-role-modal.component.html'
})
export class CreateOrEditRoleModalComponent extends AppModalDialogComponent implements AfterViewChecked, OnInit {

    @ViewChild('roleNameInput') roleNameInput: ElementRef;
    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('permissionTree') permissionTree: PermissionTreeComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    editData: GetRoleForEditOutput;
    role: RoleEditDto = new RoleEditDto();
    constructor(
        injector: Injector,
        private _roleService: RoleServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data.buttons = [
            {
                title: this.l('Save'),
                class: 'primary',
                action: this.save.bind(this)
            }
        ];
        this._roleService.getRoleForEdit(this.data.roleId).subscribe(result => {
            this.role = result.role;
            this.data.title = this.role.id ? this.l('EditRole') + ': ' + this.role.displayName : this.l('CreateNewRole');
            this.editData = result;
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
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this.dialogRef.close();
    }
}
