/*	---------------------------------------------

	owl.ContextMenu

	--------------------------------------------- */
if (owl && owl.Effect && owl.Overlay && !owl.ContextMenu) {

	// context menu object
	owl.ContextMenu = function(trigger) {

		var $C = owl.ContextMenu.Config;
		var menu = owl.Dom.Get($C.Container.Menu, trigger);

		if (owl.Css.ClassExists(trigger, $C.Container.ActiveClass) || menu.length != 1) return;
		owl.Css.ClassApply(trigger, $C.Container.ActiveClass);
		menu = menu[0];

		// click/hover events
		trigger.setAttribute("tabindex", 0);
		var events = ["click", "mouseover", "mouseout", "focus", "blur"];
		owl.Each(events, function(e) { new owl.Event(trigger, e, MenuHandler); });

		// show/hide context menu
		var throttle = null, show = false, showCur = false, overlay = null, mCopy = null, active = null;
		function MenuHandler(evt) {

			// menu click?
			if (evt.Type == "click") {
				var mClick = evt.Target;
				while (mClick != menu && mClick.nodeName.toLowerCase() != "a" && mClick.parentNode) mClick = mClick.parentNode;
				if (mClick.nodeName.toLowerCase() == "a") {
					if (MenuClicked(mClick)) evt.StopDefaultAction();
					evt.StopPropagation();
					return;
				}
			}

			if (throttle) clearInterval(throttle);
			if (evt.Target == trigger || evt.Target == menu) evt.StopPropagation();

			// should context menu appear?
			var t = evt.Type;
			if (evt.Element == trigger) show = (t == "click" || t == "focus" || (t == "mouseover" && $C.HoverTrigger));
			else show = (t == "click" || t == "focus" || t == "mouseover");

			throttle = setTimeout(ShowMenu, $C.HoverThrottle);
		}

		// show or hide menu
		function ShowMenu() {

			if (show == showCur) return;
			else showCur = show;

			if (show) {

				// create a menu copy
				if (!mCopy) {
					var body = owl.Dom.Get("body")[0];
					mCopy = body.appendChild(menu.cloneNode(true));
					owl.Css.ClassApply(mCopy, $C.MenuClass);

					// find active item
					active = owl.Dom.Get("."+$C.MenuActiveClass, mCopy);
					active = (active.length == 1 ? active[0] : null);

					mCopy.setAttribute("tabindex", 0);

					// apply events
					owl.Each(events, function(e) { new owl.Event(mCopy, e, MenuHandler); });
				}

				var mw = mCopy.offsetWidth, mh = mCopy.offsetHeight;
				var tw = trigger.offsetWidth, th = trigger.offsetHeight;
				var loc = owl.Screen.Location(trigger);
				var vs = owl.Screen.ViewScroll();
				var vp = owl.Screen.ViewPort();

				// hover
				if ($C.HoverClass) owl.Css.ClassApply(trigger, $C.HoverClass);

				// calculate position
				var x = loc.X + tw; if (loc.X + mw > vs.X + vp.Width) x -= mw;
				var y = loc.Y + th; if (loc.Y + mh > vs.Y + vp.Height) y -= (mh + th);

				// IE overlay
				overlay = new owl.Overlay.Elements(x, y, x + mw, y + mh);

				// show menu
				mCopy.style.left = x + "px";
				mCopy.style.top = y + "px";
				mCopy.style.visibility = "visible";
			}
			else {
				mCopy.style.visibility = "hidden";
				if (overlay) overlay.Show();
				if ($C.HoverClass) owl.Css.ClassRemove(trigger, $C.HoverClass);
			}

		}


		// a menu item has been  clicked
		function MenuClicked(mClick) {

			var onpage = false;

			// off page link?
			var path = mClick.pathname;
			if (path.charAt(0) != "/") path = "/"+path;
			if (path == window.location.pathname || mClick.search != "") {
				onpage = true;

				// activate menu item
				mClick.blur();

				if (active) owl.Css.ClassRemove(active, $C.MenuActiveClass);
				active = mClick;
				owl.Css.ClassApply(active, $C.MenuActiveClass);

				// update hidden value
				var f = null, v = owl.Dom.Text(mClick);
				if (mClick.hash) {
					f = owl.Dom.Get(mClick.hash);
					if (f.length == 1) {
						f = f[0];
						if (f.value || f.value == "") f.value = v;
					}
					else f = null;
				}

				// handler function
				if (typeof $C.ClickFunction == "function") $C.ClickFunction(mClick, f, v);
			}

			return onpage;

		}

	};


	/* ---------------------------------------------
	owl.ContextMenu.Config
	--------------------------------------------- */
	owl.ContextMenu.Config = {
		AutoStart: true,
		Container: {
			Element: ".contextmenu",
			ActiveClass: "active",
			Menu: "ul"
		},
		HoverTrigger: true, // menu appears on hover rather than just click
		HoverClass: "hover",
		MenuClass: "context",
		MenuActiveClass: "active",
		HoverThrottle: 300,
		ClickFunction: null
	};

	// auto-start tree controls
	if (owl.ContextMenu.Config.AutoStart) new owl.Event(window, "load", function (e) {
		owl.Each(owl.Dom.Get(owl.ContextMenu.Config.Container.Element), function(n) { new owl.ContextMenu(n); });
	}, 99999);

}