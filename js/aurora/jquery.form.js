/*!
 * jQuery form plugin (specific to Aurora)
 * Handles general delete confirmation, number formatting
 * and form-specific functions
 *
 * http://optimalworks.net/
 * Copyright 2011, Craig Buckler
 */
(function($) {

	$.fn.Form = function() {

		// invalid field: activate error tab
		var revalidate = 0;
		function FieldInvalid(e) {

			if (revalidate != 0 && new Date() - revalidate > 100) revalidate = 0;
			if (revalidate == 0) {
				revalidate = new Date();
				var sec = $(e.target).closest("section");
				if (sec.length > 0) $("a[href='#"+sec[0].id+"']").ActivateTab()
			}
			
			return true;
		}
	

		// delete record confirmation
		function DeleteEvent(e) {

			if (!window.confirm($C.language.DeleteConfirm)) {
				e.preventDefault();
			}

		}


		// numeric formatting
		function FormatNumber(e, value) {
			var i = e.target || e;
			var $i = $(i);
			var v = SWS.String.Trim(typeof value == "undefined" ? $i.val() : value);
			if (v != "" || $i.prop("required")) {
				$i.val(SWS.Format.Number(v, $(i).data("dp") || 0));
				if (v && $i.val() == "") $i.val(v);
			}
		}


		// date formatting
		function FormatDate(e) {
			var i = e.target || e;
			var v = SWS.String.Trim(i.value);
			var d = SWS.Convert.toDate(v);
			if (d === null && v != "" && !isNaN(v)) {
				var now = new Date(), n = parseInt(v, 10);
				d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n);
			}
			i.value = SWS.Format.Date(d);
		}


		// pallet screen: setup
		var Pallet = {};
		function PalletSetup() {

			// tabs
			Pallet.TransTab = $("ul.tabset a[href='#transfer']").parent();
			Pallet.AdjustTab = $("ul.tabset a[href='#adjust']").parent();
			Pallet.AuthTab = $("ul.tabset a[href='#authorisation']").parent();

			// adjust fields
			Pallet.UnitsAdd = $("input#unitsadd");
			Pallet.UnitsRemove = $("input#unitsremove");
			Pallet.UnitsRemain = $("input#unitsremaining");
			Pallet.Units = SWS.Convert.toInt(Pallet.UnitsRemain.val());
			Pallet.ToLocation = $("#tolocation");
			Pallet.NoteTransfer = $("#notetransfer");
			Pallet.NoteAdjust = $("#noteadjust");

			// hide authorisation tab
			if (Pallet.TransTab.length == 1 && Pallet.AdjustTab.length == 1 && Pallet.AuthTab.length == 1) Pallet.AuthTab.css("display", "none");

			// product selection auto-fill event
			Pallet.UpdateProduct = !$("input#productid").val();
			$("input#productid-auto").AutoComplete(PalletProduct);

			// customer selection warehouse check event
			PalletPick();
			$("input#ownerid-auto").AutoComplete(PalletPick);

			// to location auto-fill: hide adjust, show authorisation
			$("input#tolocation-auto").AutoComplete(function($e, id, value) {

				if (!Pallet.TransferActive) {
					Pallet.TransferActive = true;
					Pallet.AdjustTab.css("display", "none");
					Pallet.AuthTab.css("display", "block");
				}

				// transfer note required?
				if (value && !!SWS.Convert.toInt($("input#fromlocation").val())) Pallet.NoteTransfer.attr("required", "required");
				else Pallet.NoteTransfer.removeAttr("required");

				// customer authorised?
				PalletPick();

			});

			// adjust calculation
			Pallet.UnitsAdd.change(PalletAdjust);
			Pallet.UnitsRemove.change(PalletAdjust);
			Pallet.UnitsRemain.change(PalletAdjust);

		}


		// pallet screen: can client pick from chosen location?
		function PalletPick() {

			var l = SWS.Convert.toInt($("input#tolocation").val());
			var c = SWS.Convert.toInt($("input#ownerid").val());

			if (l>0 && c>0) {
				$.getJSON(
					$C.webservice.locationclientpick+"/"+l+"?cw="+c,
					function (loc) {
						if (loc.pick) ShowMessage(Pallet.Pick, "");
						else Pallet.Pick = ShowMessage(Pallet.Pick, $C.language.PalletPickWarning, Pallet.ToLocation);
					}
				);
			}
			else ShowMessage(Pallet.Pick, "");

		}


		// pallet screen: adjust pallets
		function PalletAdjust(e) {

			if (e.target == Pallet.UnitsRemain[0]) {
				// total units adjusted
				var u = SWS.Convert.toInt(Pallet.UnitsRemain.val());
				var d = u - Pallet.Units;
				if (d == 0) { Pallet.UnitsAdd.val(""); Pallet.UnitsRemove.val(""); }
				else if (d > 0) { FormatNumber(Pallet.UnitsAdd, d); Pallet.UnitsRemove.val(""); }
				else { Pallet.UnitsAdd.val(""); FormatNumber(Pallet.UnitsRemove, -d); };
			}
			else {
				// add/remove units adjusted
				var a = SWS.Convert.toInt(Pallet.UnitsAdd.val());
				var r = SWS.Convert.toInt(Pallet.UnitsRemove.val());
				FormatNumber(Pallet.UnitsRemain, Math.max(0, Pallet.Units + a - r));
			}

			// adjust note required?
			if (SWS.Convert.toInt(Pallet.UnitsRemain.val()) == Pallet.Units) Pallet.NoteAdjust.removeAttr("required");
			else Pallet.NoteAdjust.attr("required", "required");

			// hide transfer, show authorisation
			if (!Pallet.AdjustActive) {
				Pallet.AdjustActive = true;
				Pallet.TransTab.css("display", "none");
				Pallet.AuthTab.css("display", "block");
			}

		}


		// pallet screen: product selection and auto-fill other fields
		function PalletProduct($e, id) {

			if (!Pallet.UpdateProduct) {
				Pallet.UpdateProduct = true;
				return;
			}
		
			var ID = id;

			$.getJSON(
				$C.webservice.product+"/"+id,
				function (prod) {
					if (prod.id = ID) {
						FormatNumber("#units", prod.units);
						$("#supplierid-auto").AutoCompleteUpdate(prod.defaultsupplier);
						$("#ownerid-auto").AutoCompleteUpdate(prod.defaultowner);
						if (prod.expiry) $("#expirydate").attr("required", "required");
						else $("#expirydate").removeAttr("required");

						// find an appropriate empty bay
						var barg = "";
						if (prod.preferredwarehouse !== null) barg += "&pw=" + prod.preferredwarehouse;
						if (prod.preferredzone) barg += "&pz=" + prod.preferredzone;
						if (prod.preferredaisle) barg += "&pa=" + prod.preferredaisle;

						if (barg) {
							$.getJSON(
								$C.webservice.locationlist+"?b&ps=1"+barg,
								function (bay) {
									if (bay.RecordNumber > 0) $("#tolocation-auto").AutoCompleteUpdate(bay.Records[0].id);
								}
							);
						}
						else $("#tolocation-auto").AutoCompleteUpdate(0);
					}
				}
			);

		}


		// pick screen: setup
		var Pick = {};
		function PickSetup() {
		
			Pick.Product = null;
			Pick.Available = 0;
			Pick.ID = $("input#id").val();
			if (Pick.ID == "") Pick.ID = false;

			// client defined
			var c = $("input#client").val();
			if (c != "") Pick.Client = SWS.Convert.toInt(c);
			else Pick.Client = null;

			// product defined
			var p = $("input#product").val();
			if (p != "") PickAmount(null, SWS.Convert.toInt(p));

			// units
			Pick.UnitsInput = $("#units");
			Pick.Units = SWS.Convert.toInt(Pick.UnitsInput.val() || Pick.UnitsInput.text());

			// client selection auto-fill event
			Pick.ClientInput = $("input#client-auto");
			Pick.ClientInput.AutoComplete(PickAmount);

			// product selection auto-fill event
			Pick.ProductInput = $("input#product-auto");
			Pick.ProductInput.AutoComplete(PickAmount);

			// pick selection
			Pick.Active = $("ul.tabset a[href='#pick']").parent();
			if (Pick.Active.length == 0) Pick.Active = false;
			else {
				Pick.Punits = $("#punits");
				Pick.Pproduct = $("#pproduct");
				Pick.Pclient = $("#pclient");
				Pick.AddPallet = $("input#addpallet");
				Pick.AddPalletURL = Pick.AddPallet.data("uri");
				Pick.Progress = $("#progressnow");

				// fetch table row template
				Pick.Table = $("table#picktable");
				Pick.TableBody = Pick.Table.children("tbody");
				Pick.Row = Pick.TableBody.children("tr:first-child").clone();
				Pick.TableBody.empty();
				Pick.TotalUnits = $("#totalunits", Pick.Table);
				Pick.UnitsDiff = $("#unitsdiff", Pick.Table);
				Pick.UnitsDiffText = $("#unitsdifftext", Pick.Table);

				// pick cache
				Pick.Cache = [];

				// units changed
				Pick.UnitsInput.on("change", PickPermit);

				// pick tab selected
				Pick.Active.closest("ul").Tabs({ onchange: PickTabActive });

				// add pallet event
				Pick.AddPalletAuto = $("input#addpallet-auto");
				Pick.AddPalletAuto.AutoComplete(function($e, id, value, rec) {
					if (rec && rec.id) {
						rec.units = Math.min(rec.quantity, Math.max(0, Pick.Units - Pick.PickedUnits));
						PickFillTable(rec);
						Pick.AddPalletAuto.AutoCompleteUpdate("", "", null, false);
						PickCheck();
					}
				});

				// pallet units changed event
				Pick.Table.on("change", "input.units", PickCheckUnit);
				
				// pallet units enter key disable
				Pick.Table.on("keypress", "input.units", function(e) {
					if (e.keyCode == 13) { e.target.blur(); return false; }
				});

				// clicked delete button
				Pick.Table.on("click", "td.delete a", function(e) {
					e.preventDefault();
					$(e.target).closest("tr").remove();
					PickCheck();
				});

				// auto-pick event
				$("#autopick").on("click", PickAuto);

				// initialise pick tab
				PickPermit();

				// load previously-saved picks
				if (aInit && aInit.PickPallets) PickFillTable(aInit.PickPallets, true);
			}

		}


		// pick screen, request tab: client/product selection and auto-fill other fields
		function PickAmount($e, id) {

			if ($e && $e[0] == Pick.ClientInput[0]) Pick.Client = id;
			else Pick.Product = id;

			// find available quantities
			if (Pick.Product) {

				$.getJSON(
					$C.webservice.productavailable+"/"+Pick.Product+"?"+(Pick.Client ? "c="+Pick.Client : "")+(Pick.ID ? "&pr="+Pick.ID : ""),
					function (a) {
						if (a) {
							var a = SWS.Convert.toInt(a.available);
							Pick.Available = a;
							if (Pick.UnitsInput[0].nodeName.toLowerCase() == "input") Pick.UnitsInput.prop("max", a);
							var cp = SWS.Convert.toInt(Pick.UnitsInput.val());
							if (cp > a) FormatNumber(Pick.UnitsInput, a);
							Pick.Total = ShowMessage(
								Pick.Total,
								SWS.Format.Number(a) + " "+ $C.language.LabelAvailable,
								Pick.UnitsInput
							);
							PickPermit();
						}
					}
				);

			}
			else {
				// hide total units
				ShowMessage(Pick.Total, "");
			}

			PickPermit();
		}


		// pick screen, pick tab: picking functionality enabled?
		function PickPermit(e) {

			if (!Pick.Active) return;

			// get pick units
			Pick.Units = SWS.Convert.toInt(Pick.UnitsInput.val() || Pick.UnitsInput.text());

			// can pick be handled?
			if (Pick.Client && Pick.Product && Pick.Units && Pick.Units <= Pick.Available) {
				Pick.Active.css("display", "block");
			}
			else {
				Pick.Active.css("display", "none");
			}

		}


		// pick screen, pick tab: picking functionality
		function PickTabActive(t) {

			// pick checksum
			var v = Pick.Client+"-"+Pick.Product+"-"+Pick.Units;
			if (t != "#pick" || v == Pick.Valid) return;

			// action paragraph
			var pa = $("#product-auto"), ca = $("#client-auto");
			Pick.Punits.text(SWS.Format.Number(Pick.Units));
			Pick.Pproduct.text(pa.val() || pa.text());
			Pick.Pclient.text(ca.val() || ca.text());

			Pick.Valid = v;

			// check picks
			PickFillTable();
			PickCheck();

		}


		// pick screen, pick tab: fill pick table with data
		function PickFillTable(rec, refresh) {

			rec = rec || [];
			if (!$.isArray(rec)) rec = [rec];
			refresh = !!refresh;
			var index = Pick.Client + "-" + Pick.Product;

			// store current table state
			if (Pick.CurrentIndex) {
				Pick.Cache[Pick.CurrentIndex] = Pick.TableBody.clone();
			}

			// initialise table body
			if (!Pick.Cache[index] || refresh) Pick.Cache[index] = $("<tbody></tbody>");

			// handle records
			for (var r = 0, rl = rec.length; r < rl; r++) {

				var qty = 0;

				// fill row with data
				var row = Pick.Row.clone();
				$("td", row).each(function (i, e) {
					var td = $(this);
					var f = td.data("col");
					if (f && rec[r][f]) {
						v = rec[r][f];
						switch (f) {
							case "bay":
								if (rec[r].warehouse && rec[r].warehouse != v) v = rec[r].warehouse + ":" + v;
								break;
							case "quantity":
								qty = SWS.Convert.toInt(v);
								v = SWS.Format.Number(qty);
								break;
						}
						td.text(v);
					}
				});

				// pallet ID field
				if (rec[r].id) $("input.pallet", row).val(rec[r].id);

				// units field
				var u = (rec[r].units && rec[r].units <= qty ? rec[r].units : qty);
				var iu = $("input.units", row);
				iu.prop("max", qty);
				FormatNumber(iu, u);

				// add row
				Pick.Cache[index].append(row);
			}

			// show table
			Pick.TableBody.replaceWith(Pick.Cache[index]);
			Pick.TableBody = Pick.Table.children("tbody");
			Pick.CurrentIndex = index;

			// check pick
			PickCheck();

		}

		
		// check an entered unit is valid
		function PickCheckUnit(e) {
			var doPickCheck = false;
			if (e.target) {
				doPickCheck = true;
				e.preventDefault();
				e = $(e.target);
			}
			var q = Math.max(SWS.Convert.toInt(e.prop("max")), SWS.Convert.toInt($(e).closest("tr").children("td.quantity").text()));
			e.prop("max", q);
			FormatNumber(e, Math.min(SWS.Convert.toInt(e.val()), q));
			if (doPickCheck) PickCheck();
		}
		

		// pick screen, pick tab: check current picks
		function PickCheck() {

			Pick.PickedUnits = 0;
			Pick.PickedPallets = [];

			// table rows
			var rows = $("tr", Pick.TableBody);
			Pick.Table.closest("div").css("display", (rows.length == 0 ? "none" : "block"));

			// total rows
			rows.each(function (i, r) {
				r = $(this);
				Pick.PickedPallets[Pick.PickedPallets.length] = SWS.Convert.toInt($("input.pallet", r).val());
				var u = $("input.units", r);
				PickCheckUnit(u);
				Pick.PickedUnits += SWS.Convert.toInt(u.val());
			});

			// total units
			Pick.TotalUnits.text(SWS.Format.Number(Pick.PickedUnits));
			
			// units to add
			var diff = Pick.Units - Pick.PickedUnits;
			Pick.UnitsDiff.text(SWS.Format.Number(diff));
			Pick.UnitsDiffText.text(diff < 0 ? $C.language.LabelUnitsToRemove : $C.language.LabelUnitsToAdd)
			
			// set auto-complete product URL and reset last entry
			Pick.AddPalletAuto.data("lastentry", null);
			Pick.AddPallet.data("uri", Pick.AddPalletURL+"p="+Pick.Product+"&pc="+Pick.Client+"&pu="+Pick.PickedPallets.join(","));

			// uncheck and hide progress checkbox
			if (Pick.PickedUnits == Pick.Units) {
				Pick.Progress.closest("div").slideDown();
			}
			else {
				Pick.Progress.prop("checked",false).closest("div").slideUp();
			}

		}


		// pick screen, pick tab: auto-picking webservice
		function PickAuto(e) {

			e.preventDefault();
			if (Pick.PickedUnits > 0 && !window.confirm($C.language.PickOverride)) return;
			Pick.Progress.prop("checked",false);
			$.getJSON(
				$C.webservice.pickautopick+"?c="+Pick.Client+"&p="+Pick.Product+"&u="+Pick.Units,
				function (ap) { PickFillTable(ap, true); }
			);

		}


		// show a message in a DIV following a location
		function ShowMessage(id, message, location) {

			if (!id && location) {
				location.closest("div").after("<div><p></p></div>");
				id = location.closest("div").next().children("p");
				id.closest("div").slideUp(0);
			}

			if (id) {
				if (!message) message = "";
				id.html(message);
				if (message == "") id.closest("div").slideUp();
				else id.closest("div").slideDown();
			}

			return id;
		}


		// initialize
		this.each(function() {

			// is a form?
			if (this.nodeName.toLowerCase() != "form") return;
			
			// numeric inputs formatting
			var n = $("input[type='number']", this);
			n.each(function() {
				var i = $(this);
				if (i.val() != "") FormatNumber(i);
			});
			n.on("change", FormatNumber);

			// date input formatting
			$("input[type='date']", this).on("change", FormatDate);
			
			// is a save form?
			if (this.getAttribute("id") != "save") return;

			// pallet screen
			if ($("body#vpallet").length == 1) PalletSetup();

			// pick screen
			if ($("body#vpick").length == 1) PickSetup();
			
			// HTML5 field validation
			if (!this.novalidate && $("ul.tabset", this).length > 0) {
				$(this.elements).on("invalid", FieldInvalid);
			}
			
			// delete event confirmation handler
			$("form#delete").on("submit", DeleteEvent);
			
		});

		return this;
	};

	// initialise all fields
	$(function() {
		$("form").Form();
	});

})(jQuery);