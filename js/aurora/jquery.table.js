/*!
 * jQuery Table handling plugin
 * http://optimalworks.net/
 * Copyright 2011, Craig Buckler
 */

(function($) {

	$.fn.Table = function() {

		var Cache = [];
		var Config = {
			optMax: 10,
			optDiv: 10
		};

		// row click event (not links)
		function RowClick(e) {
			if (e.target.nodeName.toLowerCase() == "td") {
				e.preventDefault();
				var td = $(e.target);
				var tr = td.closest("tr");
				var r = tr.data("id");
				var tbl = tr.closest("table");
				var lk = td.data("uri");
				if (lk) {
					if (td.data("arg")) {
						r = td.data("val");
						if (!r && r !== 0) lk = null;
					}
				}
				else lk = tbl.data("linked");
				if (lk) window.location.href = lk+r;
			}
		}

		// table reorder event
		function Reorder(e) {

			e.preventDefault();
			var t = $(e.target), o = "asc";

			if (t.hasClass("asc")) o = "desc";
			else if (t.hasClass("desc")) o = "asc";

			t.siblings().andSelf().removeClass("asc").removeClass("desc");
			t.addClass(o);

			// update order and call web service
			var table = t.closest("table");
			table.data("wsorder", "&o="+escape(t.data("col"))+(o == "desc" ? "&d" : ""));
			UpdateTable(table);

		}


		// page jump event
		function PageJump(e) {

			e.preventDefault();
			var t = $(e.target);
			var type = (t[0].className || t[0].nodeName).toLowerCase();
			var table = t.closest("table");
			var page = parseInt(table.data("page"), 10), cpage = page;
			var pagecount = parseInt($("li.pagecount", table).text(), 10);

			switch (type) {
				case "select": page = t[0].options[t[0].selectedIndex].value; break;
				case "pagefirst": page = 1; break;
				case "pageback": page = Math.max(1, --page); break;
				case "pagenext": page = Math.min(pagecount, ++page); break;
				case "pagelast": page = pagecount; break;
			}

			// page changed
			if (page != cpage) {
				table.data("page", page);
				table.data("wspage", "&pn=" + page);
				UpdateTable(table);
			}

		}


		// set page size (drag & drop)
		function PageSize(table, ext) {
			var tbody = $("tbody", table);
			var tfoot = $("tfoot", table);
			var epos = $(ext).position().top;
			if (epos > tfoot.position().top) epos -= tfoot.height();
			var ps = Math.round((epos - tbody.position().top) / (tbody.height() / tbody.children().size()));
			ps = Math.min(Math.max(1, ps), 100);
			table.data("wspagesize", "&ps=" + ps);
			table.data("extend").style.top = "0px";
			UpdateTable(table);
		}


		// update table
		function UpdateTable(table) {

			var uri = table.data("uri") + table.data("wspagesize") + table.data("wspage") + table.data("wsorder");

			if (!Cache[uri]) {

				// call web service
				$.getJSON(
					uri,
					function (json) {
						if (json.Records) {
							Cache[uri] = json;
							UpdateTable(table);
						}
					}
				);
			}
			else {

				// update navigation values
				var page = Cache[uri].Page;
				var pagecount = Cache[uri].PageCount;
				var tfoot = $("tfoot", table);
				table.data("page", page);
				$("span.recordfrom", tfoot).text(Cache[uri].RecordFrom);
				$("span.recordto", tfoot).text(Cache[uri].RecordTo);
				$("span.recordcount", tfoot).text(Cache[uri].RecordCount);
				$("li.pagecount", tfoot).text(pagecount);
				UpdateNavigation(table);


				// update table rows
				var v, r, rl, c, cl, p, row, $row, t, tl, td, $td, $tds, arg, col = table.data("col"), numeric = table.data("numeric"), bindcol = table.data("bindcol"), bindrow = table.data("bindrow"), tbody = $("tbody", table), tr = $("tr", tbody), recl = Cache[uri].RecordNumber;

				for (r = 0, rl = Math.max(tr.size(), recl); r < rl; r++) {

					// record
					var rec = (r < recl ? Cache[uri].Records[r] : null);

					// use row or append a new one
					if (r < tr.size()) row = tr[r];
					else row = $(tr[0]).clone().appendTo(tbody)[0];

					// append row classes
					$row = $(row);
					$row.removeClass();
					for (t = 0, tl = bindrow.length; rec && t < tl; t++) {
						v = rec[bindrow[t]];
						if (v !== null) $row.addClass(bindrow[t]+v);
					}

					// insert record
					if (rec) {

						$row.data("id", rec.id);
						td = $("td", row).removeClass();

						for (t = 0, tl = td.size(); t < tl; t++) {
							$td = $(td[t]);
							v = col[t];

							// set cell styles
							if (numeric[v]) $td.addClass("num");
							for (c = 0, cl = bindcol[v].length; c < cl; c++) {
								p = bindcol[v][c];
								if (rec[p] !== null) $td.addClass(p+rec[p]);
							}

							// bind an link argument
							arg = $td.data("arg");
							if (arg) $td.data("val", rec[arg]);

							// set cell value
							$tds = $td.find("span");
							if ($tds.length == 1) {
								if (rec[v]) $td.addClass("expand");
								else $td.removeClass("expand");
								$td = $tds;
							}
							$td.text(rec[v] ? SWS.String.HTMLencode(numeric[v] ? SWS.Format.Number(rec[v]) : rec[v]) : "");

						}

					}
					else {
						// or remove row
						$row.remove();
					}

				}

			}

		}


		// update table navigation
		function UpdateNavigation(table) {

			var tfoot = $("tfoot", table);
			var page = table.data("page");
			var pagecount = parseInt($("li.pagecount", tfoot).text(),10);

			$("ul.pagecontrols", tfoot).css("display", (pagecount > 1 ? "block" : "none"));
			if (pagecount > 1) {
				var sel = $("select", tfoot);
				sel.empty();
				sel = sel[0];
				var back = $("li.pagefirst, li.pageback", tfoot);
				var next = $("li.pagenext, li.pagelast", tfoot);

				// update page select box
				var p = Math.pow(10, String(pagecount).length - 1), opt = 0, optI = 0, optA = null, np;
				while (opt < pagecount) {

					// pagecount reached
					if (optA !== null && opt+p > pagecount) {
						opt = pagecount;
						p = 0;
					}
					else {

						// inital p increment more than
						while (optA === null && opt+p > page && p > 1) p /= 10;

						// show option
						opt += p;
						if (page == opt || pagecount <= Config.optMax || p > 1 || Math.floor(opt/Config.optDiv) == opt/Config.optDiv) {
							var newOpt = document.createElement("option");
							newOpt.text = opt;
							sel.options.add(newOpt);
							if (page == opt) optA = optI; // active option
							optI++;
						}

						// increase increment
						if (optA !== null) {
							np = opt / (p*10);
							if (np == Math.floor(np)) p *= 10;
						}

					}

				}
				sel.selectedIndex = optA;

				// navigation buttons
				if (page == 1) back.addClass("disabled");
				else back.removeClass("disabled");
				if (page == pagecount) next.addClass("disabled");
				else next.removeClass("disabled");
			}

		}


		// table initialisation
		this.each(function() {

			// element
			var table = $(this);

			// row click handler
			$("tbody", table).click(RowClick);

			// if web service available
			if (table.data("uri")) {

				// find column names, numeric values and bound values
				var col = [], numeric = {}, bindcol = {}, th = $("thead tr:first th", table), $th;
				for (var t = 0, thl = th.length; t < thl; t++) {
					$th = $(th[t]);
					col[t] = $th.data("col");
					numeric[col[t]] = $th.hasClass("num");
					bindcol[col[t]] = ($th.data("bind") ? $th.data("bind").split(",") : []);
				}
				table.data("col", col);
				table.data("numeric", numeric);
				table.data("bindcol", bindcol);

				// find row bound values
				table.data("bindrow", $("thead tr:first", table).data("bind").split(","));

				// heading re-order click event
				th.attr("tabindex", 0);
				var t = $("thead th.asc, thead th.desc", table)[0];
				table.data("wsorder", "&o="+escape($(t).data("col"))+(t.className == "desc" ? "&d" : ""));
				$("thead", table).click(Reorder).keyup(Reorder);

				// navigation controls
				var tfoot = $("tfoot", table);
				var page = $("select", tfoot);
				var nav = $("li.pagefirst, li.pageback, li.pagenext, li.pagelast", tfoot);
				var pn = page[0].options[page[0].selectedIndex].value;
				table.data("page", pn);
				table.data("wspage", "&pn=" + pn);
				page.change(PageJump);
				nav.attr("tabindex", 0);
				nav.click(PageJump).keyup(PageJump);
				UpdateNavigation(table);

				// table extender
				var extend = $("#"+table[0].id+"-extend");
				if (extend.size() == 1) {
					table.data("extend", extend[0]);
					table.data("wspagesize", "");
					extend.draggable({
						horz: false,
						onStart: function (ext) { table.addClass("disabled"); },
						onDrop: function (ext) { table.removeClass("disabled"); PageSize(table, ext); },
					});
				}

			}

		});

		return this;
	};


	// initialise all tables
	$(function() {
		$('table.datatable').Table();
	});

})(jQuery);