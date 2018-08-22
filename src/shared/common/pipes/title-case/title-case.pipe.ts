import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'titleCase'
})
export class TitleCasePipe implements PipeTransform {
    transform(value: string, args?: any) {
        return value && value.replace(/\b\w+/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
}
