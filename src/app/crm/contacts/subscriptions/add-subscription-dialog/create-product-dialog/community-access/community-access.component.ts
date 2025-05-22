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
import { CommunicationDeliverableInfo, CommunicationRole, DiscordServiceProxy, GetDiscordServersInput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { finalize } from 'rxjs/operators';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';

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
    set data(value: CommunicationDeliverableInfo[]) {
        this.deliverables = value;
        if (value && value[0])
            this.setCurrentDeliverable(value[0]);
    }
    @Input() hostClientId: string;

    deliverables: CommunicationDeliverableInfo[] = [];
    currentDeliverable: CommunicationDeliverableInfo = new CommunicationDeliverableInfo();

    serversList: any[] = [];
    serversListInitialized = false;
    rolesList: any[] = [];
    rolesListIds: string[] = [];
    rolesListInitialized = false;

    readonly Plus = Plus;
    readonly X = X;

    mediumTitle: string;
    isConnected: boolean = false;

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
        if (this.currentDeliverable.serverId)
            this.getRoles(false);
    }

    setCurrentDeliverable(value: CommunicationDeliverableInfo) {
        this.currentDeliverable = value;
        if (!this.serversListInitialized && this.currentDeliverable.serverId) {
            this.serversList = [{ id: this.currentDeliverable.serverId, name: this.currentDeliverable.serverName }];
        }
        if (!this.rolesListInitialized) {
            this.rolesList = this.currentDeliverable.roles ? this.currentDeliverable.roles.map(v => ({ id: v.roleId, name: v.roleName })) : [];
            this.rolesListIds = this.rolesList.map(v => v.id);
        }
        this.changeDetector.detectChanges();
    }

    getServersOAuth() {
        switch (this.community.id) {
            case "discord": {
                this.loadingService.startLoading(this.elementRef.nativeElement);
                this.discordOAuth();
                break;
            }
            default: {
                break;
            }
        }
    }

    getRoles(showErrors = true) {
        switch (this.community.id) {
            case "discord": {
                this.appHttpConfiguration.avoidErrorHandling = !showErrors;
                this.loadingService.startLoading(this.elementRef.nativeElement);
                this.discordService.getServerRoles(this.currentDeliverable.serverId).pipe(
                    finalize(() => {
                        this.appHttpConfiguration.avoidErrorHandling = false;
                        this.loadingService.finishLoading(this.elementRef.nativeElement);
                    })
                ).subscribe(res => {
                    this.rolesList = res;
                    this.rolesListInitialized = true;
                    this.isConnected = true;
                    this.changeDetector.detectChanges();
                }, error => {
                    this.isConnected = false;
                });
                break;
            }
            default: {
                break;
            }
        }
    }

    handleConnectBot() {
        switch (this.community.id) {
            case "discord": {
                if (!this.currentDeliverable.serverId || !this.hostClientId)
                    return;
                window.open(`https://discord.com/oauth2/authorize?client_id=${this.hostClientId}&permissions=8&scope=bot%20applications.commands&guild_id=${this.currentDeliverable.serverId}`, "_blank");
                return;
            }
            default: {
                window.open("https://api.slack.com/apps", "_blank");
                this.isConnected = true;
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

    onServerChanged(e) {
        if (!e.value) {
            this.currentDeliverable.serverId = this.currentDeliverable.serverName = null;
        } else {
            const selectedItem = this.serversList.find(item => item.id === e.value);
            this.currentDeliverable.serverName = selectedItem.name;
        }

        this.rolesList = this.rolesListIds = [];
        this.rolesListInitialized = false;
        this.isConnected = false;
        this.changeDetector.detectChanges();

        if (this.currentDeliverable.serverId)
            this.getRoles(false);
    }

    onRolesChanged(e) {
        let selectedIds: string[] = e.value;
        let values = this.rolesList.filter(v => selectedIds.includes(v.id));
        this.currentDeliverable.roles = values.map(v => new CommunicationRole({ roleId: v.id, roleName: v.name }));
    }

    discordOAuth() {
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
                    this.serversList = res;
                    this.serversListInitialized = true;
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