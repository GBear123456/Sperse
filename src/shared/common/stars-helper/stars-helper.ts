import { ContactStarColorType } from '@shared/service-proxies/service-proxies';

export class StarsHelper {
    static starColorTypes = {
        Yellow: 'rgb(230, 230, 0)',
        Blue: 'blue',
        Green: 'green',
        Purple: 'purple',
        Red: 'red',
        Gradient1: ['#24c26c', '#5ac860'],
        Gradient2: ['#82cc57', '#b1d049'],
        Gradient3: ['#f0eb56', '#ffc800'],
        Gradient4: ['#f3852a', '#e14617'],
        Gradient5: '#959595',
        Blueprint: '#104579',
        Action: '#ad1d21',
        Nurturing: '#f39e1c',
        Knowledge: '#186434',
        Unknown: '#959595'
    };

    static getStarColorByType(type: ContactStarColorType, gradient = false) {
        let colors: any = StarsHelper.starColorTypes[type];
        if (colors && colors.join)
            return gradient ? 'linear-gradient(' + colors.join(',') + ')' : colors.shift();
        else
            return colors;
    }
}