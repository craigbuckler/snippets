/*
Event class, by Craig Buckler
Creates a cross-browser event object.
All added events are detached when the page unloads to prevent browser memory leaks.
Note that window.unload events can not be automatically detached.

Dependencies:
	misc.js (if IE5 is supported)
*/
function Event(element, eventType, eventHandler) {

	// reference to this object
	var thisEvent = this;

	// event object
	this.Raised = null;

	// handler function (parses event and passes reference to this)
	var handler = function(e) { thisEvent.Raised = new EventInformation(e); eventHandler(thisEvent); }

	// attach event
	try {
		if (element.addEventListener) element.addEventListener(eventType, handler, false);
		else if (element.attachEvent) var evt = element.attachEvent("on"+eventType, handler);
		else element["on"+eventType] = handler;
	}
	catch (e) {}

	// add to event manager (if not a window unload)
	if (element !== window || eventType != "unload") EventManager.Add(this);

	// detach event method
	this.Detach = function() {
		try {
			if (element.removeEventListener) element.removeEventListener(eventType, handler, false);
			else if (element.detachEvent) var evt = element.detachEvent("on"+eventType, handler);
			else element["on"+eventType] = null;
		}
		catch(e) {}
	}

}


// Event information object (cross-browser)
function EventInformation(event, stopPropagation, stopDefault) {

	// store event
	this.Event = (event ? event : window.event);

	// default values
	this.Type = "";
	this.Element = null;
	this.Key = "";
	this.ControlKey = "";
	this.Shift = false;
	this.Ctrl = false;
	this.Alt = false;
	this.MouseX = 0;
	this.MouseY = 0;

	if (this.Event) {
		// event type
		this.Type = String(event.type).toLowerCase();

		// source element
		this.Element = (event.target ? event.target : event.srcElement);

		// standard key press
		var keyCode = (this.Event.keyCode ? this.Event.keyCode : this.Event.charCode);
		if (this.Event.charCode != 0 && keyCode >= 32) this.Key = String.fromCharCode(keyCode);

		// control key press
		if (this.Key == "") {
			this.ControlKey = ControlKeys[keyCode];
			if (!this.ControlKey) this.ControlKey = "";
		}

		// action keys
		this.Ctrl = event.ctrlKey;
		this.Alt = event.altKey;
		this.Shift = event.shiftKey;

		// mouse co-ordinates
		var mre = /mouse|click/i;
		if (mre.test(this.Type)) {
			this.MouseX = (this.Event.pageX ? this.Event.pageX : this.Event.clientX + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft));
			this.MouseY = (this.Event.pageY ? this.Event.pageY : this.Event.clientY + Math.max(document.documentElement.scrollTop, document.body.scrollTop));
		}

		// default actions
		if (stopPropagation) this.StopPropagation();
		if (stopDefault) this.StopDefaultAction();
	}
}


// stop event propagation
EventInformation.prototype.StopPropagation = function() {
	if (this.Event) {
		try { this.Event.stopPropagation(); } catch(e) {}
		this.Event.cancelBubble = true;
	}
}


// stop event default action
EventInformation.prototype.StopDefaultAction = function() {
	if (this.Event) {
		try { this.Event.preventDefault(); } catch(e) {}
		this.Event.returnValue = false;
	}
}


// control key definitions
var ControlKeys = []; ControlKeys[8] = "backspace"; ControlKeys[9] = "tab"; ControlKeys[13] = "enter"; ControlKeys[27] = "esc"; ControlKeys[33] = "pageup"; ControlKeys[34] = "pagedown"; ControlKeys[35] = "end"; ControlKeys[36] = "home"; ControlKeys[37] = "left"; ControlKeys[38] = "up"; ControlKeys[39] = "right"; ControlKeys[40] = "down"; ControlKeys[45] = "insert"; ControlKeys[46] = "delete"; ControlKeys[112] = "f1"; ControlKeys[113] = "f2"; ControlKeys[114] = "f3"; ControlKeys[115] = "f4"; ControlKeys[116] = "f5"; ControlKeys[117] = "f6"; ControlKeys[118] = "f7"; ControlKeys[119] = "f8"; ControlKeys[120] = "f9"; ControlKeys[121] = "f10"; ControlKeys[122] = "f11"; ControlKeys[123] = "f12"; ControlKeys[144] = "numlock"; ControlKeys[145] = "scrolllock";


// event manager object
var EventManager = new function() {

	// initialise event stack
	var eStack = null;
	this.Initialise = function() {
		if (eStack == null) { eStack = new Array(); new Event(window, "unload", this.CleanUp); }
	}

	// add an event to the stack (except window unload events)
	this.Add = function(event) { this.Initialise(); eStack.push(event); }

	// detach all stacked events
	this.CleanUp = function(e) { while (eStack.length > 0) eStack.pop().Detach(); }
}