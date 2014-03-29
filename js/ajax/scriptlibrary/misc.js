// miscellaneous functions, by Craig Buckler

// ________________________________________________________
// convert a value to an integer
Object.prototype.toInt = function() {
	var str = String(this);
	str = str.replace(/[^0-9-.]/g, "");
	var ret = parseInt(str, 10);
	if (isNaN(ret)) ret = 0;
	return ret;
}


// ________________________________________________________
// string trimming
String.prototype.Trim = function() { return this.replace(/^\s*|\s*$/g, ""); }

// string cleaning
String.prototype.Clean = function() { return this.replace(/[^\w|\s|@|&|.|,|!|%|(|)|+|-]/g, "").replace(/_/g, " ").replace(/\s+/g, " ").Trim(); }

// string padding
String.prototype.Pad = function(length, padChar) {
	var str = String(this);
	length = length.toInt();
	if (typeof padChar == 'undefined') padChar = " ";
	else {
		padChar = String(padChar);
		if (padChar.length < 1) padChar = " ";
	}
	while (str.length < length) str = padChar + str;
	return str;
}

// convert a serial YYYYMMDD string to a date
String.prototype.SerialToDate = function() {
	var d = String(this);
	d = d.Trim();
	var date = (d.length >= 8 ? new Date(d.substr(0,4).toInt(), d.substr(4,2).toInt() - 1, d.substr(6,2).toInt()) : new Date());
	return date;
}

// convert a date to serial YYYYMMDD format
Date.prototype.DateToSerial = function() {
	return String(this.getFullYear()).Pad(4,"0")+String(this.getMonth()+1).Pad(2,"0")+String(this.getDate()).Pad(2,"0");
}


// ________________________________________________________
// array stack push (if unsupported)
if (!Array.prototype.push) { Array.prototype.push = function(element) { this[this.length] = element; } }

// array stack pop (if unsupported)
if (!Array.prototype.pop) {
	Array.prototype.pop = function() {
		var ret;
		if (this.length > 0) {
			ret = this[this.length-1];
			this.length--;
		}
		return ret;
	}
}


// ________________________________________________________
// does associative array item exist?
Array.prototype.Exists = function(key) {
	var type = typeof(this[key]);
	return (type != 'undefined' && type != 'function');
}

// save array to cookie
Array.prototype.StoreAll = function(name, minutes) {
	var values = "";
	for (var key in this) if (typeof(this[key]) != 'function') values += (values == "" ? "" : "[:]") + key + "[=]" + String(this[key]);
	CookieSet(name, values, minutes);
}

// load array from cookie
Array.prototype.LoadAll = function(name) {
	var allValues = CookieGet(name);
	var values = allValues.split("[:]");
	var thisValue;
	for (var i = 0; i < values.length; i++) {
		thisValue = values[i].split("[=]");
		if (thisValue.length == 2) {
			if (thisValue[1] == "true" || thisValue[1] == "false") this[thisValue[0]] = (thisValue[1] == "true"); // boolean values
			else this[thisValue[0]] = thisValue[1]; // other values
		}
	}
}


// ________________________________________________________
// parse querystring arguments
function HTTParguments() {
	var args = new Array();
	var arglist = location.search.Trim();
	if (arglist.charAt(0) == '?') arglist = arglist.substr(1);
	var argsep = arglist.split('&');
	var thisValue;
	for (var i = 0; i < argsep.length; i++) {
		thisValue = argsep[i].split("=");
		if (thisValue.length == 2) args[unescape(thisValue[0])] = unescape(thisValue[1]);
	}
	return args;
}


// ________________________________________________________
// set a cookie value (path set to root)
function CookieSet(name, value, minutes) {
	value = String(value).replace(/\r/g, "").replace(/\n/g, "[#]");
	if (minutes) {
		var date = new Date();
		date.setTime(date.getTime()+(minutes*60000));
		var expires = "; expires="+date.toGMTString();
	}
	else expires = "";
	document.cookie = name+"="+String(value)+expires+"; path="+location.pathname.substr(0, location.pathname.indexOf("/",1)+1);
}

// read a cookie value
function CookieGet(name) {
	var ret = "";
	name += "=";
	var allCookies = document.cookie.split(';');
	var thisCookie;
	for(var i = 0; i < allCookies.length && ret == ""; i++) {
		thisCookie = allCookies[i].Trim();
		if (thisCookie.indexOf(name) == 0) ret = thisCookie.substring(name.length).replace(/\[#\]/g, "\n");
	}
	return ret;
}

// are cookies enabled?
function CookiesEnabled() {
	CookieSet("testcookie", "testvalue", 0.05);
	return (CookieGet("testcookie") == "testvalue");
}