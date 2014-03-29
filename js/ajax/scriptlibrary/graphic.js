/*
Graphic class (static), by Craig Buckler

Dependencies:
	dom.js
*/
var Graphic = new function() {

	// define viewport dimension functions
	if (typeof window.innerWidth != 'undefined') {
		this.ViewportWidth = function() { return window.innerWidth; }
		this.ViewportHeight = function() { return window.innerHeight; }
	}
	else {
		this.ViewportWidth = function() {
			if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) return document.documentElement.clientWidth;
			else return DOM.Tags("body")[0].clientWidth;
		}
		this.ViewportHeight = function() {
			if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientHeight != 'undefined' && document.documentElement.clientHeight != 0)return document.documentElement.clientHeight;
			else return DOM.Tags("body")[0].clientHeight;
		}
	}


	// define scroll position functions
	if (typeof window.pageXOffset != 'undefined') {
		this.ViewportScrollX = function() { return window.pageXOffset; }
		this.ViewportScrollY = function() { return window.pageYOffset; }
	}
	else {
		this.ViewportScrollX = function() {
			if (typeof document.documentElement.scrollLeft != 'undefined' && document.documentElement.scrollLeft > 0) return document.documentElement.scrollLeft;
			else if (typeof document.body.scrollLeft != 'undefined') return document.body.scrollLeft;
			else return 0;
		}
		this.ViewportScrollY = function() {
			if (typeof document.documentElement.scrollTop != 'undefined' && document.documentElement.scrollTop > 0) return document.documentElement.scrollTop;
			else if (typeof document.body.scrollTop != 'undefined') return document.body.scrollTop;
			else return 0;
		}
	}


	// set element opacity (0 to 100). If autoHide is true, the visibility will be set to visible/hidden as necessary
	this.Opacity = function(element, oVal, autoHide) {
		if (typeof element == 'string') element = DOM.Id(element);
		if (element) {
			oVal = (oVal < 0 ? 0 : (oVal > 100 ? 100 : oVal));
			if (autoHide) {
				var visibility = element.style.visibility;
				if (oVal == 0 && visibility != "hidden") element.style.visibility = "hidden";
				if (oVal > 0 && visibility != "visible") element.style.visibility = "visible";
			}
			if (oVal == 100) oVal = 99.999; // fix Mozilla flicker
			var oVal1 = oVal / 100;
			element.style.opacity = oVal1;
			element.style.MozOpacity = oVal1;
			element.style.filter = "alpha(opacity:"+oVal+")";
			element.style.KHTMLOpacity = oVal1;
		}
	}


	// applies a class name to an element if it is not already applied
	this.ClassApply = function(element, cname) {
		if (typeof element == 'string') element = DOM.Id(element);
		if (element && cname.length > 0) {
			var cc = " "+element.className+" ";
			if (cc.indexOf(" "+cname+" ") < 0) cc += cname;
			element.className = cc.Trim();
		}
	}


	// removes a class name from an element
	this.ClassRemove = function(element, cname) {
		if (typeof element == 'string') element = DOM.Id(element);
		if (element && cname.length > 0) {
			var cc = " "+element.className+" ";
			cc = cc.replace(new RegExp(" "+cname+" ", "gi"), " ");
			element.className = cc.Trim();
		}
	}


	// ensures an element is within a certain section of the browser viewport
	this.PositionViewport = function(element, vtop, vbottom, absolute) {
		if (absolute !== true) {
			var vh = this.ViewportHeight();
			vtop = Math.floor((vtop/100) * vh);
			vbottom = Math.ceil((vbottom/100) * vh);
		}
		var ey = DOM.AbsoluteY(element);
		var vy = this.ViewportScrollY();
		if (ey < vy+vtop) this.ScrollViewport(ey-vtop);
		else if (ey > vy+vbottom) this.ScrollViewport(ey-vbottom);
	}


	// handles scrolling
	this.AnimationFrames = 10;
	this.AnimationPause = 300;
	this.ScrollViewport = function(moveTo, frame, pause) {

		if (isNaN(frame)) { var cTime = new Date(); frame = this.AnimationFrames; }

		// scroll to position
		var moveFrom = this.ViewportScrollY();
		window.scrollTo(0, moveFrom+Math.floor((moveTo - moveFrom) / frame));

		// continue animation
		if (frame > 1 && moveFrom != this.ViewportScrollY()) {
			if (isNaN(pause)) {
				pause = ((new Date() - cTime) + 8) * 2;
				frame = Math.floor(this.AnimationPause / pause);
			}
			else frame--;
			setTimeout(function() { Graphic.ScrollViewport(moveTo, frame, pause); }, pause);
		}
	}


	// get the computed style of an element, e.g. Graphic.ComputedStyle(element, "width");
	this.ComputedStyle = function(element, rule) {
		if (typeof element == 'string') element = DOM.Id(element);
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


	// determines whether an IFRAME is required
	this.IFrameRequired = function() {
		var ret = false;
		var nav = navigator.userAgent.toLowerCase();
		if (window.ActiveXObject && (nav.indexOf("msie 5.5") >= 0 || nav.indexOf("msie 6.0") >= 0)) {
			var tags = ["select", "iframe", "applet"];
			for (var i = 0; i < tags.length && !ret; i++) ret = (DOM.Tags(tags[i]).length > 0);
		}
		return ret;
	}


	// pass the active element and box co-ordinates (node, left x1, top y1, width w, height h) to hide overlapping elements in IE5.0
	var Hidden = new Array();
	this.HideElements = function(node, x1, y1, w, h) {

		if (window.ActiveXObject && navigator.userAgent.toLowerCase().indexOf("msie 5.0") >= 0) {

			// show previously hidden elements
			var i, j, e;
			for (i = 0; i < Hidden.length; i++) Hidden[i].style.visibility = "visible";

			// element intersection check
			var intersect = function(element) {
				var rx1 = DOM.AbsoluteX(element); var ry1 = DOM.AbsoluteY(element);
				var rx2 = rx1+element.offsetWidth+1; var ry2 = ry1+element.offsetHeight;
				if (element != node && rx2 > x1 && ry2 > y1 && x2 > rx1 && y2 > ry2) {
					Hidden.push(element);
					element.style.visibility = "hidden";
				}
			}

			Hidden = new Array(); // initialise array
			var x2 = x1+Math.abs(w); var y2 = y1+Math.abs(h); // bottom co-ordinate
			var tags = ["select", "iframe", "applet"];

			// examine all elements of type
			for (i = 0; i < tags.length; i++) {
				e = DOM.Tags(tags[i]);
				for (j = 0; j < e.length; j++) intersect(e[j]);
			}

		}
	}

}