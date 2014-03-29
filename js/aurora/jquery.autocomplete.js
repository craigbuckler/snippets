/*!
 * jQuery AutoComplete plugin
 * http://optimalworks.net/
 * Copyright 2011, Craig Buckler
 */

(function($) {

	$.fn.AutoComplete = function(onchange) {

		// configuration
		var $C = {
			ListClass: "autolist",
			ListActive: "active",
			WidthAdd: -10,
			TypeThrottle: 300
		};

		var Open, List, timerKey;

		// autocomplete data cache [id][NULL|entered][entries]
		var Cache = [];


		// display autocomplete dropdown
		function DropdownShow(e) {

			Open = true;

			if (!List) {

				// create list
				var ul = document.createElement("ul");
				ul.className = $C.ListClass;
				List = $(ul).appendTo("body");
				List.mouseover(function(e) {
					$("li."+$C.ListActive, List).removeClass($C.ListActive);
					$(e.target).addClass($C.ListActive);
				});
				List.mouseout(function(e) {
					$(e.target).removeClass($C.ListActive);
				});

			}

			// update list
			var t = e.target; $t = $(t);
			t.select();

			// position list
			List.width(t.offsetWidth + $C.WidthAdd);
			var o = $t.offset();
			o.left -= ($C.WidthAdd / 2) + 1;
			o.top += t.offsetHeight;
			List.css("display", "block");
			List.offset(o);
			List.css("display", "none");

			// update list items
			UpdateList(t);

		}


		// update list
		function UpdateList(element) {

			var $e = $(element);
			var id = element.id;
			var v = element.value;
			var bound = $e.data("bound");
			var index = bound.data("uri")+"&ps="+bound.data("entries")+"&s="+escape(v);

			if (!Cache[index] && v !== $e.data("lastentry")) {

				// new Ajax request
				$.getJSON(
					index,
					function (json) {
						Cache[index] = (json.Records ? json.Records : []);
						UpdateList(element);
					}
				);

			}
			else {

				// fetch active ID
				var active = $("li."+$C.ListActive, List).data("id");

				List.empty();
				var rl = (Cache[index] ? Cache[index].length : 0);

				// append highlighted items
				for (var r = 0; r < rl; r++) {
					var li = document.createElement("li");
					var tID = Cache[index][r].id;
					var value = SWS.String.HTMLencode(Cache[index][r].value);
					li.setAttribute("data-id", tID);
					li.setAttribute("data-value", value);
					li.setAttribute("data-cindex", index);
					li.setAttribute("data-crecord", r);
					if (v != "" && (tID == active || rl == 1)) li.className = $C.ListActive; // set active item
					if (v) value = value.replace(new RegExp('('+v+')', "ig"), "<strong>$1</strong>");
					List.append($(li).append(value));
				}

				// hide empty list
				List.css("display", (!Open || rl == 0 ? "none" : "block"));

			}

			// update last entry
			$e.data("lastentry", v);

		}


		// complete autocomplete functionality
		function DropdownFinish(e) {

			Open = false;
			List.css("display", "none");

			var t = $(e.target), active = $("li."+$C.ListActive, List);
			if (active.length == 1) t.AutoCompleteUpdate(active.data("id"), active.data("value"), Cache[active.data("cindex")][active.data("crecord")]);
			else if (t.data("currentvalue") != t[0].value) t.AutoCompleteUpdate("", "");

			List.empty();

		}


		// handle keypresses
		function BoxKey(e) {

			var t = e.target, k = e.keyCode;

			// handle return key event
			if (k == 13) {
				e.preventDefault();
				DropdownFinish(e);
				return;
			}

			// handle up and down cursor keys
			if (k == 38 || k == 40) {
				var change, active = $("li."+$C.ListActive, List);
				if (active.length == 0) change = $("li:"+(k == 38 ? "last" : "first"), List);
				else change = (k == 38 ? active.prev() : active.next());
				active.removeClass($C.ListActive);
				change.addClass($C.ListActive);
			}

			if (timerKey) clearInterval(timerKey);
			if (t.value != $(t).data("lastentry")) timerKey = setTimeout(function() { UpdateList(t); }, $C.TypeThrottle);

		}


		// autocomplete initialisation
		this.each(function() {

			// element
			var input = $(this);
			if (onchange) input.data("onchange", onchange);
			if (!!input.data("bound")) return;

			// bound input (real submitted value)
			var bound = this.id;
			bound = bound.substr(0, bound.length-5);
			bound = $('#'+bound);
			if (bound.length != 1 || !bound.data("uri") || !bound.data("entries")) return;
			if (bound.data("uri").lastIndexOf("?") < 0) bound.data("uri") += "?";
			input.attr("autocomplete", "off");
			input.data("bound", bound);

			// set initial value
			var id = bound.val();
			if (id !== "") input.AutoCompleteUpdate(id);

			// bind events
			if (this.nodeName.toLowerCase() == "input") {
				input.focus(DropdownShow).blur(DropdownFinish).keyup(BoxKey);
				$(input[0].form).submit(function (e) { if (Open) e.preventDefault(); });
			}

		});

		return this;
	};


	// set an autocomplete box value
	$.fn.AutoCompleteUpdate = function(id, value, record, docallback) {

		if (typeof docallback == "undefined") docallback = true;
		$e = $(this[0]);
		var bound = $e.data("bound");

		// find value from web service
		if (typeof value == "undefined") {
			var $E = $e;
			if (id === null) {
				$E.AutoCompleteUpdate("", "");
			}
			else {
				$.getJSON(
					bound.data("uri")+"&id="+id,
					function (json) { if (json.RecordNumber == 1) $E.AutoCompleteUpdate(id, json.Records[0].value); }
				);
			}
			return;
		}

		// parse value
		value = SWS.String.HTMLencode(value);

		if (value !== "" && $e.data("currentvalue") == value) {
			$e.val(value);
			return;
		}

		// update visible value
		if ($e[0].nodeName.toLowerCase() == "input") $e[0].value = value;
		else $e.empty().append(value);

		// update bound element
		bound.val(id);

		// update current value
		$e.data("currentvalue", value);

		// run onchange function?
		if (docallback) {
			var onchange = $e.data("onchange") || null;
			if (onchange) onchange($e, id, value, record || {});
		}

	};


	// initialise all autocomplete boxes
	$(function() {
		$('.autocomplete').AutoComplete();
	});

})(jQuery);