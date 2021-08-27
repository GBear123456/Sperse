export class HtmlHelper {
    static encodeText(value: string): string {
        if (!$) {
            return null;
        }

        return $('<div/>').text(value).html();
    }

    static decodeText(value: string): string {
        if (!$) {
            return null;
        }

        return $('<div/>').html(value).text();
    }

    static encodeJson(jsonObject: object): string {
        if (!$) {
            return null;
        }

        return JSON.parse(this.encodeText(JSON.stringify(jsonObject)));
    }

    static decodeJson(jsonObject: object): string {
        if (!$) {
            return null;
        }

        return JSON.parse(this.decodeText(JSON.stringify(jsonObject)));
    }

    static htmlToPlainText(html: string) {
        return html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gim, '')
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gim, '')
            .replace(/<[^>]*>/gim, '')
            .replace(/\&nbsp;/gim, ' ')
            .replace(/\&lsquo;/gim, String.fromCharCode(8216))
            .replace(/\&rsquo;/gim, String.fromCharCode(8217))
            .replace(/\&amp;/gim, '&')
            .replace(/\&lt;/gim, '<')
            .replace(/\&gt;/gim, '>');
    } 
}