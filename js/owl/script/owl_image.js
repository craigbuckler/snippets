/*	---------------------------------------------

	owl.Image

	--------------------------------------------- */
if (owl && !owl.Image) owl.Image = function() {

	// load an image and run a callback function
	function Load(imgsrc, callback) {
		var img = new Image();
		img.src = imgsrc;
		if (callback) {
			if (img.complete) callback(img);
			else img.onload = function() { callback(img); };
		}
	}

	// load an alpha-transparent PNG in IE
	function IEpng(element, imgsrc, sizing) {
		if (owl.Browser.IE && owl.Browser.VerNum >= 5.5 && owl.Browser.VerNum < 7) {
			if (!sizing) sizing = "crop";
			owl.Each(owl.Array.Make(element), function(e) {
				e.style.backgroundImage = "none";
				e.style.filter="progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+imgsrc+"', sizingMethod='"+sizing+"')";
			});
		}
	}

	// public methods
	return {
		Load: Load,
		IEpng: IEpng
	};

}();