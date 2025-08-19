/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { ApiRoutingModule } from './api-routing.module';
import { SwaggerComponent } from './swagger/swagger.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { LeftMenuComponent } from './shared/left-menu/left-menu.component';
import { ApiLeftMenuComponent } from './shared/left-menu/api-left-menu/api-left-menu.component';
import { EditKeyDialog } from '@app/api/introduction/add-key-dialog/add-key-dialog.component';
import { ApiWelcomeComponent } from './introduction/api-welcome/api-welcome.component';
import { LeftMenuService } from '../cfo/shared/common/left-menu/left-menu.service';

@NgModule({
  imports: [
    CommonModule,
    ApiRoutingModule,
    ngCommon.CommonModule,
    AppCommonModule,
    DxTextAreaModule,
    DxSelectBoxModule,
    DxDataGridModule,
    DxTextBoxModule,
    DxDateBoxModule,
    DxValidatorModule,
    DxValidationGroupModule,
    DxTooltipModule,
    DxScrollViewModule,
    MatDialogModule,
  ],
  declarations: [
    SwaggerComponent,
    IntroductionComponent,
    LeftMenuComponent,
    EditKeyDialog,
    ApiWelcomeComponent,
    ApiLeftMenuComponent,
  ],
  entryComponents: [EditKeyDialog],
  providers: [LeftMenuService, { provide: 'leftMenuCollapsed', useValue: AppConsts.isMobile }],
})
export class ApiModule {}
