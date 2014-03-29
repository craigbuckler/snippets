/*
DragDrop class, By Craig Buckler
Configures an element that can be dragged and dropped.
The movement of the element can be restricted to certain paths, snap to a grid, or lock on to specific drop points.
Only a single set of document events are used to manage all DragDrop elements.

Dependencies:
	misc.js
	events.js
	dom.js
	graphic.js
*/
function DragDrop(element, dragged) {

	// initialise
	this.Initialise = function() {
		dragged = (typeof dragged == 'string' ? DOM.Id(dragged) : dragged); // dragged element
		eDrag = (dragged ? dragged : this.Element);

		eDrag.style.position = "absolute";
		this.PosX = DOM.AbsoluteX(eDrag);
		this.PosY = DOM.AbsoluteY(eDrag);
		GetParentLocation();
		DragDropManager.Add(this); // manage this object
	}


	// event handler
	this.Handler = function(evt) {

		// current mouse co-ordinates
		var cX = evt.Raised.MouseX;
		var cY = evt.Raised.MouseY;

		var dp; // drop point index

		// mousedown event for this element
		if (evt.Raised.Type == "mousedown" && this.Enabled && Enable && !this.DragOn && evt.Raised.Element == this.Element) {
			this.LocateDropElements();
			ocX = cX - this.PosX;
			ocY = cY - this.PosY;
			GetParentLocation();
			this.StartPosX = this.PosX;
			this.StartPosY = this.PosY;

			ozi = eDrag.style.zIndex;
			eDrag.style.zIndex = this.DragZIndex;
			Graphic.Opacity(eDrag, this.DragOpacity, true);
			this.DragOn = true;

			if (typeof this.EventStart == 'function') this.EventStart(this); // start event
		}

		// move element
		if (evt.Raised.Type == "mousemove" && this.DragOn && this.Enabled) {
			this.MoveTo(cX - ocX, cY - ocY);
			this.UserMoved = true;
			if (typeof this.EventMove == 'function') this.EventMove(this); // move event

			// on/off a drop index
			dp = this.GetDropPoint(cX, cY);
			if (this.DropIndex != null && this.DropIndex != dp && typeof this.EventDropOut == 'function') this.EventDropOut(this); // out event
			if (dp >= 0) {
				this.DropIndex = dp;
				this.DropID = Drop[dp].id;
				this.DropElement = Drop[dp].element;
				if (typeof this.EventDropOver == 'function') this.EventDropOver(this); // over event
			}
			else { this.DropIndex = null; this.DropID = null; this.DropElement = null; }
		}

		// mouseup
		if (evt.Raised.Type == "mouseup" && this.DragOn) {
			this.DragOn = false;
			Graphic.Opacity(eDrag, 100, true);

			// on a drop point?
			dp = this.GetDropPoint(cX, cY);
			if (dp >= 0) {
				this.DropIndex = dp;
				this.DropID = Drop[dp].id;
				this.DropElement = Drop[dp].element;
				if (this.DropLock) { this.StartPosX = Drop[dp].xMin; this.StartPosY = Drop[dp].yMin; this.SlideBack(); } // lock to top
			}

			// return to starting position
			if (this.ReturnAlways || (Drop.length > 0 && this.DropPoint == null)) {
				// find drop point
				dp = this.GetDropPoint(this.StartPosX, this.StartPosY);
				if (dp >= 0) {
					this.DropIndex = dp;
					this.DropID = Drop[dp].id;
					this.DropElement = Drop[dp].element;
				}
				this.SlideBack();
			}
			else eDrag.style.zIndex = ozi;

			if (typeof this.EventStop == 'function') this.EventStop(this); // stop event
			if (this.DropIndex != null && typeof this.EventDropStop == 'function') this.EventDropStop(this); // drop event
		}

	}


	// move element to a specified co-ordinate
	this.MoveTo = function(x, y, slide) {

		// apply restrictions
		for (var i = 0; i < Restrict.length; i++) {
			var res = Restrict[i].Limit(x, y);
			x = res[0]; y = res[1];
		}

		x = Math.round(x); y = Math.round(y);

		GetParentLocation();
		if (!slide) {
			 // jump to position
			this.PosX = x; this.PosY = y; eDrag.style.left = (this.PosX - pX)+"px"; eDrag.style.top = (this.PosY - pY)+"px";
			if (!this.DragOn && typeof this.EventStop == 'function') this.EventStop(this); // stop event
		}
		else { this.StartPosX = x; this.StartPosY = y; this.SlideBack(); } // slide to position
	}


	// move element to a drop point identified by its index (zero based)
	this.MoveToDrop = function(dp, slide) {
		if (typeof dp == 'undefined' || dp == null || dp < 0) dp = Drop.length - 1;
		if (dp >= 0 && dp < Drop.length) {
			this.LocateDropElements();
			this.MoveTo(Drop[dp].xMin, Drop[dp].yMin, slide);
			this.DropIndex = dp;
			this.DropID = Drop[dp].id;
			this.DropElement = Drop[dp].element;
		}
	}


	// move back to starting position
	this.SlideBack = function(frame, pause) {

		if (isNaN(frame)) { var cTime = new Date(); Enable = false; }

		// move element
		var f = (isNaN(frame) ? 10 : frame);
		this.PosX += (this.StartPosX - this.PosX) / f;
		this.PosY += (this.StartPosY - this.PosY) / f;
		eDrag.style.left = (this.PosX - pX)+"px";
		eDrag.style.top = (this.PosY - pY)+"px";
		if (!this.DragOn && typeof this.EventMove == 'function') this.EventMove(this); // move event

		if (this.PosX == this.StartPosX && this.PosY == this.StartPosY) {
			// animation complete
			eDrag.style.zIndex = ozi;
			Enable = true;
			if (typeof this.EventStop == 'function') this.EventStop(this); // stop event
		}
		else {
			// continue animation
			if (isNaN(frame)) {
				pause = ((new Date() - cTime) + 8) * 2;
				frame = Math.floor(this.ReturnTime / pause);
			}
			else frame--;
			setTimeout(function() { DD.SlideBack(frame, pause); }, pause);
		}
	}


	// add a movement restriction
	this.AddRestriction = function(Rfunction) {
		Restrict.push(Rfunction);
		this.MoveTo(this.PosX, this.PosY);
	}


	// removes the last added movement restriction
	this.RemoveLastRestriction = function() {
		if (Restrict.length > 0) Restrict.pop();
	}


	// removes all restrictions
	this.RemoveRestrictions = function() {
		Restrict = new Array();
	}


	// add a drop point
	this.AddDrop = function(x1, y1, x2, y2, dpid, element) {
		if (!dpid) dpid = Drop.length;
		if (typeof(element) == 'undefined' || !element) element = null;
		Drop.push({id: dpid, element: element, xMin: Math.min(x1, x2), xMax: Math.max(x1, x2), yMin: Math.min(y1, y2), yMax: Math.max(y1, y2)});
	}


	// use an element as a drop point
	this.AddDropElement = function(element, dpid) {
		if (typeof element == 'string') element = DOM.Id(element);
		if (element) {
			this.AddDrop(0, 0 , 0, 0, dpid, element);
			this.CheckDropPositions();
		}
	}


	// update drop points
	this.LocateDropElements = function() {
		for (var i = 0; i < Drop.length; i++) {
			if (Drop[i].element != null) {
				Drop[i].xMin = DOM.AbsoluteX(Drop[i].element);
				Drop[i].yMin = DOM.AbsoluteY(Drop[i].element);
				Drop[i].xMax = Drop[i].xMin + Drop[i].element.offsetWidth - 1;
				Drop[i].yMax = Drop[i].yMin + Drop[i].element.offsetHeight - 1;
			}
		}
	}


	// setup drop point checking timer
	this.CheckDropPositions = function() {
		if (DropTimer == null) {

			// checking timer
			DropTimer = setInterval(
				function() {
					if (!DD.DragOn && DD.DropIndex != null) {
						DD.LocateDropElements();
						DD.MoveToDrop(DD.DropIndex, false);
					}
				},
			DropCheckDelay);

			// cleanup
			new Event(window, "unload", function(evt) { clearInterval(DropTimer); });
		}
	}
	

	// find the drop point index, if any (private)
	this.GetDropPoint = function(x, y) {
		var dp = -1;
		for (var i = 0; i < Drop.length && dp < 0; i++) {
			if (x >= Drop[i].xMin && x <= Drop[i].xMax && y >= Drop[i].yMin && y <= Drop[i].yMax) dp = i;
		}
		return dp;
	}


	// removes the last added drop point
	this.RemoveLastDrop = function() {
		if (Drop.length > 0) Drop.pop();
	}


	// removes all restrictions
	this.RemoveDrops = function() {
		Drop = new Array();
		if (DropTimer != null) {
			clearInterval(DropTimer);
			DropTimer = null;
		}
	}


	// get location of the element's offset parent (private)
	var GetParentLocation = function() {
		pX = DOM.AbsoluteX(eDrag.offsetParent);
		pY = DOM.AbsoluteY(eDrag.offsetParent);
	}


	this.Element = (typeof element == 'string' ? DOM.Id(element) : element); // this element
	this.DragOn = false; // drag started

	// custom properties
	this.Enabled = true; // dragdrop enabled/disabled
	this.DragZIndex = 10; // dragged z-index
	this.DragOpacity = 100; // opacity of dragged element

	this.UserMoved = false; // user has moved the element
	this.PosX = 0; this.PosY = 0; // current position of element
	this.StartPosX = 0; this.StartPosY = 0; // starting position of element

	this.ReturnAlways = false; // return to starting position
	this.ReturnTime = 300; // return time in ms

	this.EventStart = null; // event: move started
	this.EventMove = null; // event: move
	this.EventStop = null; // event: move stopped

	this.EventDropOver = null; // event: move over drop
	this.EventDropOut = null; // event: move out of drop
	this.EventDropStop = null; // event: stopped on drop

	this.DropIndex = null; // the drop point array index
	this.DropID = null; // the registered drop point ID
	this.DropElement = null // the registered element of the drop point
	this.DropLock = true; // if over a drop point, lock to top-left

	// private variables
	var DD = this; // reference to this object
	var eDrag; // element to drag
	var Enable = true; // temporary enable/disable flag
	var Restrict = new Array(); // restriction functions array
	var Drop = new Array(); // drop points array
	var DropTimer = null; // drop point checking timer
	var DropCheckDelay = 2000; // drop point checking delay
	var ozi = 1; // old z-index
	var ocX, ocY; // starting mouse co-ordinates (relative to element)
	var pX, pY; // offsetParent co-ordinates

	if (DOM.Enabled && this.Element) this.Initialise(); // initalise
}


// ________________________________________________________
// movement retriction functions

// limit to a grid
function DragGrid(xGrid, yGrid) {
	this.Limit = function(x, y) {
		if (xGrid > 0) x = Math.round(x / xGrid) * xGrid;
		if (yGrid > 0) y = Math.round(y / yGrid) * yGrid;
		return ([x, y]);
	}
}


// limit to a line
function DragLine(x1, y1, x2, y2) {
	// line gradient and offset
	var xMin = Math.min(x1, x2); var xMax = Math.max(x1, x2); var yMin = Math.min(y1, y2); var yMax = Math.max(y1, y2);
	var m = 0; if (xMin < xMax) m = (y2 - y1) / (x2 - x1);
	var c = 0; if (yMin < yMax) c = y1 - (m * x1);

	// find main axis
	if ((xMax-xMin) >= (yMax-yMin)) {
		// x-axis
		this.Limit = function(x, y) {
			x = (x < xMin ? xMin : (x > xMax ? xMax : x));
			if (yMin == yMax) y = yMin; else y = (x * m) + c;
			return ([x, y]);
		}
	}
	else {
		// y-axis
		this.Limit = function(x, y) {
			y = (y < yMin ? yMin : (y > yMax ? yMax : y));
			if (xMin == xMax) x = xMin; else x = (y - c) / m;
			return ([x, y]);
		}
	}
}


// limit to a box
function DragBox(x1, y1, x2, y2) {
	var xMin = Math.min(x1, x2); var xMax = Math.max(x1, x2); var yMin = Math.min(y1, y2); var yMax = Math.max(y1, y2);
	this.Limit = function(x, y) {
		x = (x < xMin ? xMin : (x > xMax ? xMax : x));
		y = (y < yMin ? yMin : (y > yMax ? yMax : y));
		return ([x, y]);
	}
}


// limit to a path defind by functions
function DragPath(cfunc) {
	this.Limit = function(x, y) { return (cfunc(x, y)); }
}


// ________________________________________________________
// dragdrop manager - single events for all elements
var DragDropManager = new function() {

	// dragdrop stack
	var ddStack = null;
	this.Initialise = function() {
		if (ddStack == null) {
			ddStack = new Array();

			// define single events for all dragdrop elements
			var handle = function(evt) { DragDropManager.HandleEvent(evt); }
			new Event(document, "mousedown", handle);
			new Event(document, "mousemove", handle);
			new Event(document, "mouseup", handle);
			new Event(document, "selectstart", handle); // stops text selection
		}
	}

	// add a dragdrop element
	this.Add = function (ddObject) { this.Initialise(); ddStack.push(ddObject); }

	// handle all events
	this.HandleEvent = function(evt) {
		for (var i = 0; i < ddStack.length; i++) {
			if (ddStack[i].DragOn || (evt.Raised.Type == "mousedown" && evt.Raised.Element == ddStack[i].Element)) {
				evt.Raised.StopDefaultAction();
				ddStack[i].Handler(evt);
			}
		}
	}

}