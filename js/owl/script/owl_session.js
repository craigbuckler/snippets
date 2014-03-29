/*	---------------------------------------------

	owl.Session

	--------------------------------------------- */
if (owl && owl.Event && !owl.Session) owl.Session = function() {

	// window object
	var win = (window.top || window);

	// session store
	var session = (win.name ? owl.Object.DeSerialize(win.name) : {});

	// auto-save
	new owl.Event(window, "unload", SaveSession);

	// store a session value/object
	function Store(name, value) {
		session[name] = value;
	}

	// restore a session value
	function Restore(name) {
		return (owl.Object.Exists(session, name) ? session[name] : null);
	}
	
	// clear session
	function Clear() { session = {}; }

	// save session data on page unload (private)
	function SaveSession() {
		win.name = owl.Object.Serialize(session);
	}

	// public methods
	return {
		Store: Store,
		Restore: Restore,
		Clear: Clear
	};

}();