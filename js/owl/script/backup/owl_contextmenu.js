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

		// click and hover events
		trigger.setAttribute("tabindex", 0);
		owl.Each(["click", "mouseover", "mouseout", "focus", "blur"], function(e) {
			new owl.Event(trigger, e, MenuHandler);
			new owl.Event(menu, e, MenuHandler);
		});

		// show/hide context menu
		var throttle = null, show = false, showCur = false, overlay = null;
		function MenuHandler(evt) {

			if (throttle) clearInterval(throttle);
			evt.StopPropagation();

			// should context menu appear?
			var t = evt.Type;

			if (evt.Element == trigger) show = (t == "click" || evt.Type == "focus" || (t == "mouseover" && $C.HoverTrigger));
			else show = (t == "click" || evt.Type == "focus" || t == "mouseover");

			throttle = setTimeout(ShowMenu, $C.HoverThrottle);
		}

		// show or hide menu
		function ShowMenu() {

			if (show == showCur) return;
			else showCur = show;

			if (show) {

				var loc = owl.Screen.Location(trigger);
				var vs = owl.Screen.ViewScroll();
				var vp = owl.Screen.ViewPort();

				// check horizontal location
				if (loc.X + trigger.offsetWidth + menu.offsetWidth > vs.X + vp.Width) {
					menu.style.left = "auto";
					menu.style.right = "0px";
				}
				else {
					menu.style.left = "100%";
					menu.style.bottom = "auto";
				}

				// check vertical location
				if (loc.Y + trigger.offsetHeight + menu.offsetHeight > vs.Y + vp.Height) {
					menu.style.top = "auto";
					menu.style.bottom = "100%";
				}
				else {
					menu.style.top = "100%";
					menu.style.bottom = "auto";
				}

				// hover
				if ($C.HoverClass) owl.Css.ClassApply(trigger, $C.HoverClass);

				// overlay (IE)
				loc = owl.Screen.Location(menu);
				overlay = new owl.Overlay.Elements(loc.X, loc.Y, loc.X + menu.offsetWidth, loc.Y + menu.offsetHeight);

				// fade in
				owl.Effect.FadeIn(menu);
			}
			else {
				// fade out
				if (overlay) overlay.Show();
				if ($C.HoverClass) owl.Css.ClassRemove(trigger, $C.HoverClass);
				owl.Effect.FadeOut(menu);
			}

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
		HoverThrottle: 300
	};

	// auto-start tree controls
	if (owl.ContextMenu.Config.AutoStart) new owl.Event(window, "load", function (e) {
		owl.Each(owl.Dom.Get(owl.ContextMenu.Config.Container.Element), function(n) { new owl.ContextMenu(n); });
	}, 99999);

}