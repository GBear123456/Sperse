import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styles: [
    `
      .theme-toggle {
        all: unset;
        background: none;
        border: none;
        cursor: pointer;
        transition: transform 0.3s ease;
        display: block;
        color: var(--text-color);
        width: 50px;
        height: 25px;
      }
      .theme-toggle:hover {
        transform: scale(1.1);
      }
    `,
  ],
})
export class ThemeToggleComponent implements OnInit {
  isDark$: Observable<boolean>;

  constructor(private themeService: ThemeService) {
    this.isDark$ = this.themeService.isDarkTheme$;
  }

  ngOnInit() {}

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
