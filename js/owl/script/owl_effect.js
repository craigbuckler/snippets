/*	---------------------------------------------

	owl.Effect

	--------------------------------------------- */
if (owl && owl.Css && owl.Event && owl.Timer && !owl.Effect) owl.Effect = function() {

	// default configuration
	var Config = {
		Timer: {
			FadeHover: "fhtimer",
			ShowHide: "shtimer",
			Fade: "ftimer",
			Height: "htimer"
		},
		Frame: {
			Start: 0,
			End: 100,
			Step: 10,
			Pause: 10
		},
		FadeHover: {
			Min: 50
		},
		Height: {
			ScrollVert: true,
			ScrollHorz: false,
			OuterCollapse: true,
			OuterProperty: "econtainers"
		}
	};

	// animation types
	var Type = {
		
		// fade
		Fade: function(element, t) { owl.Css.Opacity(element, t.Value); },
	
		// height collapse/expand
		Height: function(element, t) {
			var $C = Config.Height, inner = element.firstChild, c = 0;
			while (inner.nodeType != 1 && c < element.childNodes.length) { c++; inner = element.childNodes[c] };
			if (inner.nodeType == 1) {
				var v = t.Value/100, ow = inner.offsetWidth, oh = inner.offsetHeight, owO = 0, ohO = 0;
				if ($C.ScrollHorz) { var owN = Math.round(ow * v); owO = owN - element.offsetWidth; element.style.width = owN+"px"; }
				if ($C.ScrollVert) { var ohN = Math.round(oh * v); ohO = ohN - element.offsetHeight; element.style.height = ohN+"px"; }
				
				// collapse/expand ancestor containers
				if ($C.OuterCollapse && (owO != 0 || ohO != 0)) {
					
					// find outer container nodes
					var cNodes = owl.Property.Get(element, $C.OuterProperty);
					if (!cNodes) {
						cNodes = [];
						var e = element;
						while (e.parentNode) {
							e = e.parentNode;
							if (owl.Css.ClassExists(e, owl.Container.Config.Class)) owl.Array.Push(cNodes, e);
						}
						owl.Property.Set(element, $C.OuterProperty, cNodes);
					}
					
					// handle heights
					owl.Each(cNodes, function(e) {
						if (e.offsetWidth + owO >= 0) e.style.width = (e.offsetWidth + owO) + "px";
						if (e.offsetHeight + ohO >= 0) e.style.height = (e.offsetHeight + ohO) + "px";
					});
					
				}
				
				if (t.Value == 0 && t.StopValue == 0) element.style.display = "none";
			}
		}
	
	};
	
	// timers
	var timer = [];

	// assign a new timer to an element using the tp name
	function timerNew(element, tp, start, stop, step, pause, startDelay, stopDelay, callback) {
		var i = owl.Property.Get(element, tp);
		if (i == null) i = timer.length;
		owl.Property.Set(element, tp, i);
		timer[i] = new owl.Timer(start, stop, step, pause, startDelay, stopDelay, callback);
		return timer[i];
	}

	// fetch the timer assigned to an element with the name tp
	function timerFetch(element, tp) {
		var ret = null;
		var i = owl.Property.Get(element, tp);
		if (i !== null) ret = timer[i];
		return ret;
	}

	// deletes the element timer with the name tp
	function timerDelete(element, tp) {
		var i = owl.Property.Get(element, tp);
		if (i !== null) {
			timer[i] = null;
			owl.Property.Delete(element, tp);
			delete timer[i];
		}
	}
	
	// runs an animation timer
	function timerStart(element, tp, start, stop, animation, callback) {
	
		if (animation) owl.Each(owl.Array.Make(element), function(e) {

			var t = timerFetch(e, tp);

			if (t != null) {
				// reverse existing timer
				if (start != t.StartValue) t.Reverse();
			}
			else {
				// new timer for element
				t = timerNew(e, tp, start, stop, Config.Frame.Step * (start < stop ? 1 : -1), Config.Frame.Pause);
				t.CallBack = function(t) { owl.Each(owl.Array.Make(animation), function(a) { if (typeof a == "function") a(e, t); }); };
				e.style.display = "block";
			}

			t.OnStop = function(t) {
				timerDelete(e, tp);
				if (callback) callback();
			};
			t.Start();

		});
	
	}

	// fades element in and out on hover
	function FadeHover(element) {
		owl.Each(owl.Array.Make(element), function(e) {
			timerNew(e, Config.Timer.FadeHover, Config.Frame.End, Config.FadeHover.Min, -Config.Frame.Step, Config.Frame.Pause, 0, 0, function(t) { owl.Css.Opacity(e, t.Value); });
		});
		new owl.Event(element, "mouseover", FadeHoverEffect);
		new owl.Event(element, "mouseout", FadeHoverEffect);
	}

	// fade in/out
	function FadeHoverEffect(e) {
		var t = timerFetch(e.Element, Config.Timer.FadeHover);
		if (t !== null) {
			var dir = (e.Type.indexOf("over") >= 0 ? 1 : -1);
			if (dir != owl.Number.Sign(t.GetStep())) { t.Reverse(); t.Start(); }
		}
	}

	// show elements
	function StartShow(element, timerID, animList, callback) { timerStart(element, timerID, Config.Frame.Start, Config.Frame.End, animList, callback); }
	
	// hide elements
	function StartHide(element, timerID, animList, callback) { timerStart(element, timerID, Config.Frame.End, Config.Frame.Start, animList, callback); }
	
	// generic show and hide (pass array of animation functions)
	function Show(element, animList, callback) { StartShow(element, Config.Timer.ShowHide, animList, callback); }
	function Hide(element, animList, callback) { StartHide(element, Config.Timer.ShowHide, animList, callback); }
	
	// fade in and out
	function FadeIn(element, callback) { StartShow(element, Config.Timer.Fade, Type.Fade, callback); }
	function FadeOut(element, callback) { StartHide(element, Config.Timer.Fade, Type.Fade, callback); }
	
	// collapse/expand an element
	function Expand(element, callback) { StartShow(element, Config.Timer.Height, Type.Height, callback); }
	function Collapse(element, callback) { StartHide(element, Config.Timer.Height, Type.Height, callback); }

	// public methods
	return {
		Config: Config,
		Type: Type,
		FadeHover: FadeHover,
		Show: Show,
		Hide: Hide,
		FadeIn: FadeIn,
		FadeOut: FadeOut,
		Expand: Expand,
		Collapse: Collapse
	};

}();