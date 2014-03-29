/*	---------------------------------------------

	owl.Overlay

	--------------------------------------------- */
if (owl && owl.Css && owl.Dom && owl.Screen && owl.Timer && !owl.Overlay) {

	owl.Overlay = function() {

		// default configuration
		var Config = {
			PageFadeID: "lb_pageoverlay",
			PageFadeMax: 80,
			PageFadeStep: (owl.Browser.IE ? 20 : 5),
			PageFadePause: 20
		};

		// page fade out
		var pLayer = null, pElements = null, pTimer = null, pOpac = "opacity";
		function PageFadeOut(callback, col, opacMax, opacStep, opacPause) {

			// define layer
			if (!pLayer) {
				var b = owl.Dom.Get("body");
				if (b.length == 1) {
					pLayer = b[0].appendChild(document.createElement("div"));
					pLayer.style.position = "absolute"; pLayer.style.top = "0px"; pLayer.style.left = "0px";
				}
			}

			// set layer defaults
			if (pLayer) {
				pLayer.id = Config.PageFadeID;
				if (col) pLayer.style.backgroundColor = col;
				owl.Property.Set(pLayer, pOpac, 0);
				owl.Css.Opacity(pLayer, 0);
				pLayer.style.width = "100%"; pLayer.style.height = "100%";
				var page = owl.Screen.Page();
				var view = owl.Screen.ViewPort();
				var pWidth = Math.max(pLayer.offsetWidth, page.Width, (owl.Browser.IE ? view.Width : 0));
				var pHeight = Math.max(pLayer.offsetHeight, page.Height, (owl.Browser.IE ? view.Height : 0));
				pElements = new owl.Overlay.Elements(0, 0, pWidth, pHeight);
				pLayer.style.width = pWidth + "px";
				pLayer.style.height = pHeight + "px";

				// start timer
				opacMax = (opacMax ? opacMax : Config.PageFadeMax);
				pTimer = new owl.Timer(0, opacMax, (opacStep ? opacStep : Config.PageFadeStep), (opacPause ? opacPause : Config.PageFadePause));
				pTimer.CallBack = function(t) { owl.Css.Opacity(pLayer, t.Value); };
				if (callback) pTimer.OnStop = function(t) { if (t.Value >= opacMax) callback(); };
				pTimer.Start();
			}
		}

		// page fade in
		function PageFadeIn(callback) {
			if (pTimer) {
				pTimer.Reverse();
				pTimer.OnStop = function(t) {
					pElements.Show();
					pLayer.style.width = "0px"; pLayer.style.height = "0px";
					if (callback) callback();
				};
				pTimer.Start();
			}
		}


		// create an iframe for element hiding
		function CreateIframe() {
			var ifb = document.createElement("iframe");
			ifb.src = "javascript:false;";
			ifb.frameBorder = "0"; ifb.scrolling = "no"; ifb.style.position = "absolute";
			ifb.style.padding = "0px"; ifb.style.margin = "0px";
			ifb.style.width = "50px"; ifb.style.height = "50px"; ifb.style.top = "0px"; ifb.style.left = "0px";
			ifb.style.filter='progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)';
			return ifb;
		}

		// public methods
		return {
			Config: Config,
			PageFadeOut: PageFadeOut,
			PageFadeIn: PageFadeIn,
			CreateIframe: CreateIframe
		};

	}();


	// cover elements that cannot be overlaid in IE
	owl.Overlay.Elements = function(tx, ty, bx, by) {
		if (owl.Browser.IE && owl.Browser.VerNum < 7) {
			this.Hidden = null;
			this.HideTags = "select, iframe, applet";
			this.HideID = "owlframe";
			this.TX = tx; this.TY = ty;
			this.BX = bx; this.BY = by;
			this.Cover();
		}
	};

	// cover elements that cannot be overlaid in IE
	owl.Overlay.Elements.prototype.Cover = function() {

		// parse tags to hide
		if (this.HideTags && !this.Hidden) {

			var C = this;
			this.Hidden = [];
			owl.Each(owl.Dom.Get(this.HideTags), function(e) {

				if (!owl.Property.Exists(e, C.HideID)) {

					var loc = owl.Screen.Location(e);
					var ebox = { TX: loc.X, TY: loc.Y, BX: loc.X+e.offsetWidth, BY: loc.Y+e.offsetHeight };
					if (ebox.BX > C.TX && ebox.BY > C.TY && C.BX > ebox.TX && C.BY > ebox.TY) {

						if (owl.Browser.VerNum < 5.5) {
							// hide box in IE5.0
							if (e.style.visibility != "hidden") {
								e.style.visibility = "hidden";
								owl.Array.Push(C.Hidden, { Element: e, Iframe: false });
							}
						}
						else {
							// create iframe in IE5.5 and IE6.0
							var eop = (e.offsetParent.nodeName.toLowerCase() == "body");
							var iframe = e.parentNode.appendChild(owl.Overlay.CreateIframe());
							iframe.style.left = (eop ? ebox.TX : e.offsetLeft) + Math.max(0, C.TX - ebox.TX) + "px";
							iframe.style.top = (eop ? ebox.TY : e.offsetTop) + Math.max(0, C.TY - ebox.TY) + "px";
							iframe.style.width = Math.min(C.BX, ebox.BX) - Math.max(C.TX, ebox.TX) + "px";
							iframe.style.height = Math.min(C.BY, ebox.BY) - Math.max(C.TY, ebox.TY) + "px";
							owl.Property.Set(iframe, C.HideID, true);
							owl.Array.Push(C.Hidden, { Element: e, Iframe: iframe });
						}
					}

				}
			});
		}
	};

	// show hidden elements
	owl.Overlay.Elements.prototype.Show = function() {
		if (this.Hidden) owl.Each(this.Hidden, function(h) {
			if (h.Iframe) h.Element.parentNode.removeChild(h.Iframe);
			else h.Element.style.visibility = "visible";
		});
		this.Hidden = null;
	};

}