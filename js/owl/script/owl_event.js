/*	---------------------------------------------

	owl.Event

	--------------------------------------------- */
if (owl && !owl.Event) {

	// define an event on one or more elements
	owl.Event = function(element, type, handler, priority) {

		element = owl.Array.Make(element, [window]);
		handler = (typeof handler == 'function' ? handler : null);
		priority = (priority || priority == 0 ? owl.Number.toInt(priority) : null);
		var regIndex = [];

		// add event(s)
		owl.Each(
			element,
			function(e) { regIndex[regIndex.length] = owl.EventRegister.Add(e, type, handler, priority); }
		);

		// detach event(s)
		this.Detach = function() {
			for (var e = 0, el = element.length; e < el; e++) owl.EventRegister.Detach(element[e], type, regIndex[e], true);
		};
	};


	/*	---------------------------------------------
		owl.EventRegister
		--------------------------------------------- */
	owl.EventRegister = function() {

		// element store
		var regElements = [], register = [], precedence = [], guid = 0, pReset = false;
		var ns = 'EventRegister';

		// create event
		function Add(element, type, handler, priority) {

			// existing event list
			var regEvents = owl.Property.Get(element, ns);
			if (!regEvents) {
				regEvents = {};
				regElements[regElements.length] = element;
			}

			// register new event type for element
			if (!regEvents[type]) {

				guid++;
				register[guid] = [];
				regEvents[type] = guid;
				owl.Property.Set(element, ns, regEvents);

				// define event
				var existingEvent = element["on"+type];
				if (existingEvent) new owl.Event(element, type, existingEvent);
				element["on"+type] = owl.EventRegister.Handler;

				// clean up event
				if (guid == 1) new owl.Event(window, "unload", owl.EventRegister.CleanUp, 1e+100);

			}

			// set handler
			var regIndex = regEvents[type];
			var funcIndex = register[regIndex].length;
			register[regIndex][funcIndex] = { Handler: handler, Priority: priority };

			// handler precedence
			SetPrecedence(element, type, regIndex);

			// return handler reference
			return { Reg: regIndex, Func: funcIndex };
		}

		// set handler priority order
		function SetPrecedence(element, type, regIndex) {
			var prec = [];
			for (var p = 0, pl = register[regIndex].length; p < pl; p++) {
				if (register[regIndex][p].Handler != null) prec[prec.length] = { Index: p, Priority: register[regIndex][p].Priority };
			}

			// sort by priority
			if (prec.length > 0) prec.sort(function(a, b) { return a.Priority - b.Priority; });
			else {
				// or remove event
				element["on"+type] = null;
				delete element.owlP[ns][type];
				prec = null;
			}

			precedence[regIndex] = prec;
			pReset = false;
		}

		// run all events
		function Handler(event) {
			var ret = true, e = new owl.EventInformation(this, event);
			if (e.Index && e.Index.Reg) {
				var prec = precedence[e.Index.Reg].slice();
				for (var p = 0, pl = prec.length; p < pl; p++) {
					e.Index.Func = prec[p].Index;
					if (e.AllowNext && register[e.Index.Reg][e.Index.Func].Handler) {
						ret &= (register[e.Index.Reg][e.Index.Func].Handler(e) !== false);
					}
				}
			}
			if (pReset) SetPrecedence(e.Element, e.Type, e.Index.Reg);
			return ret;
		}

		// detach event
		function Detach(element, type, index, forceReset) {
			register[index.Reg][index.Func].Handler = null;
			if (forceReset) SetPrecedence(element, type, index.Reg);
			else pReset = true;
		}

		// cleanup event
		function CleanUp() {
			for (var e = 0, el = regElements.length, em = regElements[0]; e < el; em = regElements[++e]) { // all elements
				for (var h in owl.Property.Get(em, ns)) em["on"+h] = null;
				owl.Property.Delete(em, ns);
			}
			regElements = null; register = null; precedence = null;
		}

		// public values
		return {
			Namespace: ns,
			Add: Add,
			Handler: Handler,
			Detach: Detach,
			CleanUp: CleanUp
		};

	}();


	/*	---------------------------------------------
	owl.EventInformation
	--------------------------------------------- */
	owl.EventInformation = function(element, event) {
		this.Element = element;
		this.Event = (event ? event : window.event);
		if (this.Event) {
			this.Type = this.Event.type.toLowerCase();
			this.Target = (this.Event.target ? this.Event.target : this.Event.srcElement);
			this.Index = { Reg: this.Element.owlP[owl.EventRegister.Namespace][this.Type], Func: null };
			this.AllowNext = true;
		}
	};

	// key press
	owl.EventInformation.prototype.Key = function() {
		if (!this.KeySet) {
			this.KeySet = { Pressed: '', Function: '', Shift: this.Event.shiftKey, Ctrl: this.Event.ctrlKey, Alt: this.Event.altKey };

			if (owl.EventKey.test(this.Type)) {
				var keyCode = this.Event.keyCode; // key pressed
				var charCode = (typeof this.Event.charCode != 'undefined' ? this.Event.charCode : null); // character returned (Firefox keypress)

				if (charCode > 0) this.KeySet.Pressed = String.fromCharCode(charCode);
				else {
					if (owl.EventCK[keyCode] && (charCode != null || keyCode < 32 || (this.Type != "keypress" || (!this.Shift && keyCode < 112 && keyCode != 35 && keyCode != 39 && keyCode != 45 && keyCode != 46)))) this.KeySet.Function = owl.EventCK[keyCode];
					else if (keyCode >= 32) this.KeySet.Pressed = String.fromCharCode(keyCode);
				}

			}
		}
		return this.KeySet;
	};

	// mouse event
	owl.EventInformation.prototype.Mouse = function() {
		if (!this.MouseSet) {
			this.MouseSet = { X: 0, Y: 0 };

			if (owl.EventMouse.test(this.Type)) {
				this.MouseSet.X = (this.Event.pageX ? this.Event.pageX : this.Event.clientX + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft));
				this.MouseSet.Y = (this.Event.pageY ? this.Event.pageY : this.Event.clientY + Math.max(document.documentElement.scrollTop, document.body.scrollTop));
			}
		}
		return this.MouseSet;
	};

	// detach event
	owl.EventInformation.prototype.Detach = function() {
		owl.EventRegister.Detach(this.Element, this.Type, this.Index);
	};

	// stop processing further events
	owl.EventInformation.prototype.StopHandlers = function() { this.AllowNext = false; };

	// stop propagation
	owl.EventInformation.prototype.StopPropagation = function() {
		if (this.Event.stopPropagation) this.Event.stopPropagation();
		this.Event.cancelBubble = true;
	};

	// stop default action
	owl.EventInformation.prototype.StopDefaultAction = function() {
		if (this.Event.preventDefault) this.Event.preventDefault();
		this.Event.returnValue = false;
	};

	// event settings
	owl.EventKey = /^key/i;
	owl.EventMouse = /mouse|click/i;
	owl.EventCK = []; owl.EventCK[8] = "backspace"; owl.EventCK[9] = "tab"; owl.EventCK[13] = "enter"; owl.EventCK[19] = "break"; owl.EventCK[27] = "esc"; owl.EventCK[33] = "pageup"; owl.EventCK[34] = "pagedown"; owl.EventCK[35] = "end"; owl.EventCK[36] = "home"; owl.EventCK[37] = "left"; owl.EventCK[38] = "up"; owl.EventCK[39] = "right"; owl.EventCK[40] = "down"; owl.EventCK[45] = "insert"; owl.EventCK[46] = "delete"; owl.EventCK[112] = "f1"; owl.EventCK[113] = "f2"; owl.EventCK[114] = "f3"; owl.EventCK[115] = "f4"; owl.EventCK[116] = "f5"; owl.EventCK[117] = "f6"; owl.EventCK[118] = "f7"; owl.EventCK[119] = "f8"; owl.EventCK[120] = "f9"; owl.EventCK[121] = "f10"; owl.EventCK[122] = "f11"; owl.EventCK[123] = "f12"; owl.EventCK[144] = "numlock"; owl.EventCK[145] = "scrolllock";

	// disable fast back
	if (history && history.navigationMode) history.navigationMode = "compatible";
}