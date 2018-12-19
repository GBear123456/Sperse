$(document).ready(function () {
    var dialog = $('#dialog');
    dialog.on('show.bs.modal', function(event) {
        var target = $(event.relatedTarget);
        dialog.find('.modal-title').text(target.text());

        $(this).find('.modal-body').html('loading...')
            .load(location.origin + '/documents/' + target.data('doc') + '.html', function() { });
    });

    $('.print-this').on('click', function(event) {
        printElement($(event.target).closest('.modal-dialog').find('.print-this-section')[0]);
    });

    function printElement(elem) {
        let domClone = elem.cloneNode(true);
        let printSection = document.getElementById('printSection');
        if (!printSection) {
            printSection = document.createElement('div');
            printSection.id = 'printSection';
            document.body.appendChild(printSection);
        }
        printSection.innerHTML = '';
        printSection.appendChild(domClone);
        window.print();
    }

    function checkMenuAppearance() {
        var nav = $('.app-area-navigation'),
            responsive = $('.app-responsive-menu'),
            actions = $('.right-actions'),
            dropdown = $('.dropdown'),
            space = nav.width();

        dropdown.hide();
        nav.find('>li').each((index, item) => {
            item = $(item);
            space -= item.width();
            var dropDownItem = $(responsive.children().get(index));
            if (space > 0) {
                dropDownItem.hide();
                item.show();
            } else {
                dropdown.show();
                dropDownItem.show();
                item.hide();
            }
        });

        responsive.find('.user-account')[actions.is(':visible') ? 'hide': 'show']();
    }

    function closeAllOpenedMenuItems() {
        $('li.opened').removeClass('opened');
    }

    $('li.menu').click(function(e) {
        setTimeout(function() {
            $(e.currentTarget).addClass('opened');
        });
    });

    $('#dropdownMenuButton').click(function() {
        closeAllOpenedMenuItems();
    })

    $( window ).resize(checkMenuAppearance);
    $( window ).click(closeAllOpenedMenuItems);

    checkMenuAppearance();
});