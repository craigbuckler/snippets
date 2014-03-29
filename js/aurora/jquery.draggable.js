/*!
 * jQuery draggable element plugin
 * http://optimalworks.net/
 * Copyright 2011, Craig Buckler
 */

(function($) {

	$.fn.draggable = function(opts) {

		// default configuration
		var config = $.extend({}, {
			minX: -999999,		// minimum X movement
			maxX: +999999,		// maximum X movement
			minY: -999999,		// minimim Y movement
			maxY: +999999,		// maximum Y movement
			horz: true,		// horizontal movement permitted
			vert: true,		// vertical movement permitted
			onStart: null,		// drag start event
			onDrag: null,		// drag event
			onDrop: null		// drop event
		}, opts);

		var target = null, start = null;
		this.mousedown(DragStart);

		// start dragging
		function DragStart(e) {
			e.preventDefault();
			if (!target) {
				target = e.target;
				$(target).css({ position: "relative", zIndex: "99999" });
				start = {
					left: e.pageX - target.style.left.replace(/px/, ''),
					top: e.pageY - target.style.top.replace(/px/, '')
				};
				if (config.onStart) config.onStart(target);
				$(window).on({ mousemove: Dragging, mouseup: DragEnd });
			}
		}
		
		// dragging
		function Dragging(e) {
			e.preventDefault();
			if (config.horz) target.style.left = Math.min(Math.max(config.minX, e.pageX - start.left), config.maxX) + "px";
			if (config.vert) target.style.top = Math.min(Math.max(config.minY, e.pageY - start.top), config.maxY) + "px";
			if (config.onDrag) config.onDrag(target);
		}
		
		// end dragging
		function DragEnd(e) {
			e.preventDefault();
			if (config.onDrop) config.onDrop(target);
			target = start = null;
			$(window).off({ mousemove: Dragging, mouseup: DragEnd });
		}
		
		return this;
	};

})(jQuery);