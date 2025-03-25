import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ChevronRight, CircleUser } from 'lucide-angular'

@Component({
    selector: 'main-menu-item',
    templateUrl: './main-menu-item.component.html',
    styleUrls: ['./main-menu-item.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainMenuItemComponent extends AppComponentBase {
    readonly ArrowIcon = ChevronRight;
    readonly UserIcon = CircleUser;

    @Input() item: any;
    @Input() isActive: boolean;
    @Input() isDarkMode: boolean;
    @Input() handleMainItemClick: () => void;

    constructor(injector: Injector) {
        super(injector);
    }
}
