/*
System localisation, by Craig Buckler

Dependencies:
	misc.js
	HTML page must use: <meta http-equiv="content-type" content="application/xhtml+xml; charset=iso-8859-1" /> for some symbols
*/
var Locale = new function() {

	// private variables
	var reNumLeadZeros, reNumDP, reNumInvalid, reNumNeg, reNumNegTest;
	var dateIndexD, dateIndexM, dateIndexY;
	var reValidCharacter = new Array();


	// define locale regular expressions
	this.Initialise = function() {

		// numeric regular expressions
		var neg = this.NegativePre + (this.NegativePre != this.NegativePost ? this.NegativePost : ""); // negative characters
		reNumLeadZeros = new RegExp("^0+", "");
		reNumDP = new RegExp("["+this.DecimalPoint+"]", "g");
		reNumInvalid = new RegExp("[^0-9"+this.DecimalPoint+neg+"]", "g");
		reNumNeg = new RegExp("["+neg+"]", "g");
		reNumNegTest = new RegExp((this.NegativePre != "" ? "^["+this.NegativePre+"]" : "") + ".+" + (this.NegativePost != "" ? "["+this.NegativePost+"]$" : ""));


		// date formatting information
		var df = this.DateFormat.toLowerCase();
		df = df.replace(/[^dmy]/g, "");
		dateIndexD = df.indexOf("d");
		dateIndexM = df.indexOf("m");
		dateIndexY = df.indexOf("y");
		if (dateIndexD < 0 || dateIndexM < 0 || dateIndexY < 0) { dateIndexD = 0; dateIndexM = 1; dateIndexY = 2; }


		// valid string character regular expressions
		reValidCharacter.string = new RegExp(".", "i");
		reValidCharacter.alpha = new RegExp("[a-z|\\-|\\'| ]", "i");
		reValidCharacter.text = new RegExp("[\\w|\\s|,|\\.|?|!|\\'|\\\"|&|%|\\-|+|*|=|:|;|@|#|(|)]", "i");


		// valid number character regular expressions
		var num = "0-9" + (this.NegativePre != "" ? "|\\"+this.NegativePre : "") + (this.NegativePost != "" ? "|\\"+this.NegativePost : "") + (this.ThousandsSep != "" ? "|\\"+this.ThousandsSep : "") + (this.DecimalPoint != "" ? "|\\"+this.DecimalPoint : "");
		reValidCharacter.digit = new RegExp("[0-9]", "i");
		reValidCharacter.number = new RegExp("["+num+"]", "i");
		reValidCharacter.currency = new RegExp("["+num+(this.CurrencyPre != "" ? "|"+this.CurrencyPre : "")+(this.CurrencyPost != "" ? "|"+this.CurrencyPost : "")+"]", "i");
		reValidCharacter.percent = new RegExp("["+num+(this.PercentPre != "" ? "|"+this.PercentPre : "")+(this.PercentPost != "" ? "|"+this.PercentPost : "")+"]", "i");

		// valid date character regular expressions
		reValidCharacter.date = new RegExp("[0-9|\\-|\\/|\\\\|.| ]", "i");
	}


	// ____________________________________________________
	// conversion functions

	// convert to a real number
	this.toNumber = function(num) {
		var neg, bdp, adp;
		num=String(num);
		num=num.replace(reNumInvalid, "");
		neg = (reNumNegTest.test(num) ? -1 : 1);
		num = num.replace(reNumNeg, "");

		// find before and after dp
		var p = num.indexOf(this.DecimalPoint);
		if (p >= 0) {
			bdp = num.substr(0, p);
			adp = num.substr(p+1);
			adp = adp.replace(reNumDP, "");
		}
		else { bdp = num; adp = ""; }
		num = bdp+"."+adp;

		// final check
		if (isNaN(num)) num = null;
		else num = parseFloat(num) * neg;

		return num;
	}


	// convert to a real date
	this.toDate = function(str) {
		var date = null;
		str = String(str).Trim();
		str = str.replace(/^\D+|\D+$/g, "");
		str = str.replace(/\D+/g, "-");
		var dig = str.split("-", 3);
		if (dig.length == 3) {
			var d = (dig[dateIndexD]).toInt(); var m = (dig[dateIndexM]).toInt(); var y = (dig[dateIndexY]).toInt();
			y += (y <= 30 ? 2000 : (y > 30 && y < 100 ? 1900 : 0));
			var vDate = new Date(y, (m-1), d);
			if (d == vDate.getDate() && (m-1) == vDate.getMonth() && y == vDate.getFullYear()) date = vDate;
		}
		return date;
	}

	// ____________________________________________________
	// formatting functions

	// format a local number to dp decimal places
	this.formatNumeric = function(num, dp, type) {

		var neg, bdp, adp, obdp;

		// check inputs
		if (isNaN(num)) num = 0;
		dp = Math.abs(dp.toInt());

		// parse number
		neg = (num < 0);
		num = String(Math.round(Math.abs(num) * Math.pow(10, dp))).Pad(dp, '0');
		bdp = num.substr(0, num.length - dp);
		adp = num.substr(num.length - dp);

		// add thousands separators
		if (bdp == "") bdp = "0";
		else {
			do {
				obdp=bdp;
				bdp=bdp.replace(/(\d+)(\d{3})/g, "$1" + this.ThousandsSep + "$2");
			} while (bdp!=obdp);
		}

		// add decimal point
		num = bdp + (dp > 0 ? this.DecimalPoint + adp : "");

		// format types
		switch (type.Trim().toLowerCase()) {
			case "currency" : num = this.CurrencyPre + num + this.CurrencyPost; break;
			case "percent" : num = this.PercentPre + num + this.PercentPost; break;
		}

		// negative handler
		if (neg) num = this.NegativePre + num + this.NegativePost;

		return num;
	}


	// format a number, currency and percentage
	this.formatNumber = function(num, dp) { return this.formatNumeric(num, dp, "number"); }
	this.formatCurrency = function(num, dp) { return this.formatNumeric(num, dp, "currency"); }
	this.formatPercent = function(num, dp) { return this.formatNumeric(num, dp, "percent"); }


	// format a local date
	this.formatDate = function(date) {
		var ret = "";
		if (typeof date != 'date') this.toDate(date);
		if (date != null) {
			ret = this.DateFormat.replace(/[d]/i, String(date.getDate()).Pad(2, 0));
			ret = ret.replace(/[m]/i, String(date.getMonth()+1).Pad(2, 0));
			ret = ret.replace(/[y]/i, String(date.getFullYear()));
		}
		return ret;
	}


	// ____________________________________________________
	// valid character checking (types can be string, alpha, text, number, currency, percent, or date)
	this.validCharacter = function(str, type) {
		str = String(str);
		var reTest = (typeof reValidCharacter[type] != 'undefined' ? reValidCharacter[type] : reValidCharacter.string);
		return reTest.test(str);
	}


	// ____________________________________________________
	// locale defaults

	// UK localisation
	this.SetUK = function() {
		this.ThousandsSep = ",";
		this.DecimalPoint = ".";
		this.NegativePre = "-";
		this.NegativePost = "";
		this.CurrencyPre = "\u00a3";
		this.CurrencyPost = "";
		this.PercentPre = "";
		this.PercentPost = "%";
		this.DateFormat = "d-m-y";
		this.Initialise();
	}

	// US localisation
	this.SetUS = function() {
		this.ThousandsSep = ",";
		this.DecimalPoint = ".";
		this.NegativePre = "-";
		this.NegativePost = "";
		this.CurrencyPre = "$";
		this.CurrencyPost = "";
		this.PercentPre = "";
		this.PercentPost = "%";
		this.DateFormat = "m/d/y";
		this.Initialise();
	}

	// Canadian localisation
	this.SetCA = function() {
		this.ThousandsSep = " ";
		this.DecimalPoint = ",";
		this.NegativePre = "-";
		this.NegativePost = "";
		this.CurrencyPre = "";
		this.CurrencyPost = "$";
		this.PercentPre = "";
		this.PercentPost = "%";
		this.DateFormat = "y-m-d";
		this.Initialise();
	}

	// French localisation
	this.SetFR = function() {
		this.ThousandsSep = " ";
		this.DecimalPoint = ",";
		this.NegativePre = "-";
		this.NegativePost = "";
		this.CurrencyPre = "";
		this.CurrencyPost = "\u20ac";
		this.PercentPre = "";
		this.PercentPost = "%";
		this.DateFormat = "d/m/y";
		this.Initialise();
	}

	// German localisation
	this.SetDE = function() {
		this.ThousandsSep = ".";
		this.DecimalPoint = ",";
		this.NegativePre = "-";
		this.NegativePost = "";
		this.CurrencyPre = "";
		this.CurrencyPost = "\u20ac";
		this.PercentPre = "";
		this.PercentPost = "%";
		this.DateFormat = "d.m.y";
		this.Initialise();
	}

	// Spanish localisation
	this.SetES = function() {
		this.ThousandsSep = ".";
		this.DecimalPoint = ",";
		this.NegativePre = "-";
		this.NegativePost = "";
		this.CurrencyPre = "";
		this.CurrencyPost = "\u20ac";
		this.PercentPre = "";
		this.PercentPost = "%";
		this.DateFormat = "d/m/y";
		this.Initialise();
	}

	// default to UK
	this.SetUK();
}

// ________________________________________________________
// Generic conversion routines - all return null if invalid

// convert a (localised) string to a real number
String.prototype.toNumber = function() { return Locale.toNumber(this); }


// convert a (localised) string to a real date
String.prototype.toDate = function() { return Locale.toDate(this); }


// convert a string to a real email address
String.prototype.toEmail = function() {
	var email = this.Trim().toLowerCase();
	if (email == "") email = null;
	else if (email.replace(/^[^@]+@[a-z0-9]+([_\.\-]{0,1}[a-z0-9]+)*([\.]{1}[a-z0-9]+)+$/, "") != "") email = null;
	return email;
}


// convert a string to a real URL
String.prototype.toURL = function() {
	var url = this.Trim();
	url = url.replace(/\\/g, "/");
	if (url == "") url = null;
	else {
		if (url.toLowerCase().indexOf("http://") != 0 && url.toLowerCase().indexOf("https://") != 0) url = "http://"+url;
		if (url.replace(/^((http(s){0,1}:\/\/){0,1}[a-z0-9]+([_\.\-]{0,1}[a-z0-9]+)*([\.]{1}[a-z0-9]+)+)(\:\d{1,5}){0,1}([\/]{1}[a-z0-9_\.\-]+)*[\/]{0,1}(\?.*){0,1}$/, "") != "") url = null
	}
	return url;
}


// ________________________________________________________
// format a value to a locatised float, currency or percentage (dp decimal places)
Number.prototype.formatNumber = function(dp) { return Locale.formatNumber(this, dp); }
Number.prototype.formatCurrency = function(dp) { return Locale.formatCurrency(this, dp); }
Number.prototype.formatPercent = function(dp) { return Locale.formatPercent(this, dp); }


// format a value to a localised date
Date.prototype.formatDate = function() { return Locale.formatDate(this); }


// ________________________________________________________
// check that a character is valid for the data type
String.prototype.validStringCharacter = function() { return Locale.validCharacter(this, "string"); }
String.prototype.validAlphaCharacter = function() { return Locale.validCharacter(this, "alpha"); }
String.prototype.validTextCharacter = function() { return Locale.validCharacter(this, "text"); }
String.prototype.validDigitCharacter = function() { return Locale.validCharacter(this, "digit"); }
String.prototype.validNumberCharacter = function() { return Locale.validCharacter(this, "number"); }
String.prototype.validCurrencyCharacter = function() { return Locale.validCharacter(this, "currency"); }
String.prototype.validPercentCharacter = function() { return Locale.validCharacter(this, "percent"); }
String.prototype.validDateCharacter = function() { return Locale.validCharacter(this, "date"); }