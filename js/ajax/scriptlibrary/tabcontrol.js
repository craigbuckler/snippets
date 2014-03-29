/*
TabControl class, By Craig Buckler
Creates a tab set with bound form elements, such as validated forms.

Dependencies:
	misc.js
	events.js
	dom.js
	graphic.js
*/
new Event(window, "load", TabControlSetup);

// applies a TabControl to a list with a class of 'tabcontrol'
function TabControlSetup() {
	var list = DOM.Class("tabcontrol", "ol").concat(DOM.Class("tabcontrol", "ul"));
	for (var i = 0; i < list.length; i++) new TabControl(list[i]);
}


// TabControl class
function TabControl(tabset) {

	this.TabSet = (typeof tabset == "string" ? DOM.Id(tabset) : tabset); // this list element
	if (this.TabSet && this.TabSet.getAttribute("tabcontrol") != "true") {

		// initialise
		this.TabSet.setAttribute("tabcontrol", "true");
		this.ID = this.TabSet.id;

		// apply tabcontrol class to list
		Graphic.ClassApply(this.TabSet, "tabcontrol");

		// find all tab links
		this.DefineTabs();

		// tab content height
		this.ContentHeight = null;

		// activate first tab
		this.ActiveTab = null;
		this.NextTab = null;
		if (this.Tabs.length > 0) this.ActivateTab(0 , true);
	}

}


// define all TabItems
TabControl.prototype.DefineTabs = function() {

	var thisTabControl = this;
	this.Tabs = [];
	var i, p, TabID, TabContentID, TabContentElement, tabitem;

	var tabs = DOM.Tags("a", this.TabSet); // all links in tabset
	for (i = 0; i < tabs.length; i++) {

		TabID = (tabs[i].id ? tabs[i].id : null); // tab ID

		TabContentID = tabs[i].getAttribute("href"); // linked content ID
		if (TabContentID) {
			p = TabContentID.lastIndexOf("#");
			if (p >= 0) TabContentID = TabContentID.substring(p+1);
			TabContentElement = DOM.Id(TabContentID); // linked content element

			if (TabContentElement) {
				// add to this.Tabs array
				tabitem = this.Tabs.length;
				this.Tabs[tabitem] = new TabItem(tabitem, TabID, tabs[i], DOM.Text(tabs[i]), TabContentID, TabContentElement);

				// apply tabcontent style to content item and switch off
				Graphic.ClassApply(TabContentElement, "tabcontent");
				TabContentElement.style.display = "none";

				// tab click event
				new Event(this.Tabs[tabitem].Element, "click", function(evt) { thisTabControl.TabClicked(evt); });
			}
		}
	}

}


// find a tab by number, ID name, or element
TabControl.prototype.FindTab = function(identifier) {
	var i = 0;
	var tab = null;
	do {
		if (i === identifier || this.Tabs[i].ID === identifier || this.Tabs[i].Element === identifier || this.Tabs[i].Text === identifier) tab = i; else i++;
	} while (tab == null && i < this.Tabs.length);
	return tab;
}


// handle a tab click
TabControl.prototype.TabClicked = function(evt) {
	if (evt) {
		evt.Raised.StopDefaultAction();
		if (evt.Raised.Element.blur) evt.Raised.Element.blur();
		this.ActivateTab(evt.Raised.Element);
	}
}


// set an active tab (can override TabOff event result)
TabControl.prototype.ActivateTab = function(identifier, override) {
	this.NextTab = this.FindTab(identifier); // locate tab
	if (this.NextTab != null && this.NextTab != this.ActiveTab) {

		// run TabOff function (pass current TabItem object)
		var offret = true;
		if (this.ActiveTab != null) {
			if (typeof this.Tabs[this.ActiveTab].EventOff == 'function') offret = (this.Tabs[this.ActiveTab].EventOff(this) !== false);
		}
		if (offret || override) {

			// switch off old tab
			if (this.ActiveTab != null) {
				Graphic.ClassRemove(this.Tabs[this.ActiveTab].Element, "active");
				this.Tabs[this.ActiveTab].ContentElement.style.display = "none";
			}

			// switch on new tab
			this.ActiveTab = this.NextTab;
			this.NextTab = null;
			Graphic.ClassApply(this.Tabs[this.ActiveTab].Element, "active");
			this.Tabs[this.ActiveTab].ContentElement.style.display = "block";
			if (this.ContentHeight) this.Tabs[this.ActiveTab].ContentElement.style.height = this.ContentHeight;

			// run TabOn function (pass current TabItem object)
			if (typeof this.Tabs[this.ActiveTab].EventOn == 'function') this.Tabs[this.ActiveTab].EventOn(this);
		}
	}
}


// apply an event when a tab is hidden (must not return false to switch tabs)
TabControl.prototype.EventHide = function(identifier, eventFunction) {
	var tab = this.FindTab(identifier);
	if (tab != null && typeof eventFunction == 'function') this.Tabs[tab].EventOff = eventFunction;
}


// apply an event when a tab is shown
TabControl.prototype.EventShow = function(identifier, eventFunction) {
	var tab = this.FindTab(identifier);
	if (tab != null && typeof eventFunction == 'function') this.Tabs[tab].EventOn = eventFunction;
}


// TabItem class: information about an individual tab
function TabItem(number, id, element, text, contentid, contentelement) {
	this.Number = number;
	this.ID = id;
	this.Element = element;
	this.Text = text;
	this.ContentID = contentid;
	this.ContentElement = contentelement;
	this.EventOff = null;
	this.EventOn = null;
}