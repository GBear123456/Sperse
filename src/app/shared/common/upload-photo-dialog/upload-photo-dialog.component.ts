import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ImageCropperComponent, CropperSettings, Bounds } from 'ng2-img-cropper';
import { StringHelper } from '@shared/helpers/StringHelper';

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

    private thumbData: string;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private elementRef: ElementRef,
        public dialogRef: MatDialogRef<UploadPhotoDialogComponent>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.cropperSettings = this.getCropperSetting();
    }

    ngAfterViewInit() {
        if (this.data.source) {
            let image: any = new Image();
            image.src = this.data.source;
            this.cropper.setImage(image);
        } else {
            let ctx = this.cropper.cropcanvas.nativeElement.getContext("2d");
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0,0,500,300);
        }
    }

    getCropperSetting() {
        let setting = new CropperSettings();
        setting.width = 200;
        setting.height = 200;
        setting.croppedWidth = 100;
        setting.croppedHeight = 100;
        setting.canvasWidth = 500;
        setting.canvasHeight = 300;
        setting.minWidth = 115;
        setting.minHeight = 115;
        setting.rounded = false;
        setting.keepAspect = false;
        setting.noFileInput = true;
        setting.preserveSize = true;
        setting.minWithRelativeToResolution = true;
        setting.cropperDrawSettings.strokeColor = 'rgba(255,255,255,1)';
        setting.cropperDrawSettings.strokeWidth = 2;
        setting.cropperClass = "cropper-canvas";

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

    imgResize = function () {
        let image = new Image(),
            canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");

        image.onload = () => {
            canvas.width = AppConsts.thumbWidth;
            canvas.height = canvas.width * (this.croppedHeight / this.croppedWidth);

            let oc = document.createElement('canvas'),
                octx = oc.getContext('2d');

            oc.width = image.width * 0.9;
            oc.height = image.height * 0.9;
            octx.drawImage(image, 0, 0, oc.width, oc.height);

            octx.drawImage(oc, 0, 0, oc.width * 0.9, oc.height * 0.9);

            ctx.drawImage(oc, 0, 0,
                oc.width * 0.9, oc.height * 0.9,
                0, 0, canvas.width, canvas.height);

            this.thumbData = canvas.toDataURL();
        };
        image.src = this.imageData.image;
    }

    mouseDown(e) {}

    onCrop(bounds: Bounds) {
        this.croppedHeight = bounds.bottom-bounds.top;
        this.croppedWidth = bounds.right-bounds.left;

        this.imgResize();
    }

    onSave(event) {
        if (this.data.maxSizeBytes && this.imageData.image) {
            var fileBytes = window.atob(StringHelper.getBase64(this.imageData.image)).length;
            if (fileBytes > this.data.maxSizeBytes) {
                abp.message.error(this.l('ProfilePicture_Warn_SizeLimit', (this.data.maxSizeBytes / 1048576).toFixed(2)));
                return;
            }
        }

        this.dialogRef.close({
            origImage: this.imageData.image,
            thumImage: this.thumbData
        });
    }
}
