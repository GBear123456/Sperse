import { Component, Injector } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';

@Component({
    templateUrl: './access-denied.component.html',
    styleUrls: ['./access-denied.component.less'],
})
export class AccessDeniedComponent extends AppComponentBase {
    constructor(injector: Injector,
        public appService: AppService
    ) {
        super(injector);
    }
}
