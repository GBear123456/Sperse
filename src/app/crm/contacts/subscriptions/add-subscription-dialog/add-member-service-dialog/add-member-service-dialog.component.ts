/** Core imports */
import {
    AfterViewInit,
    Component,
    ElementRef,
    Inject,
    OnInit,
    ViewChild,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

/** Application imports */
import {
    InvoiceSettings,
    MemberServiceServiceProxy,
    MemberServiceDto,
    MemberServiceLevelDto,
    LayoutType
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { DxValidationGroupComponent } from 'devextreme-angular';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';

@Component({
    selector: 'add-member-service-dialog',
    templateUrl: './add-member-service-dialog.component.html',
    styleUrls: [
        '../../../../../../shared/common/styles/close-button.less',
        '../../../../../shared/common/styles/form.less',
        './add-member-service-dialog.component.less'
    ],
    providers: [MemberServiceServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddMemberServiceDialogComponent implements AfterViewInit, OnInit {
    @ViewChild(DxValidationGroupComponent, { static: false }) validationGroup: DxValidationGroupComponent;
    today = new Date();
    private slider: any;
    memberService: MemberServiceDto;
    amountFormat$: Observable<string> = this.invoicesService.settings$.pipe(
        filter(Boolean), map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,##0.##')
    );

    constructor(
        private elementRef: ElementRef,
        private memberServiceProxy: MemberServiceServiceProxy,
        private notify: NotifyService,
        private invoicesService: InvoicesService,
        private changeDetection: ChangeDetectorRef,
        private userManagementService: UserManagementService,
        public dialogRef: MatDialogRef<AddMemberServiceDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '75px',
                right: '-100vw'
            });
        });

        this.memberService = new MemberServiceDto();
        this.memberService.systemType = this.userManagementService.isLayout(LayoutType.BankCode) ? 'BANKCODE' : 'General';
        this.memberService.memberServiceLevels = [];
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '75px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        this.slider.classList.remove('hide');
        this.dialogRef.updateSize(undefined, '100vh');
            this.dialogRef.updatePosition({
                top: '75px',
                right: '0px'
            });
    }

    saveService() {
        if (this.validationGroup.instance.validate().isValid) {
            if (this.memberService.activationTime)
                this.memberService.activationTime = DateHelper.removeTimezoneOffset(new Date(this.memberService.activationTime), true, 'from');
            if (this.memberService.deactivationTime)
                this.memberService.deactivationTime = DateHelper.removeTimezoneOffset(new Date(this.memberService.deactivationTime), true, 'to');
            this.memberService.memberServiceLevels.map(level => {
                if (level.activationTime)
                    level.activationTime = DateHelper.removeTimezoneOffset(new Date(level.activationTime), true, 'from');
                if (level.deactivationTime)
                    level.deactivationTime = DateHelper.removeTimezoneOffset(new Date(level.deactivationTime), true, 'to');
            });

            this.memberServiceProxy.createOrUpdate(this.memberService).subscribe(res => {
                if (!this.memberService.id)
                    this.memberService.id = res.id;
                this.memberService.memberServiceLevels.forEach(level => {
                    res.memberServiceLevels.some(item => {
                        if (level.code == item.code) {
                            level.id = item.id;
                            return true;
                        }
                    });
                });
                this.dialogRef.close(this.memberService);
                this.notify.info(this.ls.l('SavedSuccessfully'));
            });
        }
    }

    close() {
        this.dialogRef.close();
    }

    addNewLevelFields() {
        this.memberService.memberServiceLevels.push(
            new MemberServiceLevelDto()
        );
    }

    removeLevelFields(index) {
        this.memberService.memberServiceLevels.splice(index, 1);
    }

    detectChanges() {
        this.changeDetection.detectChanges();
    }
}
