/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    EventEmitter,
    OnInit,
    Input,
    Output,
    ViewChildren,
    QueryList,
    HostBinding
} from '@angular/core';

/** Third party imports */
import { MatSliderChange, MatSlider } from '@angular/material/slider';
import { Observable, forkJoin } from 'rxjs';
import { concatAll, map, max, pluck, publishReplay, refCount } from 'rxjs/operators';
import partition from 'lodash/partition';

/** Application imports */
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PackageCardComponent } from '@app/shared/common/payment-wizard/package-chooser/package-card/package-card.component';
import { PackageOptions } from '@app/shared/common/payment-wizard/models/package-options.model';
import { AppConsts } from '@shared/AppConsts.ts';
import {
    GetPackagesConfigOutput,
    PaymentPeriodType,
    ModuleType,
    PackageConfigDto,
    PackageEditionConfigDto,
    PackageServiceProxy,
    ModuleSubscriptionInfoExtended
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LocalizationResolver } from '@root/shared/common/localization-resolver';

@Component({
    selector: 'package-chooser',
    templateUrl: './package-chooser.component.html',
    styleUrls: [
        './package-chooser.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PackageChooserComponent implements OnInit {
    @ViewChildren(PackageCardComponent) packageCardComponents: QueryList<PackageCardComponent>;
    @ViewChildren(MatSlider) slider: MatSlider;
    @Input() module: ModuleType;
    @Input() widgettitle: string;
    @Input() subtitle = this.l('ChoosePlan');
    @Input() yearDiscount = 20;
    @Input() packagesMaxUsersAmount: number;
    @Input() nextStepButtonText = this.l('Next');
    @Input() nextButtonPosition: 'right' | 'center' = 'right';
    @Input() showDowngradeLink = false;
    private _preselect = true;
    @Input('preselect')
    get preselect(): boolean {
        return this._preselect;
    }
    set preselect(value: boolean) {
        this._preselect = '' + value !== 'false';
    }
    @Input() preventNextButtonDisabling = false;
    @Output() onPlanChosen: EventEmitter<PackageOptions> = new EventEmitter();
    @Output() moveToNextStep: EventEmitter<null> = new EventEmitter();
    @HostBinding('class.withBackground') @Input() showBackground;
    modules = ModuleType;
    packages: PackageConfigDto[];
    usersAmount = null;
    sliderInitialMinValue = 5;
    sliderInitialStep = 5;
    sliderInitialMaxValue = 100;
    sliderStep = 5;
    selectedPackageIndex: number;
    selectedPackageCardComponent: PackageCardComponent;
    selectedBillingPeriod = BillingPeriod.Yearly;
    billingPeriod = BillingPeriod;
    private defaultUsersAmount = 5;
    private currentPackage: PackageConfigDto;
    private currentEdition: PackageEditionConfigDto;
    private freePackages: PackageConfigDto[];
    private enableSliderScalingChange = false;
    packagesConfig$: Observable<GetPackagesConfigOutput>;
    configurator = 'billingPeriod';
    tenantSubscriptionIsTrial: boolean;
    tenantSubscriptionIsFree: boolean;

    constructor(
        private localizationService: AppLocalizationService,
        private localizationResolver: LocalizationResolver,
        private packageServiceProxy: PackageServiceProxy,
        private changeDetectionRef: ChangeDetectorRef
    ) {}

    l(key: string, ...args: any[]): string {
        return this.localizationService.l(key, AppConsts.localization.defaultLocalizationSourceName, ...args);
    }

    ngOnInit() {
        forkJoin([
            this.localizationResolver.checkLoadLocalization(AppConsts.localization.defaultLocalizationSourceName),
            this.localizationResolver.checkLoadLocalization(AppConsts.localization.CFOLocalizationSourceName),
            this.localizationResolver.checkLoadLocalization(AppConsts.localization.CRMLocalizationSourceName)
        ]).subscribe(() => {
            this.loadPackages();
        });
    }

    loadPackages() {
        if (!this.widgettitle) {
            /** Default value for title if any was set in input */
            this.widgettitle = this.l('ModuleExpired', this.module, 'trial');
        }
        this.packagesConfig$ = this.packageServiceProxy.getPackagesConfig(this.module).pipe(
            publishReplay(),
            refCount()
        );
        this.packagesConfig$.subscribe((packagesConfig: GetPackagesConfigOutput) => {
            this.splitPackagesForFreeAndNotFree(packagesConfig);
            this.getCurrentSubscriptionInfo(packagesConfig.currentSubscriptionInfo);
            this.getCurrentPackageAndEdition(packagesConfig);
            this.changeDefaultSettings(packagesConfig.currentSubscriptionInfo);
            if (this.preselectionIsNeeded) {
                this.preselectPackage();
            }
            this.changeDetectionRef.detectChanges();
        });
        this.getMaxUsersAmount(this.packagesConfig$).subscribe(maxAmount => {
            this.packagesMaxUsersAmount = maxAmount;
            this.changeDetectionRef.detectChanges();
        });
    }

    get preselectionIsNeeded() {
        return this.preselect && !this.tenantSubscriptionIsFree && !this.tenantSubscriptionIsTrial;
    }

    private getCurrentSubscriptionInfo(currentSubscriptionInfo: ModuleSubscriptionInfoExtended): void {
        if (currentSubscriptionInfo) {
            this.tenantSubscriptionIsTrial = currentSubscriptionInfo.isTrial;
            this.tenantSubscriptionIsFree = this.freePackages && this.freePackages.length ? currentSubscriptionInfo.editionId === this.freePackages[0].editions[0].id : false;
        }
    }

    private getCurrentPackageAndEdition(packagesConfig: GetPackagesConfigOutput): void {
        let currentEditionId = packagesConfig.currentSubscriptionInfo ? packagesConfig.currentSubscriptionInfo.editionId : undefined;
        this.currentPackage = this.packages.find(packageConfig => {
            this.currentEdition = packageConfig.editions.find(edition => edition.id === currentEditionId);
            return !!this.currentEdition;
        });
    }

    /** Split packages to free packages and notFreePackages */
    private splitPackagesForFreeAndNotFree(packagesConfig: GetPackagesConfigOutput) {
        let [notFreePackages, freePackages]: [any, any] = partition(packagesConfig.packages, packageConfig => !!packageConfig.editions[0].annualPrice);
        this.freePackages = freePackages;
        /** @todo remove */
        /** Replace packages editions with stub data */
        if (this.module === ModuleType.CFO) {
            notFreePackages[0]['editions'][0]['features'] = [
                {
                    'definition': {
                        'name': 'CFO.FinancialAccounts',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Up to 5 financial accounts'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CFO.ForecastPlanning',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Up to 1 year forecast planning'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CFO.GroupBy',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Group by month, quarter, year'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CFO.SingleUserInstance',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Single user instance'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CFO.RelatedBusinessEntities',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Up to 3 related business entities'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                }
            ];
            notFreePackages[1]['editions'][0]['features'] = [
                {
                    'definition': {
                        'name': 'CFO.FinancialAccounts',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Up to 15 financial accounts'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CFO.ForecastPlanning',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Up to 3 year forecast planning'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
/*
                {
                    'definition': {
                        'name': 'CFO.ForecastPlanning',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Up to 10 user instances'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
*/
                {
                    'definition': {
                        'name': 'CFO.ForecastPlanning',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Up to 10 related business entities'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CFO.GroupBy',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Group by day, week, month, quarter, year'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CFO.ForecastPlanning',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Automatically scheduled daily bank synch'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CFO.SingleUserInstance',
                        'displayName': {
                            'sourceName': 'CFO',
                            'name': 'Xero and Quickbooks connections'
                        },
                        'isVariable': false,
                        'sortOrder': 0,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                }
            ];
            if (notFreePackages[2]) {
                notFreePackages[2]['editions'][0]['features'] =
                    notFreePackages[2]['editions'][1]['features'] =
                    notFreePackages[2]['editions'][2]['features'] = [
                        {
                            'definition': {
                                'name': 'CFO.FinancialAccounts',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Unlimited financial accounts'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false
                            },
                            'value': null
                        },
                        {
                            'definition': {
                                'name': 'CFO.ForecastPlanning',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Up to 10 years of future forecasts'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false
                            },
                            'value': null
                        },
/*
                        {
                            'definition': {
                                'name': 'CFO.ForecastPlanning',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Up to 100 user instances'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false
                            },
                            'value': null
                        },
*/
                        {
                            'definition': {
                                'name': 'CFO.ForecastPlanning',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Up to 25 related business entities'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false
                            },
                            'value': null
                        },
                        {
                            'definition': {
                                'name': 'CFO.GroupBy',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Group by day, week, month, quarter, year'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false
                            },
                            'value': null
                        },
                        {
                            'definition': {
                                'name': 'CFO.ForecastPlanning',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Automatically scheduled bank synch'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false
                            },
                            'value': null
                        },
                        {
                            'definition': {
                                'name': 'CFO.SingleUserInstance',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Xero & Quickbooks connections'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false
                            },
                            'value': null
                        },
                        {
                            'definition': {
                                'name': 'CFO.SingleUserInstance',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Multiple forecast scenarios'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false,
                                'disabled': true
                            },
                            'value': null
                        },
                        {
                            'definition': {
                                'name': 'CFO.SingleUserInstance',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'KPI metrics with daily stats & alerts'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false,
                                'disabled': true
                            },
                            'value': null
                        },
                        {
                            'definition': {
                                'name': 'CFO.SingleUserInstance',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Advanced forecast & series editor'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false,
                                'disabled': true
                            },
                            'value': null
                        },
                        {
                            'definition': {
                                'name': 'CFO.SingleUserInstance',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Autocomplete or postpone forecasts'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false,
                                'disabled': true
                            },
                            'value': null
                        },
                        {
                            'definition': {
                                'name': 'CFO.SingleUserInstance',
                                'displayName': {
                                    'sourceName': 'CFO',
                                    'name': 'Invoices & receipts linked for auditing'
                                },
                                'isVariable': false,
                                'sortOrder': 0,
                                'isStatic': false,
                                'measurementUnit': null,
                                'isCommon': false,
                                'disabled': true
                            },
                            'value': null
                        }
                    ];
            }
        }
        if (this.module === ModuleType.CRM) {
            notFreePackages[0]['editions'][0]['features'] = [
                {
                    'definition': {
                        'name': 'CRM.MaxActiveContactCount',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_MaxActiveContactCount'
                        },
                        'isVariable': false,
                        'sortOrder': 1,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': 5000
                },
                {
                    'definition': {
                        'name': 'MaxSpaceGB',
                        'displayName': {
                            'sourceName': 'Platform',
                            'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                        },
                        'isVariable': true,
                        'sortOrder': 2,
                        'isStatic': false,
                        'measurementUnit': 'GB',
                        'isCommon': true
                    },
                    'value': 20
                },
                {
                    'definition': {
                        'name': 'CFO.GroupBy',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                        },
                        'isVariable': false,
                        'sortOrder': 3,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.TeamPermissionManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_TeamPermissionManagement'
                        },
                        'isVariable': false,
                        'sortOrder': 4,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.DocumentManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'Document Management'
                        },
                        'isVariable': false,
                        'sortOrder': 5,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                }
            ];
            notFreePackages[0]['editions'][1]['features'] = [
                {
                    'definition': {
                        'name': 'CRM.MaxActiveContactCount',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_MaxActiveContactCount'
                        },
                        'isVariable': false,
                        'sortOrder': 1,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': 5000
                },
                {
                    'definition': {
                        'name': 'MaxSpaceGB',
                        'displayName': {
                            'sourceName': 'Platform',
                            'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                        },
                        'isVariable': true,
                        'sortOrder': 2,
                        'isStatic': false,
                        'measurementUnit': 'GB',
                        'isCommon': true
                    },
                    'value': 125
                },
                {
                    'definition': {
                        'name': 'CFO.GroupBy',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                        },
                        'isVariable': false,
                        'sortOrder': 3,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.TeamPermissionManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_TeamPermissionManagement'
                        },
                        'isVariable': false,
                        'sortOrder': 4,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.DocumentManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'Document Management'
                        },
                        'isVariable': false,
                        'sortOrder': 5,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                }
            ];
            notFreePackages[0]['editions'][2]['features'] = [
                {
                    'definition': {
                        'name': 'CRM.MaxActiveContactCount',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_MaxActiveContactCount'
                        },
                        'isVariable': false,
                        'sortOrder': 1,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': 5000
                },
                {
                    'definition': {
                        'name': 'MaxSpaceGB',
                        'displayName': {
                            'sourceName': 'Platform',
                            'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                        },
                        'isVariable': true,
                        'sortOrder': 2,
                        'isStatic': false,
                        'measurementUnit': 'GB',
                        'isCommon': true
                    },
                    'value': 250
                },
                {
                    'definition': {
                        'name': 'CFO.GroupBy',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                        },
                        'isVariable': false,
                        'sortOrder': 3,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.TeamPermissionManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_TeamPermissionManagement'
                        },
                        'isVariable': false,
                        'sortOrder': 4,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.DocumentManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'Document Management'
                        },
                        'isVariable': false,
                        'sortOrder': 5,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                }
            ];
            notFreePackages[0]['editions'][3]['features'] = [
                {
                    'definition': {
                        'name': 'CRM.MaxActiveContactCount',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_MaxActiveContactCount'
                        },
                        'isVariable': false,
                        'sortOrder': 1,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': 5000
                },
                {
                    'definition': {
                        'name': 'MaxSpaceGB',
                        'displayName': {
                            'sourceName': 'Platform',
                            'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                        },
                        'isVariable': true,
                        'sortOrder': 2,
                        'isStatic': false,
                        'measurementUnit': 'GB',
                        'isCommon': true
                    },
                    'value': 500
                },
                {
                    'definition': {
                        'name': 'CFO.GroupBy',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                        },
                        'isVariable': false,
                        'sortOrder': 3,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.TeamPermissionManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_TeamPermissionManagement'
                        },
                        'isVariable': false,
                        'sortOrder': 4,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.DocumentManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'Document Management'
                        },
                        'isVariable': false,
                        'sortOrder': 5,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                }
            ];
            notFreePackages[0]['editions'][4]['features'] = [
                {
                    'definition': {
                        'name': 'CRM.MaxActiveContactCount',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_MaxActiveContactCount'
                        },
                        'isVariable': false,
                        'sortOrder': 1,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': 5000
                },
                {
                    'definition': {
                        'name': 'MaxSpaceGB',
                        'displayName': {
                            'sourceName': 'Platform',
                            'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                        },
                        'isVariable': true,
                        'sortOrder': 2,
                        'isStatic': false,
                        'measurementUnit': 'GB',
                        'isCommon': true
                    },
                    'value': 2500
                },
                {
                    'definition': {
                        'name': 'CFO.GroupBy',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                        },
                        'isVariable': false,
                        'sortOrder': 3,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.TeamPermissionManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'NameOnPricingTable_TeamPermissionManagement'
                        },
                        'isVariable': false,
                        'sortOrder': 4,
                        'isStatic': true,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                },
                {
                    'definition': {
                        'name': 'CRM.DocumentManagement',
                        'displayName': {
                            'sourceName': 'CRM',
                            'name': 'Document Management'
                        },
                        'isVariable': false,
                        'sortOrder': 5,
                        'isStatic': false,
                        'measurementUnit': null,
                        'isCommon': false
                    },
                    'value': null
                }
            ];

            if (notFreePackages[1]) {
                notFreePackages[1]['editions'][0]['features'] = [
                    {
                        'definition': {
                            'name': 'CRM.MaxActiveContactCount',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_MaxActiveContactCount'
                            },
                            'isVariable': false,
                            'sortOrder': 1,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': 50000
                    },
                    {
                        'definition': {
                            'name': 'MaxSpaceGB',
                            'displayName': {
                                'sourceName': 'Platform',
                                'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                            },
                            'isVariable': true,
                            'sortOrder': 2,
                            'isStatic': false,
                            'measurementUnit': 'GB',
                            'isCommon': true
                        },
                        'value': 250
                    },
                    {
                        'definition': {
                            'name': 'CFO.GroupBy',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                            },
                            'isVariable': false,
                            'sortOrder': 3,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TeamPermissionManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_TeamPermissionManagement'
                            },
                            'isVariable': false,
                            'sortOrder': 4,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.DocumentManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Document Management'
                            },
                            'isVariable': false,
                            'sortOrder': 5,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TasksManagementAndCalendar',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Tasks Management and Calendar'
                            },
                            'isVariable': false,
                            'sortOrder': 6,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.FullAPIAccess',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Full API Access'
                            },
                            'isVariable': false,
                            'sortOrder': 7,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    }
                ];
                notFreePackages[1]['editions'][1]['features'] = [
                    {
                        'definition': {
                            'name': 'CRM.MaxActiveContactCount',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_MaxActiveContactCount'
                            },
                            'isVariable': false,
                            'sortOrder': 1,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': 50000
                    },
                    {
                        'definition': {
                            'name': 'MaxSpaceGB',
                            'displayName': {
                                'sourceName': 'Platform',
                                'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                            },
                            'isVariable': true,
                            'sortOrder': 2,
                            'isStatic': false,
                            'measurementUnit': 'GB',
                            'isCommon': true
                        },
                        'value': 500
                    },
                    {
                        'definition': {
                            'name': 'CFO.GroupBy',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                            },
                            'isVariable': false,
                            'sortOrder': 3,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TeamPermissionManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_TeamPermissionManagement'
                            },
                            'isVariable': false,
                            'sortOrder': 4,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.DocumentManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Document Management'
                            },
                            'isVariable': false,
                            'sortOrder': 5,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TasksManagementAndCalendar',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Tasks Management and Calendar'
                            },
                            'isVariable': false,
                            'sortOrder': 6,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.FullAPIAccess',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Full API Access'
                            },
                            'isVariable': false,
                            'sortOrder': 7,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    }
                ];
                notFreePackages[1]['editions'][2]['features'] = [
                    {
                        'definition': {
                            'name': 'CRM.MaxActiveContactCount',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_MaxActiveContactCount'
                            },
                            'isVariable': false,
                            'sortOrder': 1,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': 50000
                    },
                    {
                        'definition': {
                            'name': 'MaxSpaceGB',
                            'displayName': {
                                'sourceName': 'Platform',
                                'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                            },
                            'isVariable': true,
                            'sortOrder': 2,
                            'isStatic': false,
                            'measurementUnit': 'GB',
                            'isCommon': true
                        },
                        'value': 1000
                    },
                    {
                        'definition': {
                            'name': 'CFO.GroupBy',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                            },
                            'isVariable': false,
                            'sortOrder': 3,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TeamPermissionManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_TeamPermissionManagement'
                            },
                            'isVariable': false,
                            'sortOrder': 4,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.DocumentManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Document Management'
                            },
                            'isVariable': false,
                            'sortOrder': 5,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TasksManagementAndCalendar',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Tasks Management and Calendar'
                            },
                            'isVariable': false,
                            'sortOrder': 6,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.FullAPIAccess',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Full API Access'
                            },
                            'isVariable': false,
                            'sortOrder': 7,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    }
                ];
                notFreePackages[1]['editions'][3]['features'] = [
                    {
                        'definition': {
                            'name': 'CRM.MaxActiveContactCount',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_MaxActiveContactCount'
                            },
                            'isVariable': false,
                            'sortOrder': 1,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': 50000
                    },
                    {
                        'definition': {
                            'name': 'MaxSpaceGB',
                            'displayName': {
                                'sourceName': 'Platform',
                                'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                            },
                            'isVariable': true,
                            'sortOrder': 2,
                            'isStatic': false,
                            'measurementUnit': 'GB',
                            'isCommon': true
                        },
                        'value': 5000
                    },
                    {
                        'definition': {
                            'name': 'CFO.GroupBy',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                            },
                            'isVariable': false,
                            'sortOrder': 3,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TeamPermissionManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_TeamPermissionManagement'
                            },
                            'isVariable': false,
                            'sortOrder': 4,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.DocumentManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Document Management'
                            },
                            'isVariable': false,
                            'sortOrder': 5,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TasksManagementAndCalendar',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Tasks Management and Calendar'
                            },
                            'isVariable': false,
                            'sortOrder': 6,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.FullAPIAccess',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Full API Access'
                            },
                            'isVariable': false,
                            'sortOrder': 7,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    }
                ];
            }

            if (notFreePackages[2]) {
                notFreePackages[2]['editions'][0]['features'] = [
                    {
                        'definition': {
                            'name': 'CRM.MaxActiveContactCount',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_MaxActiveContactCount'
                            },
                            'isVariable': false,
                            'sortOrder': 1,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': 'Unlimited'
                    },
                    {
                        'definition': {
                            'name': 'MaxSpaceGB',
                            'displayName': {
                                'sourceName': 'Platform',
                                'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                            },
                            'isVariable': true,
                            'sortOrder': 2,
                            'isStatic': false,
                            'measurementUnit': 'GB',
                            'isCommon': true
                        },
                        'value': 2500
                    },
                    {
                        'definition': {
                            'name': 'CFO.GroupBy',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                            },
                            'isVariable': false,
                            'sortOrder': 3,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TeamPermissionManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_TeamPermissionManagement'
                            },
                            'isVariable': false,
                            'sortOrder': 4,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.DocumentManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Document Management'
                            },
                            'isVariable': false,
                            'sortOrder': 5,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TasksManagementAndCalendar',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Tasks Management and Calendar'
                            },
                            'isVariable': false,
                            'sortOrder': 6,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.FullAPIAccess',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Full API Access'
                            },
                            'isVariable': false,
                            'sortOrder': 7,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.OrdersAndInvoiceManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Orders & Invoice Management'
                            },
                            'isVariable': false,
                            'sortOrder': 8,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.AdvancedReporting',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Advanced Reporting'
                            },
                            'isVariable': false,
                            'sortOrder': 9,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.WorkflowAutomation',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Workflow Automation'
                            },
                            'isVariable': false,
                            'sortOrder': 10,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.SalesReportingAndForecasting',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Sales Reporting & Forecasting'
                            },
                            'isVariable': false,
                            'sortOrder': 11,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.EmailCommunications',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Email Communications'
                            },
                            'isVariable': false,
                            'sortOrder': 12,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.GoogleIntegration',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Google Integration'
                            },
                            'isVariable': false,
                            'sortOrder': 13,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.Customization',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Customization'
                            },
                            'isVariable': false,
                            'sortOrder': 14,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    }
                ];
                notFreePackages[2]['editions'][1]['features'] = [
                    {
                        'definition': {
                            'name': 'CRM.MaxActiveContactCount',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_MaxActiveContactCount'
                            },
                            'isVariable': false,
                            'sortOrder': 1,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': 'Unlimited'
                    },
                    {
                        'definition': {
                            'name': 'MaxSpaceGB',
                            'displayName': {
                                'sourceName': 'Platform',
                                'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                            },
                            'isVariable': true,
                            'sortOrder': 2,
                            'isStatic': false,
                            'measurementUnit': 'GB',
                            'isCommon': true
                        },
                        'value': 5000
                    },
                    {
                        'definition': {
                            'name': 'CFO.GroupBy',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                            },
                            'isVariable': false,
                            'sortOrder': 3,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TeamPermissionManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_TeamPermissionManagement'
                            },
                            'isVariable': false,
                            'sortOrder': 4,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.DocumentManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Document Management'
                            },
                            'isVariable': false,
                            'sortOrder': 5,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TasksManagementAndCalendar',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Tasks Management and Calendar'
                            },
                            'isVariable': false,
                            'sortOrder': 6,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.FullAPIAccess',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Full API Access'
                            },
                            'isVariable': false,
                            'sortOrder': 7,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.OrdersAndInvoiceManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Orders & Invoice Management'
                            },
                            'isVariable': false,
                            'sortOrder': 8,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.AdvancedReporting',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Advanced Reporting'
                            },
                            'isVariable': false,
                            'sortOrder': 9,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.WorkflowAutomation',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Workflow Automation'
                            },
                            'isVariable': false,
                            'sortOrder': 10,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.SalesReportingAndForecasting',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Sales Reporting & Forecasting'
                            },
                            'isVariable': false,
                            'sortOrder': 11,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.EmailCommunications',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Email Communications'
                            },
                            'isVariable': false,
                            'sortOrder': 12,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.GoogleIntegration',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Google Integration'
                            },
                            'isVariable': false,
                            'sortOrder': 13,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.Customization',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Customization'
                            },
                            'isVariable': false,
                            'sortOrder': 14,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    }
                ];
                notFreePackages[2]['editions'][2]['features'] = [
                    {
                        'definition': {
                            'name': 'CRM.MaxActiveContactCount',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_MaxActiveContactCount'
                            },
                            'isVariable': false,
                            'sortOrder': 1,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': 'Unlimited'
                    },
                    {
                        'definition': {
                            'name': 'MaxSpaceGB',
                            'displayName': {
                                'sourceName': 'Platform',
                                'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                            },
                            'isVariable': true,
                            'sortOrder': 2,
                            'isStatic': false,
                            'measurementUnit': 'GB',
                            'isCommon': true
                        },
                        'value': 10000
                    },
                    {
                        'definition': {
                            'name': 'CFO.GroupBy',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                            },
                            'isVariable': false,
                            'sortOrder': 3,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TeamPermissionManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_TeamPermissionManagement'
                            },
                            'isVariable': false,
                            'sortOrder': 4,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.DocumentManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Document Management'
                            },
                            'isVariable': false,
                            'sortOrder': 5,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TasksManagementAndCalendar',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Tasks Management and Calendar'
                            },
                            'isVariable': false,
                            'sortOrder': 6,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.FullAPIAccess',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Full API Access'
                            },
                            'isVariable': false,
                            'sortOrder': 7,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.OrdersAndInvoiceManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Orders & Invoice Management'
                            },
                            'isVariable': false,
                            'sortOrder': 8,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.AdvancedReporting',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Advanced Reporting'
                            },
                            'isVariable': false,
                            'sortOrder': 9,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.WorkflowAutomation',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Workflow Automation'
                            },
                            'isVariable': false,
                            'sortOrder': 10,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.SalesReportingAndForecasting',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Sales Reporting & Forecasting'
                            },
                            'isVariable': false,
                            'sortOrder': 11,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.EmailCommunications',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Email Communications'
                            },
                            'isVariable': false,
                            'sortOrder': 12,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.GoogleIntegration',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Google Integration'
                            },
                            'isVariable': false,
                            'sortOrder': 13,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.Customization',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Customization'
                            },
                            'isVariable': false,
                            'sortOrder': 14,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    }
                ];
                notFreePackages[2]['editions'][3]['features'] = [
                    {
                        'definition': {
                            'name': 'CRM.MaxActiveContactCount',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_MaxActiveContactCount'
                            },
                            'isVariable': false,
                            'sortOrder': 1,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': 'Unlimited'
                    },
                    {
                        'definition': {
                            'name': 'MaxSpaceGB',
                            'displayName': {
                                'sourceName': 'Platform',
                                'name': 'NameOnPricingTable_AdminMaxSpaceGB'
                            },
                            'isVariable': true,
                            'sortOrder': 2,
                            'isStatic': false,
                            'measurementUnit': 'GB',
                            'isCommon': true
                        },
                        'value': 50000
                    },
                    {
                        'definition': {
                            'name': 'CFO.GroupBy',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_LeadManagementPipelineFunnel'
                            },
                            'isVariable': false,
                            'sortOrder': 3,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TeamPermissionManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'NameOnPricingTable_TeamPermissionManagement'
                            },
                            'isVariable': false,
                            'sortOrder': 4,
                            'isStatic': true,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.DocumentManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Document Management'
                            },
                            'isVariable': false,
                            'sortOrder': 5,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.TasksManagementAndCalendar',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Tasks Management and Calendar'
                            },
                            'isVariable': false,
                            'sortOrder': 6,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.FullAPIAccess',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Full API Access'
                            },
                            'isVariable': false,
                            'sortOrder': 7,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.OrdersAndInvoiceManagement',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Orders & Invoice Management'
                            },
                            'isVariable': false,
                            'sortOrder': 8,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.AdvancedReporting',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Advanced Reporting'
                            },
                            'isVariable': false,
                            'sortOrder': 9,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.WorkflowAutomation',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Workflow Automation'
                            },
                            'isVariable': false,
                            'sortOrder': 10,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.SalesReportingAndForecasting',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Sales Reporting & Forecasting'
                            },
                            'isVariable': false,
                            'sortOrder': 11,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.EmailCommunications',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Email Communications'
                            },
                            'isVariable': false,
                            'sortOrder': 12,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.GoogleIntegration',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Google Integration'
                            },
                            'isVariable': false,
                            'sortOrder': 13,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    },
                    {
                        'definition': {
                            'name': 'CRM.Customization',
                            'displayName': {
                                'sourceName': 'CRM',
                                'name': 'Customization'
                            },
                            'isVariable': false,
                            'sortOrder': 14,
                            'isStatic': false,
                            'measurementUnit': null,
                            'isCommon': false,
                            'disabled': true
                        },
                        'value': null
                    }
                ];
            }
        }
        this.packages = notFreePackages;
    }

    /** Preselect package if current edition is in list of not free packages, else - preselect best value package */
    private preselectPackage() {
        const selectedPackage = this.currentPackage || this.packages.find(packageConfig => packageConfig.bestValue);
        if (selectedPackage) {
            this.selectedPackageIndex = this.packages.indexOf(selectedPackage);
            /** Update selected package with the active status to handle next button status */
            setTimeout(() => {
                this.selectPackage(this.selectedPackageIndex);
                const plan = this.getPlan();
                this.onPlanChosen.emit(plan);
            }, 10);
        }
    }

    /** Get values of usersAmount and billing period from user previous choice */
    private changeDefaultSettings(currentSubscriptionInfo: ModuleSubscriptionInfoExtended) {
        this.usersAmount = this.getDefaultUserAmount(currentSubscriptionInfo);
        this.selectedBillingPeriod = this.getDefaultBillingPeriod(currentSubscriptionInfo);
    }

    private getDefaultUserAmount(currentSubscriptionInfo: ModuleSubscriptionInfoExtended): number {
        let usersAmount;
        if (this.tenantSubscriptionIsTrial || this.tenantSubscriptionIsFree) {
            usersAmount = this.defaultUsersAmount;
        } else {
            usersAmount = this.round(
                currentSubscriptionInfo &&
                (
                    currentSubscriptionInfo.maxUserCount ||
                    (this.currentEdition && this.currentEdition.maxUserCount)
                ) ||
                this.defaultUsersAmount
            );
            usersAmount = usersAmount > this.sliderInitialMaxValue || usersAmount < this.sliderInitialMinValue
                ? this.sliderInitialMaxValue
                : usersAmount;
        }
        return usersAmount;
    }

    private getDefaultBillingPeriod(currentSubscriptionInfo: ModuleSubscriptionInfoExtended) {
        return currentSubscriptionInfo && currentSubscriptionInfo.frequency === PaymentPeriodType._30
            && !this.tenantSubscriptionIsFree && !this.tenantSubscriptionIsTrial
            ? BillingPeriod.Monthly
            : BillingPeriod.Yearly;
    }

    private round(amount: number): number {
        return Math.ceil(amount / this.sliderInitialStep) * this.sliderInitialStep;
    }

    /** Return the highest users count from all packages */
    private getMaxUsersAmount(packagesConfig$: Observable<GetPackagesConfigOutput>): Observable<number> {
        return packagesConfig$.pipe(
            pluck('packages'),
            concatAll(),
            map((packageConfig: PackageConfigDto) => packageConfig.editions),
            concatAll(),
            map((edition: PackageEditionConfigDto) => edition.maxUserCount),
            max()
        );
    }

    billingPeriodChanged(e) {
        this.selectedBillingPeriod = e.checked ? BillingPeriod.Yearly : BillingPeriod.Monthly;
    }

    selectPackage(packageIndex: number) {
        const selectedPlanCardComponent = this.packageCardComponents.toArray()[packageIndex];
        if (selectedPlanCardComponent.isActive) {
            this.selectedPackageIndex = packageIndex;
            this.selectedPackageCardComponent = selectedPlanCardComponent;
        }
    }

    getActiveStatus(status: 'month' | 'year') {
        return (status === 'month' && this.selectedBillingPeriod === BillingPeriod.Monthly) ||
            (status === 'year' && this.selectedBillingPeriod === BillingPeriod.Yearly);
    }

    onActiveUsersChange(event: MatSliderChange) {
        this.usersAmount = event.value;
    }

    decreaseUserCount() {
        if (this.usersAmount <= this.sliderInitialMinValue) return;
        if (this.enableSliderScalingChange) {
            if (this.sliderStep !== this.sliderInitialStep && this.usersAmount === this.sliderInitialMaxValue) {
                this.repaintSlider(this.sliderInitialMinValue, this.sliderInitialMaxValue, this.sliderInitialStep);
            }
        }
        this.usersAmount = this.usersAmount - this.sliderStep;
    }

    increaseUserCount() {
        if (this.enableSliderScalingChange) {
            if (this.usersAmount >= this.packagesMaxUsersAmount) return;
            if (this.usersAmount > (this.sliderInitialMaxValue - this.sliderStep) && this.packagesMaxUsersAmount > this.sliderInitialMaxValue) {
                const step = (this.packagesMaxUsersAmount - this.sliderInitialMaxValue) / 8;
                this.repaintSlider(this.sliderInitialMaxValue, this.packagesMaxUsersAmount, step);
            }
        } else {
            if (this.usersAmount >= this.sliderInitialMaxValue) return;
        }
        this.usersAmount = this.usersAmount + this.sliderStep;
    }

    repaintSlider(min: number, max: number, step: number) {
        this.slider['first']._min = min;
        this.slider['first']._max = max;
        this.slider['first']._step = this.sliderStep = step;
    }

    downGradeToFree() {
        if (this.showDowngradeLink) {
            const freePlan = this.getFreePlan();
            this.onPlanChosen.emit(freePlan);
            this.moveToNextStep.next();
        }
    }

    private getSubscriptionFrequency(): PaymentPeriodType {
        return this.selectedPackageCardComponent.billingPeriod === BillingPeriod.Monthly
            ? PaymentPeriodType._30
            : PaymentPeriodType._365;
    }

    goToNextStep() {
        if (!this.selectedPackageCardComponent) {
            if (!this.selectedPackageIndex) {
                /** Get last package if noone hasn't been chosen */
                this.selectedPackageIndex = this.packages.length - 1;
            }
            this.selectPackage(this.selectedPackageIndex);
        }

        const plan = this.getPlan();
        this.onPlanChosen.emit(plan);
        this.moveToNextStep.next();
    }

    getFreePlan() {
        return {
            name: this.freePackages[0].editions[0].displayName,
            billingPeriod: this.selectedPackageCardComponent.billingPeriod,
            subscriptionFrequency: this.getSubscriptionFrequency(),
            pricePerUserPerMonth: 0,
            subtotal: 0,
            discount: 0,
            total: 0,
            usersAmount: +this.freePackages[0].editions[0].maxUserCount,
            selectedEditionId: this.freePackages[0].editions[0].id,
            selectedEditionName: this.freePackages[0].editions[0].name
        };
    }

    /** @todo refactor - calculate data in payment service instead of calculating of the plan values from the plan components */
    getPlan() {
        const totalPrice = this.selectedPackageCardComponent.totalPrice;
        const plan: PackageOptions = {
            name: this.selectedPackageCardComponent.name,
            billingPeriod: this.selectedPackageCardComponent.billingPeriod,
            subscriptionFrequency: this.getSubscriptionFrequency(),
            pricePerUserPerMonth: this.selectedPackageCardComponent.pricePerUserPerMonth,
            subtotal: this.selectedBillingPeriod === BillingPeriod.Yearly ? this.selectedPackageCardComponent.monthlyPricePerYear : totalPrice,
            discount: this.selectedBillingPeriod === BillingPeriod.Yearly ? this.yearDiscount : 0,
            total: totalPrice,
            usersAmount: this.usersAmount,
            selectedEditionId: this.selectedPackageCardComponent.selectedEdition.id,
            selectedEditionName: this.selectedPackageCardComponent.selectedEdition.name
        };
        return plan;
    }

    get nextButtonDisabled(): boolean {
        let disabled = false;
        if (!this.preventNextButtonDisabling) {
            disabled = this.selectedPackageIndex === undefined || this.selectedPackageIndex < 0 || (this.selectedPackageCardComponent && !this.selectedPackageCardComponent.isActive);
        }
        return disabled;
    }
}
