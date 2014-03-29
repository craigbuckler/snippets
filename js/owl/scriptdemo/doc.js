// Documentation
var doc = {};

doc.Expand = function() {

	var DocState = "docstate";
	var Index = "Index";
	var Collapsed = "Collapsed";

	var State = owl.Cookie.Restore(DocState);
	if (!State) State = [];
	
	// initialise
	function Init() {
		var titles = owl.Dom.Get("h2, h3");
		owl.Each(titles, function(t, i) {
			owl.Property.Set(t, Index, i);
			new owl.Event(t, "click", Collapse);
			if (typeof(State[i]) == 'undefined' || State[i] !== false) Collapse(t);
		});

	}

	// collapse/expand
	function Collapse(e) {
		if (e && e.Element) e = e.Element;
		var c = !owl.Property.Get(e, Collapsed);
		owl.Property.Set(e, Collapsed, c);
		owl.Each(owl.Dom.Descendents(e.parentNode, 1), function(n, i) { n.style.display = (c && i > 0 ? "none" : "block"); });
		State[owl.Property.Get(e, Index)] = c;
		owl.Cookie.Store(DocState, State);
	}

	return {
		Init: Init
	};

}();


// startup event
new owl.Event(window, "load", doc.Expand.Init);