import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class FullScreenService {
    isFullScreenMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    isFullScreenMode$: Observable<boolean> = this.isFullScreenMode.asObservable();
    constructor() {}

    private openFullscreen(element: any) {
        let method = element.requestFullScreen || element.webkitRequestFullScreen
            || element.mozRequestFullScreen || element.msRequestFullScreen;
        if (method) {
            method.call(element);
        }
    }

    private exitFullscreen() {
        let method = (document.exitFullscreen || document.webkitExitFullscreen
            || document['mozCancelFullScreen'] || document['msExitFullscreen']);
        if (method) {
            method.call(document);
        }
    }

    toggleFullscreen(element: any) {
        if (this.isFullScreenMode.value)
            this.exitFullscreen();
        else
            this.openFullscreen(element);
    }
}
