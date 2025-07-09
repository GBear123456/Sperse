import {
    Component,
    ElementRef,
    Injector,
    OnInit,
    ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { AppService } from "@app/app.service";
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
import { DxScrollViewComponent } from 'devextreme-angular';

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
    @ViewChild(DxScrollViewComponent, { static: false }) scrollView: DxScrollViewComponent;


    contactDropdownDataSource: DataSource;

    contacts = [];
    contactIds: number[] = [];
    currentContactId: number = 0; // Current contact's ID

    subscription: Subscription;

    constructor(
        injector: Injector,
        private router: Router,
        private appService: AppService
    ) {
        super(injector);
        appService.clientDetailsChange.subscribe((res) => {
            if (res === "clientNavigate") this.loadContact();
        });
    }

    ngOnInit(): void {
        this.loadContact();
    }

    loadContact() {
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
            const segments = this.getSegment;
            if (segments.indexOf("company") < 0) {
                const contact = this.getContact(routeId);
                if (contact[this.clientFields.OrganizationId])
                    this.navigateToContact(routeId);
            }
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
        const contact = this.getContact(contactId);
        let segments = this.getSegment;
        const contactIndex = segments.indexOf("contact");
        if (contactIndex !== -1 && segments.length > contactIndex + 1) {
            segments[contactIndex + 1] = contactId.toString();
        }
        if (contact[this.clientFields.OrganizationId]) {
            const companyIdIndex = segments.indexOf("company");
            if (companyIdIndex < 0) {
                segments = [
                    ...segments.slice(0, contactIndex + 2),
                    "company",
                    contact[this.clientFields.OrganizationId]?.toString(),
                    ...segments.slice(contactIndex + 3),
                ];
            } else {
                segments[companyIdIndex + 1] =
                    contact[this.clientFields.OrganizationId]?.toString();
            }
        } else {
            const companyIdIndex = segments.indexOf("company");
            if (companyIdIndex >= 0) {
                segments = [
                    ...segments.slice(0, contactIndex + 2),
                    ...segments.slice(companyIdIndex + 2),
                ];
            }
        }
        this.navigate(segments);
        this.currentContactId = contactId;
        this.onClose();
    }

    get getSegment() {
        const urlTree = this.router.parseUrl(this.router.url);
        return urlTree.root.children["primary"].segments.map((s) => s.path);
    }
    navigate(segments) {
        const urlTree = this.router.parseUrl(this.router.url);
        this.router.navigate(["/", ...segments], {
            queryParams: urlTree.queryParams,
        });
    }

    getContact(contactId) {
        return this.contacts.find((m) => m[this.clientFields.Id] === contactId);
    }

    toggleDropdown() {
        this.isDropdownVisible = !this.isDropdownVisible;
        // if (this.isDropdownVisible) {
            this.scrollToSelectedClient();
        // }
    }

    scrollToSelectedClient() {
        setTimeout(() => {
        if (!this.scrollView || !this.currentContactId) return;

            const dropdownElement = this.scrollView.instance.content();
            const selectedItem = dropdownElement.querySelector('.dropdown-item.selectedItem') as HTMLElement; // Type assertion
            console.log(selectedItem);
            if (selectedItem) {
                const scrollTop = selectedItem.offsetTop - (dropdownElement.clientHeight / 2);
                console.log(selectedItem);
                this.scrollView.instance.scrollTo(scrollTop);
            }
        }, 150);
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
