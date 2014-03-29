/*
Event class, by Craig Buckler
A cross-browser event object. Events are detached on page unload.

Dependencies:
	none
*/
function Event(element, type, handler) {

	this.Raised = null; // event information

	// attach EventStore object to element
	if (typeof element.AttachedEvents == 'undefined' || element.AttachedEvents == null) {
		element.AttachedEvents = new EventStore();
		var existingEvent = element["on"+type];
		if (existingEvent) new Event(element, type, existingEvent); // copy existing event into EventStore
		EventStore.ElementList[EventStore.ElementList.length] = element;
		if (EventStore.ElementList.length == 1) new Event(window, "unload", EventStore.CleanUp); // cleanup event
	}
	var hIndex = element.AttachedEvents.Add(element, type, this);

	// run handler
	this.Handler = function(evtinfo) {
		this.Raised = evtinfo;
		return handler(this);
	}

	// detach event
	this.Detach = function() { element.AttachedEvents.Detach(type, hIndex); }
}


// event types for this element
function EventStore() { this.Type = []; }


// add an Event object to the store
EventStore.prototype.Add = function(element, type, EventObj) {
	if (typeof this.Type[type] == 'undefined') {
		this.Type[type] = [];
		element["on"+type] = EventStore.Handler; // actual event
	}
	var hIndex = this.Type[type].length;
	this.Type[type][hIndex] = EventObj;
	return hIndex;
}


// remove a stored event
EventStore.prototype.Detach = function(type, hIndex) {
	if (typeof this.Type[type][hIndex] == 'object') delete this.Type[type][hIndex];
}


// run all events
EventStore.prototype.RunEvents = function(evtinfo) {
	var ret = true;
	if (typeof this.Type[evtinfo.Type] != 'undefined') {
		var EventObj;
		for (var h = 0; h < this.Type[evtinfo.Type].length; h++) {
			EventObj = this.Type[evtinfo.Type][h];
			if (typeof EventObj == 'object') ret &= (EventObj.Handler(evtinfo) !== false);
		}
	}
	return ret;
}


// event handler (static)
EventStore.Handler = function(evt) {
	return (this.AttachedEvents ? this.AttachedEvents.RunEvents(new EventInformation(evt)) : null);
}


// clean up events (static)
EventStore.ElementList = [];
EventStore.CleanUp = function() {
	for (var e = 0; e < EventStore.ElementList.length; e++) EventStore.ElementList[e].AttachedEvents = null;
	EventStore.ElementList = null;
}


// Event information object (cross-browser)
function EventInformation(event) {

	if (event) {
		this.Event = event;
		this.StopPropagation = function() { this.Event.stopPropagation(); }
		this.StopDefaultAction = function() { this.Event.preventDefault(); }
	}
	else {
		this.Event = window.event;
		this.StopPropagation = function() { this.Event.cancelBubble = true; }
		this.StopDefaultAction = function() { this.Event.returnValue = false; }
	}

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
		this.Type = String(this.Event.type).toLowerCase();

		// source element
		this.Element = (this.Event.target ? this.Event.target : this.Event.srcElement);

		// action keys
		this.Ctrl = this.Event.ctrlKey;
		this.Alt = this.Event.altKey;
		this.Shift = this.Event.shiftKey;
		
		// key press events
		if (this.Type.indexOf("key") == 0) {
		
			var keyCode = this.Event.keyCode; // key pressed
			var charCode = (typeof this.Event.charCode != 'undefined' ? this.Event.charCode : null); // character returned (Firefox keypress only)
			
			if (charCode > 0) this.Key = String.fromCharCode(charCode);
			else {
				if (Event.CK[keyCode] && (charCode != null || keyCode < 32 || (this.Type != "keypress" || (!this.Shift && keyCode < 112 && keyCode != 35 && keyCode != 39 && keyCode != 45 && keyCode != 46)))) this.ControlKey = Event.CK[keyCode];
				else if (keyCode >= 32) this.Key = String.fromCharCode(keyCode);
			}
		
		}

		// mouse co-ordinates
		var mre = /mouse|click/i;
		if (mre.test(this.Type)) {
			this.MouseX = (this.Event.pageX ? this.Event.pageX : this.Event.clientX + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft));
			this.MouseY = (this.Event.pageY ? this.Event.pageY : this.Event.clientY + Math.max(document.documentElement.scrollTop, document.body.scrollTop));
		}

	}
}

// control key definitions
Event.CK = []; Event.CK[8] = "backspace"; Event.CK[9] = "tab"; Event.CK[13] = "enter"; Event.CK[19] = "break"; Event.CK[27] = "esc"; Event.CK[33] = "pageup"; Event.CK[34] = "pagedown"; Event.CK[35] = "end"; Event.CK[36] = "home"; Event.CK[37] = "left"; Event.CK[38] = "up"; Event.CK[39] = "right"; Event.CK[40] = "down"; Event.CK[45] = "insert"; Event.CK[46] = "delete"; Event.CK[112] = "f1"; Event.CK[113] = "f2"; Event.CK[114] = "f3"; Event.CK[115] = "f4"; Event.CK[116] = "f5"; Event.CK[117] = "f6"; Event.CK[118] = "f7"; Event.CK[119] = "f8"; Event.CK[120] = "f9"; Event.CK[121] = "f10"; Event.CK[122] = "f11"; Event.CK[123] = "f12"; Event.CK[144] = "numlock"; Event.CK[145] = "scrolllock";