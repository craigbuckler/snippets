/*	---------------------------------------------

	owl.Css

	--------------------------------------------- */
if (owl && !owl.Css) owl.Css = function() {


	// returns true if class applied to passed elements
	function ClassExists(elements, name) {
		var cfound = true;
		if (name) owl.Each(owl.Array.Make(elements), function(e) { var cn = " "+e.className+" "; cfound = (cn.indexOf(" "+name+" ") >= 0); return cfound; });
		return cfound;
	}


	// apply class to all elements
	function ClassApply(elements, name) {
		owl.Each(owl.Array.Make(elements),
			function(e) {
				var cn = " "+e.className+" ";
				if (cn.indexOf(" "+name+" ") < 0) {
					cn += name;
					e.className = owl.String.Trim(cn);
				}
			}
		);
	}


	// remove class from elements (pass name of "" to remove all classes)
	function ClassRemove(elements, name) {
		owl.Each(owl.Array.Make(elements),
			function(e) {
				var cn = "";
				if (name) {
					cn = " "+e.className+" ";
					cn = owl.String.Trim(cn.replace(new RegExp(" "+name+" ", "gi"), " "));
				}
				e.className = cn;
			}
		);
	}


	// set elements opacity (0 to 100). Set autoHide to false to keep visibility
	// IE5.5/6.0 elements require hasLayout and often a background colour
	function Opacity(elements, oVal, autoHide) {
		oVal = Math.min(Math.max(oVal, 0), 99.999999);
		var oValFrac = oVal / 100;
		owl.Each(owl.Array.Make(elements),
			function(e) {
				if (autoHide !== false) {
					if (e.style.visibility == "hidden") { if (oVal > 0) e.style.visibility = "visible"; }
					else { if (oVal == 0) e.style.visibility = "hidden"; }
				}
				e.style.opacity = oValFrac;
				e.style.MozOpacity = oValFrac;
				e.style.filter = "alpha(opacity:"+oVal+")";
				e.style.KHTMLOpacity = oValFrac;
			}
		);
	}
	
	
	// fetch the computed style of an element, e.g. element, "width"
	function ComputedStyle(element, rule) {
		var value = "";
		if (element) {
			if (document.defaultView && document.defaultView.getComputedStyle) value = document.defaultView.getComputedStyle(element, "").getPropertyValue(rule);
			else if (element.currentStyle) {
				rule = rule.replace(/\-(\w)/g, function(m,c) { return c.toUpperCase(); });
				value = element.currentStyle[rule];
			}
		}
		return value;
	}


	return {
		ClassExists: ClassExists,
		ClassApply: ClassApply,
		ClassRemove: ClassRemove,
		Opacity: Opacity,
		ComputedStyle: ComputedStyle
	};

}();


// prevent IE CSS background flickering
if (owl && owl.Browser && owl.Browser.IE && Math.floor(owl.Browser.VerNum) == 6) {
	try { document.execCommand("BackgroundImageCache", false, true); }
	catch(e) {};
}