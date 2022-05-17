import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RequiredDocumentsComponent } from './required-documents.component';

describe('RequiredDocumentsComponent', () => {
  let component: RequiredDocumentsComponent;
  let fixture: ComponentFixture<RequiredDocumentsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RequiredDocumentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequiredDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
