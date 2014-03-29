/*	---------------------------------------------

	owl.Cookie

	--------------------------------------------- */
if (owl && !owl.Cookie) owl.Cookie = function() {

	var LineBreak = "[|]";
	var LineBreakRe = /\[\|\]/g;

	// cookie jar - stores cookie values
	var Jar = null;

	// cookies enabled?
	var Enabled = function() {
		Set("testcookie", "testvalue", 0.1);
		var e = (Get("testcookie") == "testvalue");
		Enabled = function() { return e; };
		return Enabled();
	};

	// set cookie
	function Set(name, value, secs) {
		if (!Jar) Jar = {};
		Jar[name] = value;
		value = String(value).replace(/\r/g, "").replace(/\n/g, LineBreak);
		var expires = "";
		if (secs) {
			var date = new Date();
			date.setTime(date.getTime()+(secs * 1000));
			expires = "; expires="+date.toUTCString();
		}
		document.cookie = name+"="+String(value)+expires+"; path="+location.pathname.substr(0, location.pathname.indexOf("/",1)+1);
	}

	// get cookie
	function Get(name) {
		var value = null;
		if (!Jar) {
			Jar = {};
			owl.Each(document.cookie.split(";"), function(c) {
				c = owl.String.Trim(c);
				var p = c.indexOf("=");
				if (p > 0) Jar[c.substr(0, p)] = c.substring(p+1).replace(LineBreakRe, "\n");
			});
		}
		if (Jar[name]) value = Jar[name];
		return value;
	}

	// delete cookie
	function Delete(name) {
		Set(name, '', -60);
		Jar[name] = null;
	}

	// stores a serialized object
	function Store(name, object, secs) {
		Set(name, owl.Object.Serialize(object), secs);
	}

	// returns a serialized object
	function Restore(name) {
		return owl.Object.DeSerialize(Get(name));
	}

	// public methods
	return {
		Enabled: Enabled,
		Set: Set,
		Get: Get,
		Delete: Delete,
		Store: Store,
		Restore: Restore
	};

}();