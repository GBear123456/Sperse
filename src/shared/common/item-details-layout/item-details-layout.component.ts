import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  HostListener,
  HostBinding,
  ChangeDetectorRef,
} from '@angular/core';
import { Params } from '@angular/router';
import { NavLink } from '@app/crm/contacts/nav-link.model';
import { Observable, of } from 'rxjs';
import { ThemeService } from '@app/shared/services/theme.service';
@Component({
  selector: 'item-details-layout',
  templateUrl: './item-details-layout.component.html',
  styleUrls: ['../styles/close-button.less', './item-details-layout.component.less'],
})
export class ItemDetailsLayoutComponent implements OnInit {
  @Input() navLinks: NavLink[];
  @Input() queryParams: Params;
  @Input() rightPanelOpened: boolean;
  @Input() rightPanelWidth: string;
  @HostBinding('class.modern') @Input() showModernLayout: boolean;
  @Output() onClose: EventEmitter<null> = new EventEmitter<null>();
  @Output() onChanged: EventEmitter<NavLink> = new EventEmitter<NavLink>();
  isDark$: Observable<boolean>;
  isDarkMode: boolean = false;

  constructor(private themeService: ThemeService, private changeDetectorRef: ChangeDetectorRef) {
    this.isDark$ = this.themeService.isDarkTheme$;
  }

  rightSideVisible;
  @HostListener('window:resize') onResize() {
    this.rightSideVisible = innerWidth > 1200;
  }

  ngOnInit() {
    this.onResize();
    this.isDark$.subscribe(val => {
      this.isDarkMode = val;
      this.changeDetectorRef.detectChanges();
    });
  }

  close() {
    this.onClose.emit();
  }

  getIconPath(iconName: string): string {
    const suffix = this.isDarkMode ? '-dark' : '';
    return `./assets/common/icons/${iconName}${suffix}.svg`;
  }

  isVisible(link: NavLink): Observable<boolean> {
    return link.visible$ === undefined || link.disabled ? of(!link.disabled) : link.visible$;
  }

  getLabel(link: NavLink): Observable<string> {
    return link.label$ ? link.label$ : of(link.label);
  }

  navChanged(navLink: NavLink) {
    this.onChanged.emit(navLink);
  }
}
