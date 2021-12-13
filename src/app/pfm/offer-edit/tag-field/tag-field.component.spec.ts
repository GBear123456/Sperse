import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TagFieldComponent } from './tag-field.component';

describe('TagFieldComponent', () => {
  let component: TagFieldComponent;
  let fixture: ComponentFixture<TagFieldComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TagFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
