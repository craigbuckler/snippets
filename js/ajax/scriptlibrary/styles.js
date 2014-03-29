/*
StyleHandler class (static), by Craig Buckler
Provides CSS switching functionality in all browsers

Dependencies:
	misc.js (if IE5 is supported)
	events.js
	dom.js
*/
var StyleHandler = new function() {

	var DefaultTitle = "default style"; // default style title (if not defined)
	var AlternateTitle = "alternate style"; // alternate style title (if not defined)

	var Styles; // stylesheet array
	var Initialised = false; // true when StyleHandler has been initialised

	// initialise StyleHandler
	this.Initialise = function() {

		if (!Initialised) {
			Initialised = true; // StyleHandler initialised

			// find style declarations
			var slist = DOM.Tags("link");
			var title, rel, media;

			// examine styles
			for (var i = 0; i < slist.length; i++) {
				title = slist[i].getAttribute("title");
				rel = slist[i].getAttribute("rel");
				media = slist[i].getAttribute("media");

				// set default titles
				if (!title && (!media || media == "screen")) {
					if (rel && rel.indexOf("style") >= 0 && rel.indexOf("alt") < 0) title = DefaultTitle; else title = AlternateTitle;
					slist[i].setAttribute("title", title);
				}

				// set screen media
				if (!media) slist[i].setAttribute("media", "screen");
			}
		}
	}


	// returns current stylesheet
	this.Current = function() {
		this.Initialise();
		var slist = DOM.Tags("link");
		var current = "";
		for (var i = 0; i < slist.length && current == ""; i++) if (!slist[i].disabled) current = slist[i].getAttribute("title");
		return current;
	}


	// return an array of style titles
	this.Titles = function() {
		this.Initialise();
		var slist = DOM.Tags("link");
		var titles = new Array();
		var title, media, exists, i, j;

		for (i = 0; i < slist.length; i++) {
			title = slist[i].getAttribute("title");
			media = slist[i].getAttribute("media").Trim().toLowerCase();

			if (title != "" && media == "screen") {
				exists = false;
				for (j = 0; j < titles.length && !exists; j++) if (titles[j] == title) exists = true;
				if (!exists) titles.push(title);
			}
		}
		return titles;
	}


	// activate a style
	this.Activate = function(styletitle) {
		this.Initialise();
		var found = null;
		var currentstyle = null;
		var firststyle = null;
		var current = this.Current();
		var slist = DOM.Tags("link");
		var title, media, i;

		for (i = 0; i < slist.length; i++) {

			title = slist[i].getAttribute("title");
			media = slist[i].getAttribute("media").Trim().toLowerCase();

			if (title != "" && media == "screen") {
				if (found == null && title == styletitle) found = i;
				if (currentstyle == null && title == current) currentstyle = i;
				if (firststyle == null) firststyle = i;
				slist[i].disabled = true; // disable style
			}
		}

		// enable style (if not found, use current or first defined style)
		i = (found != null ? found : (currentstyle != null ? currentstyle : firststyle));
		if (i != null) { slist[i].disabled = false; slist[i].disabled = true; slist[i].disabled = false; }
		this.SavePreference();
	}


	// load user preference
	this.LoadPreference = function() {
		this.Initialise();
		this.Activate(CookieGet("stylepref"));
	}


	// save user preference
	this.SavePreference = function() {
		this.Initialise();
		CookieSet("stylepref", this.Current(), 10080); // store preference for 7 days
	}
}

// initialise StyleHandler
new Event(window, "unload", function(evt) { StyleHandler.SavePreference(); });
new Event(window, "load", function(evt) { StyleHandler.LoadPreference(); });