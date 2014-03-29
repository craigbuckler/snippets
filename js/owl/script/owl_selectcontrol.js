/*	---------------------------------------------

	owl.SelectControl

	--------------------------------------------- */
if (owl && owl.Effect && owl.Overlay && !owl.SelectControl) {

	// context menu object
	owl.SelectControl = function(select, OnChange) {

		var $C = owl.SelectControl.Config;
		if (owl.Css.ClassExists(select, $C.ActiveClass)) return;
		owl.Css.ClassApply(select, $C.ActiveClass);
		this.Select = select;

		// create custom element
		var sc = document.createElement("a");
		sc.href = "#";
		sc.className = $C.ControlClass + " " + this.Select.className;
		var scs = sc.appendChild(document.createElement("strong"));
		scs.appendChild(document.createTextNode(this.Select.options[this.Select.selectedIndex].text));

		// remove select
		this.Select.style.display = "none";

		// append select control
		this.Control = this.Select.parentNode.insertBefore(sc, this.Select);

		// menu (not created until needed)
		this.Menu = null;
		this.MenuShow = false;
		this.MenuActive = false;
		this.MenuOverlay = null;
		this.MenuThrottle = null;
		this.MenuItem = null;

		// change event
		this.OnChange = OnChange;

		// click/hover events
		var S = this;
		var events = ["click", "mouseover", "mouseout", "focus", "blur", "keydown"];
		owl.Each(events, function(e) { new owl.Event(S.Control, e, function(evt) { S.Handler(evt); }); });
	};


	// event handler
	owl.SelectControl.prototype.Handler = function(evt) {

		var t = evt.Type, k = evt.Key().Function;
		if (k == "tab") return;

		evt.StopDefaultAction();
		evt.StopPropagation();

		var $C = owl.SelectControl.Config, S = this;
		var target = owl.Dom.Ancestors(evt.Target, "a");
		if (this.MenuThrottle) clearInterval(this.MenuThrottle);

		// should menu appear?
		if (target == this.Control) this.MenuShow = (t == "click" || t == "focus" || (t == "keydown" && (k != "enter" || !this.MenuActive)) || (t == "mouseover" && (this.MenuActive || $C.HoverTrigger)));
		else {
			this.MenuShow = (t == "focus" || t == "mouseover" || (t == "keydown" && k != "enter"));

			// has an option been chosen?
			if (t == "click" && target != null) this.OptionChosen(target);
		}

		// key press handler
		if (t == "keydown" && (k == "up" || k == "down") && this.MenuActive && this.MenuItem) {

			// get all menu items
			var link = owl.Dom.Get("a", this.Menu);

			// find active
			var mi = 0;
			while (link[mi] && link[mi] != this.MenuItem && mi < link.length) mi++;

			// define active item
			if (link[mi] && link[mi] == this.MenuItem) {
				if (k == "up" && mi > 0) this.OptionChosen(link[mi-1]);
				if (k == "down" && mi < link.length-1) this.OptionChosen(link[mi+1]);
			}
		}

		this.MenuThrottle = setTimeout(function() { S.ShowMenu(); }, $C.HoverThrottle);
	};


	// show menu
	owl.SelectControl.prototype.ShowMenu = function() {

		if (this.MenuShow) {

			// create menu
			if (!this.Menu) {

				var $C = owl.SelectControl.Config, S = this;
				var m = document.createElement("ol");
				m.className = $C.ControlClass;

				// append menu items (option and optgroup nodes)
				owl.Each(owl.Dom.Descendents(this.Select), function(o) {
					var n = o.nodeName.toLowerCase();
					if (n == "optgroup" || n == "option") {
						var li = document.createElement("li");
						if (n == "option") {
							var a = li.appendChild(document.createElement("a"));
							a.href = "#";
							a.value = o.value;
							if (o.value == S.Select.value) a.className = $C.ActiveClass;
							a.appendChild(document.createTextNode(o.text));
						}
						else {
							var s = li.appendChild(document.createElement("strong"));
							s.appendChild(document.createTextNode(o.label));
						}
						m.appendChild(li);
					}
				});

				// add menu to body
				var body = owl.Dom.Get("body")[0];
				this.Menu = body.appendChild(m);

				// find active item
				var mi = owl.Dom.Get("a."+$C.ActiveClass, this.Menu);
				if (mi.length > 0) this.MenuItem = mi[0];

				// menu events
				var events = ["click", "mouseover", "mouseout", "focus", "blur"];
				owl.Each(events, function(e) { new owl.Event(S.Menu, e, function(evt) { S.Handler(evt); }); });
			}

			// position menu
			var mw = this.Menu.offsetWidth, mh = this.Menu.offsetHeight;
			var cw = this.Control.offsetWidth, ch = this.Control.offsetHeight;
			var loc = owl.Screen.Location(this.Control);
			var vs = owl.Screen.ViewScroll();
			var vp = owl.Screen.ViewPort();

			// calculate position
			var x = loc.X + Math.round((cw - mw) / 2);
			var y = loc.Y + ch - 1; if (loc.Y + mh > vs.Y + vp.Height) y -= (mh + ch - 1);

			// IE overlay
			this.MenuOverlay = new owl.Overlay.Elements(x, y, x + mw, y + mh);

			// show menu
			this.Menu.style.left = x + "px";
			this.Menu.style.top = y + "px";
			this.Menu.style.visibility = "visible";
			this.MenuActive = true;
		}
		else {

			// hide menu
			if (this.Menu) this.Menu.style.visibility = "hidden";
			if (this.MenuOverlay) this.MenuOverlay.Show();
			this.MenuActive = false;

		}

	};


	// reset the menu (will rebuild from new select box)
	owl.SelectControl.prototype.ResetMenu = function() {

		if (this.Menu) {
			owl.Dom.Text(this.Control, this.Select.options[this.Select.selectedIndex].text);
			var body = owl.Dom.Get("body")[0];
			body.removeChild(this.Menu);
			this.Menu = null;
		}

	};


	// option chosen
	owl.SelectControl.prototype.OptionChosen = function(item) {

		var $C = owl.SelectControl.Config;
		if (this.MenuItem) owl.Css.ClassRemove(this.MenuItem, $C.ActiveClass);
		this.MenuItem = item;
		owl.Css.ClassApply(this.MenuItem, $C.ActiveClass);

		// update text
		owl.Dom.Text(this.Control, item.firstChild.nodeValue);

		// update real select box and run change handler
		if (this.Select.value != item.value) {
			this.Select.value = item.value;
			var oca = this.Select.getAttribute("onchange");
			if (oca !== null) {
				if (typeof oca == "function") oca();
				else eval(oca);
			}
			if (typeof this.Select.onChange == "function") this.Select.onChange(this.Select, this);
			if (typeof this.OnChange == "function") this.OnChange(this.Select, this);
			if (typeof $C.ClickFunction == "function") $C.ClickFunction(this.Select, this);
		}

	};


	/* ---------------------------------------------
	owl.SelectControl.Config
	--------------------------------------------- */
	owl.SelectControl.Config = {
		AutoStart: true,
		Element: "select",
		ActiveClass: "active",
		ControlClass: "selectcontrol",
		HoverTrigger: false, // menu appears on hover rather than just click
		HoverThrottle: 200,
		ClickFunction: null
	};

	// replace all selects
	owl.SelectControl.ReplaceAll = function(OnChange) {
		owl.Each(owl.Dom.Get(owl.SelectControl.Config.Element), function(n) { new owl.SelectControl(n, OnChange); });
	};

	// auto-start select control replacement
	if (owl.SelectControl.Config.AutoStart) new owl.Event(window, "load", owl.SelectControl.ReplaceAll, 99999);
}