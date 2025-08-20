import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
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
      id: 'facebook',
      name: 'Facebook',
      icon: 'assets/images/platforms/facebook.svg',
      color: '#1877f2'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'assets/images/platforms/twitter.svg',
      color: '#1da1f2'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'assets/images/platforms/linkedin.svg',
      color: '#0077b5'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'assets/images/platforms/instagram.svg',
      color: '#e4405f'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'assets/images/platforms/youtube.svg',
      color: '#ff0000'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: 'assets/images/platforms/tiktok.svg',
      color: '#000000'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: 'assets/images/platforms/whatsapp.svg',
      color: '#25d366'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: 'assets/images/platforms/telegram.svg',
      color: '#0088cc'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: 'assets/images/platforms/discord.svg',
      color: '#5865f2'
    },
    {
      id: 'website',
      name: 'Website',
      icon: 'assets/images/platforms/website.svg',
      color: '#6366f1'
    },
    {
      id: 'calendly',
      name: 'Calendly',
      icon: 'assets/images/platforms/calendly.svg',
      color: '#006bff'
    },
    {
      id: 'cal.com',
      name: 'Cal.com',
      icon: 'assets/images/platforms/cal.svg',
      color: '#000000'
    },
    {
      id: 'crunchbase',
      name: 'Crunchbase',
      icon: 'assets/images/platforms/crunchbase.svg',
      color: '#8B5CF6'
    },
    {
      id: 'angellist',
      name: 'AngelList',
      icon: 'assets/images/platforms/angellist.svg',
      color: '#8B5CF6'
    },
    {
      id: 'bbb.org',
      name: 'BBB.org',
      icon: 'assets/images/platforms/bbb.svg',
      color: '#007BFF'
    },
    {
      id: 'bluesky',
      name: 'BlueSky',
      icon: 'assets/images/platforms/bluesky.svg',
      color: '#007BFF'
    }
  ];

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
      case "angellist": return "https://angel.co/u/";
      case "apple": return "https://www.apple.com/";
      case "bbb.org": return "https://www.bbb.org/";
      case "cal.com": return "https://cal.com/";
      case "calendly": return "https://calendly.com/";
      case "crunchbase": return "https://www.crunchbase.com/person/";
      case "discord": return "https://discord.gg/";
      case "dribbble": return "https://dribbble.com/";
      case "facebook": return "https://www.facebook.com/";
      case "github": return "https://github.com/";
      case "glassdoor": return "https://www.glassdoor.com/Overview/";
      case "google reviews": return "https://www.google.com/maps/place/";
      case "instagram": return "https://www.instagram.com/";
      case "linkedin": return "https://www.linkedin.com/in/";
      case "messenger": return "https://m.me/";
      case "nav": return "https://www.nav.com/company/";
      case "opencorporates": return "https://opencorporates.com/companies/";
      case "opensea": return "https://opensea.io/";
      case "paypal.me": return "https://paypal.me/";
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
      case "trustpilot": return "https://www.trustpilot.com/review/";
      case "twitch": return "https://twitch.tv/";
      case "up": return "https://upapp.us/";
      case "upscroll": return "https://upscroll.com/";
      case "viber": return "https://chats.viber.com/";
      case "vimeo": return "https://vimeo.com/";
      case "wechat": return "https://www.wechat.com/";
      case "whatsapp": return "https://wa.me/";
      case "teams": return "https://www.microsoft.com/en-us/microsoft-teams";
      case "x.com": return "https://x.com/";
      case "yelp": return "https://www.yelp.com/biz/";
      case "youtube": return "https://www.youtube.com/@";
      case "zoom": return "https://zoom.us/my/";
      case "your website": return "https://";
      case "other link": return "https://";
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
