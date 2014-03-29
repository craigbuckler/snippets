/*	---------------------------------------------

	owl.Effect

	--------------------------------------------- */
if (owl && owl.Css && owl.Event && owl.Timer && !owl.Effect) owl.Effect = function() {

	// default configuration
	var Config = {
		Timer: {
			FadeHover: "fhtimer",
			FadeInOut: "shtimer",
			CollaspeExpand: "cetimer"
		},
		Frame: {
			Start: 0,
			End: 100,
			Step: 3,
			Pause: 10
		},
		Fade: {
			Min: 50
		},
		CollaspeExpand: {
			ScrollVert: true,
			ScrollHorz: false,
			FixTop: false,
			FixLeft: false
		},
		Container: {
			Element: "div",
			Class: "econtainer",
			InnerClass: "econtained"
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
				t.CallBack = function(t) { animation(e, t); };
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
			timerNew(e, Config.Timer.FadeHover, Config.Frame.End, Config.Fade.Min, -Config.Frame.Step, Config.Frame.Pause, 0, 0, function(t) { owl.Css.Opacity(e, t.Value); });
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

	// fade in and out
	function FadeIn(element, callback) { timerStart(element, Config.Timer.FadeInOut, Config.Frame.Start, Config.Frame.End, Fade, callback); }
	function FadeOut(element, callback) { timerStart(element, Config.Timer.FadeInOut, Config.Frame.End, Config.Frame.Start, Fade, callback); }
	function Fade(element, t) { owl.Css.Opacity(element, t.Value); }
	
	// collapse/expand an element
	function Expand(element, callback) { return CEinitialise(element, Config.Frame.Start, Config.Frame.End, callback); }
	function Collapse(element, callback) { return CEinitialise(element, Config.Frame.End, Config.Frame.Start, callback); }

	// initialise collapse/expand
	function CEinitialise(element, start, stop, callback) {
		element = FixContainer(element, Config.CollaspeExpand.FixTop, Config.CollaspeExpand.FixLeft);
		timerStart(element, Config.Timer.CollaspeExpand, start, stop, CEanimate, callback);
		return element;
	}
	
	// collapse/expand animation
	function CEanimate(element, t) {
		var inner = element.firstChild;
		var v = t.Value/100;
		if (Config.CollaspeExpand.ScrollHorz) element.style.width = Math.round(inner.offsetWidth * v)+"px";
		if (Config.CollaspeExpand.ScrollVert) element.style.height = Math.round(inner.offsetHeight * v)+"px";
		if (t.Value == 0 && t.StopValue == 0) element.style.display = "none";
	}
	
	
	// returns containers with fixed inner sections
	function FixContainer(element, fixtop, fixleft) {
		element = CreateContainer(element);		
		owl.Each(element, function(e) {
			e = e.firstChild;
			e.style.top = (fixtop ? "0px" : "auto");
			e.style.bottom = (fixtop ? "auto" : "0px");
			e.style.left = (fixleft ? "0px" : "auto");
			e.style.right = (fixleft ? "auto" : "0px");
		});
		return element;
	}
	
	// create container elements (and return in an array)
	function CreateContainer(element) {
		var container = [];
		
		owl.Each(owl.Array.Make(element), function(e, i) {
			var cont = (owl.Css.ClassExists(e, Config.Container.Class) ? e : e.parentNode);
			if (!owl.Css.ClassExists(cont, Config.Container.Class)) {
			
				// find child index
				var cnum = 0;
				var n = e;
				while ((n = n.previousSibling)) cnum++;
			
				// create container node
				var cnode = document.createElement(Config.Container.Element);
				cnode.className = Config.Container.Class;
				cnode.appendChild(e.cloneNode(true));
				cont.replaceChild(cnode, e);
				
				// find container and element in DOM
				cont = cont.childNodes[cnum];
				e = cont.firstChild;
				
				// modify position
				if (owl.Css.ComputedStyle(e, "position") == "absolute") {
					cont.style.position = "absolute";
					cont.style.top = owl.Css.ComputedStyle(e, "top");
					cont.style.bottom = owl.Css.ComputedStyle(e, "bottom");
					cont.style.left = owl.Css.ComputedStyle(e, "left");
					cont.style.right = owl.Css.ComputedStyle(e, "right");
				}
				
				// modify dimensions
				cont.style.width = e.offsetWidth+"px";
				cont.style.height = e.offsetHeight+"px";
				cont.style.marginLeft = owl.Css.ComputedStyle(e, "margin-left");
				cont.style.marginRight = owl.Css.ComputedStyle(e, "margin-right");
				cont.style.marginTop = owl.Css.ComputedStyle(e, "margin-top");
				cont.style.marginBottom = owl.Css.ComputedStyle(e, "margin-bottom");
				
				// remove inner classes
				owl.Css.ClassApply(e, Config.Container.InnerClass);
			}
			
			// add container to returned nodes
			container[container.length] = cont;
		});
		
		return container;
	}

	// public methods
	return {
		Config: Config,
		FadeHover: FadeHover,
		FadeIn: FadeIn,
		FadeOut: FadeOut,
		Expand: Expand,
		Collapse: Collapse
	};

}();