import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Platform } from './platform.interface';
import { platforms } from './platforms.data';


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
  platforms: Platform[] = platforms;

  

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
      case "opencorporates": return 'https://opencorporates.com/';
      case "bbb.org": return "https://www.bbb.org/";
      default: return "https://";
    }
  }

  selectPlatform(platform: Platform): void {
    this.selectedPlatformId = platform.id;
    // Get the URL prefix for the selected platform
    const urlPrefix = this.getPlatformUrlPrefix(platform.id);
    // Create a platform object with the URL prefix and color
    const platformWithUrl = {
      ...platform,
      urlPrefix: urlPrefix,
      color: this.getPlatformColor(platform.name)
    };
    
    this.platformSelected.emit(platformWithUrl);
    this.closeModal();
  }

  // Get platform color for consistent styling
  private getPlatformColor(platformName: string): string {
    const platformColors: { [key: string]: string } = {
      'Facebook': '#1877f2',
      'Twitter': '#1da1f2',
      'X.com': '#000000',
      'LinkedIn': '#0077b5',
      'Instagram': '#e4405f',
      'YouTube': '#ff0000',
      'TikTok': '#000000',
      'WhatsApp': '#25d366',
      'Telegram': '#0088cc',
      'Discord': '#5865f2',
      'GitHub': '#333333',
      'Reddit': '#ff4500',
      'Snapchat': '#fffc00',
      'Pinterest': '#bd081c',
      'Skype': '#00aff0',
      'Zoom': '#2d8cff',
      'Vimeo': '#1ab7ea',
      'SoundCloud': '#ff7700',
      'Twitch': '#9146ff',
      'Steam': '#171a21'
    };
    
    return platformColors[platformName] || '#6366f1';
  }

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

 

  toggleViewMode(): void {
    this.isGridView = !this.isGridView;
  }

  onSearch(): void {
    // Search functionality is handled by the getter
  }
}
