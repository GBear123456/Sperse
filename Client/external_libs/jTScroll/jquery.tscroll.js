/*
	VP: Small solution to adjust JTable to be possible scroll body with fixed header.
*/
(function ($) {
    $.fn.tscroll = function () {
        this.each(function () {
            var self = $(this),
				scroll = $('<div class="jtscroll">'),
				clone = $('<table class="jtable">');

			scroll.insertAfter(self)
			clone.insertBefore(self);
			scroll.append(self);


			clone.append(self.find('thead'));
		/*	
			self.find('thead').css({
				//'visibility': 'hidden',
				'height': '0px'
			});
		*/
        });
    };
})(jQuery);