/*
Popup handler, by Craig Buckler
Adds icons to links and handles popup windows.

Dependencies:
	misc.js
	dom.js
	events.js
	graphic.js
*/
var Popup = function() {};

// node classes (can be applied to <a> or parent nodes)
Popup.ClassAlways = "popupalways"; // if set, always popup
Popup.ClassIconOn = "popupicon"; // if set, always show icon
Popup.ClassIconOff = "popupiconoff"; // if set, never show an icon
Popup.ClassSize = "popupsize"; // define window size, e.g. "popupsize800x600"
Popup.ClassNoTools = "popupnotools"; // if set, hide the toolbars

Popup.UserChoiceCookie = "popupchoice"; // user choice cookie name
Popup.UserChoicePeriod = 10080; // store user's choices for one week
Popup.UserConfirmMessage = "do you want to open this LINKTYPE\nand other LINKGROUP in a new window?"; // confirm popup

Popup.DownloadHandler = "downloads/downloadhandler.php?file="; // generic download handler


// initialise
Popup.Initialise = function() {

	// define all popup handlers (identifier, baseclass, subclass, linktype, linkgroup, handler, popupallowed, isbitmap)
	var PHandlers = [

		// images
		new PopupHandlerFileType("jpg", "image", null, "JPEG image", "images", null, true, true),
		new PopupHandlerFileType("jpeg", "image", null, "JPEG image", "images", null, true, true),
		new PopupHandlerFileType("gif", "image", null, "GIF image", "images", null, true, true),
		new PopupHandlerFileType("png", "image", null, "PNG image", "images", null, true, true),
		new PopupHandlerFileType("bmp", "image", null, "BMP image", "images", null, true, true),
		new PopupHandlerFileType("svg", "image", null, "SVG image", "images", null, true, false),

		// sound media
		new PopupHandlerFileType("mp3", "sound", null, "MP3 audio", "sound files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("wav", "sound", null, "WAV audio", "sound files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("wma", "sound", null, "WMA audio", "sound files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("ogg", "sound", null, "OGG audio", "sound files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("mid", "sound", null, "MIDI audio", "sound files", Popup.DownloadHandler, false, false),

		// video media
		new PopupHandlerFileType("mpg", "video", null, "MPG video", "video files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("mpeg", "video", null, "MPG video", "video files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("avi", "video", null, " AVI video", "video files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("wmv", "video", null, "WMV video", "video files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("mov", "video", null, "Quicktime video", "video files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("qt", "video", null, "Quicktime video", "video files", Popup.DownloadHandler, false, false),

		// documents
		new PopupHandlerFileType("txt", "document", null, "text document", "documents", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("rtf", "document", null, "rich text document", "documents", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("pdf", "document", "pdf", "PDF document", "documents", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("doc", "document", "doc", "Microsoft Word document", "documents", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("xls", "document", "xls", "Microsoft Excel document", "documents", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("ppt", "document", "ppt", "Microsoft PowerPoint document", "documents", Popup.DownloadHandler, false, false),

		// applications
		new PopupHandlerFileType("exe", "application", null, "application", "downloaded files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("msi", "application", null, "installer", "downloaded files", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("iso", "application", null, "disk image", "downloaded files", Popup.DownloadHandler, false, false),

		// archives
		new PopupHandlerFileType("zip", "archive", null, "ZIP file", "archives", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("tar", "archive", null, "TAR file", "archives", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("gz", "archive", null, "GZ file", "archives", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("rar", "archive", null, "RAR file", "archives", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("lha", "archive", null, "LHA file", "archives", Popup.DownloadHandler, false, false),
		new PopupHandlerFileType("jar", "archive", null, "JAR file", "archives", Popup.DownloadHandler, false, false),

		// string checks
		new PopupHandlerLinkString("mailto:", "email", null, "email", "email links", null, false, false),
		new PopupHandlerLinkString("feed:", "feed", null, "feed", "feed links", null, false, false),

		// external sites
		new PopupHandlerExternal(null, "website", null, "website", "external sites", null, true, false)
	];


	// analyse all page links
	var allLinks = DOM.Tags("a");
	var modified;
	for (var i = 0; i < allLinks.length; i++) {
		modified = false;
		//alert(allLinks[i].href);
		for (var j = 0; j < PHandlers.length && !modified; j++) {
			modified = PHandlers[j].Modify(allLinks[i]);
		}
	}

}


// ________________________________________________________
// defines a file extension handler
function PopupHandlerFileType(id, baseclass, subclass, linktype, linkgroup, handler, popupallowed, isbitmap) {
	this.Constructor = PopupConstructor;
	this.IconRequired = PopupIconRequired;
	this.OnSite = PopupOnSite;
	this.Modify = PopupModify;
	this.Constructor(id, baseclass, subclass, linktype, linkgroup, handler, popupallowed, isbitmap);
}


// checks a node to see if it matches this type
PopupHandlerFileType.prototype.NodeCheck = function(aNode) {
	var ext = "";
	if (aNode.nodeName.toLowerCase() == "a") {
		ext = aNode.href;
		var exte = ext.indexOf("?");
		if (exte < 0) exte = ext.length;
		var exts = ext.lastIndexOf(".", exte)+1;
		ext = ext.substring(exts, exte).toLowerCase();
	}
	return (ext == this.ID);
}


// ________________________________________________________
// defines an external link handler
function PopupHandlerExternal(id, baseclass, subclass, linktype, linkgroup, handler, popupallowed, isbitmap) {
	this.Constructor = PopupConstructor;
	this.IconRequired = PopupIconRequired;
	this.OnSite = PopupOnSite;
	this.Modify = PopupModify;
	this.Constructor("EXTERNAL", baseclass, subclass, linktype, linkgroup, handler, popupallowed, false);
}

// checks a node to see if it matches this type
PopupHandlerExternal.prototype.NodeCheck = function(aNode) {
	return !this.OnSite(aNode);
}


// ________________________________________________________
// defines a link contains string handler
function PopupHandlerLinkString(id, baseclass, subclass, linktype, linkgroup, handler, popupallowed, isbitmap) {
	this.Constructor = PopupConstructor;
	this.IconRequired = PopupIconRequired;
	this.OnSite = PopupOnSite;
	this.Modify = PopupModify;
	this.Constructor(id, baseclass, subclass, linktype, linkgroup, handler, popupallowed, false);
}

// checks a node to see if it matches this type
PopupHandlerLinkString.prototype.NodeCheck = function(aNode) {
	return (aNode.href.indexOf(this.ID) >= 0);
}


// ________________________________________________________
// shared methods

// define properties
function PopupConstructor(id, baseclass, subclass, linktype, linkgroup, handler, popupallowed, isbitmap) {
	this.ID = (typeof id == 'string' ? id.toLowerCase() : null);
	this.BaseClass = (typeof baseclass == 'string' ? baseclass : null);
	this.SubClass = (typeof subclass == 'string' ? subclass : null);
	this.LinkType = (typeof linktype == 'string' ? linktype : null);
	this.LinkGroup = (typeof linkgroup == 'string' ? linkgroup : null);
	this.Handler = (typeof handler == 'string' ? handler : null);
	this.PopupAllowed = (popupallowed == true);
	this.IsBitmap = (isbitmap == true);
}


// should popup icon be applied?
function PopupIconRequired(aNode) {
	var ret = null;
	var thisClass;
	var iter = 0;

	// examine class of node and all parents
	var tNode = aNode;
	do {
		thisClass = " "+tNode.className.toLowerCase()+" ";
		if (thisClass.indexOf(" "+Popup.ClassIconOff+" ") >= 0) ret = false;
		if (thisClass.indexOf(" "+Popup.ClassIconOn+" ") >= 0) ret = true;
		tNode = tNode.parentNode;
		iter++;
	} while (ret == null && tNode && tNode.nodeType == DOM.ElementNode);

	// ensure that there are no img children
	if (ret == null || (ret && iter > 1)) {
		var cNodes = DOM.AllElements(aNode);
		for (var i = 0; i < cNodes.length && ret !== false; i++) if (cNodes[i].nodeName.toLowerCase() == "img") ret = false;
	}

	return (ret !== false);
}


// is link to somewhere on this site?
function PopupOnSite(aNode) {
	var href = aNode.href.toLowerCase();
	var loc = href.indexOf("://"+window.location.host.toLowerCase());
	return ((loc > 0 && loc < 10) || href.length == 0);
}


// modify a node for popup handling
function PopupModify(aNode) {
	var ret = this.NodeCheck(aNode); // node modification required
	if (ret) {

		// change link
		aNode.href = (this.Handler && this.OnSite(aNode) ? this.Handler : "")+aNode.href;

		// apply title
		if (aNode.title == "") aNode.title = this.LinkType;

		// apply icon classes
		if (this.IconRequired(aNode)) {
			if (this.BaseClass) Graphic.ClassApply(aNode, this.BaseClass);
			if (this.SubClass) Graphic.ClassApply(aNode, this.SubClass);
		}

		// attach popup event
		if (this.PopupAllowed) {

			// apply LinkGroup attribute
			aNode.baseclass = this.BaseClass;

			// apply confirmation message attribute
			aNode.confmsg = Popup.UserConfirmMessage.replace(new RegExp("LINKTYPE", "gi"), this.LinkType).replace(new RegExp("LINKGROUP", "gi"), this.LinkGroup);

			// apply bitmap attribute
			aNode.bitmap = (this.IsBitmap ? "true" : "false");

			// attach event
			new Event(aNode, "click", PopupClicked);
		}

	}
	return ret;
}


// ________________________________________________________
// popup click handler
function PopupClicked(evt) {

	var popup = false;

	// find link element
	var element = false;
	var node = evt.Raised.Element;
	do {
		if (node.nodeName.toLowerCase() == "a") element = node;
		else node = node.parentNode;
	} while (!element && node.nodeType == DOM.ElementNode);

	// should popup be used?
	if (element && element.baseclass && element.confmsg && element.bitmap) {

		// popup request defined in class
		var thisClass = " "+element.className+" ";
		popup = (thisClass.indexOf(" "+Popup.ClassAlways+" ") >= 0);

		// user preference handling
		if (!popup && CookiesEnabled()) {

			// load user choices from cookie
			var UserChoice = [];
			UserChoice.LoadAll(Popup.UserChoiceCookie);

			if (UserChoice.Exists(element.baseclass)) popup = UserChoice[element.baseclass]; // preference in cookie
			else {
				// ask for decision and save cookie
				popup = window.confirm(element.confmsg);
				UserChoice[element.baseclass] = popup;
				UserChoice.StoreAll(Popup.UserChoiceCookie, Popup.UserChoicePeriod);
			}
		}

		// open popup
		if (popup) {
			popup = (popup && PopupWindow(element));
			if (popup) evt.Raised.StopDefaultAction(); // cancel event
		}

	}

	return !popup;
}


// show popup window
function PopupWindow(element) {

	// screen size
	var scnWidth = (screen.availWidth ? screen.availWidth : 640);
	var scnHeight = (screen.availHeight ? screen.availHeight : 480);

	// find window dimensions and location
	var bitmap = (element.bitmap == "true");
	var winWidth = 0; var winHeight = 0;
	var winPosX = 0; var winPosY = 0;
	var thisClass = " "+element.className+" ";
	var notools = bitmap || (thisClass.indexOf(" "+Popup.ClassNoTools+" ") >= 0);

	// has window size been defined by author?
	var winAuthDef = false;
	var ws = thisClass.indexOf(" "+Popup.ClassSize);
	if (ws >= 0) {
		var wdef = thisClass.substring(ws+10, thisClass.indexOf(" ", ws+1)).toLowerCase();
		var wdim = wdef.split("x", 2);
		if (wdim.length == 2) {
			winWidth = wdim[0].toInt();
			winHeight = wdim[1].toInt();
			if (winWidth > 0 && winHeight > 0) winAuthDef = true;
		}
	}

	// set standard window size for images (if not defined)
	if (bitmap) {
		if (winWidth == 0) winWidth = scnWidth-60;
		if (winHeight == 0) winHeight = scnHeight-100;
	}

	// set position
	if (winWidth < scnWidth) winPosX = Math.floor((scnWidth - winWidth) / 2);
	if (winHeight < scnHeight) winPosY = Math.floor((scnHeight - winHeight) / 2);

	// define settings
	var winSettings = (winWidth > 0 && winHeight > 0 ? "width=" +winWidth+  ",height=" +winHeight+ ",left=" +winPosX+ ",top=" +winPosY : "");
	if (notools) winSettings += (winSettings != "" ? "," : "")+ "location=0,directories=0,menubar=0,toolbar=0,status=0,scrollbars=1,resizable=1";

	// open window
	var win = window.open(element.href, "", winSettings);
	win.focus();

	// handle image window resize
	if (bitmap && !winAuthDef) {
		var cImage = new Image;
		cImage.src = element.href;
		if (cImage.complete) PopupResizeImage(win, cImage);
		else new Event(cImage, "load", function(evt) { evt.Detach(); PopupResizeImage(win, cImage); });
	}
	
	// return window
	return win;
}


// resize an image window
function PopupResizeImage(win, cImage) {

	// image size
	var imgWidth = cImage.width+50;
	var imgHeight = cImage.height+70;

	// screen size
	var scnWidth = (screen.availWidth ? screen.availWidth : 640);
	var scnHeight = (screen.availHeight ? screen.availHeight : 480);

	// resize and reposition
	if (scnWidth > imgWidth && scnHeight > imgHeight) {
		win.resizeTo(imgWidth, imgHeight);
		win.moveTo(Math.floor((scnWidth-imgWidth)/2), Math.floor((scnHeight-imgHeight)/2));
	}
}


// ________________________________________________________
// start popup functionality
new Event(window, "load", Popup.Initialise);