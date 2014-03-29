/*!
 * jQuery Colour Pickler plugin
 * http://optimalworks.net/
 * Copyright 2011, Craig Buckler
 */

(function($) {

	$.fn.ColourPickler = function() {

		// configuration
		var $C = {
			ColourPickerClass: "colourpicker",
			ColourBoxClass: "colourlist",
			ColourPrefix: "colour",
			ColourActive: "active",
			OffsetX: -10,
			OffsetY: 10,
			WidthAdd: -10,
			CloseDelay: 300
		};

		var Open, ColourBox, cTimer;

		// display colour picker
		function ColourBoxShow(e) {

			Open = true;
			var t = e.target, $t = $(t);

			if (!ColourBox) {

				// create colour box
				var cols = $(t).data("bound").data("colours");

				var ul = document.createElement("ul");
				ul.setAttribute("tabindex", 0);
				ul.className = $C.ColourBoxClass;
				for (var c = 0; c <= cols; c++) {
					var li = document.createElement("li");
					li.className = $C.ColourPrefix + c;
					li.setAttribute("tabindex", 0);
					ul.appendChild(li);
				}
				ColourBox = $(ul).appendTo("body");

				// events
				ColourBox.click(ChooseColour).keyup(ChooseColour).focusout(ChooseColour);
			}

			// bind element
			ColourBox.data("input", t);
			
			// position box
			var o = $t.offset();
			o.left += t.offsetWidth + $C.OffsetX;
			o.top += $C.OffsetY;
			ColourBox.css("display", "block");
			ColourBox.offset(o);
			ColourBox[0].focus();
			cTimer = null;

		}


		// handle keypresses
		function ChooseColour(e) {
		
			if (e.type == "focusout" && !cTimer) {
				cTimer = setTimeout(function() { ChooseColour(e); }, $C.CloseDelay);
				return;
			}
		
			var t = e.target;
			if (t && t.nodeName.toLowerCase() == "li" && (e.type == "click" || e.keyCode == 13)) {
				ColourBox.data("input").className = $C.ColourPickerClass + " " + t.className;
				var c = t.className.substr(6);
				if (c == 0) c = "";
				$(ColourBox.data("input")).data("bound")[0].value = c;
			}
			
			Open = false;
			ColourBox.css("display", "none");

		}


		// autocomplete initialisation
		this.each(function() {

			// element
			var input = $(this);

			// bound input (real submitted value)
			var bound = this.id;
			bound = bound.substr(0, bound.length-7);
			bound = $('#'+bound);
			if (bound.length != 1 || !bound.data("colours")) return;
			input.attr("tabindex", 0);
			input.data("bound", bound);

			// events
			input.click(ColourBoxShow).focus(ColourBoxShow);
			$(input[0].form).submit(function (e) { if (Open) e.preventDefault(); });

		});

		return this;
	};


	// initialise all colour pickers
	$(function() {
		$('.colourpicker').ColourPickler();
	});

})(jQuery);