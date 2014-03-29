/*	---------------------------------------------

	owl.ScrollControl

	--------------------------------------------- */
if (owl && owl.Dom && owl.Event && !owl.ScrollControl) {

	// scroll control object
	owl.ScrollControl = function(node) {

		// ensure not already defined
		var $C = owl.ScrollControl.Config;
		if (owl.Css.ClassExists(node, $C.ActiveClass)) return;
		owl.Css.ClassApply(node, $C.ActiveClass);

		// find up/down buttons
		this.Node = node;

		this.Up = owl.Dom.Get("#"+node.id+$C.UpID);
		this.Up = (this.Up.length == 1 ? this.Up[0] : null);
		this.Down = owl.Dom.Get("#"+node.id+$C.DownID);
		this.Down = (this.Down.length == 1 ? this.Down[0] : null);

		// scroll animation properties
		this.Timer = null;
		this.Move = 0;
		this.Dir = 0;

		// up/down events
		var S = this;
		var event = ($C.ScrollOnClick ? ['mousedown', 'mouseup', 'keydown', 'keyup'] : ['mouseover', 'mouseout', 'focus', 'blur']);
		owl.Array.Push(event, "click");
		owl.Each(event, function(e) {
			if (S.Up) new owl.Event(S.Up, e, function(evt) { S.Hander(evt); });
			if (S.Down) new owl.Event(S.Down, e, function(evt) { S.Hander(evt); });
		});

		// is scrolling required now?
		this.Check();

		// periodically check if scrolling is required
		var sCheck = setInterval(function() { S.Check(); }, $C.Check);
		new owl.Event(window, "unload", function() { clearInterval(sCheck); sCheck = null; });
	};


	// is scroll button required?
	owl.ScrollControl.prototype.Check = function() {

		var $C = owl.ScrollControl.Config;
		var active = $C.ActiveClass;
		var s = this.Node.scrollHeight, h = this.Node.offsetHeight, t = this.Node.scrollTop;
		var ms = s - h;

		if (ms <= 0) {
			// scrolling not required
			if (this.Up) owl.Css.ClassRemove(this.Up, active);
			if (this.Down) owl.Css.ClassRemove(this.Down, active);
			if (t > 0) this.Node.scrollTop = 0;
			this.CancelTimer();
		}
		else {

			if (t >= ms) this.Node.scrollTop = ms;

			// handle scrolling
			if (this.Move != 0 || this.Dir != 0) {

				var dir = this.Dir;
				if (dir == 0 && this.Move != 0) dir = (this.Move > 0 ?  -1 : 1);
				if (this.Move == 0) this.Move = dir * $C.Animate.MinMove;
				else this.Move += (dir * $C.Animate.IncMove);

				if (this.Dir == 0 && this.Move >= -$C.Animate.MinMove && this.Move <= $C.Animate.MinMove) this.CancelTimer();
				this.Move = Math.max(-$C.Animate.MaxMove, Math.min(this.Move, $C.Animate.MaxMove));

				this.Node.scrollTop += (this.Dir < 0 ? Math.ceil(this.Move) : Math.floor(this.Move));
				t = this.Node.scrollTop;
			}

			// cancel movement
			if ((this.Dir < 1 && t == 0) || (this.Dir > 0 && t >= ms)) this.CancelTimer();

			// up button required?
			if (this.Up) {
				var upA = owl.Css.ClassExists(this.Up, active);
				if (t == 0) { if (upA) owl.Css.ClassRemove(this.Up, active); }
				else { if (!upA) owl.Css.ClassApply(this.Up, active); }
			}

			// down button required?
			if (this.Down) {
				var dnA = owl.Css.ClassExists(this.Down, active);
				if (t >= ms) { if (dnA) owl.Css.ClassRemove(this.Down, active); }
				else { if (!dnA) owl.Css.ClassApply(this.Down, active); }
			}
		}
	};


	// cancel scroll timer
	owl.ScrollControl.prototype.CancelTimer = function() {
		this.Dir = 0;
		this.Move = 0;
		if (this.Timer) {
			clearInterval(this.Timer);
			this.Timer = null;
		}
	};


	// event handler
	owl.ScrollControl.prototype.Hander = function(evt) {

		evt.StopDefaultAction();
		if (evt.Type != "click") {
			this.Dir = (evt.Type.indexOf("up") > 0 || evt.Type.indexOf("out") > 0 || evt.Type == "blur" ? 0 : (evt.Element == this.Up ? -1 : 1));
			var S = this;
			if (!this.Timer) this.Timer = setInterval(function() { S.Check(); }, owl.ScrollControl.Config.Animate.Delay);
		}

	};


	/* ---------------------------------------------
	owl.ScrollControl.Config
	--------------------------------------------- */
	owl.ScrollControl.Config = {
		AutoStart: true,
		Element: ".scrollcontrol",
		UpID: "_up",
		DownID: "_down",
		ActiveClass: "active",
		ScrollOnClick: true,
		Check: 1500,
		Animate: {
			IncMove: 0.4,
			MinMove: 1,
			MaxMove: 15,
			Delay: 25
		}
	};

	// auto-start scroll controls
	if (owl.ScrollControl.Config.AutoStart) new owl.Event(window, "load", function (e) {
		owl.Each(owl.Dom.Get(owl.ScrollControl.Config.Element), function(n) { new owl.ScrollControl(n); });
	}, 99999);

}