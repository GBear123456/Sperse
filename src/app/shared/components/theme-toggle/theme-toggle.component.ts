import { Component, OnInit } from "@angular/core";
import { ThemeService } from "../../services/theme.service";
import { Observable } from "rxjs";

@Component({
    selector: "app-theme-toggle",
    template: `
        <button
            class="theme-toggle"
            (click)="toggleTheme()"
            [title]="
                (isDark$ | async)
                    ? 'Switch to light theme'
                    : 'Switch to dark theme'
            "
        >
            <ng-container *ngIf="!(isDark$ | async)">
                <lucide-icon name="sun"></lucide-icon>
            </ng-container>
            <ng-container *ngIf="isDark$ | async">
                <lucide-icon name="moon"></lucide-icon>
            </ng-container>
        </button>
    `,
    styles: [
        `
            .theme-toggle {
                background: none;
                border: none;
                padding: 8px;
                cursor: pointer;
                transition: transform 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-color);
            }
            .theme-toggle:hover {
                transform: scale(1.1);
            }
            :host {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            :host ::ng-deep lucide-icon {
                width: 24px;
                height: 24px;
                display: block;
            }
            :host ::ng-deep lucide-icon svg {
                width: 100%;
                height: 100%;
                color: currentColor;
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
