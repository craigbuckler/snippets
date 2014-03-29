/*	---------------------------------------------

	owl.Lightbox

	--------------------------------------------- */
if (owl && owl.Event && owl.innerHTML && owl.Image && owl.Overlay && !owl.Lightbox) {

	// lightbox object
	owl.Lightbox = function(node) {

		// define new lightbox
		if (!owl.Css.ClassExists(node, owl.Lightbox.Config.Container.ActiveClass)) {

			// shortcuts
			var $D = owl.Dom;
			var $E = owl.Event;
			var $T = owl.Timer;
			var $Conf = owl.Lightbox.Config;
			var A = $Conf.Animation;

			owl.Css.ClassApply(node, $Conf.Container.ActiveClass);
			var LB = {shown: false, win: null, img: null, bar: null };
			var Event = {};
			var width = 0, height = 0, maxwidth = 0, maxheight = 0, scrwidth = 0, scrheight = 0, vScroll = null;
			var image = [], cImage = null, opacityImage = 0;
			var hoverOver = null, iReady = false, barText = null, barPos = false;
			var locX = 0, locY = 0, curX = 0, curY = 0;
			var timerBox = null, timerImg = null, timerBar = null, timerHover = null, timerZoom = null;

			// attach click event to images
			owl.Each(owl.Dom.Get("a", node), function(a, i) {
				image[i] = new owl.Lightbox.Image(a);
				owl.Property.Set(a, "LBindex", i);
				new $E(a, "click", function(e) { Start(e); });
			});

			// load first image
			if (!$Conf.Preload.All && $Conf.Preload.Next && image.length > 0) image[0].Load();
		}

		// start lightbox
		function Start(e) {
			if ($Conf.Enabled) {
				StopEvent(e);
				var i = owl.Property.Get(e.Element, "LBindex");
				image[i].Load();
				if (!LB.shown) {
					// determine dimensions
					LB.shown = true;
					owl.Overlay.PageFadeOut(function() { ShowWindow(i); });
					var vp = owl.Screen.ViewPort();
					scrwidth = vp.Width; scrheight = vp.Height;
					maxwidth = Math.max($Conf.Size.Minimum, Math.ceil(scrwidth - $Conf.Size.WidthPad));
					maxheight = Math.max($Conf.Size.Minimum, Math.ceil(scrheight - $Conf.Size.HeightPad));
				}
			}
		}

		// stop lightbox
		function Stop(e) {
			StopEvent(e);

			// remove events
			owl.Each(Event, function(e) { e.Detach(); });

			// fade out
			if (timerBox) timerBox.Stop();
			if (timerImg) timerImg.Stop();
			LB.win.style.display = "none";
			owl.Overlay.PageFadeIn(function() { LB.shown = false; });
		}

		// show window
		function ShowWindow(i) {

			// create window
			if (LB.win === null) {
				LB.win = owl.Lightbox.CreateWindow();
				LB.img = $D.Get("img", LB.win)[0];
				LB.bar = $D.Get("#lb_bar", LB.win)[0];
				if (image.length < 2) owl.Each($D.Get("a[id!=lb_close]", LB.bar), function(n) { n.style.display = "none"; });
				owl.Css.Opacity(LB.bar, $Conf.Animation.BarOpacity);
			}

			// configure
			HideInfo();
			width = $Conf.Size.Start;
			height = width;
			vScroll = owl.Screen.ViewScroll();
			LB.win.style.display = "block";
			WindowSize(width, height);
			ShowImage(i);

			// define events
			Event.KeyDown = new $E(document, "keydown", HandleKeyEvent);
			Event.Next = new $E($D.Get("#lb_next", LB.bar), "click", NextImage);
			Event.Back = new $E($D.Get("#lb_back", LB.bar), "click", NextImage);
			Event.Close = new $E($D.Get("#lb_close", LB.bar), "click", Stop);
			Event.ImgNext = new $E(LB.win, "click", NextImage);
			Event.MouseOver = new $E(LB.win, "mouseover", InfoHover);
			Event.Focus = new $E(LB.win, "focus", InfoHover);
			Event.MouseOut = new $E(LB.win, "mouseout", InfoHover);
			Event.Blur = new $E(LB.win, "blur", InfoHover);
			Event.MouseMove = new $E(LB.win, "mousemove", ZoomMove);
			Event.Overlay = new $E($D.Get("#"+owl.Overlay.Config.PageFadeID), "click", Stop);
			Event.WinFocus = new $E(document, "focus", HandleWindowFocus);
		}

		// stop page element focus
		function HandleWindowFocus(e) {
			var t = e.Target;
			while (t != LB.win && t.parentNode) t = t.parentNode;
			if (t != LB.win) { StopEvent(e); LB.win.focus(); InfoHover(e); }
		}

		// key event
		function HandleKeyEvent(e) {
			var c = e.Key().Function;
			if (e.Key().Pressed == " ") c = "right";
			var f = {
				"esc": 99,
				"left": -1, "up": -1, "pageup": -1,
				"right": 1, "down": 1, "pagedown": -1
			};
			if (f[c]) { if (f[c] == 99) Stop(); else NextImage(e, f[c]); }
		}

		// go to next image
		function NextImage(e, dir) {
			StopEvent(e);
			if (!dir) dir = (e.Element && e.Element.id == "lb_back" ? -1 : 1);
			if (cImage !== null) {
				var i = cImage + dir;
				var il = image.length - 1;
				i = (i > il ? 0 : (i < 0 ? il : i));
				if (i != cImage) ShowImage(i);
			}
		}

		// show image
		function ShowImage(i) {

			HideInfo();
			if (timerZoom) timerZoom.Stop();
			timerZoom = null;
			if (timerBox) timerBox.Stop();
			if (timerImg) timerImg.Stop();

			// load image
			iReady = false;
			cImage = i;
			image[cImage].Load(ResizeWindow);

			// fade current image
			if (opacityImage > 0) timerImg = new $T(opacityImage, 0, -A.FadeStep, A.FramePause, 0, 0, function(t) { ImageOpacity(t.Value); });

			// preload next image
			if (!$Conf.Preload.All && $Conf.Preload.Next && cImage+1 < image.length) image[cImage+1].Load();
		}

		// prepare window
		function ResizeWindow() {

			// load image
			if (timerImg) timerImg.Stop();
			ImageOpacity(0);
			image[cImage].Resize(maxwidth, maxheight);
			LB.img.width = image[cImage].Width;
			LB.img.height = image[cImage].Height;
			LB.img.src = image[cImage].Src;
			vScroll = owl.Screen.ViewScroll();
			WindowSize(width, height);

			// fade image in and resize
			var ws = A.SizeStep * (width > image[cImage].Width ? -1 : 1);
			var hs = A.SizeStep * (height > image[cImage].Height ? -1 : 1);

			// resize width
			if (timerBox) timerBox.Stop();
			timerBox = new $T(width, image[cImage].Width, ws, A.FramePause, $Conf.Throttle, 0);
			timerBox.CallBack = function(t) { WindowSize(t.Value, height); };
			timerBox.OnStop = function() {

				// resize height
				timerBox = new $T(height, image[cImage].Height, hs, A.FramePause, 0, 0);
				timerBox.CallBack = function(t) { WindowSize(width, t.Value); };
				timerBox.OnStop = function() {

					// fade image in
					var loc = owl.Screen.Location(LB.img);
					locX = loc.X; locY = loc.Y;
					iReady = true;
					if (timerImg) timerImg.Stop();
					timerImg = new $T(0, 100, A.FadeStep, A.FramePause, 0, 0);
					timerImg.CallBack = function(t) { ImageOpacity(t.Value); };
					timerImg.OnStop = function() { if (hoverOver) { ShowInfo(); ZoomIn(); } };
					timerImg.Start();

				};
				timerBox.Start();
			};
			timerBox.Start();

		}

		// resize window
		function WindowSize(w, h) {
			LB.img.style.left = ((w - LB.img.width) / 2) + "px";
			LB.img.style.top = ((h - LB.img.height) / 2) + "px";
			LB.win.style.left = ((scrwidth - w) / 2 + vScroll.X) +"px";
			LB.win.style.top = ((scrheight - h) / 2 + vScroll.Y) +"px";
			LB.win.style.width = w+"px";
			LB.win.style.height = h+"px";
			width = w;
			height = h;
		}

		// throttle showing the info box
		function InfoHover(e) {
			if (timerHover) clearInterval(timerHover);
			hoverOver = !(e.Type == "mouseout" || e.Type == "blur");
			timerHover = setTimeout( function() { if (hoverOver) { ShowInfo(); ZoomIn(); } else { HideInfo(); ZoomOut(); } }, $Conf.Throttle);
		}

		// show information panel
		function ShowInfo() {
			if ($Conf.ShowInfo && iReady) {

				// copy description
				if (barText != cImage) {
					if (timerBar) { timerBar.Stop(); timerBar = null; }
					barText = cImage;
					var p = $D.Get("p", LB.bar)[0];
					$D.Clone(image[barText].Node, p, false, true);
					var i = $D.Get("img", p);
					if (i.length > 0) i[0].parentNode.removeChild(i[0]);
				}

				// slide into view
				if (timerBar) {
					if (timerBar.OnStop) { timerBar.OnStop = null; timerBar.Reverse(); }
				}
				else {
					var h = -LB.bar.offsetHeight;
					timerBar = new $T(h, -1, A.BarStep, A.FramePause, 0, 0);
					timerBar.CallBack = function(t) { barPos = t.Value; LB.bar.style.bottom = barPos + "px"; };
					LB.bar.style.visibility = "visible";
				}
				timerBar.Start();
			}
		}

		// hide information panel
		function HideInfo() {
			if (timerBar && !timerBar.OnStop) {
				timerBar.Reverse();
				timerBar.OnStop = function() { timerBar = null; };
				timerBar.Start();
			}
			else LB.bar.style.visibility = "hidden";
		}

		// zoom in
		function ZoomIn() {
			if ($Conf.Magnify && iReady) {
				if (timerZoom) {
					if (timerZoom.OnStop) { timerZoom.OnStop = null; timerZoom.Reverse(); }
				}
				else {
					if (image[cImage].Ratio < 1) {
						timerZoom = new $T(image[cImage].Ratio, 1, (1 - image[cImage].Ratio) / A.ZoomSteps, A.FramePause, 0, 0);
						timerZoom.CallBack = function(t) { ZoomImage(t.Value); };
					}
				}
				if (timerZoom) timerZoom.Start();
			}
		}

		// zoom out
		function ZoomOut() {
			if (timerZoom && !timerZoom.OnStop) {
				timerZoom.Reverse();
				timerZoom.OnStop = function() { timerZoom = null; };
				timerZoom.Start();
			}
		}

		// zoom image handler
		function ZoomMove(e) {
			if ($Conf.Magnify && iReady && hoverOver && image[cImage].Ratio < 1) {
				var m = e.Mouse();
				curX = Math.max(0, Math.min(width, m.X - locX));
				curY = Math.max(0, Math.min(height, m.Y - locY));
				if (!timerZoom || timerZoom.Value == 1) ZoomImage();
			}
		}

		// zoom the image
		function ZoomImage(zoom) {
			var w, h;
			if (zoom) { w = Math.ceil(image[cImage].RealWidth * zoom); h = Math.ceil(image[cImage].RealHeight * zoom); }
			else { w = LB.img.width; h = LB.img.height; }

			// move to location
			LB.img.style.left = ( (1 - ((width - curX) / width)) * (width - w) ) + "px";
			LB.img.style.top = ( (1 - ((height - curY) / height)) * (height - h) ) + "px";

			// zoom
			if (zoom) { LB.img.width = w; LB.img.height = h; }
		}

		// change image opacity
		function ImageOpacity(o) { owl.Css.Opacity(LB.img, o); opacityImage = o; }

		// stop event
		function StopEvent(e) { if (e) { e.StopDefaultAction(); e.StopPropagation(); if (e.Element && e.Element.blur) e.Element.blur(); } }

	};

	// create the lightbox window
	owl.Lightbox.CreateWindow = function() {
		var lbw = owl.innerHTML(owl.Dom.Get("body"), owl.Lightbox.Config.WindowHTML, false);
		owl.Lightbox.CreateWindow = function() { return lbw; };
		return owl.Lightbox.CreateWindow();
	};

	/*	---------------------------------------------
		owl.Lightbox.Image
		--------------------------------------------- */
	owl.Lightbox.Image = function(node) {
		this.Node = node;
		this.Src = this.Node.href;
		this.Pic = null;
		this.RealWidth = 0; this.RealHeight = 0;
		this.Ratio = 1; this.Width = 0; this.Height = 0;
		this.Loading = false;
		this.LoadCallback = null;
		if (owl.Lightbox.Config.Preload.All) this.Load();
	};

	// load the image
	owl.Lightbox.Image.prototype.Load = function(callback) {

		// queue callbacks
		if (callback) {
			var CallbackQ = this.LoadCallback;
			if (CallbackQ) this.LoadCallback = function() { CallbackQ(); callback(); };
			else this.LoadCallback = callback;
		}

		// does image need caching?
		if (this.Pic === null) {
			if (!this.Loading) {
				this.Loading = true; var P = this;
				owl.Image.Load(this.Src, function(i) {
					P.Pic = i; P.Loading = false;
					P.RealWidth = i.width; P.RealHeight = i.height;
					if (P.LoadCallback) { P.LoadCallback(); P.LoadCallback = null; }
				});
			}
		}
		else if (this.LoadCallback) { this.LoadCallback(); this.LoadCallback = null; }
	};

	// calculate the new size of the image based on a maximum width and height
	owl.Lightbox.Image.prototype.Resize = function(maxWidth, maxHeight) {
		if (this.RealWidth > 0 && this.RealHeight > 0) {
			this.Ratio = Math.min(Math.min(maxWidth / this.RealWidth, 1), Math.min(maxHeight / this.RealHeight, 1));
			this.Width = Math.floor(this.RealWidth * this.Ratio); this.Height = Math.floor(this.RealHeight * this.Ratio);
		}
	};

	/* ---------------------------------------------
	owl.Lightbox.Config
	--------------------------------------------- */
	owl.Lightbox.Config = {
		AutoStart: true,
		Enabled: true,
		ShowInfo: true,
		Magnify: true,
		Throttle: 200,
		Container: {
			Element: ".lightbox",
			ActiveClass: "active"
		},
		Preload: {
			All: false,
			Next: false
		},
		Size: {
			Start: 40,
			Minimum: 200,
			WidthPad: 30,
			HeightPad: 50
		},
		Animation: {
			FramePause: 10,
			FadeStep: 5,
			SizeStep: 10,
			BarOpacity: 60,
			BarStep: 2,
			ZoomSteps: 20
		},
		WindowHTML: '<div id="lb_window"><div id="lb_image"><img tabindex="0" /><div id="lb_bar"><p></p><a id="lb_close" href="#" title="close"><strong>close</strong></a><a  id="lb_next" href="#" title="next image"><strong>next</strong></a><a id="lb_back" href="#" title="previous image"><strong>back</strong></a></div></div></div>'
	};

	// auto-start lightbox
	if (owl.Lightbox.Config.AutoStart) new owl.Event(window, "load", function (e) {
		owl.Each(owl.Dom.Get(owl.Lightbox.Config.Container.Element), function(n) { new owl.Lightbox(n); });
	}, 99999);

}