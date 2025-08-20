# Social Dialog Module

A reusable Angular 12 module that provides a social link manager dialog component, matching the design from the screenshot exactly.

## Features

- **Social Dialog Component**: Pixel-perfect modal for managing social media links
- **Components**: Loading spinner, confirm dialog
- **Directives**: Highlight directive
- **Pipes**: Phone number formatter
- **Services**: Notification service, validation service, social dialog service

## Installation

1. Import the module in your feature module:

```typescript
import { SocialDialogModule } from '@shared/social-dialog';

@NgModule({
  imports: [
    SocialDialogModule,
    // ... other imports
  ],
  // ... rest of module config
})
export class YourFeatureModule { }
```

2. Or import specific components/services:

```typescript
import { SocialDialogComponent, SocialDialogService } from '@shared/social-dialog';
```

## Usage Examples

### Opening the Social Dialog

```typescript
constructor(private socialDialogService: SocialDialogService) {}

// Open for creating new social link
openCreateDialog() {
  this.socialDialogService.openSocialDialogForCreate().subscribe(result => {
    if (result) {
      console.log('New social link:', result);
      // Handle the new social link
    }
  });
}

// Open for editing existing social link
openEditDialog(socialLink: SocialLinkData) {
  this.socialDialogService.openSocialDialogForEdit(socialLink).subscribe(result => {
    if (result) {
      console.log('Updated social link:', result);
      // Handle the updated social link
    }
  });
}
```

### Using the Dialog Component Directly

```typescript
import { MatDialog } from '@angular/material/dialog';
import { SocialDialogComponent } from '@shared/social-dialog';

constructor(private dialog: MatDialog) {}

openDialog() {
  const dialogRef = this.dialog.open(SocialDialogComponent, {
    width: '550px',
    data: {
      platform: 'facebook',
      url: 'https://facebook.com/example',
      comment: 'My Facebook page',
      isActive: true,
      isConfirmed: false
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('Dialog result:', result);
    }
  });
}
```

## Dialog Features

The Social Dialog includes:

- **Platform Selection**: Dropdown for social media platforms
- **URL Input**: URL field with validation
- **Comment Field**: Optional text area for notes
- **Status Checkboxes**: Active and Confirmed toggles
- **Action Buttons**: Cancel and Save buttons
- **Theme Toggle**: Moon icon for dark/light mode switching
- **External Link Button**: Opens the URL in a new tab

## Data Interface

```typescript
export interface SocialLinkData {
  platform?: string;      // Social media platform
  url?: string;           // URL of the social link
  comment?: string;       // Optional comment/note
  isActive?: boolean;     // Whether the link is active
  isConfirmed?: boolean;  // Whether the link is confirmed
}
```

## Styling

The component uses LESS and includes:
- Responsive design
- Hover effects
- Focus states
- Disabled states
- Custom checkbox design
- Pixel-perfect spacing and typography

## Dependencies

- Angular Material (Dialog, Button, Checkbox, Input, FormField)
- Angular Forms (Reactive Forms)
- Angular Common

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Responsive design for mobile devices
- Accessible keyboard navigation
