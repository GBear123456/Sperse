import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SocialDialogComponent, SocialLinkData } from '../components/social-dialog/social-dialog.component';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocialDialogService {

  constructor(private dialog: MatDialog) { }

  openSocialDialog(data?: SocialLinkData, config?: MatDialogConfig): Observable<SocialLinkData | undefined> {
    const dialogConfig: MatDialogConfig = {
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
      data: data || {},
      ...config
    };

    const dialogRef = this.dialog.open(SocialDialogComponent, dialogConfig);
    return dialogRef.afterClosed();
  }

  openSocialDialogForEdit(socialLink: SocialLinkData): Observable<SocialLinkData | undefined> {
    return this.openSocialDialog(socialLink);
  }

  openSocialDialogForCreate(): Observable<SocialLinkData | undefined> {
    return this.openSocialDialog();
  }
}
