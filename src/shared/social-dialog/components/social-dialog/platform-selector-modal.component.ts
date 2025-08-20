import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface Platform {
  id: string;
  name: string;
  icon: string;
  color?: string;
  urlPrefix?: string;
}

@Component({
  selector: 'app-platform-selector-modal',
  templateUrl: './platform-selector-modal.component.html',
  styleUrls: ['./platform-selector-modal.component.less']
})
export class PlatformSelectorModalComponent {
  @Input() isVisible: boolean = false;
  @Output() platformSelected = new EventEmitter<Platform>();
  @Output() modalClosed = new EventEmitter<void>();

  searchTerm: string = '';
  selectedPlatformId: string = '';
  isGridView: boolean = false;

  platforms: Platform[] = [
    {
      id: 'apple',
      name: 'Apple',
      icon: 'assets/images/platforms/apple.svg'
    },
    {
      id: 'angel',
      name: 'AngelList',
      icon: 'assets/images/platforms/angel.svg'
    },
    {
      id: 'bbb.org',
      name: 'BBB.org',
      icon: 'assets/images/platforms/bbb.svg'
    },
    {
      id: 'cb',
      name: 'Crunchbase',
      icon: 'assets/images/platforms/cb.svg'
    },
    {
      id: 'cal.com',
      name: 'Cal.com',
      icon: 'assets/images/platforms/cal.svg'
    },
    {
      id: 'calendly',
      name: 'Calendly',
      icon: 'assets/images/platforms/calendly.svg'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: 'assets/images/platforms/discord.svg'
    },
    {
      id: 'dribbble',
      name: 'Dribbble',
      icon: 'assets/images/platforms/dribbble.svg'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'assets/images/platforms/facebook.svg'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: 'assets/images/platforms/github.svg'
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      icon: 'assets/images/platforms/glassdoor.svg'
    },
    {
      id: 'google',
      name: 'Google',
      icon: 'assets/images/platforms/google.svg'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'assets/images/platforms/instagram.svg'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'assets/images/platforms/linkedin.svg'
    },
    {
      id: 'messenger',
      name: 'Messenger',
      icon: 'assets/images/platforms/messenger.svg'
    },
    {
      id: 'opencorporates',
      name: "Opencorporates",
      icon: 'assets/images/platforms/opencorporates.svg'
    },
    {
      id: 'opensea',
      name: 'OpenSea',
      icon: 'assets/images/platforms/opensea.svg'
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      icon: 'assets/images/platforms/pinterest.svg'
    },
    // {
    //   id: 'podcast',
    //   name: 'Podcast',
    //   icon: 'assets/images/platforms/podcast.svg'
    // },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: 'assets/images/platforms/reddit.svg'
    },
    {
      id: 'rss',
      name: 'RSS',
      icon: 'assets/images/platforms/rss.svg'
    },
    {
      id: 'skype',
      name: 'Skype',
      icon: 'assets/images/platforms/skype.svg'
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: 'assets/images/platforms/slack.svg'
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      icon: 'assets/images/platforms/snapchat.svg'
    },
    {
      id: 'soundcloud',
      name: 'SoundCloud',
      icon: 'assets/images/platforms/cloud.svg'
    },
    {
      id: 'substack',
      name: 'Substack',
      icon: 'assets/images/platforms/substack.svg'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      icon: 'assets/images/platforms/teams.svg'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: 'assets/images/platforms/telegram.svg'
    },
    {
      id: 'threads',
      name: 'Threads',
      icon: 'assets/images/platforms/threads.svg'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: 'assets/images/platforms/tiktok.svg'
    },
    {
      id: 'trustpilot',
      name: 'Trustpilot',
      icon: 'assets/images/platforms/trustpilot.svg'
    },
    {
      id: 'tweach',
      name: 'Tweach',
      icon: 'assets/images/platforms/tweach.svg'
    },
    {
      id: 'viber',
      name: 'Viber',
      icon: 'assets/images/platforms/viber.svg'
    },
    {
      id: 'vimeo',
      name: 'Vimeo',
      icon: 'assets/images/platforms/vimeo.svg'
    },
    // {
    //   id: 'website',
    //   name: 'Website',
    //   icon: 'assets/images/platforms/website.svg'
    // },
    {
      id: 'wechat',
      name: 'WeChat',
      icon: 'assets/images/platforms/wechat.svg'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: 'assets/images/platforms/whatsapp.svg'
    },
    {
      id: 'x.com',
      name: 'X.com',
      icon: 'assets/images/platforms/x.svg'
    },
    {
      id: 'yelp',
      name: 'Yelp',
      icon: 'assets/images/platforms/yelp.svg'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'assets/images/platforms/Youtube.svg'
    },
    {
      id: 'zoom',
      name: 'Zoom',
      icon: 'assets/images/platforms/zoom.svg'
    }
  ];

  getSocialAppBackground(platform: string): string {
    switch (platform.toLowerCase()) {
      case "facebook": return "social-bg-facebook";
      case "instagram": return "social-bg-instagram";
      case "x.com": return "social-bg-x";
      case "linkedin": return "social-bg-linkedin";
      case "youtube": return "social-bg-youtube";
      case "tiktok": return "social-bg-tiktok";
      case "discord": return "social-bg-discord";
      case "github": return "social-bg-github";
      case "whatsapp": return "social-bg-whatsapp";
      case "telegram": return "social-bg-telegram";
      case "pinterest": return "social-bg-pinterest";
      case "reddit": return "social-bg-reddit";
      case "snapchat": return "social-bg-snapchat";
      case "tweach": return "social-bg-tweach";
      case "dribbble": return "social-bg-dribbble";
      case "soundcloud": return "social-bg-soundcloud";
      case "skype": return "social-bg-skype";
      case "zoom": return "social-bg-zoom";
      case "vimeo": return "social-bg-vimeo";
      case "threads": return "social-bg-threads";
      case "cal.com": return "social-bg-cal";
      case "calendly": return "social-bg-calendly";
      case "podcast": return "social-bg-podcast";
      case "rss": return "social-bg-rss";
      case "slack": return "social-bg-slack";
      case "substack": return "social-bg-substack";
      case "yelp": return "social-bg-yelp";
      case "website": return "social-bg-website";
      case "apple": return "social-bg-apple";
      case "viber": return "social-bg-viber";
      case "messenger": return "social-bg-messenger";
      case "wechat": return "social-bg-wechat";
      case "google": return "social-bg-google";
      case "onlinecourse": return "social-bg-onlinecourse";
      case "teams": return "social-bg-teams";
      case "opensea": return "social-bg-opensea";
      case "cb": return "social-bg-cb";
      case "angel": return "social-bg-angel";
      default: return "social-bg-default";
    }
  }

  get filteredPlatforms(): Platform[] {
    if (!this.searchTerm) {
      return this.platforms;
    }
    return this.platforms.filter(platform =>
      platform.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getPlatformUrlPrefix(platform: string): string {
    switch (platform.toLowerCase()) {
      case "angel": return "https://angel.co/u/";
      case "apple": return "https://www.apple.com/";
      case "cal.com": return "https://cal.com/";
      case "calendly": return "https://calendly.com/";
      case "cb": return "https://www.crunchbase.com/person/";
      case "discord": return "https://discord.gg/";
      case "dribbble": return "https://dribbble.com/";
      case "facebook": return "https://www.facebook.com/";
      case "github": return "https://github.com/";
      case "glassdoor": return "https://www.glassdoor.com/Overview/";
      case "google": return "https://www.google.com/";
      case "instagram": return "https://www.instagram.com/";
      case "linkedin": return "https://www.linkedin.com/in/";
      case "messenger": return "https://m.me/";
      case "opensea": return "https://opensea.io/";
      case "pinterest": return "https://www.pinterest.com/";
      case "podcast": return "https://";
      case "rss": return "https://";
      case "reddit": return "https://www.reddit.com/user/";
      case "skype": return "https://www.skype.com/";
      case "slack": return "https://slack.com/";
      case "snapchat": return "https://www.snapchat.com/add/";
      case "soundcloud": return "https://soundcloud.com/";
      case "substack": return "https://substack.com/@";
      case "telegram": return "https://t.me/";
      case "threads": return "https://www.threads.net/@";
      case "tiktok": return "https://www.tiktok.com/@";
      case "trustpilot": return "https://www.trustpilot.com/";
      case "tweach": return "https://tweach.com/";
      case "viber": return "https://chats.viber.com/";
      case "vimeo": return "https://vimeo.com/";
      case "wechat": return "https://www.wechat.com/";
      case "whatsapp": return "https://wa.me/";
      case "teams": return "https://www.microsoft.com/en-us/microsoft-teams";
      case "x.com": return "https://x.com/";
      case "yelp": return "https://www.yelp.com/biz/";
      case "youtube": return "https://www.youtube.com/@";
      case "zoom": return "https://zoom.us/my/";
      case "website": return "https://";
      case "opencorporates": return 'https://opencorporates.com/';
      default: return "https://";
    }
  }

  selectPlatform(platform: Platform): void {
    this.selectedPlatformId = platform.id;
    // Get the URL prefix for the selected platform
    const urlPrefix = this.getPlatformUrlPrefix(platform.name);
    
    // Create a platform object with the URL prefix
    const platformWithUrl = {
      ...platform,
      urlPrefix: urlPrefix
    };
    
    this.platformSelected.emit(platformWithUrl);
    this.closeModal();
  }

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  toggleTheme(): void {
    // Theme toggle functionality
    console.log('Theme toggled');
  }

  toggleViewMode(): void {
    this.isGridView = !this.isGridView;
  }

  onSearch(): void {
    // Search functionality is handled by the getter
  }
}
