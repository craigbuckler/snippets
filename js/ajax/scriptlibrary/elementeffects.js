/*
ElementEffect class, by Craig Buckler

Dependencies:
	misc.js
	dom.js
	graphic.js
*/
function ElementEffect(element) {

	this.Element = (typeof element == 'string' ? DOM.Id(element) : element);
	this.Container = null;

	if (this.Element && this.Element.parentNode) {
		var parent = this.Element.parentNode;
		var pclass = " "+parent.className+" ";
		if (pclass.indexOf(" elementcontainer ") >= 0 || parent.getAttribute("container") == "true") this.Container = parent;
		else {
			// create container element
			var cOuter = document.createElement(this.Element.nodeName);
			cOuter.setAttribute("container", "true");
			cOuter.appendChild(this.Element.cloneNode(true)); // append element to container

			// find child index
			var cnum = 0;
			var node = this.Element;
			while ((node = node.previousSibling)) cnum++;

			// replace element with parent
			parent.replaceChild(cOuter, this.Element);
			this.Container = parent.childNodes[cnum];
			this.Element = this.Container.firstChild;
		}

		// style element and container
		if (Graphic.ComputedStyle(this.Element, "position") != "absolute") this.Container.style.position = "relative";
		else {
			this.Container.style.position = "absolute";
			this.Container.style.left = Graphic.ComputedStyle(this.Element, "left");
			this.Container.style.right = Graphic.ComputedStyle(this.Element, "right");
			this.Container.style.top = Graphic.ComputedStyle(this.Element, "top");
			this.Container.style.bottom = Graphic.ComputedStyle(this.Element, "bottom");
		}
		this.Container.style.padding = "0px";
		this.Container.style.marginLeft = Graphic.ComputedStyle(this.Element, "margin-left");
		this.Container.style.marginRight = Graphic.ComputedStyle(this.Element, "margin-right");
		this.Container.style.marginTop = Graphic.ComputedStyle(this.Element, "margin-top");
		this.Container.style.marginBottom = Graphic.ComputedStyle(this.Element, "margin-bottom");
		this.Container.style.borderStyle = "none";
		this.Container.style.overflow = "hidden";
		this.Container.style.width = this.Element.offsetWidth+"px";
		this.Container.style.height = this.Element.offsetHeight+"px";

		this.Element.style.margin = "0";
		this.Element.style.position = "absolute";
		this.Element.style.left = "auto";
		this.Element.style.right = "auto";
		this.Element.style.top = "auto";
		this.Element.style.bottom = "auto";

		this.ContainerDisplay(Graphic.ComputedStyle(this.Container, "display") != "none");
	}

	if (this.Container && this.Element) {
		this.AnimationActive = false; // true if a change animation is occurring
		this.FrameTime = 30; // time permitted between frames

		this.HideTime = 300; // animation time (ms) when disappearing
		this.HideEffects = new ElementEffectSimple(); // element hide effect (or an array of effects)
		this.HideEvent = null; // hidden event (when fully hidden)

		this.ShowTime = 300; // animation time (ms) when appearing
		this.ShowEffects = new ElementEffectSimple(); // element show effect (or an array of effects)
		this.ShowEvent = null; // show event (when fully shown)
	}

}


// toggle show/hide element
ElementEffect.prototype.Toggle = function() {
	if (this.Container.style.display == "none") this.Show(); else this.Hide();
}


// collapse the element
ElementEffect.prototype.Hide = function() {
	if (!this.AnimationActive && this.Container.style.display != "none") {
		this.ContainerDisplay(true);
		this.Animate(false);
	}
}


// show the element
ElementEffect.prototype.Show = function() {
	if (!this.AnimationActive && this.Container.style.display == "none") {
		this.ContainerDisplay(true);
		this.Animate(true);
	}
}


// run the animation effect
ElementEffect.prototype.Animate = function(show, frame) {

	// calculate the number of frames
	var firstframe = false;
	if (typeof frame == 'undefined') {
		this.AnimationActive = true;
		firstframe = true;
		frame = Math.floor((show ? this.ShowTime : this.HideTime) / this.FrameTime);
	}

	// run all animation handlers
	var complete = false;
	var handler = (show ? this.ShowEffects : this.HideEffects);
	if (handler.length) {
		// run all handlers
		for (var h = 0; h < handler.length; h++) {
			if (firstframe) handler[h].Reset(this.Container, this.Element, show);
			complete = (complete || (show ? handler[h].Show(this.Container, this.Element, frame) : handler[h].Hide(this.Container, this.Element, frame)));
		}
	}
	else {
		// single handler
		if (firstframe) handler.Reset(this.Container, this.Element, show);
		complete = (show ? handler.Show(this.Container, this.Element, frame) : handler.Hide(this.Container, this.Element, frame));
	}

	if (complete) {

		// animation complete
		this.AnimationActive = false;

		if (show) {
			// show container
			this.ContainerDisplay(true);
			if (typeof this.ShowEvent == 'function') this.ShowEvent(this);
		}
		else {
			// hide container
			this.ContainerDisplay(false);
			if (typeof this.HideEvent == 'function') this.HideEvent(this);
		}

	}
	else {
		// continue animation
		frame--;
		var ee = this;
		if (frame >= 0) setTimeout(function() { ee.Animate(show, frame); }, this.FrameTime);
	}

}


// show or hide container
ElementEffect.prototype.ContainerDisplay = function(show) {
	this.Container.style.display = (show ? "block" : "none");
	Graphic.Opacity(this.Container, (show ? 100 : 0), false);
	this.Container.style.width = (show ? this.Element.offsetWidth : 0)+"px";
	this.Container.style.height = (show ? this.Element.offsetHeight : 0)+"px";
}


// ________________________________________________________
// simple element effect
function ElementEffectSimple() {}

// simple effect reset
ElementEffectSimple.prototype.Reset = function() {}

// simple effect hide
ElementEffectSimple.prototype.Hide = function(container, element, frame) {
	container.style.display = "none";
	return true;
}

// simple effect show
ElementEffectSimple.prototype.Show = function(container, element, frame) {
	container.style.display = "";
	return true;
}


// ________________________________________________________
// fade element effect
function ElementEffectFade() {
	this.FrameMax = 0; // the largest frame number
}

// fade element reset
ElementEffectFade.prototype.Reset = function() { this.FrameMax = 0; }

// fade out effect (returns true when complete)
ElementEffectFade.prototype.Hide = function(container, element, frame) {
	return this.ShowHide(false, container, frame);
}

// fade in effect (returns true when complete)
ElementEffectFade.prototype.Show = function(container, element, frame) {
	return this.ShowHide(true, container, frame);
}

// handles fading in/out
ElementEffectFade.prototype.ShowHide = function(dir, node, frame) {
	if (this.FrameMax == 0) this.FrameMax = frame;
	var op = Math.round(frame / this.FrameMax * 100);
	if (dir) op=100-op;
	Graphic.Opacity(node, op, false);
	return (frame == 0);
}


// ________________________________________________________
// scroll element effect
function ElementEffectScroll(hscroll, vscroll, fixleft, fixtop) {
	this.FrameMax = 0;
	this.Hscroll = (hscroll === true);
	this.Vscroll = (vscroll !== false);
	this.FixLeft = (fixleft !== false);
	this.FixTop = (fixtop !== false);
}

// scroll effect reset
ElementEffectScroll.prototype.Reset = function(container, element, show) {
	this.FrameMax = 0;
	if (this.FixLeft) element.style.left = "0px"; else element.style.right = "0px";
	if (this.FixTop) element.style.top = "0px"; else element.style.bottom = "0px";
	if (show) {
		if (this.Hscroll) container.style.width = "0px";
		if (this.Vscroll) container.style.height = "0px";
	}
}

// scroll out effect (returns true when complete)
ElementEffectScroll.prototype.Hide = function(container, element, frame) {
	return this.ShowHide(false, container, element, frame);
}

// scroll in effect (returns true when complete)
ElementEffectScroll.prototype.Show = function(container, element, frame) {
	return this.ShowHide(true, container, element, frame);
}

// handles scrolling in/out
ElementEffectScroll.prototype.ShowHide = function(dir, container, element, frame) {
	if (this.FrameMax == 0) this.FrameMax = frame;
	var op = frame / this.FrameMax;
	if (dir) op=1-op;
	if (this.Hscroll) container.style.width = Math.round(element.offsetWidth * op)+"px";
	if (this.Vscroll) container.style.height = Math.round(element.offsetHeight * op)+"px";
	return (frame == 0);
}