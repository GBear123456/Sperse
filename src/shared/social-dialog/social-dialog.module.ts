import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { SocialDialogComponent } from './components/social-dialog/social-dialog.component';
import { PlatformSelectorModalComponent } from './components/social-dialog/platform-selector-modal.component';

@NgModule({
  declarations: [
    SocialDialogComponent,
    PlatformSelectorModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatCheckboxModule
  ],
  exports: [
    SocialDialogComponent,
    PlatformSelectorModalComponent
  ]
})
export class SocialDialogModule { }
