/*
TextEffect class, by Craig Buckler

Dependencies:
	misc.js
	dom.js
	graphic.js
*/
function TextEffect(node) {

	// find text node
	this.TextNode = null;
	node= (typeof node == "string" ? DOM.Id(node) : node);
	if (node) {
		if (node.nodeType == DOM.TextNode) this.TextNode = node;
		else this.TextNode = DOM.FindNodeType(node, DOM.TextNode);
	}

	// append text node if required
	if (!this.TextNode) {
		if (node && node.nodeType == DOM.ElementNode) this.TextNode = node.appendChild(document.createTextNode("\u00a0"));
	}

	// create TextEffect object
	if (this.TextNode) {
		this.Node = this.TextNode.parentNode; // parent element
		this.Node.style.position = "relative"; // set relative for animation
		this.Node.style.height = this.Node.offsetHeight+"px"; // make object have layout (IE)
		Graphic.Opacity(this.Node, 100);

		this.TextCurrent = this.TextNode.nodeValue; // current text
		this.TextNext = null; // next text item
		this.TextChange = null; // activated by this.ChangeText()
		this.AnimationActive = false; // true if a change animation is occurring

		this.FrameTime = 30; // time permitted between frames

		this.HideTime = 300; // animation time (ms) when disappearing
		this.HideEffect = new TextEffectSimple(); // element hide effect
		this.HideEvent = null; // hidden event (when fully hidden)

		this.ShowTime = 300; // animation time (ms) when appearing
		this.ShowEffect = new TextEffectSimple(); // element show effect
		this.ShowEvent = null; // show event (when fully shown)
	}

}


// change text
TextEffect.prototype.ChangeText = function(text) {
	this.TextChange = (typeof text == 'undefined' ? this.TextCurrent : text);
	if (!this.AnimationActive) this.Animate();
}


// handle hide and show animation
TextEffect.prototype.Animate = function(show, frame) {

	// first run
	if (typeof show == 'undefined') {
		this.AnimationActive = true;
		this.TextNext = this.TextChange;
		show = false;
	}

	// calculate the number of frames
	if (typeof frame == 'undefined') frame = Math.floor((show ? this.ShowTime : this.HideTime) / this.FrameTime);

	// run animation handler
	var complete = (show ? 
		this.ShowEffect.Show(this.Node, this.TextNode, this.TextCurrent, this.TextNext, frame) : 
		this.HideEffect.Hide(this.Node, this.TextNode, this.TextCurrent, this.TextNext, frame)
	);

	if (complete) {
		if (!show) {
			// hide animation complete
			if (typeof this.HideEvent == 'function') this.HideEvent(this);
			this.TextNext = this.TextChange;
			this.Animate(true);
		}
		else {
			// show animation complete
			this.TextCurrent = this.TextNext;
			this.TextNext = null;
			this.AnimationActive = false;
			if (typeof this.ShowEvent == 'function') this.ShowEvent(this);
			if (this.TextChange != null && this.TextChange != this.TextCurrent) this.Animate();
		}
	}
	else {
		// continue animation
		frame--;
		var te = this;
		if (frame >= 0) setTimeout(function() { te.Animate(show, frame); }, this.FrameTime);
	}

}


// ________________________________________________________
// default text effect - no animation
function TextEffectSimple() {}

// basic hide effect (returns true when complete)
TextEffectSimple.prototype.Hide = function(node, textnode, textold, textnew, frame) {
	textnode.nodeValue = "";
	return true;
}

// basic show effect (returns true when complete)
TextEffectSimple.prototype.Show = function(node, textnode, textold, textnew, frame) {
	textnode.nodeValue = textnew;
	Graphic.Opacity(node, 100);
	return true;
}

// ________________________________________________________
// fade text effect
function TextEffectFade() {
	this.FrameMax = 0; // the largest frame number
}

// fade out effect (returns true when complete)
TextEffectFade.prototype.Hide = function(node, textnode, textold, textnew, frame) {
	return this.ShowHide(false, node, textnode, textold, textnew, frame);
}

// fade in effect (returns true when complete)
TextEffectFade.prototype.Show = function(node, textnode, textold, textnew, frame) {
	if (this.FrameMax == 0) textnode.nodeValue = textnew;
	return this.ShowHide(true, node, textnode, textold, textnew, frame);
}

// handles fading in/out
TextEffectFade.prototype.ShowHide = function(dir, node, textnode, textold, textnew, frame) {
	if (this.FrameMax == 0) this.FrameMax = frame;
	var op = Math.round(frame / this.FrameMax * 100);
	if (dir) op=100-op;
	Graphic.Opacity(node, op, false);
	if (frame == 0) this.FrameMax = 0;
	return (frame == 0);
}

// ________________________________________________________
// teletype text effect
function TextEffectTeletype() {
	this.FrameMax = 0; // the largest frame number
	this.Cursor = true; // show cursor
	this.CursorFlash = true; // flash cursor
}

// teletype out effect (returns true when complete)
TextEffectTeletype.prototype.Hide = function(node, textnode, textold, textnew, frame) {
	return this.ShowHide(false, node, textnode, textold, textnew, frame);
}

// teletype in effect (returns true when complete)
TextEffectTeletype.prototype.Show = function(node, textnode, textold, textnew, frame) {
	if (this.FrameMax == 0) Graphic.Opacity(node, 100);
	return this.ShowHide(true, node, textnode, textold, textnew, frame);
}

// handles teletype in/out
TextEffectTeletype.prototype.ShowHide = function(dir, node, textnode, textold, textnew, frame) {
	if (this.FrameMax == 0) this.FrameMax = frame;
	var text = (dir ? textnew : textold);
	var op = Math.round(frame / this.FrameMax * text.length);
	if (dir) op=text.length-op;
	var ntext = text.substr(0, op)+(this.Cursor && frame > 0 && (!this.CursorFlash || (frame/2) == Math.floor(frame/2)) ? "_" : "");
	textnode.nodeValue = ntext + (ntext.length == 0 ? "\u00a0" : "");
	if (frame == 0) this.FrameMax = 0;
	return (frame == 0);
}

// ________________________________________________________
// scroll text effect
function TextEffectScroll() {
	this.Cursor = false; // show cursor
}
TextEffectScroll.prototype = new TextEffectTeletype;

// handles scroll in/out
TextEffectScroll.prototype.ShowHide = function(dir, node, textnode, textold, textnew, frame) {
	if (this.FrameMax == 0) this.FrameMax = frame;
	var text = (dir ? textnew : textold);
	var op = Math.round(frame / this.FrameMax * text.length);
	if (!dir) op=text.length-op;
	var ntext = text.substr(op)+(this.Cursor && frame > 0 && (!this.CursorFlash || (frame/2) == Math.floor(frame/2)) ? "_" : "");
	textnode.nodeValue = ntext + (ntext.length == 0 ? "\u00a0" : "");
	if (frame == 0) this.FrameMax = 0;
	return (frame == 0);
}