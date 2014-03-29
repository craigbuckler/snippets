/*!
 * jQuery automated field totaliser
 * Apply class of (plus|minus|mult|div)-<totalfieldID>[-priority] to any form field, e.g.
 * 	"plus-total"	- add this field to the value of #total
 * 	"mult-total-5"	- multiply current #total value by this field
 *	(given a priority of 5: lower priority numbers are evaluated first)
 *
 * http://optimalworks.net/
 * Copyright 2011, Craig Buckler
 */

(function($) {

	$.fn.Totaliser = function() {


		// perform calculation
		function Calculate(e) {

			$.each($(this).data("linked"), function() {

				var total = $(this);
				var eq = total.data("total");

				// sort calculation by priority
				if (!total.data("sorted")) {
					eq.sort(function (a,b) { return a.priority - b.priority; });
					total.data("total", eq);
					total.data("sorted", true);
				}

				// do calculation
				var calc = 0, i, op, v;
				for (i = 0; sum = eq[i]; i++) {
					v = SWS.Convert.toInt(sum.field.value) || 0;
					switch(sum.op) {
						case "minus": calc -= v; break;
						case "mult": calc *= v; break;
						case "div": if (v != 0) calc /= v; break;
						default: calc += v; break;
					}
				}

				// update field
				total.val(SWS.Format.Number(calc, total.data("dp") || 0));
				if (calc && total.val() == "") total.val(calc);

			});

		}


		// initialize
		this.each(function() {

			// is an input?
			if (this.nodeName.toLowerCase() != "input") return;

			// get total ID
			var t = this.className.match(/(plus|minus|mult|div)\-(\w*)\-*(\d*)/i);
			if (t && t.length > 2) {
				var total = $("#"+t[2]);
				if (total.length == 1) {

					// define linked total and change event
					var $this = $(this);
					var ts = $this.data("linked");
					if (!ts) ts = [];
					ts[ts.length] = total;
					$this.data("linked", ts).change(Calculate);

					// define sum
					var eq = {
						op: t[1],
						field: this,
						priority: t[3] || 0
					};
					ts = total.data("total");
					if (!ts) ts = [];
					ts[ts.length] = eq;
					total.data("total", ts);
					total.data("sorted", false);

				}
			}

		});

		return this;
	};

	// initialise all fields
	$(function() {
		$("input[class*=plus-]").add("input[class*=minus-]").add("input[class*=mult-]").add("input[class*=div-]").Totaliser();
	});

})(jQuery);