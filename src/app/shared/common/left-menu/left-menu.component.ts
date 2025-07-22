/** Core imports */
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostBinding,
  AfterViewInit,
  Output,
  OnDestroy,
  OnInit,
  EventEmitter
} from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Subject, Observable, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { LeftMenuItem } from './left-menu-item.interface';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';

@Component({
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.less'],
  selector: 'left-menu',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeftMenuComponent implements AfterViewInit, OnDestroy, OnInit {
  @HostBinding('class.collapsed') @Input() collapsed = AppConsts.isMobile;
  @HostBinding('class.mobile') mobile: boolean = AppConsts.isMobile;
  @HostBinding('style.visibility') visibility = 'hidden';
  @HostBinding('class.fullscreen') public isFullscreenMode;
  @Input() selectedItemIndex: number;
  @Input() items: LeftMenuItem[] = [];
  @Input() headerTitle: string;
  @Input() headerLink;
  @Input() navigatePrefix = '';
  @Output() onItemClick: EventEmitter<LeftMenuItem> = new EventEmitter();
  @Output() collapsedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  private destroy: Subject<null> = new Subject<null>();
  private destroy$: Observable<null> = new Observable<null>();

  constructor(
      private changeDetectorRef: ChangeDetectorRef,
      private router: Router,
      private leftMenuService: LeftMenuService,
      private fullScreenService: FullScreenService
  ) {}

  ngOnInit() {
      this.leftMenuService.collapsed$
          .pipe(takeUntil(this.destroy$))
          .subscribe((collapsed: boolean) => {
              this.collapsed = collapsed;
              this.collapsedChange.emit(collapsed);
              this.changeDetectorRef.markForCheck();
          });
      this.fullScreenService.isFullScreenMode$
          .pipe(takeUntil(this.destroy$))
          .subscribe((isFullScreenMode: boolean) => {
              this.isFullscreenMode = isFullScreenMode;
              this.changeDetectorRef.markForCheck();
          });
  }

  ngAfterViewInit() {
      setTimeout(() => {
          this.visibility = 'visible';
          this.changeDetectorRef.markForCheck();
      }, 1000);
  }

  setSelectedIndex(index: number) {
      this.selectedItemIndex = index;
      this.changeDetectorRef.detectChanges();
  }

  onClick(event, elem: LeftMenuItem) {
      if (!elem.disabled) {
          if (elem.onClick) {
              this.selectedItemIndex = this.items.findIndex((item: LeftMenuItem) => item === elem);
              elem.onClick(elem);
              this.changeDetectorRef.detectChanges();
          } else if (elem.component) {
              this.router.navigate([ this.navigatePrefix + elem.component ]);
          }
      }
  }

  addButtonClick(e, elem: LeftMenuItem) {
      this.router.navigate(
          [ this.navigatePrefix + elem.component ],
          { queryParams: { action: 'addNew' }}
      );
      e.stopPropagation();
  }

  itemIsVisible(item: LeftMenuItem): Observable<boolean> {
      return item.visible instanceof Observable ? item.visible : of(!item.hasOwnProperty('visible') || item.visible);
  }

  ngOnDestroy() {
      this.destroy.next();
  }
}
