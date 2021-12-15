/** Core imports */
import {
    Component,
    ViewChild,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Inject
} from '@angular/core';

/** Third party imports */
import { of } from 'rxjs';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize, map, tap } from 'rxjs/operators';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    TenantHostServiceProxy, AddSslBindingInput, TenantSslCertificateServiceProxy,
    TenantSslCertificateInfo, UpdateSslBindingInput,
    CheckHostNameDnsMappingInput, TenantHostType
} from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { environment } from '@root/environments/environment';

@Component({
    selector: 'addOrEditSSLBindingModal',
    templateUrl: 'add-or-edit-ssl-binding-modal.component.html',
    styleUrls: ['add-or-edit-ssl-binding-modal.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantHostServiceProxy, TenantSslCertificateServiceProxy ]
})
export class AddOrEditSSLBindingModalComponent {
    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('DomainName') domainComponent: DxTextBoxComponent;
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;

    public readonly HostType_PlatformApp = TenantHostType.PlatformApp;

    saving = false;
    model: any;
    regexPatterns = AppConsts.regexPatterns;
    sslCertificates: TenantSslCertificateInfo[];
    editing = false;
    titleText = this.ls.l('AddSSLBinding');
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this),
            disabled: true
        }
    ];
    orgUnits: any[] = [{
        id: -1,
        displayName: this.ls.l('AllOrganizationUnits')
    }];

    envHost = {
        production: {
            ip: '52.165.168.40',
            host: 'sperseprodapiservice.azurewebsites.net'
        },
        development: {
            ip: '40.80.155.102',
            host: 'testsperseplatformapi.azurewebsites.net'
        },
        staging: {
            ip: '40.80.155.102',
            host: 'testsperseplatformapi.azurewebsites.net'
        },
        beta: {
            ip: '52.176.6.37',
            host: 'sperseapi.azurewebsites.net'
        }
    }[environment.releaseStage];

    constructor(
        private changeDetection: ChangeDetectorRef,
        private tenantHostService: TenantHostServiceProxy,
        private tenantSslCertificateService: TenantSslCertificateServiceProxy,
        private notify: NotifyService,
        public ls: AppLocalizationService,
        private dialogRef: MatDialogRef<AddOrEditSSLBindingModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (data.orgUnits && data.orgUnits.length)
            this.orgUnits = this.orgUnits.concat(data.orgUnits);

        this.editing = Boolean(data.item && data.item.id);
        if (this.editing) {
            this.model = new UpdateSslBindingInput({
                id: data.item.id,
                organizationUnitId: data.item.organizationUnitId || -1,
                sslCertificateId: data.item.sslCertificateId,
                isActive: data.item.isActive
            }); // ...data.item added a lot of no needed items
            this.titleText = this.ls.l('EditSSLBinding');
        } else {
            this.model = new AddSslBindingInput();
            this.model.organizationUnitId = -1;
            this.model.tenantHostType = data.hostTypes[0].id;
        }
        this.getTenantSslCertificates(data.item);
    }

    startLoading() {
        this.modalDialog && this.modalDialog.startLoading();
    }

    finishLoading() {
        this.modalDialog && this.modalDialog.finishLoading();
    }

    getTenantSslCertificates(data) {
        this.tenantSslCertificateService.getTenantSslCertificates()
            .subscribe(result => {
                this.sslCertificates = result;
                this.sslCertificates.unshift(new TenantSslCertificateInfo({
                    id: -1,
                    hostNames: this.ls.l('LetsEncrypt_FreeSSLCertificate'),
                    expiration: undefined,
                    thumbprint: undefined
                }));

                if (data) {
                    this.model.tenantHostType = <any>data.hostType;
                    this.model.domainName = data.hostName;
                    this.model.sslCertificateId = data.sslCertificateId || -1;
                } else
                    this.model.sslCertificateId = -1;

                this.changeDetection.markForCheck();
            });
    }

    save(): void {
        this.saving = true;
        this.startLoading();
        if (this.editing) {
            this.tenantHostService.updateSslBinding(new UpdateSslBindingInput({
                ...this.model,
                organizationUnitId: this.model.organizationUnitId == -1
                    ? null : this.model.organizationUnitId,
                sslCertificateId: this.model.sslCertificateId == -1
                    ? null : this.model.sslCertificateId
            })).pipe(finalize(() => {
                this.finishLoading();
                this.saving = false;
                this.changeDetection.detectChanges();
            })).subscribe(result => {
                this.closeSuccess();
            });
        } else {
            if (!this.domainComponent.instance.option('isValid'))
                return this.notify.error(this.ls.l('HostName_NotMapped'));

            this.tenantHostService.addSslBinding(new AddSslBindingInput({
                ...this.model,
                organizationUnitId: this.model.organizationUnitId == -1
                    ? null : this.model.organizationUnitId,
                sslCertificateId: this.model.sslCertificateId == -1
                    ? null : this.model.sslCertificateId
            })).pipe(finalize(() => {
                this.finishLoading();
                this.saving = false;
                this.changeDetection.detectChanges();
            })).subscribe(result => {
                this.closeSuccess();
            });
        }
        this.changeDetection.detectChanges();
    }

    close(success = false): void {
        this.dialogRef.close(success);
        this.changeDetection.markForCheck();
    }

    closeSuccess(): void {
        this.notify.info(this.ls.l('SavedSuccessfully'));
        this.close(true);
    }

    onHostTypeChanged() {
        if (this.model.tenantHostType != TenantHostType.PlatformApp)
            this.model.sslCertificateId = undefined;
        this.changeDetection.markForCheck();
    }

    checkHostNameDnsMapping = (data) => {
        return new Promise((approve, reject) => {
            (data.value && this.model.tenantHostType == TenantHostType.PlatformApp ?
                this.tenantHostService.checkHostNameDnsMapping(
                    new CheckHostNameDnsMappingInput({
                        tenantHostType: TenantHostType.PlatformApp,
                        hostName: data.value
                    })
                ).pipe(map(res => res.hostNameDnsMapped)) : of(true)
            ).pipe(tap(isValid => {
                this.buttons[0].disabled = !isValid;
                this.changeDetection.detectChanges();
            })).subscribe(approve, reject);
        });
    }

    onValueChanged(event) {
        this.buttons[0].disabled = true;
        this.changeDetection.detectChanges();
    }

    validate(event): boolean {
        if (event.validationGroup.validate().isValid) {
            event.component.option('disabled', true);
            return true;
        }
    }
}