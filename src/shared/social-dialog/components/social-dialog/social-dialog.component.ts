import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Platform, PlatformSelectorModalComponent } from './platform-selector-modal.component';

export interface SocialLinkData {
  platform?: string;
  url?: string;
  comment?: string;
  isActive?: boolean;
  isConfirmed?: boolean;
}

@Component({
  selector: 'app-social-dialog',
  templateUrl: './social-dialog.component.html',
  styleUrls: ['./social-dialog.component.less']
})
export class SocialDialogComponent implements OnInit {
  socialForm: FormGroup;
  platforms: Platform[] = [
    { id: 'facebook', name: 'Facebook', icon: 'assets/images/platforms/facebook.svg', color: '#1877f2' },
    { id: 'twitter', name: 'Twitter', icon: 'assets/images/platforms/twitter.svg', color: '#1da1f2' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'assets/images/platforms/linkedin.svg', color: '#0077b5' },
    { id: 'instagram', name: 'Instagram', icon: 'assets/images/platforms/instagram.svg', color: '#e4405f' },
    { id: 'youtube', name: 'YouTube', icon: 'assets/images/platforms/youtube.svg', color: '#ff0000' },
    { id: 'tiktok', name: 'TikTok', icon: 'assets/images/platforms/tiktok.svg', color: '#000000' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'assets/images/platforms/whatsapp.svg', color: '#25d366' },
    { id: 'telegram', name: 'Telegram', icon: 'assets/images/platforms/telegram.svg', color: '#0088cc' },
    { id: 'discord', name: 'Discord', icon: 'assets/images/platforms/discord.svg', color: '#5865f2' },
    { id: 'website', name: 'Website', icon: 'assets/images/platforms/website.svg', color: '#6366f1' },
    { id: 'calendly', name: 'Calendly', icon: 'assets/images/platforms/calendly.svg', color: '#006bff' },
    { id: 'cal', name: 'Cal.com', icon: 'assets/images/platforms/cal.svg', color: '#000000' },
    { id: 'crunchbase', name: 'Crunchbase', icon: 'assets/images/platforms/crunchbase.svg', color: '#0288d1' },
    { id: 'angellist', name: 'AngelList', icon: 'assets/images/platforms/angellist.svg', color: '#000000' },
    { id: 'bbb', name: 'BBB.org', icon: 'assets/images/platforms/bbb.svg', color: '#0066cc' },
    { id: 'bluesky', name: 'BlueSky', icon: 'assets/images/platforms/bluesky.svg', color: '#0085ff' }
  ];
  showPlatformSelector: boolean = false;
  selectedPlatform: Platform | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SocialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SocialLinkData
  ) {
    this.socialForm = this.fb.group({
      platform: ['', Validators.required],
      url: ['', [Validators.required]],
      comment: [''],
      isActive: [false],
      isConfirmed: [false]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.socialForm.patchValue({
        platform: this.data.platform || '',
        url: this.data.url || '',
        comment: this.data.comment || '',
        isActive: this.data.isActive || false,
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
      // Combine platform and URL data
      const result = {
        ...formData,
        platform: this.selectedPlatform ? this.selectedPlatform.name : formData.platform
      };
      this.dialogRef.close(result);
    }
  }

  openPlatformSelector(): void {
    this.showPlatformSelector = true;
  }

  onPlatformSelected(platform: Platform): void {
    this.selectedPlatform = platform;
    console.log(platform);
    this.socialForm.patchValue({
      platform: platform.name,
      url: platform.urlPrefix || ''
    });
    this.showPlatformSelector = false;
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
    return this.socialForm.valid && !!this.selectedPlatform;
  }

 
}
