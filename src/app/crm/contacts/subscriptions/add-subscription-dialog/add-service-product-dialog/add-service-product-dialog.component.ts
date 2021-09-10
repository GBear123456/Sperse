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
    FlatFeatureDto,
    SystemTypeDto,
    NameValueDto,
    LayoutType
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { FeatureTreeEditModel, FeatureValuesDto } from '@app/shared/features/feature-tree-edit.model';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { DxValidationGroupComponent } from 'devextreme-angular';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';

@Component({
    selector: 'add-service-product-dialog',
    templateUrl: './add-service-product-dialog.component.html',
    styleUrls: [
        '../../../../../../shared/common/styles/close-button.less',
        '../../../../../shared/common/styles/form.less',
        './add-service-product-dialog.component.less'
    ],
    providers: [MemberServiceServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddServiceProductDialogComponent implements AfterViewInit, OnInit {
    @ViewChild(DxValidationGroupComponent, { static: false }) validationGroup: DxValidationGroupComponent;
    today = new Date();
    private slider: any;
    serviceProduct: MemberServiceDto;
    amountFormat$: Observable<string> = this.invoicesService.settings$.pipe(
        filter(Boolean), map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,##0.##')
    );
    systemTypes: string[];
    featuresData: FeatureTreeEditModel;

    constructor(
        private elementRef: ElementRef,
        private serviceProductProxy: MemberServiceServiceProxy,
        private notify: NotifyService,
        private invoicesService: InvoicesService,
        private changeDetection: ChangeDetectorRef,
        private userManagementService: UserManagementService,
        public dialogRef: MatDialogRef<AddServiceProductDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '75px',
                right: '-100vw'
            });
        });        

        this.serviceProductProxy.getSystemTypes().subscribe((types: SystemTypeDto[]) => {
            this.systemTypes = types.map(type => type.code);
            if (data && data.service)
                this.onSystemTypeChanged({value: data.service.systemType});
            else {
                this.serviceProduct.systemType = this.systemTypes[0];
                this.detectChanges();
            }
        });

        if (data && data.service)
            this.serviceProduct = data.service;
        else
            this.serviceProduct = new MemberServiceDto();

        if (!this.serviceProduct.memberServiceLevels)
            this.serviceProduct.memberServiceLevels = [];
        if (!this.serviceProduct.features)
            this.serviceProduct.features = {};
    }

    onSystemTypeChanged(event) {
        this.serviceProductProxy.getSystemFeatures(
            event.value
        ).subscribe((features: FlatFeatureDto[]) => {
            this.featuresData = {
                features: features,
                featureValues: features.map(feature => new FeatureValuesDto({
                    name: feature.name,
                    value: this.serviceProduct.features[feature.name] || feature.defaultValue
                }))
            };
            this.detectChanges();
        });        
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
            if (this.serviceProduct.activationTime)
                this.serviceProduct.activationTime = DateHelper.removeTimezoneOffset(new Date(this.serviceProduct.activationTime), true, 'from');
            if (this.serviceProduct.deactivationTime)
                this.serviceProduct.deactivationTime = DateHelper.removeTimezoneOffset(new Date(this.serviceProduct.deactivationTime), true, 'to');
            this.serviceProduct.memberServiceLevels.forEach(level => {
                level['featureValues'].forEach((feature, index) => {
                    if (feature.value == this.featuresData.featureValues[index].value || feature.value == '')
                        level.features[feature.name] = undefined;
                    else if (feature.value != null && feature.value != undefined) 
                        level.features[feature.name] = feature.value;
                });
                if (level.activationTime)
                    level.activationTime = DateHelper.removeTimezoneOffset(new Date(level.activationTime), true, 'from');
                if (level.deactivationTime)
                    level.deactivationTime = DateHelper.removeTimezoneOffset(new Date(level.deactivationTime), true, 'to');
            });

            this.featuresData.featureValues.forEach((feature, index) => {
                if (feature.value == this.featuresData.features[index].defaultValue || feature.value == '')
                    this.serviceProduct.features[feature.name] = undefined;                
                else if (feature.value != null && feature.value != undefined) 
                    this.serviceProduct.features[feature.name] = feature.value;
            });
            this.serviceProductProxy.createOrUpdate(this.serviceProduct).subscribe(res => {
                if (!this.serviceProduct.id)
                    this.serviceProduct.id = res.id;
                this.serviceProduct.memberServiceLevels.forEach(level => {
                    res.memberServiceLevels.some(item => {
                        if (level.code == item.code) {
                            level.id = item.id;
                            return true;
                        }
                    });
                });
                this.dialogRef.close(this.serviceProduct);
                this.notify.info(this.ls.l('SavedSuccessfully'));
            });
        }
    }

    close() {
        this.dialogRef.close();
    }

    addNewLevelFields() {
        let level = new MemberServiceLevelDto();
        level.features = {};
        this.defineFeatureLevelValues(level);
        this.serviceProduct.memberServiceLevels.push(level);
    }

    defineFeatureLevelValues(level) {
        if (this.featuresData) {
            let features = this.featuresData.features;
            level['featureValues'] = features.map(
                (feature, index) => new FeatureValuesDto({
                    name: feature.name,
                    value: level.features[feature.name] || 
                        this.featuresData.featureValues[index].value
                })
            );
        }
    }

    getServiceLevelFeatures(serviceLevel) {
        if (!this.featuresData)
            return undefined;

        if (!serviceLevel['featureValues'])
            this.defineFeatureLevelValues(serviceLevel);

        return {
            features: this.featuresData.features.map((feature, index) => {
                return {
                    ...feature,
                    defaultValue: this.featuresData.featureValues[index].value
                        || feature.defaultValue
                };
            }),
            featureValues: serviceLevel['featureValues']
        };
    }

    removeLevelFields(index) {
        this.serviceProduct.memberServiceLevels.splice(index, 1);
    }

    detectChanges() {
        this.changeDetection.detectChanges();
    }
}