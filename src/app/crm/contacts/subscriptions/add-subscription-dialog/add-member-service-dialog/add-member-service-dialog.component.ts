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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/** Application imports */
import {
    MemberServiceServiceProxy,
    MemberServiceDto,
    MemberServiceLevelDto,
    FlatFeatureDto,
    SystemTypeDto
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { FeatureTreeComponent } from '@app/shared/features/feature-tree.component';
import { FeatureTreeEditModel, FeatureValuesDto } from '@app/shared/features/feature-tree-edit.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { DxValidationGroupComponent } from 'devextreme-angular';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { LoadingService } from '@shared/common/loading-service/loading.service';

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
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    @ViewChild(FeatureTreeComponent) featureTree: FeatureTreeComponent;

    today = new Date();
    private slider: any;
    memberService: MemberServiceDto;
    systemTypes: string[];
    featuresData: FeatureTreeEditModel;
    title: string;
    isReadOnly = true;

    constructor(
        private elementRef: ElementRef,
        private memberServiceProxy: MemberServiceServiceProxy,
        private notify: NotifyService,
        private changeDetection: ChangeDetectorRef,
        private loadingService: LoadingService,
        public dialogRef: MatDialogRef<AddMemberServiceDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClosed().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '75px',
                right: '-100vw'
            });
        });

        if (data && data.service)
            this.memberService = data.service;
        else
            this.memberService = new MemberServiceDto();

        this.isReadOnly = data && !!data.isReadOnly;
        this.title = ls.l(this.isReadOnly ? 'Service' : this.memberService.id ? 'EditService' : 'AddService');
        
        this.memberServiceProxy.getSystemTypes().subscribe((types: SystemTypeDto[]) => {
            this.systemTypes = types.map(type => type.code);
            if (data && data.service)
                this.onSystemTypeChanged({ value: data.service.systemType });
            else {
                this.memberService.systemType = this.systemTypes[0];
                this.detectChanges();
            }
        });

        if (!this.memberService.memberServiceLevels)
            this.memberService.memberServiceLevels = [];
        if (!this.memberService.features)
            this.memberService.features = {};
    }

    onSystemTypeChanged(event) {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.memberServiceProxy.getSystemFeatures(
            event.value
        ).subscribe((features: FlatFeatureDto[]) => {
            this.featuresData = {
                features: features,
                featureValues: features.map(feature => new FeatureValuesDto({
                    name: feature.name,
                    value: this.memberService.features[feature.name] || feature.defaultValue
                }))
            };

            this.loadingService.finishLoading(this.elementRef.nativeElement);
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
        this.dialogRef.updateSize(undefined, 'calc(100vh - 75px)');
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
            this.memberService.memberServiceLevels.forEach(level => {
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

            const featureValues = this.featureTree.getGrantedFeatures();
            if (!this.featureTree.areAllValuesValid()) {
                this.notify.warn(this.ls.l('InvalidFeaturesWarning'));
                return;
            }
            if (ArrayHelper.dataChanged(this.featureTree.initialGrantedFeatures, featureValues)) {
                featureValues.forEach((feature, index) => {
                    if (feature.value == this.featuresData.features[index].defaultValue || feature.value == '')
                        this.memberService.features[feature.name] = undefined;
                    else if (feature.value != null && feature.value != undefined)
                        this.memberService.features[feature.name] = feature.value;
                });
            }

            this.loadingService.startLoading(this.elementRef.nativeElement);
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
                this.loadingService.finishLoading(this.elementRef.nativeElement);
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
        this.memberService.memberServiceLevels.push(level);
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

        let featuresConfig: FlatFeatureDto[] = serviceLevel['currentFeaturesConfig'] || this.featuresData.features;
        serviceLevel['featureValues'].forEach((val: FeatureValuesDto) => {
            let featureConfig: FlatFeatureDto = featuresConfig.find(v => v.name == val.name);
            if (!featureConfig || featureConfig.inputType.name == 'CHECKBOX')
                return val;

            if (val.value == featureConfig.defaultValue) {
                let serviceValue = this.featuresData.featureValues.find(v => v.name == val.name);
                val.value = serviceValue ? serviceValue.value : featureConfig.defaultValue;
            }

            return val;
        })
        let features = this.featuresData.features.map((feature, index) => {
            return {
                ...feature,
                defaultValue: this.featuresData.featureValues[index].value
                    || feature.defaultValue
            };
        });
        serviceLevel['currentFeaturesConfig'] = features;

        return {
            features: features,
            featureValues: serviceLevel['featureValues']
        };
    }

    removeLevelFields(index) {
        this.memberService.memberServiceLevels.splice(index, 1);
    }

    detectChanges() {
        this.changeDetection.detectChanges();
    }
}