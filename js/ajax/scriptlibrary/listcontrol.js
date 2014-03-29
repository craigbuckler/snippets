/*
ListControl class, By Craig Buckler
Allows lists to be reordered

Dependencies:
	misc.js
	events.js
	dom.js
	graphic.js
	dragdrop.js
*/
new Event(window, "load", ListControlSetup);

// check lists in page 
function ListControlSetup() {
	var list = DOM.Class("listcontrol", "ol").concat(DOM.Class("listcontrol", "ul"));
	for (var i = 0; i < list.length; i++) new ListControl(list[i]);
}


// ListControl class
function ListControl(list, OnChangeEvent) {

	this.List = (typeof list == "string" ? DOM.Id(list) : list); // this list element
	if (this.List && this.List.getAttribute("listcontrol") != "true") {

		// initialise
		this.List.setAttribute("listcontrol", "true");

		// public properties
		this.ID = this.List.id;
		this.OnChange = (typeof OnChangeEvent == "function" ? OnChangeEvent : false);
		this.DragOpacity = 50;
		this.DragStyle = null;
		this.SlideOn = true;
		this.SlideTime = 300;

		// private properties
		var LC = this; // reference to this object
		this.BackX = null;
		this.BackY = null;
		this.Item = new Array();
		this.ItemClone = new Array();
		this.Slot = new Array();
		this.SlotOffsetX = 0;
		this.SlotOffsetY = 0;
		this.ItemMoved = null;
		this.ItemStop = null;
		var PositionCheckDelay = 2000; // interval (ms) to check if list control has moved
	
		// find children and clone
		var i;
		var lchild = DOM.ChildElements(this.List);
		for (i = 0; i < lchild.length; i++) {

			// define list item
			this.Item[i] = { element: lchild[i], dd: null, slot: i };
	
			// clone list item (remove any IDs)
			this.ItemClone[i] = this.List.appendChild(DOM.RemoveID(this.Item[i].element.cloneNode(true)));
			this.ItemClone[i].style.visibility = "hidden";
	
			// make draggable
			this.Item[i].dd = new DragDrop(this.Item[i].element); // dragdrop control
		}
	
		// move to starting positions and restrict movement to line
		this.PositionCheck();
	
		// add movement handlers
		for (i = 0; i < this.Item.length; i++) {
	
			// find item being moved
			this.Item[i].dd.EventStart = function(dd) {
				LC.ItemMoved = null;
				for (var i = 0; i < LC.Item.length && LC.ItemMoved == null; i++) if (dd == LC.Item[i].dd) LC.ItemMoved = i;
				if (LC.DragStyle) Graphic.ClassApply(LC.Item[LC.ItemMoved].element, LC.DragStyle);
			}
	
			// find new slot and rearrange
			this.Item[i].dd.EventMove = function(dd) {
				if (LC.ItemMoved != null && dd == LC.Item[LC.ItemMoved].dd) {
					var i;
					var overslot = -1;
					for (i = LC.Slot.length-1; i >= 0 && overslot < 0; i--) if ((dd.PosX+LC.SlotOffsetX) >= LC.Slot[i].posX && (dd.PosY+LC.SlotOffsetY) >= LC.Slot[i].posY) overslot = i;
		
					if (overslot >= 0 && LC.Item[LC.ItemMoved].slot != overslot) {
						var dir = (LC.Item[LC.ItemMoved].slot < overslot ? 1 : -1);
						var ss = (dir > 0 ? LC.Item[LC.ItemMoved].slot+dir : overslot); // first slot to move
						var se = (dir > 0 ? overslot : LC.Item[LC.ItemMoved].slot+dir); // last slot to move
						for (i = 0; i < LC.Item.length; i++) {
							if (LC.Item[i].slot >= ss && LC.Item[i].slot <= se) {
								LC.Item[i].slot -= dir;
								LC.Item[i].dd.MoveTo(LC.Slot[LC.Item[i].slot].posX, LC.Slot[LC.Item[i].slot].posY, LC.SlideOn);
							}
						}
						LC.Item[LC.ItemMoved].slot = overslot;
						if (typeof LC.OnChange == 'function') LC.OnChange(LC); // run onchange event (pass this)
					}
				}
			}
	
			// stop movement
			this.Item[i].dd.EventStop = function(dd) {
				if (LC.ItemMoved != null && dd == LC.Item[LC.ItemMoved].dd && LC.ItemStop == null) {
					LC.ItemStop = LC.Item[LC.ItemMoved].slot
					dd.MoveTo(LC.Slot[LC.ItemStop].posX, LC.Slot[LC.ItemStop].posY, LC.SlideOn);
					if (LC.DragStyle) Graphic.ClassRemove(LC.Item[LC.ItemMoved].element, LC.DragStyle);
					LC.ItemStop = null;
					LC.ItemMoved = null;
				}
			}
	
		}
	
		// position checking timer
		this.CheckTimer = setInterval(function() { LC.PositionCheck(); }, PositionCheckDelay);
	
		// cleanup event
		new Event(window, "unload", function(evt) { LC.CleanUp(); });
	}

}


// check list position
ListControl.prototype.PositionCheck = function(reset) {

	// list dimensions
	var bX = DOM.AbsoluteX(this.List);
	var bY = DOM.AbsoluteY(this.List);

	// update item locations if necessary
	if (typeof reset != 'undefined' || bX != this.BackX || bY != this.BackY) {

		if (this.ItemMoved == null) { this.BackX = bX; this.BackY = bY; }
		else { this.BackX = null; this.BackY = null; }

		var i, sox, soy;
		var minX = -1; var maxX = -1; this.SlotOffsetX = 0;
		var minY = -1; var maxY = -1; this.SlotOffsetY = 0;
		
		// find slot locations
		for (i = 0; i < this.ItemClone.length; i++) {
			this.Slot[i] = { posX: DOM.AbsoluteX(this.ItemClone[i]), posY: DOM.AbsoluteY(this.ItemClone[i]) }; // find slot positions

			minX = (minX < 0 ? this.Slot[i].posX : Math.min(minX, this.Slot[i].posX)); // x minimum
			maxX = Math.max(minX, this.Slot[i].posX); // x maximum
			minY = (minY < 0 ? this.Slot[i].posY : Math.min(minY, this.Slot[i].posY)); // y minimum
			maxY = Math.max(minY, this.Slot[i].posY); // y maximum

			if (i > 0) {
				// find slot offset - movement permitted before slotting into place
				sox = Math.floor((this.Slot[i].posX - this.Slot[i-1].posX) / 2);
				if (sox < this.SlotOffsetX || this.SlotOffsetX == 0) this.SlotOffsetX = sox;
				soy = Math.floor((this.Slot[i].posY - this.Slot[i-1].posY) / 2);
				if (soy < this.SlotOffsetY || this.SlotOffsetY == 0) this.SlotOffsetY = soy;
			}
		}

		// move all list items
		for (i = 0; i < this.Item.length; i++) {
			this.Item[i].dd.RemoveRestrictions();
			this.Item[i].dd.MoveTo(this.Slot[this.Item[i].slot].posX, this.Slot[this.Item[i].slot].posY, false); // move to correct position
			this.Item[i].dd.AddRestriction(new DragLine(minX, minY, maxX, maxY)); // restrict to line
			this.Item[i].dd.DragOpacity = this.DragOpacity;
			this.Item[i].dd.ReturnTime = this.SlideTime;
		}

	}

}


// set initial order - returns true if valid
ListControl.prototype.SetOrder = function(slotarray) {
	// check validity of array
	var i;
	var valid = 0;
	if (slotarray) for (i = 0; i < slotarray.length; i++) valid = (valid | Math.pow(2, slotarray[i]));
	valid = (valid == (Math.pow(2, this.Item.length)-1));

	if (valid)  {
		for (i = 0; i < this.Item.length; i++) this.Item[i].slot = slotarray[i]; // update order
		this.PositionCheck(true);
		if (typeof this.OnChange == 'function') this.OnChange(this); // run onchange event (pass this)
	}
	return valid;
}


// return an array of item positions (zero based)
ListControl.prototype.Order = function() {
	var ret = new Array();
	for (var i = 0; i < this.Item.length; i++) ret[i] = this.Item[i].slot;
	return ret;
}


// clean up
ListControl.prototype.CleanUp = function() {
	clearInterval(this.CheckTimer);
	for (var i = 0; i < this.Item.length; i++) this.Item[i].dd = null;
}