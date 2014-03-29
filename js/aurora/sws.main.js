/*!
 * Main JavaScript libraries
 * http://optimalworks.net/
 * Copyright 2012, Craig Buckler
 */

var SWS = SWS || {};


// _______________________________________________________
// string functions
SWS.String = function() {

	var reTrim = /^\s*|\s*$/g;

	// trim
	function Trim(s) {
		return String(s).replace(reTrim, "");
	}


	// left pad
	function LPad(s, len, chr) {
		chr = chr || " ";
		while (s.length < len) s = [chr, s].join("");
		return s;
	}


	// right pad
	function RPad(s, len, chr) {
		chr = chr || " ";
		while (s.length < len) s = [s, chr].join("");
		return s;
	}


	// HTMLencode
	function HTMLencode(s) {
		return s.replace(/&quot;/ig, '"').replace(/&#039;/ig, "'").replace(/&lt;/ig, "<").replace(/&gt;/ig, ">").replace(/&amp;/ig, "&").replace(/&#8594;/g, '\u2192').replace(/&#215;/g, '\u00D7');
	}


	return {
		Trim: Trim,
		LPad: LPad,
		RPad: RPad,
		HTMLencode: HTMLencode
	};

}();


// _______________________________________________________
// conversion functions
SWS.Convert = function() {

	var reNum = new RegExp("[^\\d"+$C.numberpoint+"]", "g");
	var reDate = /(\d+)\D+(\d+)\D+(\d+)/g;
	var tpDate = null;

	// to integer
	function toInt(v) {
		return toFloat(v);
	}


	// to float
	function toFloat(v, dp) {
		dp = Math.pow(10, dp || 0);
		v = parseFloat(String(v).replace(reNum, ""));
		return (isNaN(v) ? 0 : Math.round(v * dp) / dp);
	}


	// to date
	function toDate(v) {
		var d = null, v = v.split(reDate);
		if (v.length >= 4) {

			// parse date format (done once)
			if (tpDate == null) {
				var df = $C.dateinput.toLowerCase().replace(/[^djmnoy]/g, "");
				tpDate = {
					"d": df.search(/d|j/) || 0,
					"m": df.search(/m|n/) || 0,
					"y": df.search(/o|y/) || 0
				};
				for (p in tpDate) if (typeof tpDate[p] == "number") tpDate[p]++;
			}

			// convert to date
			var y = parseInt(v[tpDate.y], 10);
			if (y < 100) y += 2000;
			d = new Date(y, parseInt(v[tpDate.m], 10)-1, parseInt(v[tpDate.d], 10));

		}
		return d;
	}


	return {
		toInt: toInt,
		toFloat: toFloat,
		toDate: toDate
	};

}();


// _______________________________________________________
// localisation
SWS.Format = function() {

	// format number
	function Number(v, dp) {

		v = String(SWS.Convert.toFloat(v, dp));
		var p = v.indexOf(".");
		if (p < 0) p = v.length;

		var adp = SWS.String.RPad(v.substr(p+1), dp, "0");
		var bdp = v.substr(0, p), obdp;
		while (bdp!=obdp) {
			obdp=bdp;
			bdp = bdp.replace(/(\d+)(\d{3})/g, "$1" + $C.numbersep + "$2");
		}

		return bdp + (adp.length > 0 ? $C.numberpoint + adp : "");

	}


	// format integer
	function Int(v) {
		return Number(v, 0);
	}


	// format currency
	function Currency(v) {
		return $C.currencypre + Number(v, $C.currencydp) + $C.currencypost;
	}


	// format date (PHP date format)
	function Date(v) {

		var r = "";
		if (v && v.getDate) {

			var d = String(v.getDate());
			var m = String(v.getMonth()+1);
			var y = String(v.getFullYear());

			r = $C.dateinput.replace(/d/g, SWS.String.LPad(d, 2, "0")).replace(/j/g, d).replace(/m/g, SWS.String.LPad(m, 2, "0")).replace(/n/g, m).replace(/y/g, y.substr(2)).replace(/o|Y/g, y);

		}
		return r;

	}


	return {
		Number: Number,
		Int: Int,
		Currency: Currency,
		Date: Date
	}

}();