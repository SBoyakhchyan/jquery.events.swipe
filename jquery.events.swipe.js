/**
 * jquery.events.swipe v1.0.0 by Andr�s Zs�g�n
 * jQuery Plugin to obtain horizontal touch gestures from Android, iOS, Windows Phone
 * http://github.com/andreszs/jquery.events.swipe
 * License: MIT
 * ------------
 * Based on https://github.com/patrickhlauke/touch and https://github.com/marcandre/detect_swipe
 */

(function(factory) {
	if(typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if(typeof exports === 'object') {
		// Node/CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function($) {

	// Check if Pointer Events are available -
	if(window.PointerEvent) {
		// IE11+ Chrome55+ (https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
		var touchstart = 'pointerdown';
		var touchmove = 'pointermove';
		var touchend = 'pointerup';
		var touchcancel = 'pointercancel';
	} else if(window.MSPointerEvent) {
		// IE10 (https://msdn.microsoft.com/en-us/library/hh772103%28v=vs.85%29.aspx?f=255&MSPPError=-2147217396)
		var touchstart = 'MSPointerDown';
		var touchmove = 'MSPointerMove';
		var touchend = 'MSPointerUp';
		var touchcancel = 'MSPointerCancel';
	} else {
		// WebKit Legacy (https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
		var touchstart = 'touchstart';
		var touchmove = 'touchmove';
		var touchend = 'touchend';
		var touchcancel = 'touchcancel';
	}

	var start = {};
	var end = {};
	var thresholdTime = 500; /* max scroll time (ms) */
	var thresholdDistance = 64; /* scroll threshold (px) */
	var debug = false;

	function gestureStart(e) {
		if(debug) console.info(e.type);
		if(typeof e.isPrimary !== 'undefined' && e.isPrimary === false) {
			// Filter out non-primary touches - https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/isPrimary
			return;
		} else if(typeof e.touches !== 'undefined' && e.touches.length > 1) {
			// Ignore multi-touch
			return
		} else {
			// Hack - would normally use e.timeStamp but it's whack in Fx/Android
			start.t = new Date().getTime();
			if(typeof e.touches !== 'undefined') {
				// TouchEvents
				start.x = e.touches[0].pageX;
				start.y = e.touches[0].pageY;
			} else if(typeof e.pageX !== 'undefined') {
				// PointerEvents
				start.x = e.pageX;
				start.y = e.pageY;
			}
			end.x = start.x;
			end.y = start.y;
		}
		// Add event listeners
		this.addEventListener(touchmove, gestureMove, false);
		this.addEventListener(touchend, gestureEnd, false);
		this.addEventListener(touchcancel, gestureCancel, false);  /* auto-fired: https://developer.mozilla.org/en-US/docs/Web/Events/pointercancel */
	}

	function gestureMove(e) {
		if(debug) console.info(e.type);
		if(typeof e.touches !== 'undefined') {
			// TouchEvents
			end.x = e.touches[0].pageX;
			end.y = e.touches[0].pageY;
		} else if(typeof e.pageX !== 'undefined') {
			// PointerEvents
			end.x = e.pageX;
			end.y = e.pageY;
		}

		var now = new Date().getTime();
		var deltaTime = now - start.t;
		var deltaX = end.x - start.x;
		var deltaY = end.y - start.y;

		// Prevent default handling if scroll started as horizontal (before touchcancel is fired)
		if(deltaTime > thresholdTime) {
			// Gesture timed out
			removeEvents(this);
		} else if((deltaX > thresholdDistance) && (Math.abs(deltaY) < thresholdDistance)) {
			// Swiped right
			if(debug) console.info('swiperight');
			$(this).trigger('swipe', 'right').trigger('swiperight');
			removeEvents(this);
		} else if((-deltaX > thresholdDistance) && (Math.abs(deltaY) < thresholdDistance)) {
			// Swiped left
			if(debug) console.info('swipeleft');
			$(this).trigger('swipe', 'left').trigger('swipeleft');
			removeEvents(this);
		} else if(Math.abs(deltaX) > 16 && Math.abs(deltaX) > Math.abs(deltaY)) {
			// Started as horizontal swipe: Prevent default and keep tracking
			if(debug) console.log('Horizontal swipe started');
			e.preventDefault();
		} else if(Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
			// Started as vertical swipe: Forget about this gesture
			if(debug) console.log('Vertical swipe started');
			removeEvents(this);
		}
	}

	function gestureEnd(e) {
		if(debug) console.info(e.type);
		removeEvents(this);
	}

	function gestureCancel(e) {
		if(debug) console.info(e.type);
		removeEvents(this);
	}

	function removeEvents(obj) {
		obj.removeEventListener(touchmove, gestureMove);
		obj.removeEventListener(touchend, gestureEnd);
		obj.removeEventListener(touchcancel, gestureEnd);
	}

	function setup() {
		this.addEventListener(touchstart, gestureStart, false);
	}

	$.event.special.swipe = { setup: setup };

	$.each(['left', 'right'], function() {
		$.event.special['swipe' + this] = {
			setup: function() {
				$(this).on('swipe', $.noop);
			}
		};
	});
}));
