export class CfoConfig {
    name = 'CFO';
    search = false;
    navigation = [
        [ '', '', 'icon-home', '/app/cfo/:instance/start' ],
        [ 'Accounts', '', 'icon-home', '/app/cfo/:instance/linkaccounts' ]
    ];
}
