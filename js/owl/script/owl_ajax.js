/*	---------------------------------------------

	owl.Ajax

	--------------------------------------------- */
if (owl && owl.Dom && owl.Event && !owl.Ajax) {

	// define an Ajax web service request
	owl.Ajax = function(form, callback) {

		// initialise
		this.ID = null;
		this.Form = null;
		this.URL = null;
		this.Method = "GET"; // GET, POST, SCRIPT
		this.Async = true;
		this.Timeout = 10000;

		// callback functions
		this.Callback = {
			Start: null,
			Success: null,
			Fail: null,
			Timeout: null,
			Abort: null
		};

		// status
		this.Status = {
			Active: false,
			Complete: true,
			Success: true,
			Timeout: false,
			Abort: false
		};

		// response
		this.Response = {
			Text: null,
			XML: null
		};

		var args = {}; // call arguments
		var timeout = null; // timeout
		var request = null; // request object
		var head = null; // HTML head

		// add an argument
		this.Argument = function(name, value) { args[name] = escape(owl.String.Trim(value)); };


		// call webservice
		this.Call = function(callback) {

			if (!this.Status.Active) {

				request = null;
				if (this.Method == "SCRIPT") {
					if (!head) {
						// find HTML head
						head = owl.Dom.Get("head");
						if (head.length == 1) head = head[0];
					}
					if (head) request = document.createElement("script");
				}
				else request = this.HttpRequest();

				if (request) {

					this.Status = { Active: true, Complete: false, Success: false, Timeout: false, Abort: false };
					this.Response = { Text: null, XML: null };
					if (typeof callback == "function") this.SetCallback(callback);
					this.CallbackHandler(this.Callback.Start);

					var thisAjax = this;

					// fetch form values
					if (this.Form) owl.Each(this.Form.elements, function(e) {
						if (e.name && e.value) {
							var v = (e.type=="checkbox" || e.type=="radio" ? (e.checked ? e.value : '') : e.value);
							if (v) thisAjax.Argument(e.name, v);
						}
					});

					// add call count
					if (owl.Ajax.Config.AjaxIdentifier != "") this.Argument(owl.Ajax.Config.AjaxIdentifier, owl.Ajax.CallCount++);

					// generate argument string
					var n, arglist = "";
					for (n in args) if (typeof(args[n]) != 'function') arglist += "&" + n + "=" + args[n];
					if (arglist.length > 0) arglist = arglist.substr(1);

					// asynchronous call handler and timeout
					if (this.Async || this.Method == "SCRIPT") {
						request.onreadystatechange = function() { thisAjax.StateChange(); };
						if (this.Timeout > 0) timeout = setTimeout(function() { thisAjax.StateTimeout(); }, this.Timeout);
					}

					// call web service
					switch (this.Method) {

						case "SCRIPT":
							request.src = this.URL + (arglist.length > 0 ? "?"+arglist : "");
							request.onload = request.onreadystatechange;
							head.appendChild(request);
							break;

						case "POST":
							request.open("POST", this.URL, this.Async);
							request.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");
							request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
							request.send(arglist);
							break;

						default:
							request.open("GET", this.URL + (arglist.length > 0 ? "?"+arglist : ""), this.Async);
							request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
							request.send(null);
							break;
					}

					// synchronous call handler
					if (!this.Async && this.Method != "SCRIPT") this.StateChange();

				}
			}
		};


		// state change
		this.StateChange = function() {
			if (this.Status.Active) {

				this.Status.Complete = ( this.Method == "SCRIPT" && (!request.readyState || request.readyState == "loaded" || request.readyState == "complete") ) || ( this.Method != "SCRIPT" && request.readyState == 4 );

				// web service call complete
				if (this.Status.Complete) {
					this.Status.Active = false;

					if (this.Method == "SCRIPT") this.Status.Success = true;
					else {
						// web service result
						this.Status.Success = ((request.status >= 200 && request.status < 300 ) || request.status == 304 || request.status == 1223 || (owl.Browser.Safari && request.status == undefined));
						if (this.Status.Success) {
							this.Response.Text = request.responseText;
							this.Response.XML = request.responseXML;
							if (!this.Response.XML || !this.Response.XML.documentElement) this.Response.XML = null;
						}
					}

					this.ClearUp();
					this.CallbackHandler((this.Status.Success ? this.Callback.Success : this.Callback.Fail));
				}

			}
		};


		// clear up
		this.ClearUp = function() {
			this.Status.Complete = true;
			if (timeout) clearTimeout(timeout);
			timeout = null;
			if (request) {
				if (this.Method == "SCRIPT") head.removeChild(request);
				else request.abort();
			}
			request = null;
		};


		// start
		this.Hijax(form);
		if (typeof callback == "function") {
			this.SetCallback(callback);
			if (!this.Form) this.Call();
		}

	};


	// call count
	owl.Ajax.CallCount = 0;


	// retrieve values form form
	owl.Ajax.prototype.Hijax = function(form) {
		if (form && form.nodeName && form.nodeName.toLowerCase() == "form") {
			this.Form = form;
			this.ID = form.id;
			this.URL = form.action;
			this.Method = owl.String.Trim(form.method.toUpperCase());
			if (this.Method != "GET" && this.Method != "POST") this.Method = "POST";

			// add a submit event
			var thisAjax = this;
			this.HijaxEvent = new owl.Event(form, "submit", function (evt) {
				evt.StopHandlers();
				evt.StopDefaultAction();
				thisAjax.Call();
			}, 999999);
		}
	};


	// define callback functions
	owl.Ajax.prototype.SetCallback = function(callback) {
		if (typeof callback == "function") this.Callback = {
			Start: callback,
			Success: callback,
			Fail: callback,
			Timeout: callback,
			Abort: callback
		};
	}


	// callback handler
	owl.Ajax.prototype.CallbackHandler = function(callback) { if (typeof callback == "function") callback(this); };


	// HTTP time out
	owl.Ajax.prototype.StateTimeout = function() {
		if (this.Status.Active) {
			this.Status.Active = false; this.Status.Success = false; this.Status.Timeout = true;
			this.ClearUp();
			this.CallbackHandler(this.Callback.Timeout);
		}
	};


	// abort call
	owl.Ajax.prototype.Abort = function() {
		if (this.Status.Active) {
			this.Status.Active = false; this.Status.Success = false; this.Status.Abort = true;
			this.ClearUp();
			this.CallbackHandler(this.Callback.Abort);
		}
	};


	// XMLHttpRequest object
	owl.Ajax.prototype.HttpRequest = function() {
		var xh;
		if (window.XMLHttpRequest) {
			try { xh = new XMLHttpRequest(); }
			catch (e) { xh = null; }
		}
		else {
			var ieXH = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP", "Microsoft.XMLHTTP"];
			for (var i = 0, j = ieXH.length; !xh && i < j; i++) {
				try { xh = new ActiveXObject(ieXH[i]); }
				catch(e) { xh = null; }
			}
		}
		return xh;
	};


	/* ---------------------------------------------
	owl.Ajax.Config
	--------------------------------------------- */
	owl.Ajax.Config = {
		AjaxIdentifier: "ajax"
	};

}