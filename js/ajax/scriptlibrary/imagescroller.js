/*
ImageScroller, by Craig Buckler
Scrolls an image when a mouseover occurs over the thumbnail

Dependencies:
	misc.js (if IE5 is supported)
	events.js
	dom.js
	graphic.js
*/
new Event(window, "load", ImageScrollerSetup);

var ISfadeOn = true; // switch fade on/off
var ISfadeStep = 2; // fade steps (1 - 100)
var ISfadePause = 10; // fade pause between steps

// find links with class of imagescroller
function ImageScrollerSetup() {
		var links = DOM.Class("imagescroller", "a");
		for (var i = 0; i < links.length; i++) if (links[i].getAttribute("imagescroller") != 'true') new ImageScroller(links[i]);
}

// define ImageScroller
function ImageScroller(aNode) {

	var IS = this; // this object

	// set image background and mousemove event
	this.Initialise = function() {
		aNode.style.backgroundImage = "url("+fImage.src+")";
		aNode.style.backgroundRepeat = "no-repeat";
		aNode.style.cursor = "move";
		Graphic.Opacity(iNode, fop, true);
		new Event(aNode, "mouseover", function(evt) { IS.MoveEvent(evt); });
		new Event(aNode, "mousemove", function(evt) { IS.PositionImage(evt); });
		new Event(aNode, "mouseout", function(evt) { IS.MoveEvent(evt); });
	}

	// show or hide image
	this.MoveEvent = function(evt) {
		if (ftimer) clearInterval(ftimer);
		if (evt.Raised.Type == "mouseover") {
			aX = DOM.AbsoluteX(aNode); aY = DOM.AbsoluteY(aNode); // find element location (if screen resized)
			if (ISfadeOn) ftimer = setInterval(function() { IS.Fade(-ISfadeStep); }, ISfadePause); else iNode.style.visibility = "hidden";
		}
		else if (evt.Raised.Type == "mouseout") {
			if (ISfadeOn) ftimer = setInterval(function() { IS.Fade(ISfadeStep); }, ISfadePause); else iNode.style.visibility = "visible";
		}
	}

	// fade the image
	this.Fade = function(step) {
		fop += step;
		fop = (fop <= 0 ? 0 : (fop >= 100 ? 100 : fop));
		Graphic.Opacity(iNode, fop, true);
		if (fop == 0 || fop == 100) clearInterval(ftimer);
	}

	// position the image
	this.PositionImage = function(evt) {
		var piX = parseInt(((evt.Raised.MouseX - aX) / aW) * 100); piX = (piX < 5 ? 0 : (piX > 95 ? 100 : piX));
		var piY = parseInt(((evt.Raised.MouseY - aY) / aH) * 100); piY = (piY < 5 ? 0 : (piY > 95 ? 100 : piY));
		aNode.style.backgroundPosition = piX+"% "+piY+"%";
	}

	// setup
	var iNode = DOM.Tags("img", aNode);
	if (iNode.length > 0) iNode = iNode[0]; else iNode = null;

	var ext = /\.(gif|jpg|jpeg|png|bmp)$/i;
	if (iNode && aNode.getAttribute("imagescroller") != 'true' && ext.test(aNode.getAttribute("href").Trim())) {

		// mark as controlled
		aNode.setAttribute("imagescroller", "true");
	
		// element dimensions
		var aX = DOM.AbsoluteX(aNode); var aY = DOM.AbsoluteY(aNode);
		var aW = aNode.offsetWidth; var aH = aNode.offsetHeight;
	
		// fade opacity and timer
		var fop = 100;
		var ftimer;
	
		// load image and initialise
		var fImage = new Image;
		fImage.src = aNode.getAttribute("href");
		if (fImage.complete) this.Initialise();
		else new Event(fImage, "load", function(evt) { IS.Initialise(); });
	}
}