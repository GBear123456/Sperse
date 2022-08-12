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

/** Third party imports */
import { NotifyService } from 'abp-ng2-module';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';

/** Application imports */
import {
    CouponServiceProxy,
    CreateCouponInput,
    UpdateCouponInput,
    CouponDiscountType,
    CouponDiscountDuration
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { DxValidationGroupComponent } from '@root/node_modules/devextreme-angular';

@Component({
    selector: 'add-coupon-dialog',
    templateUrl: './add-coupon-dialog.component.html',
    styleUrls: [
        '../../../../shared/common/styles/close-button.less',
        '../../../shared/common/styles/form.less',
        './add-coupon-dialog.component.less'
    ],
    providers: [CouponServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCouponDialogComponent implements AfterViewInit, OnInit {
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    private slider: any;
    coupon: CreateCouponInput | UpdateCouponInput;

    types: string[] = Object.keys(CouponDiscountType);
    durations: string[] = Object.keys(CouponDiscountDuration);
    typesEnum = CouponDiscountType;
    title: string;
    isAlreadyUsed = false;
    isReadOnly = true;

    constructor(
        private elementRef: ElementRef,
        private couponProxy: CouponServiceProxy,
        private notify: NotifyService,
        private changeDetection: ChangeDetectorRef,
        public dialogRef: MatDialogRef<AddCouponDialogComponent>,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClosed().subscribe(() => {
            this.dialogRef.updatePosition({
                top: this.data.fullHeigth ? '0px' : '75px',
                right: '-100vw'
            });
        });

        this.isReadOnly = !!data.isReadOnly;
        this.title = ls.l(this.isReadOnly ? 'Coupon' : data.coupon ? 'EditCoupon' : 'AddCoupon');
        if (data.coupon && data.coupon.id) {
            this.isAlreadyUsed = data.coupon.isAlreadyUsed;
            this.coupon = new UpdateCouponInput(data.coupon);
        } else {
            this.coupon = new CreateCouponInput();
            this.coupon.type = CouponDiscountType.Fixed;
            this.coupon.activationDate = new Date();
        }
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: this.data.fullHeigth ? '0px' : '75px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        this.slider.classList.remove('hide');
        this.dialogRef.updateSize(undefined, this.data.fullHeigth ? '100vh' : 'calc(100vh - 75px)');
            this.dialogRef.updatePosition({
                top: this.data.fullHeigth ? '0px' : '75px',
                right: '0px'
            });
    }

    saveCoupon() {
        this.isReadOnly = true;
        if (this.validationGroup.instance.validate().isValid) {
            let obs: Observable<any> = this.coupon instanceof UpdateCouponInput ?
                this.couponProxy.updateCoupon(this.coupon) :
                this.couponProxy.createCoupon(this.coupon);

            obs.pipe(finalize(() => {
                this.isReadOnly = false;
                this.changeDetection.detectChanges();
            })).subscribe(() => {
                this.notify.info(this.ls.l('SavedSuccessfully'));
                this.dialogRef.close(true);
            });
        }
    }

    close() {
        this.dialogRef.close();
    }
}