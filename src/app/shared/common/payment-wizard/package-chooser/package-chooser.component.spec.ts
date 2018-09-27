import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageChooserComponent } from './package-chooser.component';

describe('PackageChooserComponent', () => {
  let component: PackageChooserComponent;
  let fixture: ComponentFixture<PackageChooserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PackageChooserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PackageChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
