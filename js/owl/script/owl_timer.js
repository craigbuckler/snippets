/*	---------------------------------------------

	owl.Timer

	--------------------------------------------- */
if (owl && !owl.Timer) {

	// define a timer
	owl.Timer = function(start, stop, step, pause, startPause, stopPause, callback) {

		var timer = null, Inc = (step || step == 0 ? step : (start < stop ? 1 : -1));
		var timerDelay = (pause ? pause : 20), startDelay = (startPause ? startPause : 0), stopDelay = (stopPause ? stopPause : 0);

		// public properties
		this.StartValue = (start ? start : 0);
		this.StopValue = (stop || stop == 0 ? stop : 100);
		this.Value = this.StartValue;
		this.CallBack = (callback ? callback : null);
		this.OnStart = null;
		this.OnStop = null;
		this.OnReverse = null;
		var abort = false;
		var T = this;

		// set step: starts/stops timer and reverses if necessary
		this.SetStep = function(newInc) {
			if (newInc == 0) { this.Stop(); Inc = 0; }
			else {
				if ((newInc < 0 && this.StartValue < this.StopValue) || (newInc > 0 && this.StartValue > this.StopValue)) {
					Inc = -newInc;
					this.Reverse();
				}
				else Inc = newInc;
				this.Start();
			}
		};
		
		// returns the step value
		this.GetStep = function() { return Inc; };

		// start timer
		this.Start = function() {
			if (!timer) {
				abort = false;
				var tFunc = function(start) {
					if (!abort) {
						if (start) { if (T.OnStart) T.OnStart(T); if (T.CallBack) T.CallBack(T); }
						timer = setInterval( function() { T.Run(); }, timerDelay );
					}
				};
				var s = (this.Value == this.StartValue);
				if (s && startDelay > 0) setTimeout( function() { tFunc(s); }, startDelay ); else tFunc(s);
			}
		};

		// run timer
		this.Run = function() {
			this.Value += Inc;
			this.Value = ( Inc > 0 ? Math.min(this.Value, this.StopValue) : Math.max(this.Value, this.StopValue) );
			if (this.CallBack) this.CallBack(this);
			if (this.Value == this.StopValue) this.Stop();
		};

		// reverse timer
		this.Reverse = function() {
			var sv = this.StartValue;
			this.StartValue = this.StopValue;
			this.StopValue = sv;
			Inc = -Inc;
			if (this.OnReverse) this.OnReverse(this);
		};

		// stop timer
		this.Stop = function() {
			abort = true;
			if (timer) {
				timer = clearInterval(timer);
				if (this.Value == this.StopValue) setTimeout(function() { if (T.OnStop) T.OnStop(T); }, stopDelay);
			}
		};

		// start immediately if callback defined
		if (this.CallBack) this.Start();
	};

}