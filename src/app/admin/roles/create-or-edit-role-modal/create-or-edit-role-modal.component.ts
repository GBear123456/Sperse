/** Core imports */
import {
    AfterViewChecked,
    Component,
    EventEmitter,
    Inject,
    Output,
    OnInit,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    CreateOrUpdateRoleInput,
    GetRoleForEditOutput,
    RoleEditDto,
    RoleServiceProxy
} from '@shared/service-proxies/service-proxies';
import { PermissionTreeComponent } from '../../shared/permission-tree.component';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'createOrEditRoleModal',
    templateUrl: './create-or-edit-role-modal.component.html'
})
export class CreateOrEditRoleModalComponent implements AfterViewChecked, OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild('permissionTree') permissionTree: PermissionTreeComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    editData: GetRoleForEditOutput;
    role: RoleEditDto = new RoleEditDto();
    title: string;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];
    constructor(
        private roleService: RoleServiceProxy,
        private dialogRef: MatDialogRef<CreateOrEditRoleModalComponent>,
        private notifyService: NotifyService,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.roleService.getRoleForEdit(this.data.roleId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(result => {
                this.role = result.role;
                this.title = this.role.id ? this.ls.l('EditRole') + ': ' + this.role.displayName : this.ls.l('CreateNewRole');
                this.editData = result;
                this.changeDetectorRef.detectChanges();
            });
    }

    ngAfterViewChecked(): void {
        //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
        $('tabset ul.nav').addClass('m-tabs-line');
        $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
    }

    save(): void {
        this.modalDialog.startLoading();
        const input = new CreateOrUpdateRoleInput();
        input.role = this.role;
        input.grantedPermissionNames = this.permissionTree.getGrantedPermissionNames();
        this.roleService.createOrUpdateRole(input)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this.dialogRef.close();
    }
}
