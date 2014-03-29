/*!
 * jQuery tab handling plugin
 * http://optimalworks.net/
 * Copyright 2011, Craig Buckler
 */

(function($) {

	$.fn.Tabs = function(opts) {
	
		// default configuration
		var config = $.extend({}, {
			onchange: null,
		}, opts);
	
		// click event handler
		function ClickTab(e) {
			e.preventDefault();
			$(e.target).ActivateTab();
		}

		// tab initialisation
		this.each(function() {
		
			var ul = $(this);				// list element
			if (config.onchange) ul.data("onchange", config.onchange);
			if (!!ul.data("height")) return;
			ul.data("height", 0);
			var pActive = location.hash;	// currently active tab

			// parse individual tabs
			var $a = $("a", ul), active = null;
			$a.each(function() {
				var hash = this.hash;
				var content = $(hash);
				ul.data("height", Math.max(ul.data("height"), content.height()));
				content.css("display", "none");
				if (!active || hash == pActive) active = this;
			});

			// activate first or active tab
			$(active).ActivateTab();

			// event handler
			$a.click(ClickTab);

		});

		return this;
	};
	
	
	// activate tab
	$.fn.ActivateTab = function() {
	
		// default configuration
		var config = {
			activeClass: "active",
		};
	
		this.each(function() {
	
			var a = this;
			var $a = $(a);
			var ul = $a.closest("ul");
			var active = ul.data("active");
			if (a != active) {

				// hide previously active tab
				if (active) {
					$(active).removeClass(config.activeClass);
					var $c = $(active.hash);
					ul.data("height", Math.max(ul.data("height"), $c.height()));
					$c.css("display", "none");
				}

				// show active tab
				$a.addClass(config.activeClass);
				$(a.hash).css({ "display":"block", "minHeight":ul.data("height")+"px" });
				ul.data("active", a);
				
				// run onchange function
				var onchange = ul.data("onchange") || null;
				if (onchange) onchange(a.hash);
			}
		
		});
		
		return this;
	}
	

	// initialise all tables
	$(function() {
		$("ul.tabset").Tabs();
	});

})(jQuery);