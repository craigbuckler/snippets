/*!
 * jQuery password generation plugin
 * http://optimalworks.net/
 * Copyright 2011, Craig Buckler
 */

(function($) {

	$.fn.PasswordGenerate = function(opts) {

		// default configuration
		var config = $.extend({}, {
			password1: "#password",
			password2: "#password2",
			pwlength: 8,
			pwdict: "bcdfghkmnpqrstwxyz23456789"
		}, opts);

		// find inputs
		var p1 = $(config.password1);
		p1 = (p1.length == 1 ? p1[0] : null);
		var p2 = $(config.password2);
		p2 = (p2.length == 1 ? p2[0] : null);
		
		// click event
		if (p1 && p2) $(this).click(function(e) {
			e.preventDefault();
			var p = '';
			while (p.length < config.pwlength) {
				p += config.pwdict.substr(Math.floor(Math.random() * config.pwdict.length-1), 1);
			}
			p1.value = p2.value = p;
			p1.focus();
		});
		
		return this;
	};
	
	// initialise all password buttons
	$(function() {
		$("#passgen").PasswordGenerate();
	});

})(jQuery);