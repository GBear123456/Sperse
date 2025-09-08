/** Core imports */
import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    GetInvoiceReceiptInfoOutput, InvoiceEventInfo, InvoiceStatus,
    UserInvoiceServiceProxy,
    TenantHostServiceProxy,
    GetExternalUserDataInput,
    ExternalUserDataServiceProxy,
    GetExternalUserDataOutput,
    SetDiscordForContactInput
} from '@root/shared/service-proxies/service-proxies';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';
import * as moment from 'moment';
import { findIana } from 'windows-iana';

/** Application imports */
import { ConditionsType } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
import { AppConsts } from '@shared/AppConsts';
import { EventDurationHelper } from '@shared/crm/helpers/event-duration-types.enum';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'public-receipt',
    templateUrl: 'receipt.component.html',
    styleUrls: [
        '../../../shared/common/styles/core.less',
        './receipt.component.less'
    ],
    encapsulation: ViewEncapsulation.None,
    providers: [TenantHostServiceProxy, ExternalUserDataServiceProxy]
})
export class ReceiptComponent implements OnInit {
    loading: boolean = true;
    invoiceInfo: GetInvoiceReceiptInfoOutput;
    returnText: string = '';
    hostName = AppConsts.defaultTenantName;
    currentYear: number = new Date().getFullYear();
    hasToSOrPolicy: boolean;
    conditions = ConditionsType;

    static retryDelay: number = 4000;
    static maxRetryCount: number = 15;
    currentRetryCount: number = 0;
    failedToLoad: boolean = false;
    failMessage: string = '';

    tenantId: number = Number(this.activatedRoute.snapshot.paramMap.get('tenantId'));
    publicId = this.activatedRoute.snapshot.paramMap.get('publicId');
    preventRedirect: boolean = Boolean(this.activatedRoute.snapshot.queryParamMap.get('preventRedirect'));
    usePortal = !!this.activatedRoute.snapshot.queryParamMap.get('usePortal');

    discordPopup: Window;
    discordUserId: string;
    discordUserName: string;
    discordUserUpdated: boolean;
    discordUserUpdating: boolean;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        public ls: AppLocalizationService,
        private userInvoiceService: UserInvoiceServiceProxy,
        private tenantHostService: TenantHostServiceProxy,
        private clipboardService: ClipboardService,
        private externalUserDataService: ExternalUserDataServiceProxy,
        public conditionsModalService: ConditionsModalService,
    ) {
    }

    ngOnInit(): void {
        this.clearQueryParam();
        abp.ui.setBusy();
        this.getInvoiceInfo(this.tenantId, this.publicId);
    }

    clearQueryParam() {
        this.router.navigate([], {
            queryParams: {
                'usePortal': null
            },
            queryParamsHandling: 'merge'
        });
    }

    getInvoiceInfo(tenantId, publicId) {
        this.userInvoiceService
            .getInvoiceReceiptInfo(tenantId, publicId)
            .subscribe(result => {
                switch (result.invoiceStatus) {
                    case InvoiceStatus.Sent:
                        {
                            if (result.waitingForFutureSubscriptionPayment) {
                                this.router.navigate(['invoicing/invoice', tenantId, publicId]);
                                return;
                            }

                            this.retryDataRequest(tenantId, publicId);
                            return;
                        }
                    case InvoiceStatus.Paid:
                        {
                            if (!this.preventRedirect && result.redirectUrls && result.redirectUrls.length == 1) {
                                location.href = result.redirectUrls[0];
                                return;
                            }

                            this.invoiceInfo = result;
                            this.invoiceInfo.resources = result.resources.sort((a, b) => Boolean(a.url) > Boolean(b.url) ? 1 : -1);
                            this.hasToSOrPolicy = this.invoiceInfo.tenantHasTerms || this.invoiceInfo.tenantHasPrivacyPolicy;
                            this.initEventsInfo();
                            this.setReturnLinkInfo();
                            this.loading = false;
                            abp.ui.clearBusy();
                            return;
                        }
                    default:
                        {
                            this.retryDataRequest(tenantId, publicId);
                            return;
                        }
                }
            });
    }

    retryDataRequest(tenantId, publicId) {
        this.currentRetryCount++;
        if (this.currentRetryCount >= ReceiptComponent.maxRetryCount) {
            abp.ui.clearBusy();
            this.failedToLoad = true;
            this.failMessage = 'Failed to load payment information. Please refresh the page or try again later.';
        }
        else {
            setTimeout(() => this.getInvoiceInfo(tenantId, publicId), ReceiptComponent.retryDelay);
        }
    }

    setReturnLinkInfo() {
        if (this.invoiceInfo.isTenantInvoice) {
            this.returnText = abp.session.userId ? 'Return to System' : 'Login to System';
        }
        else if (this.usePortal) {
            this.returnText = 'Return to System';
        }
    }

    returnLinkClick() {
        abp.ui.setBusy();

        if (this.usePortal) {
            this.tenantHostService.getMemberPortalUrl(this.tenantId || undefined)
                .subscribe(output => {
                    window.location.href = output.url;
                });
        }
        else if (abp.session.userId) {
            window.location.href = location.origin + '/app/crm';
        }
        else {
            sessionStorage.setItem('redirectUrl', `${location.origin}/app/crm`);
            window.location.href = location.origin + '/account/login';
        }
    }

    openConditionsDialog(type: ConditionsType) {
        this.conditionsModalService.openModal({
            panelClass: ['slider', 'footer-slider'],
            data: {
                type: type,
                tenantId: this.tenantId,
                hasOwnDocument: type == ConditionsType.Terms ? this.invoiceInfo.tenantHasTerms : this.invoiceInfo.tenantHasPrivacyPolicy
            }
        });
    }

    resourceClick(event, resource: any) {
        if (resource.url) {
            this.clipboardService.copyFromContent(resource.url);
            abp.notify.info(this.ls.l('SavedToClipboard'));
        } else {
            if (resource.fileUrl)
                window.open(resource.fileUrl, '_blank');
            else
                this.userInvoiceService.getInvoiceResourceUrl(this.tenantId, this.publicId, resource.id).subscribe(url => {
                    resource.fileUrl = url;
                    window.open(url, '_blank');
                });
        }

        event.stopPropagation();
        event.preventDefault();
    }

    initEventsInfo() {
        if (!this.invoiceInfo.events)
            return;

        for (let event of this.invoiceInfo.events) {
            if (event.time) {
                let baseDateMomentUtc = event.date ? moment(new Date(event.date)).utc() : moment().utc();
                let timeArr = event.time.split(':');
                baseDateMomentUtc.set({ hour: timeArr[0], minute: timeArr[1] });
                let timezoneDateMoment = baseDateMomentUtc.tz(findIana(event.timezone)[0]);
                event['dateStr'] = event.date ? timezoneDateMoment.format('MMM D, YYYY h:mm A Z') : timezoneDateMoment.format('h:mm A Z');
                event['dateStrLocal'] = event.date ? timezoneDateMoment.local().format('MMM D, YYYY h:mm A Z') : timezoneDateMoment.local().format('h:mm A Z');
            } else if (event.date) {
                event['dateStr'] = moment(new Date(event.date)).utc().format('MMM D, YYYY');
            }

            if (event.durationMinutes) {
                let durationInfo = EventDurationHelper.ParseDuration(event.durationMinutes);
                event['durationStr'] = `${durationInfo.eventDuration} ${EventDurationHelper.getDisplayValue(durationInfo.eventDurationType)}`;
            }
        }
    }

    copyEventData(event: InvoiceEventInfo) {
        let eventData = `${event.productName}\nLocation: ${this.ls.l('ProductEventLocation_' + event.location)}\n`;
        if (event['dateStr']) {
            eventData += `Date: ${event['dateStr']}${event.time ? '(' + event.timezone + ')' : ''}\n`;
            if (event.time)
                eventData += `Local Date: ${event['dateStrLocal']}\n`;
        }

        eventData += this.getCopyString('Link', event.link);

        if (event.address.streetAddress || event.address.city || event.address.stateName || event.address.countryName || event.address.zip) {
            eventData += `Address\n`;
            eventData += this.getCopyString('Street', event.address.streetAddress);
            eventData += this.getCopyString('City', event.address.city);
            eventData += this.getCopyString('State', event.address.stateName);
            eventData += this.getCopyString('Country', event.address.countryName);
            eventData += this.getCopyString('Zip', event.address.zip);
        }

        eventData += this.getCopyString('Duration', event['durationStr']);
        eventData += this.getCopyString('Language', event.languageName, false);

        this.clipboardService.copyFromContent(eventData);
        abp.notify.info(this.ls.l('SavedToClipboard'));
    }

    private getCopyString(displayName: string, value: any, checkNotEmpty = true): string {
        if (checkNotEmpty && !value) {
            return '';
        }
        return `${displayName}: ${value}\n`;
    }

    discordOAuth() {
        let scopes = ['email', 'identify', 'guilds.join'];
        let scopesString = scopes.join('%20');
        let redirectUrl = `${AppConsts.appConfigOrigin.remoteServiceBaseUrl}/account/oauth-redirect?provider=discord`;
        let popupUrl = 'https://discord.com/oauth2/authorize?response_type=code&client_id=' + this.invoiceInfo.discordInfo.discordAppId +
            `&redirect_uri=${redirectUrl}&state=${this.tenantId}&scope=${scopesString}&prompt=none`;

        this.discordPopup = window.open(popupUrl, 'discordOAuth', 'width=500,height=600');
        if (!this.discordPopup) {
            abp.notify.error('Please allow popups to authorize in Discord');
            return;
        }

        const popupCheckInterval = setInterval(() => {
            if (this.discordPopup.closed) {
                this.discordPopup = null;
                clearInterval(popupCheckInterval);
                window.removeEventListener('message', messageHandler);
            }
        }, 500);

        const messageHandler = (event: MessageEvent) => {
            if (event.origin !== AppConsts.remoteServiceBaseUrl)
                return;

            if (event.data.code) {
                const authCode = event.data.code;
                this.externalUserDataService.getUserData(new GetExternalUserDataInput({
                    tenantId: 0,
                    provider: 'Discord',
                    exchangeCode: authCode,
                    loginReturnUrl: redirectUrl,
                    options: null,
                    vault: true
                })).subscribe(res => {
                    this.discordUserId = res.additionalData["Id"];
                    this.discordUserName = res.additionalData["Username"];
                });
            } else {
                abp.notify.error(event.data.error || 'Failed to get ');
            }

            clearInterval(popupCheckInterval);
            window.removeEventListener('message', messageHandler);
            this.discordPopup.close();
            this.discordPopup = null;
        };

        window.addEventListener('message', messageHandler);
    }

    confirmDiscord() {
        if (!this.discordUserId)
            return;

        this.discordUserUpdating = true;
        this.userInvoiceService.setDiscordForContact(new SetDiscordForContactInput({
            tenantId: this.tenantId,
            publicId: this.publicId,
            discordUserId: this.discordUserId,
            discordUserName: this.discordUserName
        })).pipe(finalize(() => {
            this.discordUserUpdating = false;
        })).subscribe(() => {
            this.discordUserUpdated = true;
        });
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: any) {
        if (this.invoiceInfo.discordInfo?.showDiscordAuthButton && !this.discordUserUpdated) {
            $event.returnValue = true;
            if (!this.discordUserId)
                return 'Please connect your Discord account';
            else
                return 'Please confirm your Discord account';
        }
    }
}
