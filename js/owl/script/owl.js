/*	---------------------------------------------

	owl: Optimalworks Library
	(c) optimalworks.net

	core components:
		owl
		owl.RegEx
		owl.Number
		owl.String
		owl.Property

	--------------------------------------------- */

if (!owl) {
var owl = {};
owl.Version = 0.1;


/*	---------------------------------------------

	owl.Browser

	--------------------------------------------- */
owl.UserAgent = navigator.userAgent.toLowerCase();
owl.Browser = {
	IE: /msie/.test(owl.UserAgent) && !/opera/.test(owl.UserAgent),
	Mozilla: /mozilla/.test(owl.UserAgent) && !/(compatible|webkit)/.test(owl.UserAgent),
	Opera: /opera/.test(owl.UserAgent),
	Safari: /webkit/.test(owl.UserAgent),
	Konqueror: /konqueror/.test(owl.UserAgent)
};
owl.Browser.Version = owl.UserAgent.replace(/^.+[ox|ra|on|or][\/: ]/, "");
if (owl.Browser.Version.indexOf("msie") >= 0) owl.Browser.Version = owl.Browser.Version.replace(/^.+[ie][\/: ]/, "");
owl.Browser.Version = owl.Browser.Version.replace(/([^\d.].+$)/, "");
owl.Browser.VerNum = parseFloat(owl.Browser.Version);


/*	---------------------------------------------

	owl.Number

	--------------------------------------------- */
owl.Number = function() {

	var reNumeric = /[^0-9-.]/g;

	// to integer
	function toInt(obj) {
		var str = String(obj);
		str = str.replace(reNumeric, "");
		var ret = parseInt(str, 10);
		return (isNaN(ret) ? 0 : ret);
	}
	
	// sign - returns -1, 0 or 1
	function Sign(num) {
		if (isNaN(num)) num = 0;
		return (Math.min(1, Math.max(-1, num)));
	}

	// public
	return {
		toInt: toInt,
		Sign: Sign
	};

}();


/*	---------------------------------------------

	owl.String

	--------------------------------------------- */
owl.String = function() {

	var reTrim = /^\s*|\s*$/g;
	var reClean = /[^\w|\s|@|&|.|,|!|%|(|)|+|-]/g;
	var reWhitespace = /[_|\s]+/g;

	// string trim
	function Trim(str) { return String(str).replace(reTrim, ""); }

	// string clean
	function Clean(str) { return Trim(String(str).replace(reClean, "").replace(reWhitespace, " ")); }

	// string pad
	function Pad(str, length, chr) {
		str = String(str);
		length = owl.Number.toInt(length);
		if (typeof chr == 'undefined') chr = " ";
		else {
			chr = String(chr);
			if (chr.length < 1) chr = " ";
		}
		while (str.length < length) str = chr + str;
		return str;
	}

	// string format - replaces %0, %1 ... %n with values in the params array|string
	function Format(str, params) {
		if (typeof params == 'string') params = [params];
		if (params && params.length) {
			for (var p = 0, pl = params.length; p < pl; p++) str = str.replace(new RegExp("(^|[^%])%"+p+"([^0-9]|$)", "g"), "$1"+params[p]+"$2");
		}
		return str;
	}

	// public methods
	return {
		Trim: Trim,
		Clean: Clean,
		Pad: Pad,
		Format: Format
	};

}();


/*	---------------------------------------------

	owl.Array

	--------------------------------------------- */
if (owl && !owl.Array) owl.Array = function() {

	// is array
	function Is(array) { return !!(array && array.constructor == Array); }

	// push
	function Push(array, element) { array[array.length] = element; }

	// pop
	function Pop(array) {
		var ret = null;
		if (array.length > 0) {
			ret = array[array.length-1];
			array.length--;
		}
		return ret;
	}
	
	// make (array arr, default value/array def)
	function Make(arr, def) {
		return (arr ? (Is(arr) ? arr : [arr]) : (typeof def == "undefined" ? [] : (Is(def) ? def : [def])));
	}

	// public methods
	return {
		Is: Is,
		Push: Push,
		Pop: Pop,
		Make: Make
	};

}();


/*	---------------------------------------------

	owl.Each

	--------------------------------------------- */
owl.Each = function (obj, fn) {
	if (obj.length) for (var i = 0, ol = obj.length, v = obj[0]; i < ol && fn(v, i) !== false; v = obj[++i]);
	else for (var p in obj) if (fn(obj[p], p) === false) break;
};


/*	---------------------------------------------

	owl.Property

	--------------------------------------------- */
owl.Property = function() {

	// add owl namespace to element
	function owlNamespace(element) {
		if (!element.owlP) {
			element.owlP = {};
			element.owlP.length = 0;
		}
	}

	// add value to owl namespace (for one or more elements)
	function Set(element, name, value) {
		owl.Each(owl.Array.Make(element), function(e) {
			owlNamespace(e);
			e.owlP[name] = value;
			e.owlP.length++;
		});
	}

	// get value from owl namespace
	function Get(element, name) {
		return (Exists(element, name) ? element.owlP[name] : null);
	}

	// does value exist?
	function Exists(element, name) {
		return (element && element.owlP && typeof element.owlP[name] != "undefined");
	}

	// remove value and namespace if required
	function Delete(element, name) {
		owl.Each(owl.Array.Make(element), function(e) {
			if (e.owlP && e.owlP[name]) {
				delete e.owlP[name];
				e.owlP.length--;
				if (e.owlP.length == 0) e.owlP = null;
			}
		});
	}

	// public methods
	return {
		Set: Set,
		Get: Get,
		Exists: Exists,
		Delete: Delete
	};

}();


/*	---------------------------------------------

	owl.Object

	--------------------------------------------- */
owl.Object = function() {

	// property/method exists
	function Exists(object, item) { return (object && typeof object[item] != 'undefined'); }

	// property exists
	function PropertyExists(object, item) { var type = (object ? typeof(object[item]) : 'undefined'); return (type != 'undefined' && type != 'function'); }

	// method exists
	function MethodExists(object, item) { return (object && typeof object[item] == 'function'); }

	// serialize object properties (to JSON)
	function Serialize(obj) {
		var t = typeof (obj);
		if (t != "object" || obj === null) {

			// simple data type
			if (t == "string") obj = '"'+obj+'"';
			return String(obj);

		}
		else {

			// recurse array or object
			var n, v, json = [], arr = owl.Array.Is(obj);

			for (n in obj) {
				v = obj[n]; t = typeof(v);

				if (t == "string") v = '"'+v+'"';
				else if (t == "object" && v !== null) v = owl.Object.Serialize(v);

				json.push((arr ? "" : '"' + n + '":') + String(v));
			}

			return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
		}
	}

	// return a deserialize object from a JSON string
	function DeSerialize(serial) {
		if (serial === "") serial = '""';
		eval("var ret = " + serial + ";");
		return ret;
	}

	// public methods
	return {
		Exists: Exists,
		PropertyExists: PropertyExists,
		MethodExists: MethodExists,
		Serialize: Serialize,
		DeSerialize: DeSerialize
	};

}();


}