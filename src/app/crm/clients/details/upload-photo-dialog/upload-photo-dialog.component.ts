import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, ElementRef, ViewChild } from '@angular/core';
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
export class UploadPhotoDialogComponent extends AppComponentBase {
    @ViewChild('cropper') cropper: ImageCropperComponent;

    imageData: any;
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

        this.cropperSettings = new CropperSettings();
        this.cropperSettings.width = 200;
        this.cropperSettings.height = 200;

        this.cropperSettings.croppedWidth = 200;
        this.cropperSettings.croppedHeight = 200;

        this.cropperSettings.canvasWidth = 500;
        this.cropperSettings.canvasHeight = 300;

        this.cropperSettings.minWidth = 115;
        this.cropperSettings.minHeight = 115;

        this.cropperSettings.rounded = false;
        this.cropperSettings.keepAspect = false;     
        this.cropperSettings.noFileInput = true;
        this.cropperSettings.minWithRelativeToResolution = false;

        this.cropperSettings.cropperDrawSettings.strokeColor = 'rgba(255,255,255,1)';
        this.cropperSettings.cropperDrawSettings.strokeWidth = 2;

        this.imageData = {};
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
        //!!VP Store Base64 -> this.imageData.image
    }
}
