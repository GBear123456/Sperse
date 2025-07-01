/** Core imports */
import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    Output,
    Renderer2,
    SimpleChanges,
    ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";

/** Third party imports */
import { Observable } from "rxjs";
import { takeUntil } from "rxjs/operators";
import invert from "lodash/invert";
import startCase from "lodash/startCase";

/** Application imports */
import { TagsListComponent } from "@app/shared/common/lists/tags-list/tags-list.component";
import { ListsListComponent } from "@app/shared/common/lists/lists-list/lists-list.component";
import { TypesListComponent } from "@app/shared/common/lists/types-list/types-list.component";
import { UserAssignmentComponent } from "@app/shared/common/lists/user-assignment-list/user-assignment-list.component";
import { RatingComponent } from "@app/shared/common/lists/rating/rating.component";
import { StarsListComponent } from "@app/crm/shared/stars-list/stars-list.component";
import { StaticListComponent } from "@app/shared/common/static-list/static-list.component";
import {
    ContactInfoDto,
    LayoutType,
    UserServiceProxy,
    TenantCRMIntegrationSettingsServiceProxy,
    SalesTalkSettings,
    ContactServiceProxy,
    ContactGroupDto,
} from "@shared/service-proxies/service-proxies";
import { ContactsService } from "@app/crm/contacts/contacts.service";
import { ContactGroup, ContactStatus } from "@shared/AppEnums";
import { AppComponentBase } from "@shared/common/app-component-base";
import { ImpersonationService } from "@app/admin/users/impersonation.service";
import { ToolBarComponent } from "@app/shared/common/toolbar/toolbar.component";
import { AppService } from "@app/app.service";
import { AppPermissions } from "@shared/AppPermissions";
import { CrmService } from "@app/crm/crm.service";
import { UserManagementService } from "@shared/common/layout/user-management-list/user-management.service";
import { AppConsts } from "@shared/AppConsts";
import { GroupStatus } from "@app/crm/contacts/operations-widget/status.interface";
import { AppAuthService } from "@shared/common/auth/app-auth.service";
import { environment } from "@root/environments/environment";
import { AppFeatures } from "@shared/AppFeatures";

@Component({
    selector: "operations-widget",
    templateUrl: "./operations-widget.component.html",
    styleUrls: ["./operations-widget.component.less"],
    providers: [TenantCRMIntegrationSettingsServiceProxy],
})
export class OperationsWidgetComponent
    extends AppComponentBase
    implements AfterViewInit, OnChanges
{
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: ListsListComponent;
    @ViewChild(TypesListComponent) partnerTypesComponent: TypesListComponent;
    @ViewChild(UserAssignmentComponent)
    userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild("stagesList") stagesComponent: StaticListComponent;
    @ViewChild("statusesList") statusComponent: StaticListComponent;
    @ViewChild(ToolBarComponent) toolbarComponent: ToolBarComponent;

    /*** @todo add localization service */

    @Input()
    set enabled(val: Boolean) {
        this._enabled = val;
        this.initToolbarConfig();
    }
    get enabled(): Boolean {
        return this._enabled;
    }
    @Input() title: String;
    @Input() contactInfo: ContactInfoDto;
    @Input() customerType: string;
    @Input() leadId: number;
    @Input() selectedPipelineId: number;
    @Input()
    set pipelineDataSource(pipelines: any[]) {
        this._pipelines = pipelines;
        if (pipelines.length) this.initToolbarConfig();
    }
    get pipelineDataSource(): any[] {
        return this._pipelines;
    }
    @Input() selectedStageId: number;
    @Input() selectedPartnerTypeId: string;
    @Input()
    set partnerTypes(partnerTypes: any[]) {
        this._partnerTypes = partnerTypes;
        this.initToolbarConfig();
    }
    get partnerTypes(): any[] {
        return this._partnerTypes;
    }
    @Input() getProxyService;
    @Input() assignedUsersSelector: (
        source$: Observable<any>
    ) => Observable<any>;
    @Input() getAssignmentsPermissionKey;

    @Output() onDelete: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStage: EventEmitter<any> = new EventEmitter();
    @Output() onUpdatePartnerType: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStatus: EventEmitter<GroupStatus> = new EventEmitter();
    @Output() print: EventEmitter<any> = new EventEmitter();

    private initTimeout;
    private _enabled: Boolean;
    private _stages: any[] = [];
    private _pipelines: any[] = [];
    private _partnerTypes: any[] = [];
    manageCGPermision = "";
    toolbarConfig = [];
    customToolbarConfig;
    optionButtonConfig;
    printButtonConfig = {
        location: "after",
        locateInMenu: "auto",
        items: [
            {
                name: "print",
                visible: false,
                action: this.print.emit.bind(this.print),
            },
        ],
    };
    permissions = AppPermissions;
    isCfoAvailable = false;
    isCrmAvailable = false;
    isPfmAvailable = false;
    isApiAvailable = false;
    isBankCodeLayout: boolean = this.userManagementService.isLayout(
        LayoutType.BankCode
    );
    statuses: GroupStatus[];
    activeGroupIds: string[];
    contactGroupKeys = invert(ContactGroup);
    contactGroups: ContactGroupDto[];
    salesTalkApiLink: string;

    constructor(
        injector: Injector,
        private route: ActivatedRoute,
        private elementRef: ElementRef,
        private appService: AppService,
        private authService: AppAuthService,
        private userService: UserServiceProxy,
        private contactService: ContactsService,
        private impersonationService: ImpersonationService,
        private crmService: CrmService,
        private userManagementService: UserManagementService,
        private settingsProxy: TenantCRMIntegrationSettingsServiceProxy,
        private contactProxy: ContactServiceProxy,
        private renderer: Renderer2
    ) {
        super(injector);
        contactService.toolbarSubscribe((config) => {
            if (config) {
                this.customToolbarConfig = config.customToolbar;
                this.optionButtonConfig = config.optionButton;
            } else {
                this.customToolbarConfig = undefined;
                this.optionButtonConfig = undefined;
            }
            this.updateActiveGroups();
            this.initToolbarConfig();
        });
        this.contactProxy
            .getContactGroups()
            .subscribe((res: ContactGroupDto[]) => {
                this.contactGroups = res;
                this.updateActiveGroups();
            });
        this.initSalesTalkApiLink();
    }

    initSalesTalkApiLink() {
        if (
            !this.appService.isHostTenant &&
            this.customerType != ContactGroup.Employee &&
            abp.features.isEnabled(AppFeatures.CRMSalesTalk)
        ) {
            let storageKey = "salesTalkApiLink" + this.appSession.tenantId;
            this.salesTalkApiLink = sessionStorage.getItem(storageKey);
            if (this.salesTalkApiLink == null)
                this.settingsProxy
                    .getSalesTalkSettings()
                    .subscribe((data: SalesTalkSettings) => {
                        this.salesTalkApiLink = data.isEnabled
                            ? data.url +
                              "?type=Lead-Sperse&api-key=" +
                              data.apiKey
                            : "";
                        sessionStorage.setItem(
                            storageKey,
                            this.salesTalkApiLink
                        );
                    });
        }
    }

    ngAfterViewInit() {
        this.contactService.settingsDialogOpened$
            .pipe(takeUntil(this.destroy$))
            .subscribe((opened: boolean) => {
                this.initToolbarConfig(0);
            });
    }

    ngOnChanges(changes: SimpleChanges) {
        /** Load users instance (or get from cache) for user id to find out whether to show cfo or verify button */
        if (changes.contactInfo && this.contactInfo.groups) {
            this.updateActiveGroups();

            if (
                this.contactInfo.groups.some(
                    (group) => group.groupId == ContactGroup.Client
                ) &&
                this.appService.isCfoLinkOrVerifyEnabled
            ) {
                const contactInfo: ContactInfoDto =
                    changes.contactInfo.currentValue;
                if (contactInfo.id && contactInfo.personContactInfo) {
                    this.crmService
                        .isCfoAvailable(contactInfo.personContactInfo.userId)
                        .subscribe((isCfoAvailable: boolean) => {
                            this.isCfoAvailable = isCfoAvailable;
                        });
                    this.crmService
                        .isModuleAvailable(
                            contactInfo.personContactInfo.userId,
                            AppPermissions.CRM
                        )
                        .subscribe((isCrmAvailable: boolean) => {
                            this.isCrmAvailable = isCrmAvailable;
                        });
                    this.crmService
                        .isModuleAvailable(
                            contactInfo.personContactInfo.userId,
                            AppPermissions.PFM
                        )
                        .subscribe((isPfmAvailable: boolean) => {
                            this.isPfmAvailable = isPfmAvailable;
                        });
                    this.crmService
                        .isModuleAvailable(
                            contactInfo.personContactInfo.userId,
                            AppPermissions.API
                        )
                        .subscribe((isApiAvailable: boolean) => {
                            this.isApiAvailable = isApiAvailable;
                        });
                }
            }
        }
    }

    initToolbarConfig(ms = 600) {
        this.toolbarConfig = [];
        clearTimeout(this.initTimeout);
        this.initTimeout = setTimeout(() => {
            if (!this.contactInfo || !this.contactInfo.groups) return;

            this.manageCGPermision = this.permission.getCGPermissionKey(
                this.contactInfo.groups.map((group) => group.groupId),
                "Manage"
            );
            if (this.customToolbarConfig)
                return (this.toolbarConfig = this.customToolbarConfig);

            let portalBaseUrl = AppConsts.appMemberPortalUrl
                    ? AppConsts.appMemberPortalUrl + "/app"
                    : "/code-breaker",
                impersonationItem = {
                    location: "after",
                    locateInMenu: "auto",
                    items: [
                        {
                            name: "login",
                            widget: "dxDropDownMenu",
                            text: this.l("Login"),
                            options: {
                                hint: this.l("Login"),
                                name: "login",
                                items: [
                                    {
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId
                                            );
                                        },
                                        text: this.l("LoginAsThisUser"),
                                        visible:
                                            this.canImpersonate ||
                                            this.autoLoginAllowed,
                                    },
                                    {
                                        text: this.l(
                                            this.isCfoAvailable
                                                ? "CFO"
                                                : "ClientDetails_RequestVerification"
                                        ),
                                        visible: this.cfoLinkOrVerifyEnabled,
                                        icon: !this.isCfoAvailable
                                            ? "verify-icon"
                                            : "",
                                        class: this.isCfoAvailable
                                            ? "icon cfo-icon"
                                            : "",
                                        action: () => {
                                            if (this.isCfoAvailable === true) {
                                                this.redirectToCFO();
                                            } else if (
                                                this.isCfoAvailable === false
                                            ) {
                                                this.requestVerification();
                                            }
                                        },
                                    },
                                    {
                                        text: this.l("CRM"),
                                        visible:
                                            this.canImpersonate &&
                                            this.isCrmAvailable,
                                        class: "icon crm-icon",
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                "/app/crm"
                                            );
                                        },
                                    },
                                    {
                                        text: this.l("PFM"),
                                        visible:
                                            this.canImpersonate &&
                                            this.isPfmAvailable,
                                        class: "icon pfm-icon",
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                "/app/pfm"
                                            );
                                        },
                                    },
                                    {
                                        text: this.l("API"),
                                        visible:
                                            this.canImpersonate &&
                                            this.isApiAvailable,
                                        class: "icon api-icon",
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                "/app/api"
                                            );
                                        },
                                    },
                                    {
                                        text: this.l("LoginToPortal"),
                                        visible:
                                            (this.canImpersonate ||
                                                this.autoLoginAllowed) &&
                                            !!AppConsts.appMemberPortalUrl &&
                                            !this.isBankCodeLayout,
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                AppConsts.appMemberPortalUrl
                                            );
                                        },
                                    },
                                    {
                                        text: this.l("BankCode_CodebreakerAI"),
                                        visible:
                                            this.canImpersonate &&
                                            this.isBankCodeLayout,
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                portalBaseUrl +
                                                    "/products/codebreaker-ai"
                                            );
                                        },
                                    },
                                    {
                                        text: this.l("BankCode_BankPass"),
                                        visible:
                                            this.canImpersonate &&
                                            this.isBankCodeLayout,
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                portalBaseUrl +
                                                    "/products/bankpass"
                                            );
                                        },
                                    },
                                    {
                                        text: this.l("BankCode_BankVault"),
                                        visible:
                                            this.canImpersonate &&
                                            this.isBankCodeLayout,
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                portalBaseUrl +
                                                    "/products/bankvault"
                                            );
                                        },
                                    },
                                    {
                                        text: this.l("BankCode_WhyTheyBuy"),
                                        visible:
                                            this.canImpersonate &&
                                            this.isBankCodeLayout,
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                portalBaseUrl +
                                                    "/products/why-they-buy"
                                            );
                                        },
                                    },
                                    {
                                        text: this.l("BankCode_BankAffiliate"),
                                        visible:
                                            this.canImpersonate &&
                                            this.isBankCodeLayout,
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                portalBaseUrl +
                                                    "/products/bank-affiliate"
                                            );
                                        },
                                    },
                                    {
                                        text: this.l("BankCode_BankTrainer"),
                                        visible:
                                            this.canImpersonate &&
                                            this.isBankCodeLayout,
                                        action: () => {
                                            this.impersonationService.impersonate(
                                                this.contactInfo
                                                    .personContactInfo.userId,
                                                this.appSession.tenantId,
                                                portalBaseUrl +
                                                    "/products/bank-trainer"
                                            );
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
                optionItem = {
                    location: "after",
                    locateInMenu: "auto",
                    items: this.optionButtonConfig
                        ? [this.optionButtonConfig]
                        : [],
                };
            this.toolbarConfig = this._enabled
                ? [
                      ...(this.layoutService.showModernLayout
                          ? [
                                {
                                    location: "before",
                                    locateInMenu: "auto",
                                    items: [
                                        {
                                            name: "title",
                                        },
                                    ],
                                },
                            ]
                          : []),
                      {
                          location: this.layoutService.showModernLayout
                              ? "after"
                              : "before",
                          locateInMenu: "auto",
                          items: [
                              {
                                  name: "assign",
                                  attr: {
                                      class: "assign-to",
                                  },
                                  action: this.toggleUserAssignment.bind(this),
                                  disabled: !this.permission.checkCGPermission(
                                      [this.customerType],
                                      "ManageAssignments"
                                  ),
                              },
                              {
                                  name: "stage",
                                  action: this.toggleStages.bind(this),
                                  disabled: !this.permission.checkCGPermission(
                                      this.contactInfo.groups,
                                      ""
                                  ),
                                  visible:
                                      this.pipelineDataSource &&
                                      this.pipelineDataSource.length &&
                                      !this.contactInfo.parentId,
                              },
                              {
                                  name: "groups",
                                  action: this.toggleStatus.bind(this),
                                  disabled: !this.permission.checkCGPermission(
                                      this.contactInfo.groups,
                                      ""
                                  ),
                              },
                              {
                                  name: "partnerType",
                                  action: this.togglePartnerTypes.bind(this),
                                  disabled: !this.permission.checkCGPermission(
                                      this.contactInfo.groups,
                                      ""
                                  ),
                                  visible:
                                      this.customerType == ContactGroup.Partner,
                              },
                              {
                                  name: "lists",
                                  action: this.toggleLists.bind(this),
                                  disabled: !this.permission.checkCGPermission(
                                      this.contactInfo.groups,
                                      ""
                                  ),
                              },
                              {
                                  name: "tags",
                                  action: this.toggleTags.bind(this),
                                  disabled: !this.permission.checkCGPermission(
                                      this.contactInfo.groups,
                                      ""
                                  ),
                              },
                              {
                                  name: "rating",
                                  action: this.toggleRating.bind(this),
                                  disabled: !this.permission.checkCGPermission(
                                      this.contactInfo.groups,
                                      ""
                                  ),
                              },
                              {
                                  name: "star",
                                  action: this.toggleStars.bind(this),
                                  visible: !this.isBankCodeLayout,
                                  disabled: !this.permission.checkCGPermission(
                                      this.contactInfo.groups,
                                      ""
                                  ),
                              },
                              {
                                  name: "delete",
                                  action: this.delete.bind(this),
                                  visible:
                                      this.layoutService.showModernLayout &&
                                      Boolean(this.leadId) &&
                                      this.permission.checkCGPermission(
                                          this.contactInfo.groups
                                      ) &&
                                      this.route.snapshot.children[0]
                                          .routeConfig.path ==
                                          "contact-information",
                              },
                          ],
                      },
                      {
                          location: "before",
                          locateInMenu: "auto",
                          items: [
                              {
                                  options: {
                                      text: this.l("SalesTalk"),
                                  },
                                  action: () => {
                                      if (this.salesTalkApiLink) {
                                          let userEmail = [
                                                  "staging",
                                                  "beta",
                                                  "production",
                                              ].includes(
                                                  environment.releaseStage
                                              )
                                                  ? this.appSession.user
                                                        .emailAddress
                                                  : "sperse@test.com",
                                              leadEmail: any = (
                                                  this.contactInfo
                                                      .personContactInfo.details
                                                      .emails || []
                                              ).find(
                                                  (email) =>
                                                      email.id ==
                                                      this.contactInfo
                                                          .personContactInfo
                                                          .primaryEmailId
                                              );
                                          leadEmail = leadEmail
                                              ? leadEmail.emailAddress
                                              : "";
                                          window.open(
                                              this.salesTalkApiLink +
                                                  "&leadId=" +
                                                  this.leadId +
                                                  "&userEmail=" +
                                                  userEmail +
                                                  "&leadEmail=" +
                                                  leadEmail
                                          );
                                      }
                                  },
                                  disabled:
                                      !this.salesTalkApiLink ||
                                      !this.permission.checkCGPermission(
                                          this.contactInfo.groups,
                                          ""
                                      ),
                                  visible: false, //!this.appService.isHostTenant
                                  // && this.customerType != ContactGroup.Employee
                                  //  && abp.features.isEnabled(AppFeatures.CRMSalesTalk)
                              },
                          ],
                      },
                      {
                          location: "before",
                          locateInMenu: "auto",
                          items: [
                              {
                                  name: "delete",
                                  action: this.delete.bind(this),
                                  visible:
                                      !this.layoutService.showModernLayout &&
                                      Boolean(this.leadId) &&
                                      this.permission.checkCGPermission(
                                          this.contactInfo.groups
                                      ) &&
                                      this.route.snapshot.children[0]
                                          .routeConfig.path ==
                                          "contact-information",
                              },
                          ],
                      },
                      this.printButtonConfig,
                      this.getNavigationConfig(),
                      optionItem,
                      impersonationItem,
                      ...(this.layoutService.showModernLayout
                          ? [
                                {
                                    location: "after",
                                    locateInMenu: "auto",
                                    items: [
                                        {
                                            widget: "dxButton",
                                            action: () => {
                                                this.contactService.openSettingsDialog();
                                            },
                                            options: {
                                                width: "18px",
                                                height: "18px",
                                                accessKey:
                                                    "open-settings-dialog",
                                                icon: "./assets/common/icons/angle-left.svg",
                                            },
                                            checkVisible: () => {
                                                return !this.contactService
                                                    .settingsDialogOpened.value;
                                            },
                                        },
                                    ],
                                },
                            ]
                          : []),
                  ]
                : [
                      impersonationItem,
                      this.printButtonConfig,
                      this.getNavigationConfig(),
                      optionItem,
                  ];
        }, ms);
    }

    isUserAvailable() {
        return Boolean(
            this.contactInfo &&
                this.contactInfo.personContactInfo &&
                this.contactInfo.personContactInfo.userId
        );
    }

    get canImpersonate(): Boolean {
        return (
            this.isUserAvailable() &&
            this.permission.isGranted(
                AppPermissions.AdministrationUsersImpersonation
            )
        );
    }

    get autoLoginAllowed(): Boolean {
        return (
            this.isUserAvailable() &&
            this.contactInfo &&
            this.permission.checkCGPermission(
                this.contactInfo.groups,
                "UserInformation.AutoLogin"
            )
        );
    }

    getNavigationConfig() {
        return {
            location: "after",
            locateInMenu: "auto",
            items: [
                {
                    name: "prev",
                    action: this.loadPrevItem.bind(this),
                    visible: !this.layoutService.showModernLayout,
                    disabled: this.contactService.isPrevDisabled,
                },
                {
                    name: "next",
                    action: this.loadNextItem.bind(this),
                    visible: !this.layoutService.showModernLayout,
                    disabled: this.contactService.isNextDisabled,
                },
            ],
        };
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    toggleStatus() {
        this.statusComponent.toggle();
    }

    togglePartnerTypes() {
        this.partnerTypesComponent.toggle();
    }

    toggleUserAssignment() {
        this.userAssignmentComponent.toggle();
    }

    toggleLists() {
        this.listsComponent.toggle();
    }

    toggleTags() {
        this.tagsComponent.toggle();
    }

    toggleRating() {
        this.ratingComponent.toggle();
    }

    toggleStars() {
        this.starsListComponent.toggle();
    }

    delete() {
        this.onDelete.emit();
    }

    updateStatus(event) {
        if (event.addedItems.length) {
            let elm = event.addedItems[0];
            if (this.activeGroupIds.some((id) => id == elm.id)) return;
            elm.isActive = true;
            this.onUpdateStatus.emit(elm);
            this.statusComponent.tooltipVisible = false;
        }

        if (event.removedItems.length) {
            let elm = event.removedItems[0];
            if (this.activeGroupIds.some((id) => id == elm.id)) {
                elm.isActive = false;
                this.onUpdateStatus.emit(elm);
                this.statusComponent.tooltipVisible = false;
            }
        }
    }

    updateActiveGroups(status?: GroupStatus) {
        if (this.contactGroups && this.contactInfo && this.contactInfo.groups) {
            this.statuses = [];
            this.contactGroups.forEach((group) => {
                if (this.permission.checkCGPermission([group.id], ""))
                    this.statuses.push(<GroupStatus>{
                        id: group.id,
                        groupId: group.id,
                        name: startCase(
                            this.l(
                                "ContactGroup_" +
                                    this.contactGroupKeys[group.id]
                            )
                        ),
                        isActive:
                            status && status.groupId == group.id
                                ? status.isActive
                                : this.contactInfo.groups.some(
                                      (cg) =>
                                          cg.groupId == group.id && cg.isActive
                                  ),
                        disabled: !this.permission.checkCGPermission(
                            [group.id],
                            "Manage"
                        ),
                    });
            });

            this.activeGroupIds = this.statuses
                .filter((status) => status.isActive)
                .map((status) => status.id);
        }
    }

    updateStage(event) {
        this.onUpdateStage.emit(event);
    }

    updatePartnerType(event) {
        this.onUpdatePartnerType.emit(event);
    }

    invalidateContact() {
        this.contactService.invalidate();
    }

    refresh() {
        this.stagesComponent.tooltipVisible = false;
        this.initToolbarConfig();
    }

    loadPrevItem() {
        this.contactService.prev.next(this);
    }

    loadNextItem() {
        this.contactService.next.next(this);
    }

    requestVerification() {
        this.appService
            .requestVerification(this.contactInfo.personContactInfo.id)
            .pipe(takeUntil(this.deactivate$))
            .subscribe((result) => {
                if (this.contactInfo && this.contactInfo.personContactInfo)
                    this.contactInfo.personContactInfo.userId = result;
                this.initToolbarConfig();
            });
    }

    redirectToCFO() {
        this.appService.redirectToCFO(
            this.contactInfo.personContactInfo.userId
        );
    }

    updateNavButtons(isFirst, isLast) {
        const updateToolbar =
            this.contactService.isPrevDisabled !== isFirst ||
            this.contactService.isNextDisabled !== isLast;
        this.contactService.isPrevDisabled = isFirst;
        this.contactService.isNextDisabled = isLast;
        if (updateToolbar) this.initToolbarConfig();
    }

    /**
     * If isCfoAvailable is undefined - then it hasn't loaded yet and this method returns false
     * @return {boolean}
     */
    get cfoLinkOrVerifyEnabled(): boolean {
        return !!(
            (this.isCfoAvailable &&
                this.appService.checkCFOClientAccessPermission()) ||
            (this.isCfoAvailable === false &&
                this.appService.canSendVerificationRequest() &&
                ((this.contactInfo && this.contactInfo.groups) || []).some(
                    (group) =>
                        group.groupId == ContactGroup.Client && group.isActive
                ))
        );
    }
}
