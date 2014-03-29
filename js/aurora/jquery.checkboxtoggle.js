/*!
 * jQuery toggle checkboxes plugin
 * http://optimalworks.net/
 * Copyright 2011, Craig Buckler
 */

(function($) {

	$.fn.CheckboxToggle = function() {
		
		// click event
		$(this).click(function(e) {
			e.preventDefault();
			var t = $(e.target);
			var state = t.hasClass("toggleall");
			$("input[type='checkbox']", t.closest("fieldset")).prop("checked", state);
		});
		
		return this;
	};
	
	// initialise all buttons
	$(function() {
		$("a.toggleall").CheckboxToggle();
		$("a.togglenone").CheckboxToggle();
	});

})(jQuery);