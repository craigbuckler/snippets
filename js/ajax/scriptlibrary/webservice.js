/*
WebService class, by Craig Buckler
Creates an object that can send data to a web service and fetch a response.

Dependencies:
	none
*/
function WebService(url, method, async) {

	// cross-browser xmlHttpRequest
	this.Request = this.XmlHttpRequest();

	// symbolic name used for this call
	this.Name = "";

	// web service URL
	this.URL = url;

	// true for POST (default), false for GET
	method = String(method);
	this.PostMethod = (method.toUpperCase() != "GET");

	// asynchronous (default - true) or synchronous (false)
	this.Async = (async != false);

	// asynchronous timeout (0 for no timeout - not recommended)
	this.TimeOut = 0;
	this.Timer = null;

	// passed arguments
	this.Args = {};

	// status values
	this.ReadyState = 0;
	this.Status = null;
	this.StatusText = null;
	this.Complete = true;
	this.Success = true;

	// response values
	this.ResponseText = null;
	this.ResponseXML = null;

	// event handlers - 'this' passed as argument
	this.OnLoading = null;
	this.OnLoaded = null;
	this.OnInteractive = null;
	this.OnComplete = null;
	this.OnAbort = null;
	this.OnError = null;
	this.OnTimeOut = null;
}


// set a single error handling function
WebService.prototype.ErrorFunction = function(errorFunc) {
	if (typeof errorFunc == 'function') { this.OnAbort = errorFunc; this.OnError = errorFunc; this.OnTimeOut = errorFunc; }
}


// add an argument to pass to the web service
WebService.prototype.Argument = function(key, value) { this.Args[key] = escape(value); }


// run the web service
WebService.prototype.Call = function() {
	if (this.Request) {

		// start a new call
		this.Complete = false;
		this.Success = false;

		// web service arguments
		var key, args = "";
		for (key in this.Args) if (typeof(this.Args[key]) != 'function') args += "&" + key + "=" + this.Args[key];
		if (args.length > 0) args = args.substr(1);

		if (this.Async) {
			var thisObject = this;

			// asynchronous call handler
			this.Request.onreadystatechange = function() { thisObject.ReadyStateChange(); }

			// define timeout
			if (this.TimeOut > 0) this.Timer = setTimeout(function() { thisObject.TimedOut(); }, this.TimeOut);
		}

		// call web service
		if (this.PostMethod) {
			this.Request.open("POST", this.URL, this.Async);
			this.Request.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");
			this.Request.send(args);
		}
		else {
			this.Request.open("GET", this.URL + (args.length > 0 ? "?"+args : ""), this.Async);
			this.Request.send(null);
		}

		// synchronous call handler
		if (!this.Async) this.ReadyStateChange();
	}
}


// handle web service status change
WebService.prototype.ReadyStateChange = function() {

	if (!this.Complete) {

		// find state
		this.ReadyState = this.Request.readyState;

		// run state handler
		switch(this.ReadyState) {
			case 4:
				// call complete
				this.Complete = true;

				// stop timer
				if (this.Timer) clearTimeout(this.Timer);

				// update object properties
				this.Status = this.Request.status;
				if (this.Status == 304) this.Status = 200;
				this.StatusText = (typeof this.Request.statusText == 'undefined' ? "OK" : this.Request.statusText);
				this.ResponseText = this.Request.responseText;
				this.ResponseXML = this.Request.responseXML;
				if (!this.ResponseXML || !this.ResponseXML.documentElement) this.ResponseXML = null;

				// run events
				if (this.Status == 0) this.Handler(this.OnAbort);
				else if (this.Status == 200 && this.StatusText == "OK") { this.Success = true; this.Handler(this.OnComplete); }
				else this.Handler(this.OnError);

				break;

			case 3: this.Handler(this.OnInteractive); break;
			case 2: this.Handler(this.OnLoaded); break;
			case 1: this.Handler(this.OnLoading); break;
		}
	}
}


// run an event handler
WebService.prototype.Handler = function(HandlerFunction) {
	if (typeof HandlerFunction == 'function') HandlerFunction(this);
}


// abort the web service request
WebService.prototype.Abort = function() {
	if (!this.Complete) { this.AbortHandler(); this.Handler(this.OnAbort); }
}


// handle a timeout
WebService.prototype.TimedOut = function() {
	if (!this.Complete) { this.AbortHandler(); this.Handler(this.OnTimeOut); }
}


// (private) abort handler
WebService.prototype.AbortHandler = function() {
	this.Complete = true;
	if (this.Timer) clearTimeout(this.Timer);
	this.ReadyState = 0;
	this.Request.abort();
}


// define a cross-browser XmlHttpRequest object
WebService.prototype.XmlHttpRequest = function() {
	var xh;
	if (window.XMLHttpRequest) {
		try { xh = new XMLHttpRequest(); } catch (e) {}
	}
	else {
		var ieXH = ["MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
		for (var i = 0; i < ieXH.length && !xh; i++) {
			try { xh = new ActiveXObject(ieXH[i]); }
			catch(e) {}
		}
	}
	return xh;
}