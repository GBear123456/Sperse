import { AppConsts } from '@shared/AppConsts';
import { Component, Inject, Injector, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { AppComponentBase } from '../../app-component-base';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'modal-dialog',
  templateUrl: 'modal-dialog.component.html',
  styleUrls: ['modal-dialog.component.less']
})
export class ModalDialogComponent extends AppComponentBase implements OnInit, AfterViewInit {
  private elementRef: ElementRef;
  private slider: any;
  public data: any;
  public dialogRef: MatDialogRef<ModalDialogComponent>;

  constructor(
    injector: Injector
  ) {
    super(injector);

    this.data = injector.get(MAT_DIALOG_DATA);
    this.elementRef = injector.get(ElementRef);
    this.dialogRef = injector.get(MatDialogRef);

    this.localizationSourceName = this.data.localization;
  }

  private fork(callback, timeout = 0) {
      setTimeout(callback.bind(this), timeout);
  }

  ngOnInit() {
      this.dialogRef.disableClose = true;
      this.slider = this.elementRef.nativeElement.closest('.slider');
      if (this.slider) {
          this.slider.classList.add('hide');
          this.dialogRef.updateSize(undefined, '100vh');
          this.dialogRef.updatePosition({
              right: '-100vw'
          });
      }
  }

  ngAfterViewInit() {
      if (this.slider)
          this.fork(() => {
              this.slider.classList.remove('hide');
              this.fork(() => {
                  this.dialogRef.updatePosition({
                      right: '0px'
                  });
              }, 100);
          });
  }

  close(slide: boolean = false, closeData = null) {
      if (slide) {
          this.dialogRef.updatePosition({
              right: '-100vw'
          });
          this.fork(() => {
              this.dialogRef.close(closeData);
          }, 300);
      } else
          this.dialogRef.close(closeData);
  }
}
