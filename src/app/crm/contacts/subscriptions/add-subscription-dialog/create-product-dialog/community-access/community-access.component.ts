/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    Input,
    ViewEncapsulation,
    AfterViewInit,
    OnInit,
} from '@angular/core';


/** Third party imports */
import { Plus, X } from 'lucide-angular';

/** Application imports */


@Component({
    selector: 'community-access-selector',
    templateUrl: './community-access.component.html',
    styleUrls: [
        '../../../subscriptions-base.less',
        './community-access.component.less'
    ],
    providers: [
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunityAccessSelectorComponent implements OnInit {
    @Input() community: any;

    readonly Plus = Plus;
    readonly X = X;

    mediumTitle: string;
    isConnected: boolean = true;

    configMedium = {
        discord: {
            step1: {
                description: "install the Upgrade.chat Bot in your Discord Server",
                buttonTitle: "Install Bot In Your Server",
                link: "https://discord.com/oauth2/authorize?permissions=8&guild_id=1367708807555186738&response_type=code&redirect_uri=https%3A%2F%2Fapi-custom-domains-staging.upgrade.chat%2Fauth%2Fdiscord-bot%2Fcallback&scope=bot%20applications.commands&state=%7B%7D&client_id=1078561663202115714",
                inputPlaceholder: "My Discord Server Build ID",
                connectedText: "Your Discord bot is connected"
            },
            step2: {
                description: "Specify role(s) you want to grant a member of this product or subscription",
                channelTitle: "Assigned Role IDs:",
                channels: [{ id: "1353113605926817912", name: "Premium Member" },
                    { id: "1353826886026793011", name: "VIP" },
                    { id: "1353827766503473202", name: "Early Access" }
                ],
                noChannels: "No roles selected",
                addButtonTitle: "Select Roles"
            }
        },
        telegram: {
            step1: {
                description: "Install the Bot in your Telegram Channel",
                buttonTitle: "Create Bot with BotFather",
                link: "https://telegram.me/botfather",
                inputPlaceholder: "Telegram Bot Token",
                connectedText: "Your Telegram bot is connected"
            },
            step2: {
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
                description: "Install the App in your Slack Workspace",
                buttonTitle: "Create Slack App",
                link: "https://api.slack.com/apps",
                inputPlaceholder: "Slack Workspace ID",
                connectedText: "Your Slack App is connected"
            },
            step2: {
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

    constructor() {
    }
    
    ngOnInit(): void {
        this.mediumTitle = this.community.id?.charAt(0).toUpperCase() + this.community.id?.slice(1);
    }

    handleConnectBot() {
        window.open("https://api.slack.com/apps", "_blank");
        this.isConnected = true;
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
}