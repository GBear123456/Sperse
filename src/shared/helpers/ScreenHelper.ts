export class ScreenHelper {

    static openFullscreen(element: any) {
        let method = element.requestFullScreen || element.webkitRequestFullScreen
            || element.mozRequestFullScreen || element.msRequestFullScreen;
        if (method)
            method.call(element);
    }

    static exitFullscreen() {
        let method = (document.exitFullscreen || document.webkitExitFullscreen
            || document['mozCancelFullScreen'] || document['msExitFullscreen']);
        if (method)
            method.call(document);
    }
}
