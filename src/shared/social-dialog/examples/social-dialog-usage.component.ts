import { Component } from '@angular/core';
import { SocialDialogService } from '../services/social-dialog.service';
import { SocialLinkData } from '../components/social-dialog/social-dialog.component';

@Component({
  selector: 'app-social-dialog-usage',
  template: `
    <div class="usage-container">
      <h2>Social Dialog Usage Examples</h2>
      
      <div class="button-group">
        <button class="btn btn-primary" (click)="openCreateDialog()">
          Create New Social Link
        </button>
        
        <button class="btn btn-secondary" (click)="openEditDialog()">
          Edit Existing Social Link
        </button>
      </div>

      <div class="result-display" *ngIf="lastResult">
        <h3>Last Dialog Result:</h3>
        <pre>{{ lastResult  }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .usage-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .button-group {
      display: flex;
      gap: 12px;
      margin: 20px 0;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background: #0056b3;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #5a6268;
    }
    
    .result-display {
      margin-top: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #dee2e6;
    }
    
    pre {
      background: white;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
  `]
})
export class SocialDialogUsageComponent {
  lastResult: SocialLinkData | undefined;

  constructor(private socialDialogService: SocialDialogService) {}

  openCreateDialog(): void {
    this.socialDialogService.openSocialDialogForCreate().subscribe(result => {
      if (result) {
        this.lastResult = result;
        console.log('New social link created:', result);
      }
    });
  }

  openEditDialog(): void {
    const existingLink: SocialLinkData = {
      platform: 'facebook',
      url: 'https://facebook.com/example',
      comment: 'My Facebook page',
      isActive: true,
      isConfirmed: false
    };

    this.socialDialogService.openSocialDialogForEdit(existingLink).subscribe(result => {
      if (result) {
        this.lastResult = result;
        console.log('Social link updated:', result);
      }
    });
  }
}
