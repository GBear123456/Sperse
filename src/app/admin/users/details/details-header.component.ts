import { Component, OnInit, Injector, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';

import { AppComponentBase } from '@shared/common/app-component-base';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UserServiceProxy, GetUserForEditOutput, UpdateUserPictureInput } from '@shared/service-proxies/service-proxies';
import { StringHelper } from '@shared/helpers/StringHelper';

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
                maxSizeBytes: 5242880
            },
            hasBackdrop: true
        }).afterClosed().subscribe(result => {
            if (result && result.origImage) {
                this._userService.updateUserPicture(UpdateUserPictureInput.fromJS({
                    userId: this.data['userId'],
                    image: StringHelper.getBase64(result.origImage),
                    imageThumbnail: StringHelper.getBase64(result.imageThumbnail)
                })).subscribe((thumbnailId) => {
                    this.data['photo'] = result.origImage;

                    if (this.data['userId'] == abp.session.userId)
                        abp.event.trigger('profilePictureChanged', thumbnailId);
                });
            }
        });
        event.stopPropagation();
    }
}
