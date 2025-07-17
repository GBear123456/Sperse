/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    Input,
    OnInit,
    ChangeDetectorRef,
    ElementRef,
} from '@angular/core';

/** Third party imports */
import { Plus, X } from 'lucide-angular';

/** Application imports */
import { CommunicationDeliverableInfo, CommunicationRole, DiscordServiceProxy, GetDiscordServersInput, ProductDeliverableTypes } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { finalize } from 'rxjs/operators';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { CommunicationDeliverableInfoWithOptions } from './community-access.type'

@Component({
    selector: 'community-access-selector',
    templateUrl: './community-access.component.html',
    styleUrls: [
        '../../../subscriptions-base.less',
        './community-access.component.less'
    ],
    providers: [DiscordServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunityAccessSelectorComponent implements OnInit {
    @Input() community: any;
    @Input()
    set data(value: CommunicationDeliverableInfoWithOptions[]) {
        this.initDeliverables(value);
    }
    @Input() hostClientId: string;

    deliverables: CommunicationDeliverableInfoWithOptions[] = [];
    oAuthTriggeredDeliverable: CommunicationDeliverableInfoWithOptions;

    readonly Plus = Plus;
    readonly X = X;

    mediumTitle: string;

    oAuthPopup: Window;

    configMedium = {
        discord: {
            step1: {
                buttonTitle: "Connect to Discord to get your Servers",
                inputPlaceholder: "Select your server"
            },
            step2: {
                description: `Install the ${AppConsts.defaultTenantName} Bot in your Discord Server`,
                buttonTitle: "Install Bot In Your Server",
                connectedText: "Your Discord bot is connected"
            },
            step3: {
                description: "Specify role(s) you want to grant a member of this product or subscription",
                channelTitle: "Assigned Role IDs:",
                channels: [],
                noChannels: "No roles selected",
                addButtonTitle: "Select Roles"
            }
        },
        telegram: {
            step1: {
                buttonTitle: "Connect to Telegram to get your Servers",
                inputPlaceholder: "Telegram Bot Token",
            },
            step2: {
                description: "Install the Bot in your Telegram Channel",
                buttonTitle: "Create Bot with BotFather",
                connectedText: "Your Telegram bot is connected"
            },
            step3: {
                description: "Specify channel(s) you want to grant access to for this product or subscription",
                channelTitle: "Assigned Channels:",
                channels: [{ id: "channel123456789", name: "Premium Content" },
                { id: "channel987654321", name: "Announcements" },
                { id: "channel456789123", name: "Exclusive Updates" }
                ],
                noChannels: "No channels selected",
                addButtonTitle: "Select Channels"
            }
        },
        slack: {
            step1: {
                buttonTitle: "Connect to Slack to get your Servers",
                inputPlaceholder: "Slack Workspace ID"
            },
            step2: {
                description: "Install the App in your Slack Workspace",
                buttonTitle: "Create Slack App",
                connectedText: "Your Slack App is connected"
            },
            step3: {
                description: "Specify channel(s) you want to grant access to for this product or subscription",
                channelTitle: "Assigned Channels:",
                channels: [{ id: "C0123456789", name: "premium-content" },
                { id: "C9876543210", name: "announcements" },
                { id: "C4567891230", name: "exclusive-updates" }
                ],
                noChannels: "No channels selected",
                addButtonTitle: "Select Channels"
            }
        }
    }

    constructor(
        private elementRef: ElementRef,
        private changeDetector: ChangeDetectorRef,
        private loadingService: LoadingService,
        private appHttpConfiguration: AppHttpConfiguration,
        private discordService: DiscordServiceProxy
    ) {
    }

    ngOnInit(): void {
        this.mediumTitle = this.community.id?.charAt(0).toUpperCase() + this.community.id?.slice(1);
    }

    initDeliverables(value: CommunicationDeliverableInfoWithOptions[]) {
        this.deliverables = value;
        if (!value.length)
            value.push(this.getNewEntity());

        this.deliverables.forEach(deliverable => {
            deliverable.uiOptions = deliverable.uiOptions || {};
            if (!deliverable.uiOptions.serversListInitialized && deliverable.serverId) {
                deliverable.uiOptions.serversList = [{ id: deliverable.serverId, name: deliverable.serverName }];
            }
            if (!deliverable.uiOptions.rolesListInitialized) {
                deliverable.uiOptions.rolesList = deliverable.roles ? deliverable.roles.map(v => ({ id: v.roleId, name: v.roleName })) : [];
                deliverable.uiOptions.rolesListIds = deliverable.uiOptions.rolesList.map(v => v.id);
            }
        });

        this.deliverables.forEach(deliverable => {
            if (deliverable.serverId && !deliverable.uiOptions.rolesListInitialized)
                this.getRoles(deliverable, false);
        });
        this.changeDetector.detectChanges();
    }

    getNewEntity(): CommunicationDeliverableInfoWithOptions {
        let newEntity: CommunicationDeliverableInfoWithOptions = new CommunicationDeliverableInfo();
        newEntity.type = ProductDeliverableTypes.Discord;
        newEntity.roles = [];
        newEntity.uiOptions = {};
        if (this.deliverables.length) {
            newEntity.uiOptions.serversListInitialized = this.deliverables[0].uiOptions.serversListInitialized;
            newEntity.uiOptions.serversList = this.deliverables[0].uiOptions.serversList;
        }

        return newEntity;
    }

    addNewDeliverable() {
        this.deliverables.push(this.getNewEntity());
        this.changeDetector.detectChanges();
    }

    removeDeliverable(index: number) {
        this.deliverables.splice(index, 1);
        this.changeDetector.detectChanges();
    }

    getServersOAuth(deliverable: CommunicationDeliverableInfoWithOptions) {
        switch (this.community.id) {
            case "discord": {
                this.loadingService.startLoading(this.elementRef.nativeElement);
                this.discordOAuth(deliverable);
                break;
            }
            default: {
                break;
            }
        }
    }

    getRoles(deliverable: CommunicationDeliverableInfoWithOptions, showErrors = true) {
        switch (this.community.id) {
            case "discord": {
                this.appHttpConfiguration.avoidErrorHandling = !showErrors;
                this.loadingService.startLoading(this.elementRef.nativeElement);
                this.discordService.getServerRoles(deliverable.serverId).pipe(
                    finalize(() => {
                        this.appHttpConfiguration.avoidErrorHandling = false;
                        this.loadingService.finishLoading(this.elementRef.nativeElement);
                    })
                ).subscribe(res => {
                    deliverable.uiOptions.rolesList = res;
                    deliverable.uiOptions.rolesListInitialized = true;
                    deliverable.uiOptions.isConnected = true;
                    this.changeDetector.detectChanges();
                }, error => {
                    deliverable.uiOptions.isConnected = false;
                });
                break;
            }
            default: {
                break;
            }
        }
    }

    handleConnectBot(deliverable: CommunicationDeliverableInfoWithOptions) {
        switch (this.community.id) {
            case "discord": {
                if (!deliverable.serverId || !this.hostClientId)
                    return;
                window.open(`https://discord.com/oauth2/authorize?client_id=${this.hostClientId}&permissions=8&scope=bot%20applications.commands&guild_id=${deliverable.serverId}`, "_blank");
                return;
            }
            default: {
                window.open("https://api.slack.com/apps", "_blank");
            }
        }
    }

    handleAddChannel() {
        const newChannel = this.community.id === 'slack' ? { id: `C${Date.now()}`, name: "new-channel" } :
            this.community.id === 'telegram' ? { id: `channel${Date.now()}`, name: "New Channel" }
                : { id: `${Date.now()}`, name: "New Role" }
        this.configMedium[this.community.id].step2.channels = [...this.configMedium[this.community.id].step2.channels, newChannel];
    }

    handleRemoveChannel(channelId: string) {
        this.configMedium[this.community.id].step2.channels = this.configMedium[this.community.id].step2.channels.filter((channel) => channel.id !== channelId)
    }

    onServerChanged(e, deliverable: CommunicationDeliverableInfoWithOptions) {
        if (!e.value) {
            deliverable.serverId = deliverable.serverName = null;
        } else {
            const selectedItem = deliverable.uiOptions.serversList.find(item => item.id === e.value);
            deliverable.serverName = selectedItem.name;
        }

        deliverable.uiOptions.rolesList = deliverable.uiOptions.rolesListIds = [];
        deliverable.uiOptions.rolesListInitialized = false;
        deliverable.uiOptions.isConnected = false;
        this.changeDetector.detectChanges();

        if (deliverable.serverId)
            this.getRoles(deliverable, false);
    }

    onRolesChanged(e, deliverable: CommunicationDeliverableInfoWithOptions) {
        let selectedIds: string[] = e.value;
        let values = deliverable.uiOptions.rolesList.filter(v => selectedIds.includes(v.id));
        deliverable.roles = values.map(v => new CommunicationRole({ roleId: v.id, roleName: v.name }));
    }

    discordOAuth(deliverable: CommunicationDeliverableInfoWithOptions) {
        let scopes = ['identify', 'guilds'];
        let scopesString = scopes.join('%20');
        let redirectUrl = `${AppConsts.remoteServiceBaseUrl}/account/oauth-redirect?provider=discord`;
        let popupUrl = 'https://discord.com/oauth2/authorize?response_type=code&client_id=' + this.hostClientId +
            `&redirect_uri=${redirectUrl}&scope=${scopesString}&prompt=none`;

        this.oAuthPopup = window.open(popupUrl, 'oAuthPopup', 'width=500,height=600');
        if (!this.oAuthPopup) {
            abp.notify.error('Please allow popups to authorize in External system');
            return;
        }

        this.oAuthTriggeredDeliverable = deliverable;
        const popupCheckInterval = setInterval(() => {
            if (this.oAuthPopup.closed) {
                this.oAuthPopup = null;
                clearInterval(popupCheckInterval);
                window.removeEventListener('message', messageHandler);
                this.loadingService.finishLoading(this.elementRef.nativeElement);
            }
        }, 500);

        const messageHandler = (event: MessageEvent) => {
            if (event.origin !== AppConsts.remoteServiceBaseUrl)
                return;

            if (event.data.code) {
                const authCode = event.data.code;
                this.discordService.getServers(new GetDiscordServersInput({
                    code: authCode,
                    redirectUrl: redirectUrl
                })).pipe(
                    finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
                ).subscribe(res => {
                    this.oAuthTriggeredDeliverable.uiOptions.serversList = res;
                    this.oAuthTriggeredDeliverable.uiOptions.serversListInitialized = true;
                    this.changeDetector.detectChanges();
                });
            } else {
                this.loadingService.finishLoading(this.elementRef.nativeElement);
                abp.notify.error(event.data.error || 'Failed to get data');
            }

            clearInterval(popupCheckInterval);
            window.removeEventListener('message', messageHandler);
            this.oAuthPopup.close();
            this.oAuthPopup = null;
        };

        window.addEventListener('message', messageHandler);
    }
}