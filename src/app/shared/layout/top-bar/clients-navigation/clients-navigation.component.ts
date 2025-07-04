import {
    Component,
    ElementRef,
    Injector,
    OnInit,
    ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { ClientFields } from "@app/crm/clients/client-fields.enum";
import { ContactDto } from "@app/crm/clients/contact.dto";
import { LifecycleSubjectsService } from "@root/shared/common/lifecycle-subjects/lifecycle-subjects.service";
import { AppConsts } from "@shared/AppConsts";
import { ContactGroup } from "@shared/AppEnums";
import { AppComponentBase } from "@shared/common/app-component-base";
import { KeysEnum } from "@shared/common/keys.enum/keys.enum";
import DataSource from "devextreme/data/data_source";
import ODataStore from "devextreme/data/odata/store";
import { Subscription } from "rxjs";

@Component({
    selector: "clients-navigation",
    templateUrl: "./clients-navigation.component.html",
    styleUrls: ["./clients-navigation.component.less"],
    providers: [LifecycleSubjectsService],
})
export class ClientsNavigationComponent
    extends AppComponentBase
    implements OnInit
{
    readonly clientFields: KeysEnum<ContactDto> = ClientFields;
    isDropdownVisible = false;
    @ViewChild("dropdownBtn", { static: false }) dropdownBtn: ElementRef;

    contactDropdownDataSource: DataSource;

    contacts = [];
    contactIds: number[] = [];
    currentContactId: number = 0; // Current contact's ID

    subscription: Subscription;

    constructor(injector: Injector, private router: Router) {
        super(injector);
    }

    ngOnInit(): void {
        this.contactDropdownDataSource = new DataSource({
            store: new ODataStore({
                key: this.clientFields.Id,
                url: this.getODataUrl("Contact"),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.params.contactGroupId = ContactGroup.Client;
                    request.headers["Authorization"] =
                        "Bearer " + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
            }),
            paginate: false,
        });

        this.contactDropdownDataSource.load().then((contacts: any[]) => {
            this.contacts = contacts;
            this.contactIds = contacts.map((c) => c[this.clientFields.Id]);

            const routeId = +this.router.url
                .split("/")
                .find((part) => /^\d+$/.test(part));
            this.currentContactId = routeId;
        });
    }

    goToPrevClient() {
        const idx = this.contactIds.indexOf(this.currentContactId);
        if (idx > 0) {
            const prevId = this.contactIds[idx - 1];
            this.navigateToContact(prevId);
        }
    }

    goToNextClient() {
        const idx = this.contactIds.indexOf(this.currentContactId);
        if (idx < this.contactIds.length - 1 && idx !== -1) {
            const nextId = this.contactIds[idx + 1];
            this.navigateToContact(nextId);
        }
    }

    navigateToContact(contactId: number) {
        const urlTree = this.router.parseUrl(this.router.url);
        const segments = urlTree.root.children["primary"].segments.map(
            (s) => s.path
        );

        const contactIndex = segments.indexOf("contact");
        if (contactIndex !== -1 && segments.length > contactIndex + 1) {
            segments[contactIndex + 1] = contactId.toString();
        }

        this.router.navigate(["/", ...segments], {
            queryParams: urlTree.queryParams,
        });
        this.currentContactId = contactId;
        this.onClose();
    }

    toggleDropdown() {
        this.isDropdownVisible = !this.isDropdownVisible;
    }

    onClose() {
        this.isDropdownVisible = false;
    }
    getPhotoSrc(contact): string {
        const photoPublicId = contact[this.clientFields.PhotoPublicId];

        return photoPublicId
            ? this.profileService.getContactPhotoUrl(photoPublicId)
            : this.profileService.getPhoto(contact.thumbnail);
    }
}
