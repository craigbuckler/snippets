/*	---------------------------------------------

	owl.Screen

	--------------------------------------------- */
if (owl && owl.Dom && owl.Timer && !owl.Screen) {

	owl.Screen = function() {

		// get body node
		var Body = function() {
			var b = owl.Dom.Get("body");
			if (b.length == 1) { Body = function() { return b[0]; }; return Body(); }
			else return null;
		};


		// returns the X, Y co-ordinates of a single element
		function Location(element) {
			var Loc = { X: element.offsetLeft - element.scrollLeft, Y: element.offsetTop - element.scrollTop };
			while ((element = element.offsetParent)) { Loc.X += element.offsetLeft - element.scrollLeft; Loc.Y += element.offsetTop - element.scrollTop; }
			return Loc;
		}


		// viewport dimensions
		var ViewPortFunction;
		function ViewPort() {
			if (!ViewPortFunction) {
				if (window.innerWidth) {
					ViewPortFunction = function() { return { Width: window.innerWidth, Height: window.innerHeight }; };
				}
				else if (document.documentElement && document.documentElement.clientWidth) {
					ViewPortFunction = function() { return { Width: document.documentElement.clientWidth, Height: document.documentElement.clientHeight }; };
				}
				else ViewPortFunction = function() { return { Width: (Body() ? Body().clientWidth : 0), Height: (Body() ? Body().clientHeight : 0) }; };
			}
			return ViewPortFunction();
		}


		// scroll offsets
		function ViewScroll() {
			return {
				X: window.pageXOffset || (document.documentElement && document.documentElement.scrollLeft) || (Body() && Body().scrollLeft),
				Y: window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || (Body() && Body().scrollTop)
			};
		}


		// page dimensions
		function Page() {
			var p = { Width: 0, Height: 0 };
			if (Body()) {
				if (document.documentElement && document.documentElement.scrollWidth) {
					p.Width = document.documentElement.scrollWidth; p.Height = document.documentElement.scrollHeight;
				}
				else if (Body().offsetWidth) { p.Width = Body().offsetWidth; p.Height = Body().offsetHeight; }
			}
			return p;
		}


		// screen resolution
		var Resolution = function() {
			var r = {};
			r.Width = (screen.width ? screen.width : null);
			r.Height = (screen.height ? screen.height : null);
			r.AvailWidth = (screen.availWidth ? screen.availWidth : r.Width);
			r.AvailHeight = (screen.availHeight ? screen.availHeight : r.Height);
			r.AvailLeft = (screen.availLeft ? screen.availTop : 0);
			r.AvailTop = (screen.availTop ? screen.availTop : 0);
			r.ColorDepth = (screen.colorDepth ? screen.colorDepth : (screen.pixelDepth ? screen.pixelDepth : null));
			Resolution = function() { return r; };
			return Resolution();
		};


		// move to new scroll position and run callback when complete
		var timerScroll = null;
		function ScrollTo(newX, newY, animate, callback) {

			if (animate === false) {
				// jump to new location
				window.scrollTo(newX, newY);
				if (typeof callback == "function") callback();
			}
			else {
				// scroll to new location
				if (timerScroll) timerScroll.Stop();
				timerScroll = new owl.Timer(owl.Screen.Config.MoveFrames, 1, -1, owl.Screen.Config.MovePause, 0, 0, function(t) {
					// scroll animation
					var v = ViewScroll();
					var f = Math.sqrt(t.Value);
					window.scrollTo( v.X + Math.ceil((newX - v.X) / f), v.Y + Math.ceil((newY - v.Y) / f) );
					var nv = ViewScroll();
					if (nv.X == v.X && nv.Y == v.Y) {
						t.Stop();
						if (typeof callback == "function") { callback(); callback = null; }
					}
				});
			}

		}


		// scrolls the top left of an element into view
		function ScrollToElement(element, left, right, top, bottom, absolute, animate, callback) {
			if (absolute !== true) {
				var vp = ViewPort();
				left = Math.floor((left/100) * vp.Width);
				right = Math.ceil((right/100) * vp.Width);
				top = Math.floor((top/100) * vp.Height);
				bottom = Math.ceil((bottom/100) * vp.Height);
			}
			var loc = Location(element); // element location
			var vs = ViewScroll(); // scroll location
			var sx = (loc.X < vs.X + left ? loc.X - left : (loc.X > vs.X + right ? loc.X - right : vs.X));
			var sy = (loc.Y < vs.Y + top ? loc.Y - top : (loc.Y > vs.Y + bottom ? loc.Y - bottom : vs.Y));
			ScrollTo(sx, sy, animate, callback);
		}


		return {
			Location: Location,
			ViewPort: ViewPort,
			ViewScroll: ViewScroll,
			Page: Page,
			Resolution: Resolution,
			ScrollTo: ScrollTo,
			ScrollToElement: ScrollToElement
		};

	}();


	/* ---------------------------------------------
	owl.Screen.Config
	--------------------------------------------- */
	owl.Screen.Config = {
		MoveFrames: 50,
		MovePause: 20
	}

}