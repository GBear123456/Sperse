import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ImageCropperComponent, CropperSettings, Bounds } from 'ng2-img-cropper';

import * as _ from 'underscore';

import {
  ContactPhoneServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'upload-photo-dialog',
  templateUrl: 'upload-photo-dialog.html',
  styleUrls: ['upload-photo-dialog.less']
})
export class UploadPhotoDialogComponent extends AppComponentBase implements AfterViewInit {
    @ViewChild('cropper') cropper: ImageCropperComponent;

    imageData: any = {};
    cropperSettings: CropperSettings;

    croppedWidth: number;
    croppedHeight: number;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private elementRef: ElementRef,
        public dialogRef: MatDialogRef<UploadPhotoDialogComponent>,
        private _contactPhoneService: ContactPhoneServiceProxy,
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.cropperSettings = this.getCropperSetting();        
    }

    ngAfterViewInit() {
        if (this.data.source) {
            let image: any = new Image();
            image.src = this.data.source;
            this.cropper.setImage(image);
        }
    }

    getCropperSetting() {
        let setting = new CropperSettings();
        setting.width = 200;
        setting.height = 200;
        setting.croppedWidth = 200;
        setting.croppedHeight = 200;
        setting.canvasWidth = 500;
        setting.canvasHeight = 300;
        setting.minWidth = 115;
        setting.minHeight = 115;
        setting.rounded = false;
        setting.keepAspect = false;
        setting.noFileInput = true;
        setting.minWithRelativeToResolution = false;
        setting.cropperDrawSettings.strokeColor = 'rgba(255,255,255,1)';
        setting.cropperDrawSettings.strokeWidth = 2;

        return setting;
    }

    fileChangeListener($event) {
        let image: any = new Image();
        let file: File = $event.target.files[0];
        let myReader: FileReader = new FileReader();

        myReader.onloadend = (loadEvent: any) => {
            image.src = loadEvent.target.result;
            this.cropper.setImage(image);
        };

        myReader.readAsDataURL(file);
    }

    onCrop(bounds: Bounds) {
        this.croppedHeight = bounds.bottom-bounds.top;
        this.croppedWidth = bounds.right-bounds.left;
    }

    onSave(event) {
        this.dialogRef.close(this.imageData.image);
    }
}
