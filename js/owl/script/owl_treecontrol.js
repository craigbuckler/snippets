/*	---------------------------------------------

	owl.TreeControl

	--------------------------------------------- */
if (owl && owl.Dom && owl.Effect && owl.Session && !owl.TreeControl) {

	// tree control object
	owl.TreeControl = function(node) {

		// ensure not already defined
		var $C = owl.TreeControl.Config;
		if (!owl.Css.ClassExists(node, $C.ActiveClass)) return;
		owl.Css.ClassApply(node, $C.ActiveClass);

		var nName = node.nodeName, submenu = [], sopen = [];

		// session
		var session = (node.id ? $C.Session + node.id : null);

		// find sub-menus by deepest first
		var recurseNodes = function(n) {
			owl.Each(owl.Dom.Descendents(n, 1), function(c) {
				recurseNodes(c);
				if (c.nodeName == nName) owl.Array.Push(submenu, c);
			});
		};
		recurseNodes(node);

		// apply containers
		owl.Container.Anchor(submenu, false, true);

		// find submenu nodes
		submenu = owl.Dom.Get("."+owl.Container.Config.Class, node);

		// all submenus
		owl.Each(submenu, function(s, i) {
			var p = s.parentNode;
			owl.Property.Set(p, $C.LinkID, i);

			// styles
			owl.Css.ClassApply(p, $C.Class.Collapsible);

			// initial open/close branch
			sopen[i] = (session && owl.Session.Restore(session+i));
			if (owl.Css.ClassExists(p, $C.Class.Closed)) sopen[i] = false;
			if (owl.Css.ClassExists(p, $C.Class.Open)) sopen[i] = true;
			if (sopen[i]) owl.Css.ClassApply(p, $C.Class.Open);
			else { sopen[i] = true; Collapse(i); }

			// click and keypress events
			p.setAttribute("tabindex", 0);
			new owl.Event(p, "click", ExpandCollapse);
			new owl.Event(p, "keypress", ExpandCollapse);
			new owl.Event(p, "mouseover", HoverEffect);
			new owl.Event(p, "mouseout", HoverEffect);
			new owl.Event(p, "focus", HoverEffect);
			new owl.Event(p, "blur", HoverEffect);
		});

		// hover over/out effect
		function HoverEffect(evt) {
			evt.StopPropagation();
			var li = owl.Dom.Ancestors(evt.Target, "li");
			if (li && owl.Property.Exists(li, $C.LinkID)) {
				if (evt.Type == "mouseover" || evt.Type == "focus") owl.Css.ClassApply(li, $C.Class.Hover);
				else owl.Css.ClassRemove(li, $C.Class.Hover);
			}
		}

		// expand/collapse event
		function ExpandCollapse(evt) {
			evt.StopPropagation();
			var li = owl.Dom.Ancestors(evt.Target, "li");
			if (li && owl.Property.Exists(li, $C.LinkID)) {
				var m = owl.Property.Get(li, $C.LinkID);

				if (sopen[m]) {
					if (evt.Type != "keypress" || evt.Key().Function.indexOf("up") >= 0) Collapse(m); // collapse
				}
				else {
					if (evt.Type != "keypress" || evt.Key().Function.indexOf("down") >= 0) Expand(m); // expand
				}

			}
		};

		// collapse menu
		function Collapse(m) {
			var li = submenu[m].parentNode;
			sopen[m] = !sopen[m];
			owl.Css.ClassRemove(li, $C.Class.Open);
			owl.Css.ClassApply(li, $C.Class.Closed);
			owl.Effect.Collapse(submenu[m]);
			if (session) owl.Session.Store(session+m, sopen[m]);
		}

		// expand menu
		function Expand(m) {
			var li = submenu[m].parentNode;
			sopen[m] = !sopen[m];
			owl.Css.ClassRemove(li, $C.Class.Closed);
			owl.Css.ClassApply(li, $C.Class.Open);
			owl.Effect.Expand(submenu[m]);
			if (session) owl.Session.Store(session+m, sopen[m]);
		}

	};


	/* ---------------------------------------------
	owl.TreeControl.Config
	--------------------------------------------- */
	owl.TreeControl.Config = {
		AutoStart: true,
		Container: {
			Element: ".treecontrol",
			ActiveClass: "active"
		},
		LinkID: "submenu",
		Class:  {
			Collapsible: "collapsible",
			Open: "open",
			Closed: "closed",
			Hover: "hover"
		},
		Session: "treecontrol_"
	};

	// auto-start tree controls
	if (owl.TreeControl.Config.AutoStart) new owl.Event(window, "load", function (e) {
		owl.Each(owl.Dom.Get(owl.TreeControl.Config.Container.Element), function(n) { new owl.TreeControl(n); });
	}, 99990);

}