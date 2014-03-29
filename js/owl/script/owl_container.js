/*	---------------------------------------------

	owl.Container

	--------------------------------------------- */
if (owl && owl.Css && !owl.Container) owl.Container = function() {

	// default configuration
	var Config = {
		Element: "div",
		Class: "econtainer",
		InnerClass: "econtained"
	};

	// create container elements (and return in an array)
	function Create(element) {

		var container = [];
		owl.Each(owl.Array.Make(element), function(e, i) {
			var cont = (owl.Css.ClassExists(e, Config.Class) ? e : e.parentNode);
			if (!owl.Css.ClassExists(cont, Config.Class)) {
			
				// find child index
				var cnum = 0;
				var n = e;
				while ((n = n.previousSibling)) cnum++;
			
				// create container node
				var cnode = document.createElement(Config.Element);
				cnode.className = Config.Class;
				cnode.appendChild(e.cloneNode(true));
				cont.replaceChild(cnode, e);
				
				// find container and element in DOM
				cont = cont.childNodes[cnum];
				e = cont.firstChild;
				
				// modify position
				if (owl.Css.ComputedStyle(e, "position") == "absolute") {
					cont.style.position = "absolute";
					cont.style.top = owl.Css.ComputedStyle(e, "top");
					cont.style.bottom = owl.Css.ComputedStyle(e, "bottom");
					cont.style.left = owl.Css.ComputedStyle(e, "left");
					cont.style.right = owl.Css.ComputedStyle(e, "right");
				}
				
				// modify dimensions
				cont.style.width = e.offsetWidth+"px";
				cont.style.height = e.offsetHeight+"px";
				cont.style.marginLeft = owl.Css.ComputedStyle(e, "margin-left");
				cont.style.marginRight = owl.Css.ComputedStyle(e, "margin-right");
				cont.style.marginTop = owl.Css.ComputedStyle(e, "margin-top");
				cont.style.marginBottom = owl.Css.ComputedStyle(e, "margin-bottom");
				
				// remove inner classes
				owl.Css.ClassApply(e, Config.InnerClass);
			}
			
			// add container to returned nodes
			owl.Array.Push(container, cont);
		});
		
		return container;
	}
	
	// anchors container contents to top/bottom and left/right
	function Anchor(element, fixtop, fixleft) {
		element = Create(element);		
		owl.Each(element, function(e) {
			e = e.firstChild;
			e.style.top = (fixtop ? "0px" : "auto");
			e.style.bottom = (fixtop ? "auto" : "0px");
			e.style.left = (fixleft ? "0px" : "auto");
			e.style.right = (fixleft ? "auto" : "0px");
		});
		return element;
	}

	// public methods
	return {
		Config: Config,
		Create: Create,
		Anchor: Anchor
	};

}();