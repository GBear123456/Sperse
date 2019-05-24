import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { filter } from 'rxjs/operators';
import { AppComponentBase } from '@shared/common/app-component-base';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UserServiceProxy, GetUserForEditOutput, UpdateUserPictureInput } from '@shared/service-proxies/service-proxies';
import { StringHelper } from '@shared/helpers/StringHelper';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'details-header',
    templateUrl: './details-header.component.html',
    styleUrls: ['./details-header.component.less']
})
export class DetailsHeaderComponent extends AppComponentBase implements OnInit {
    @Output() onUpdate: EventEmitter<any> = new EventEmitter();

    data: GetUserForEditOutput;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _userService: UserServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.data = this._userService['data'];
    }

    showUploadPhotoDialog(event) {
        this.dialog.open(UploadPhotoDialogComponent, {
            data: {
                source: this.data['photo'],
                maxSizeBytes: AppConsts.maxImageSize
            },
            hasBackdrop: true
        }).afterClosed()
            .pipe(filter(result => result))
            .subscribe(result => {
                if (result.clearPhoto) {
                    this._userService.clearUserPicture(this.data['userId'])
                        .subscribe(() => {
                            this.handlePictureChange(null, null);
                        });
                } else if (result.origImage) {
                    this._userService.updateUserPicture(UpdateUserPictureInput.fromJS({
                        userId: this.data['userId'],
                        image: StringHelper.getBase64(result.origImage),
                        imageThumbnail: StringHelper.getBase64(result.imageThumbnail),
                        source: result.source
                    })).subscribe((thumbnailId) => {
                        this.handlePictureChange(result.origImage, thumbnailId);
                    });
                }
            });
        event.stopPropagation();
    }

    private handlePictureChange(origImage: string, thumbnailId: string) {
        this.data['photo'] = origImage;

        if (this.data['userId'] == abp.session.userId)
            abp.event.trigger('profilePictureChanged', thumbnailId);
    }
}
