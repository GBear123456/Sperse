import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
})
export class TestimonialsComponent extends AppComponentBase implements OnInit {

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {
    }

}
