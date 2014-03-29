/*
SliderControl class, By Craig Buckler
Creates a slider control given a background to slider over, a form element 
to bind to, and a function to call when the slider control value changes.

Dependencies:
	misc.js
	events.js
	dom.js
	graphic.js
	dragdrop.js
	localisation.js
	validatorsupport.js
	validator.js
*/
function SliderControl(SliderBack, BindFormElement, OnChangeEvent) {

	// element to slide on
	this.SliderBack = (typeof SliderBack == "string" ? DOM.Id(SliderBack) : SliderBack);

	// bound form element
	this.FormElement = (BindFormElement && BindFormElement.Min != null && BindFormElement .Max != null ? BindFormElement : false);

	// initialise slider
	if (this.SliderBack && this.FormElement) {

		// this object
		var sc = this;

		// default properties
		this.ID = this.SliderBack.id;
		this.Started = false;
		this.ReportingFunction = ValidationReport;
		this.ValidValue = this.FormElement.Value;
		this.OriginalValue = null;
		this.SliderHorz = (this.SliderBack.offsetWidth >= this.SliderBack.offsetHeight); // true if a horizontal slider
		this.SlideOn = true; // slide into place

		this.WiggleOn = true; // wiggle functionality
		this.WiggleDelay = 2000; // delay to wiggle
		this.WiggleMovement = 11; // movement in pixels (should be an odd number)
		this.WiggleFrames = 35; // number of wiggle animation frames
		this.WigglePause = 50; // pause in ms between wiggle frames

		var PositionCheckDelay = 2000; // interval (ms) to check if slider background has moved

		// minumum and maximum actual values
		this.ValueMin = this.FormElement.Min;
		this.ValueMax = this.FormElement.Max;

		// on change event
		this.OnChange = (typeof OnChangeEvent == "function" ? OnChangeEvent : false);
	
		// define slider element
		var slider = document.createElement("div");

		if (this.SliderHorz) slider.className = "sliderH"; // horizontal slider
		else slider.className = "sliderV"; // vertical slider
	
		// add slider to DOM and find dimensions
		this.Slider = this.SliderBack.parentNode.appendChild(slider);
	
		// make slider dragable
		this.dd = new DragDrop(this.Slider);

		// bind to form element
		this.dd.EventStart = function() { sc.PositionCheck(); }
		this.dd.EventMove = function() { sc.UpdateFormElement(); };

		// update slider if input changes
		new Event(this.FormElement.InputNode, "blur", function() { sc.UpdateSlider(); });

		// background click event
		new Event(this.SliderBack, "click", function(evt) { sc.PositionCheck(); sc.dd.UserMoved = true; sc.dd.MoveTo(evt.Raised.MouseX -(sc.Slider.offsetWidth/2), evt.Raised.MouseY-(sc.Slider.offsetHeight/2), sc.SlideOn); });

		// position slider
		this.BackX = null;
		this.BackY = null;
		this.BackW = null;
		this.BackH = null;
		this.PositionCheck();

		// wiggle timer
		if (this.WiggleOn) setTimeout(function() { sc.Wiggle(); }, this.WiggleDelay);

		// position checking timer
		this.CheckTimer = setInterval(function() { sc.PositionCheck(); }, PositionCheckDelay);

		// cleanup event
		new Event(window, "unload", function(evt) { sc.CleanUp(); });
	}
}


// check slider position
SliderControl.prototype.PositionCheck = function() {

	// slider background dimensions
	var bX = DOM.AbsoluteX(this.SliderBack);
	var bY = DOM.AbsoluteY(this.SliderBack);
	var bW = this.SliderBack.offsetWidth;
	var bH = this.SliderBack.offsetHeight;

	// background has moved
	if (bX != this.BackX || bY != this.BackY || bW != this.BackW || bH != this.BackH) {
		this.BackX = bX; this.BackY = bY; this.BackW = bW; this.BackH = bH;
		this.PositionSlider(); // change slider position
	}
}


// positions the slider in the correct location
SliderControl.prototype.PositionSlider = function() {

	// find slider dimensions
	var sw = this.Slider.offsetWidth;
	var sh = this.Slider.offsetHeight;

	// define slider limits and return value (0 to 1)
	var Xmin, Ymin, Xmax, Ymax, range;
	if (this.SliderHorz) {
		Xmin = this.BackX;
		Ymin = this.BackY+(this.BackH/2)-(sh/2);
		Xmax = this.BackX+this.BackW-sw;
		Ymax = Ymin;
		range = Xmax - Xmin;
		this.Value = function() { return (this.dd.PosX - Xmin) / range; };
		this.Xupdate = function(newValue) { return Math.round((newValue * range) + Xmin); };
		this.Yupdate = function(newValue) { return Ymin; }
	}
	else {
		Xmin = this.BackX+(this.BackW/2)-(sw/2);
		Ymin = this.BackY+this.BackH-sh;
		Xmax = Xmin;
		Ymax = this.BackY;
		range = Ymax - Ymin;
		this.Value = function() { return (this.dd.PosY - Ymin) / range; };
		this.Xupdate = function(newValue) { return Xmin; };
		this.Yupdate = function(newValue) { return Math.round((newValue * range) + Ymin); }
	}

	// restrict movement to a line
	this.dd.RemoveRestrictions();
	this.dd.AddRestriction(new DragLine(Xmin, Ymin, Xmax, Ymax));

	// form element rounding
	this.RoundTo = this.FindRoundingFactor(range);

	// move to starting position
	this.UpdateSlider();
	if (!this.Started && this.SlideOn) {
		var sxpos = this.dd.PosX;
		var sypos = this.dd.PosY;
		this.dd.MoveTo(Xmin, Ymin, false);
		this.dd.MoveTo(sxpos, sypos, true);
	}

	// slider has been started
	this.Started = true;
}


// find nearest rounding factor
SliderControl.prototype.FindRoundingFactor = function(range) {
	var factors = [10, 5, 2, 1];
	var ret = 0;
	var rr = Math.abs((this.ValueMax - this.ValueMin) / range);
	var pwr = 0;
	var ps, pe, i, f;
	do {
		ps = Math.pow(10, pwr);
		pe = Math.pow(10, pwr+1);
		if (rr < ps) pwr--;
		if (rr > pe) pwr++;
	} while (rr < ps || rr > pe);
	for (i = 0; i < factors.length; i++) {
		f = ps * factors[i];
		if (rr <= f) ret = f;
	}
	return ret;
}


// update bound field
SliderControl.prototype.UpdateFormElement = function() {
	var v = (this.Value() * (this.ValueMax - this.ValueMin)) + this.ValueMin;
	if (v > this.ValueMin && v < this.ValueMax) v = Math.round(v / this.RoundTo) * this.RoundTo; // rounding
	this.FormElement.UpdateField(this.FormElement.FormatValue(v));

	// update valid value and call change event (passing this object)
	if (this.ValidValue != this.FormElement.Value) {
		this.ValidValue = this.FormElement.Value;
		if (this.OnChange) this.OnChange(this);
	}
}


// update slider from bound field
SliderControl.prototype.UpdateSlider = function() {
	this.FormElement.EventType = "blur";
	this.FormElement.Validate();
	if (!this.FormElement.Valid) this.FormElement.UpdateField(this.ValidValue);
	else {
		// update last valid value
		if (this.ValidValue != this.FormElement.Value) {
			this.ValidValue = this.FormElement.Value;
			this.dd.UserMoved = true;
			if (this.OnChange) this.OnChange(this);
		}
	}

	// update value
	var newValue = (this.ValidValue.toNumber() - this.ValueMin) / (this.ValueMax - this.ValueMin);
	this.dd.MoveTo(this.Xupdate(newValue), this.Yupdate(newValue), false);
	if (this.ReportingFunction) this.ReportingFunction(this.FormElement);
}


// slider wiggle
SliderControl.prototype.Wiggle = function(frame) {
	if (this.WiggleOn && !this.dd.UserMoved) {

		if (this.OriginalValue == null) this.OriginalValue = this.ValidValue;

		var wdiv = Math.floor(this.WiggleMovement / 2);
		if (typeof frame == 'undefined') frame = wdiv;
		frame++;
		var moveby = (frame % this.WiggleMovement) - wdiv;
	
		if ((frame > this.WiggleFrames && moveby == 0) || this.ValidValue != this.OriginalValue) {
			// finish wiggling
			this.OriginalValue = null;
			// this.FormElement.UpdateField(this.ValidValue);
			this.UpdateSlider();
		}
		else {
			// animate
			this.dd.MoveTo(this.dd.PosX+moveby, this.dd.PosY+moveby, false);
			var sc = this;
			setTimeout(function() { sc.Wiggle(frame); }, this.WigglePause);
		}
	}
}


// clean up
SliderControl.prototype.CleanUp = function() {
	clearInterval(this.CheckTimer);
	this.dd = null;
}