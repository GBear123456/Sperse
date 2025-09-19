import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {platforms} from './platforms.data'
import { Platform } from './platform.interface';

export interface SocialLinkData {
  platform?: string;
  url?: string;
  comment?: string;
  isActive?: boolean;
  isConfirmed?: boolean;
  linkTypeId?: string;
  id?: string; 
}

@Component({
  selector: 'app-social-dialog',
  templateUrl: './social-dialog.component.html',
  styleUrls: ['./social-dialog.component.less']
})
export class SocialDialogComponent implements OnInit {
  socialForm: FormGroup;
  platforms: Platform[] = platforms;
  showPlatformSelector: boolean = false;
  selectedPlatform: Platform | null = null;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SocialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SocialLinkData
  ) {
    this.socialForm = this.fb.group({
      url: ['', [Validators.required]],
      comment: [''],
      isActive: [true],
      isConfirmed: [false]
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!(this.data && this.data.id);
    
    if (this.data) {
      if (this.data.platform) {
        this.selectedPlatform = this.platforms.find(p => p.name === this.data.platform) || null;
      }
      
      if (!this.selectedPlatform && this.data.url) {
        this.selectedPlatform = this.findPlatformByUrl(this.data.url);
      }
      
      this.socialForm.patchValue({
        url: this.data.url || '',
        comment: this.data.comment || '',
        isActive: this.data.isActive !== undefined ? this.data.isActive : true,
        isConfirmed: this.data.isConfirmed || false
      });
      
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.socialForm.valid) {
      const formData = this.socialForm.value;
      
      // For new links, platform selection is required
      if (!this.isEditMode && !this.selectedPlatform) {
        console.log('Form validation failed: Platform selection required for new links');
        return;
      }
      
      // Construct the full URL if it doesn't start with http
      let finalUrl = formData.url;
      if (finalUrl && !finalUrl.match(/^https?:\/\//)) {
        if (this.selectedPlatform && this.selectedPlatform.urlPrefix) {
          finalUrl = this.selectedPlatform.urlPrefix + finalUrl;
        } else {
          finalUrl = 'https://' + finalUrl;
        }
      }

      // Create the result object with all necessary data
      const result = {
        id: this.data?.id, // Include ID if editing
        platform: this.selectedPlatform ? this.selectedPlatform.name : (this.data?.platform || ''),
        platformId: this.selectedPlatform ? this.selectedPlatform.id : '',
        url: finalUrl,
        comment: formData.comment,
        isActive: formData.isActive,
        isConfirmed: formData.isConfirmed,
        linkTypeId: this.selectedPlatform ? this.getLinkTypeId(this.selectedPlatform.id) : (this.data?.linkTypeId || 'other'),
        isEditMode: this.isEditMode
      };
      
      this.dialogRef.close(result);
    } else {
      console.log('Form validation failed:', {
        formValid: this.socialForm.valid,
        platformSelected: !!this.selectedPlatform,
        isEditMode: this.isEditMode,
        formErrors: this.socialForm.errors,
        urlErrors: this.socialForm.get('url')?.errors
      });
    }
  }

  openPlatformSelector(): void {
    this.showPlatformSelector = true;
  }

  onPlatformSelected(platform: Platform): void {
    console.log('Platform selected:', platform);
    this.selectedPlatform = platform;
    // Clear URL when platform changes
    this.socialForm.patchValue({
      url: platform.urlPrefix || ''
    });
    this.showPlatformSelector = false;
    console.log('Form updated after platform selection:', this.socialForm.value);
  }

  onPlatformSelectorClosed(): void {
    this.showPlatformSelector = false;
  }

  openExternalLink(): void {
    const url = this.socialForm.get('url')?.value;
    if (url) {
      window.open(url, '_blank');
    }
  }

  get isFormValid(): boolean {
    // In edit mode, we only need the form to be valid (URL field filled)
    // In create mode, we need both form valid and platform selected
    if (this.isEditMode) {
      return this.socialForm.valid; // Only require form validation in edit mode
    } else {
      return this.socialForm.valid && !!this.selectedPlatform; // Require both in create mode
    }
  }

  // Map platform IDs to link type IDs for the CRM system
  private getLinkTypeId(platformId: string): string {
    const platformToLinkTypeMap: { [key: string]: string } = {
      'apple': 'apple',
      'angel': 'angellist',
      'bbb.org': 'bbb',
      'cb': 'crunchbase',
      'cal.com': 'cal',
      'calendly': 'calendly',
      'discord': 'discord',
      'dribbble': 'dribbble',
      'facebook': 'facebook',
      'github': 'github',
      'glassdoor': 'glassdoor',
      'google': 'google',
      'instagram': 'instagram',
      'linkedin': 'linkedin',
      'messenger': 'messenger',
      'opencorporates': 'opencorporates',
      'opensea': 'opensea',
      'pinterest': 'pinterest',
      'reddit': 'reddit',
      'rss': 'rss',
      'skype': 'skype',
      'slack': 'slack',
      'snapchat': 'snapchat',
      'soundcloud': 'soundcloud',
      'substack': 'substack',
      'teams': 'teams',
      'telegram': 'telegram',
      'threads': 'threads',
      'tiktok': 'tiktok',
      'trustpilot': 'trustpilot',
      'tweach': 'tweach',
      'viber': 'viber',
      'vimeo': 'vimeo',
      'wechat': 'wechat',
      'whatsapp': 'whatsapp',
      'x.com': 'twitter',
      'yelp': 'yelp',
      'youtube': 'youtube',
      'zoom': 'zoom'
    };
    
    return platformToLinkTypeMap[platformId] || 'other';
  }

  // Get helpful tips for each platform
  getPlatformTip(platformId: string): string {
    const platformTips: { [key: string]: string } = {
      'facebook': 'Enter your username (e.g., "john.doe") or paste the full profile URL',
      'twitter': 'Enter your username (e.g., "@johndoe") or paste the full profile URL',
      'linkedin': 'Enter your username (e.g., "johndoe") or paste the full profile URL',
      'instagram': 'Enter your username (e.g., "johndoe") or paste the full profile URL',
      'youtube': 'Enter your channel name (e.g., "JohnDoeChannel") or paste the full channel URL',
      'tiktok': 'Enter your username (e.g., "@johndoe") or paste the full profile URL',
      'whatsapp': 'Enter your phone number (e.g., "1234567890") or paste the full WhatsApp link',
      'telegram': 'Enter your username (e.g., "johndoe") or paste the full profile URL',
      'discord': 'Enter your Discord username or paste the full invite link',
      'website': 'Enter your website URL (e.g., "example.com") or paste the full URL',
      'calendly': 'Enter your Calendly username or paste the full Calendly link',
      'cal': 'Enter your Cal.com username or paste the full Cal.com link',
      'crunchbase': 'Enter your Crunchbase profile name or paste the full profile URL',
      'angellist': 'Enter your AngelList username or paste the full profile URL',
      'bbb': 'Enter your BBB business name or paste the full BBB profile URL',
      'bluesky': 'Enter your BlueSky handle (e.g., "@johndoe.bsky.social") or paste the full profile URL'
    };
    
    return platformTips[platformId] || 'Enter your profile information or paste the full URL';
  }

  // Helper method to find platform based on URL
  private findPlatformByUrl(url: string): Platform | null {
    if (!url) return null;
    
    const urlLower = url.toLowerCase();
    
    // Check for platform-specific URL patterns
    if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) {
      return this.platforms.find(p => p.id === 'facebook') || null;
    } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
      return this.platforms.find(p => p.id === 'x.com') || null;
    } else if (urlLower.includes('linkedin.com')) {
      return this.platforms.find(p => p.id === 'linkedin') || null;
    } else if (urlLower.includes('instagram.com')) {
      return this.platforms.find(p => p.id === 'instagram') || null;
    } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return this.platforms.find(p => p.id === 'youtube') || null;
    } else if (urlLower.includes('tiktok.com')) {
      return this.platforms.find(p => p.id === 'tiktok') || null;
    } else if (urlLower.includes('whatsapp.com') || urlLower.includes('wa.me')) {
      return this.platforms.find(p => p.id === 'whatsapp') || null;
    } else if (urlLower.includes('t.me')) {
      return this.platforms.find(p => p.id === 'telegram') || null;
    } else if (urlLower.includes('discord.gg') || urlLower.includes('discord.com')) {
      return this.platforms.find(p => p.id === 'discord') || null;
    } else if (urlLower.includes('github.com')) {
      return this.platforms.find(p => p.id === 'github') || null;
    } else if (urlLower.includes('reddit.com')) {
      return this.platforms.find(p => p.id === 'reddit') || null;
    } else if (urlLower.includes('snapchat.com')) {
      return this.platforms.find(p => p.id === 'snapchat') || null;
    } else if (urlLower.includes('pinterest.com')) {
      return this.platforms.find(p => p.id === 'pinterest') || null;
    } else if (urlLower.includes('skype.com')) {
      return this.platforms.find(p => p.id === 'skype') || null;
    } else if (urlLower.includes('zoom.us')) {
      return this.platforms.find(p => p.id === 'zoom') || null;
    } else if (urlLower.includes('vimeo.com')) {
      return this.platforms.find(p => p.id === 'vimeo') || null;
    } else if (urlLower.includes('soundcloud.com')) {
      return this.platforms.find(p => p.id === 'soundcloud') || null;
    } else if (urlLower.includes('slack.com')) {
      return this.platforms.find(p => p.id === 'slack') || null;
    } else if (urlLower.includes('teams.microsoft.com')) {
      return this.platforms.find(p => p.id === 'teams') || null;
    } else if (urlLower.includes('calendly.com')) {
      return this.platforms.find(p => p.id === 'calendly') || null;
    } else if (urlLower.includes('cal.com')) {
      return this.platforms.find(p => p.id === 'cal.com') || null;
    } else if (urlLower.includes('crunchbase.com')) {
      return this.platforms.find(p => p.id === 'cb') || null;
    } else if (urlLower.includes('angel.co')) {
      return this.platforms.find(p => p.id === 'angel') || null;
    } else if (urlLower.includes('bbb.org')) {
      return this.platforms.find(p => p.id === 'bbb.org') || null;
    } else if (urlLower.includes('glassdoor.com')) {
      return this.platforms.find(p => p.id === 'glassdoor') || null;
    } else if (urlLower.includes('opencorporates.com')) {
      return this.platforms.find(p => p.id === 'opencorporates') || null;
    } else if (urlLower.includes('opensea.io')) {
      return this.platforms.find(p => p.id === 'opensea') || null;
    } else if (urlLower.includes('substack.com')) {
      return this.platforms.find(p => p.id === 'substack') || null;
    } else if (urlLower.includes('threads.net')) {
      return this.platforms.find(p => p.id === 'threads') || null;
    } else if (urlLower.includes('trustpilot.com')) {
      return this.platforms.find(p => p.id === 'trustpilot') || null;
    } else if (urlLower.includes('tweach.com')) {
      return this.platforms.find(p => p.id === 'tweach') || null;
    } else if (urlLower.includes('chats.viber.com')) {
      return this.platforms.find(p => p.id === 'viber') || null;
    } else if (urlLower.includes('wechat.com')) {
      return this.platforms.find(p => p.id === 'wechat') || null;
    } else if (urlLower.includes('yelp.com')) {
      return this.platforms.find(p => p.id === 'yelp') || null;
    }
    
    // If no specific platform found, check if it's a general website
    if (urlLower.includes('http') && !urlLower.includes('://')) {
      return this.platforms.find(p => p.id === 'website') || null;
    }
    
    return null;
  }
}
