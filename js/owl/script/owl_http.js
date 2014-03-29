/*	---------------------------------------------

	owl.Http

	--------------------------------------------- */
if (owl && !owl.Http) owl.Http = function() {

	var ArgArray, querystring;

	// returns an array of arguments
	function Arguments(arg) {
		if (!arg) arg = owl.String.Trim(location.search);
		if (arg != querystring) {
			querystring = arg;
			ArgArray = {};
			var q = arg.indexOf('?');
			if (q >= 0) arg = arg.substr(++q);
			owl.Each(arg.split('&'), function(a) {
				var v = a.split("=");
				if (v.length == 2) ArgArray[unescape(v[0])] = unescape(v[1]);
			});
		}
		return ArgArray;
	}

	// returns a named argument
	function Argument(name) {
		Arguments();
		return (ArgArray[name] ? ArgArray[name] : null);
	}

	// public methods
	return {
		Arguments: Arguments,
		Argument: Argument
	};

}();