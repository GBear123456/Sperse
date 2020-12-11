/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { CountryPhoneNumberModule } from '@shared/common/phone-numbers/country-phone-number.module';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';

/** Application imports */
import { CreateEntityDialogComponent } from './create-entity-dialog.component';
import { StaticListModule } from '@app/shared/common/static-list/static-list.module';
import { SourceContactListModule } from '@shared/common/source-contact-list/source-contact-list.module';
import { ModalDialogModule } from '@shared/common/dialogs/modal/modal-dialog.module';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { SimilarEntitiesDialogComponent } from './similar-entities-dialog/similar-entities-dialog.component';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import {
    ActivityServiceProxy,
    ContactCommunicationServiceProxy, ContactPhotoServiceProxy,
    ContactServiceProxy, LeadServiceProxy, OrderServiceProxy, OrganizationContactServiceProxy, PipelineServiceProxy
} from '@shared/service-proxies/service-proxies';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import { PipelineService } from '@app/shared/pipeline/pipeline.service';
import { AppStoreService } from '@app/store/app-store.service';
import { ListsModule } from '@app/shared/common/lists/lists.module';
import { RatingBarModule } from '@app/shared/common/rating-bar/rating-bar.module';
import { AddressFieldsComponent } from '@shared/common/create-entity-dialog/address-fields/address-fields.component';

@NgModule({
    imports: [
        CommonModule,
        DxContextMenuModule,
        DxButtonModule,
        DxToolbarModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxValidationGroupModule,
        DxValidatorModule,
        DxNumberBoxModule,
        DxTextAreaModule,
        DxDropDownBoxModule,
        DxListModule,
        DxScrollViewModule,
        DxDateBoxModule,
        MatDialogModule,
        MatTabsModule,
        MatSidenavModule,
        FormsModule,
        StaticListModule,
        SourceContactListModule,
        ModalDialogModule,
        CountryPhoneNumberModule,
        BankCodeLettersModule,
        ListsModule,
        RatingBarModule,
        GooglePlaceModule
    ],
    exports: [
        CreateEntityDialogComponent,
        SimilarEntitiesDialogComponent
    ],
    declarations: [
        CreateEntityDialogComponent,
        SimilarEntitiesDialogComponent,
        AddressFieldsComponent
    ],
    providers: [
        ContactsService,
        ContactServiceProxy,
        ContactCommunicationServiceProxy,
        DialogService,
        ContactPhotoServiceProxy,
        NameParserService,
        PipelineService,
        PipelineServiceProxy,
        LeadServiceProxy,
        OrderServiceProxy,
        ActivityServiceProxy,
        OrganizationContactServiceProxy,
        AppStoreService
    ],
    entryComponents: [
        CreateEntityDialogComponent,
        SimilarEntitiesDialogComponent
    ]
})
export class CreateEntityModule {}
