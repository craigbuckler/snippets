/*
DOM class (static), by Craig Buckler
Provides various DOM manipulation methods

Dependencies:
	misc.js
*/
var DOM = new function() {

	// common node types
	this.ElementNode = 1;
	this.AttributeNode = 2;
	this.TextNode = 3;
	this.CommentNode = 8;


	// DOM enabled browser?
	this.Enabled = (document.getElementById && document.getElementsByTagName);


	// locate an element by ID (starting at rootElement)
	this.Id = function(id, rootElement) {
		var element = null;
		if (this.Enabled) {
			if (typeof rootElement == 'string') rootElement = this.Id(rootElement);
			if (!rootElement) rootElement = document;
			element = rootElement.getElementById(String(id));
		}
		return element;
	}


	// return an array of elements identified by tag name (starting at rootElement)
	this.Tags = function(tag, rootElement) {
		var elements = new Array(0);
		if (this.Enabled) {
			if (typeof rootElement == 'string') rootElement = this.Id(rootElement);
			if (!rootElement) rootElement = document;
			elements = rootElement.getElementsByTagName(String(tag));
		}
		return elements;
	}


	// returns an array of elements using the class className (optionally specifying a tag type and rootElement)
	this.Class = function(className, tag, rootElement) {
		className = " "+className.Trim()+" ";
		var thisClass;
		var classNodes = new Array();
		var allNodes = (typeof tag == 'string' && tag.length > 0 ? this.Tags(tag, rootElement) : this.AllElements(rootElement));
		for (var i = 0; i < allNodes.length; i++) {
			thisClass = " "+allNodes[i].className+" ";
			if (thisClass.indexOf(className) >= 0) classNodes.push(allNodes[i]);
		}
		return classNodes;
	}


	// returns all tags (starting at rootElement)
	// replaces getElementsByTagName("*") which fails in IE5/5.5 and returns comments in IE6
	this.AllElements = function(rootElement) {
		var nl = new Array(0);
		if (this.Enabled) {
			var RecurseElements = function(element) {
				var cnodes = DOM.ChildElements(element);
				for (var i =0; i< cnodes.length; i++) {
					nl.push(cnodes[i]);
					RecurseElements(cnodes[i]);
				}
			}
			if (typeof rootElement == 'string') rootElement = this.Id(rootElement);
			if (!rootElement) rootElement = document;
			RecurseElements(rootElement);
		}
		return nl;
	}


	// returns array of child elements (ignores whitespace and comments)
	this.ChildElements = function(element) {
		var ce = new Array();
		if (typeof element == 'string') element = this.Id(element);
		if (element) {
			for (var i=0; i<element.childNodes.length; i++) {
				if (element.childNodes[i].nodeType == this.ElementNode && element.childNodes[i].nodeName != "!") ce.push(element.childNodes[i]);
			}
		}
		return ce;
	}


	// finds a child node of required type
	this.FindNodeType = function(element, ntype) {
		var found = null;
		if (typeof element == 'string') element = this.Id(element);
		if (element) {
			var thisNode;
			for (var i =0; i < element.childNodes.length && found == null; i++) {
				thisNode = element.childNodes[i];
				if (thisNode.nodeType == ntype) found = thisNode;
				else found = this.FindNodeType(thisNode, ntype);
			}
		}
		return found;
	}


	// find the value of the first text node found
	this.Text = function(element) {
		var text = "";
		if (typeof element == 'string') element = this.Id(element);
		if (element) {
			var tNode = this.FindNodeType(element, this.TextNode);
			if (tNode) text = tNode.nodeValue;
		}
		return text;
	}


	// changes a text node (will append one if necessary)
	this.SetText = function(element, text) {
		if (typeof element == 'string') element = this.Id(element);
		if (element) {
			var tNode = this.FindNodeType(element, this.TextNode);
			if (tNode) tNode.nodeValue = text;
			else element.appendChild(document.createTextNode(text));
		}
	}


	// copies (clones) children of fromNode to children of toNode
	this.Copy = function(fromNode, toNode) {
		if (typeof fromNode == 'string') fromNode = this.Id(fromNode);
		if (typeof toNode == 'string') toNode = this.Id(toNode);
		if (fromNode && toNode) {
			for (var i = 0; i < fromNode.childNodes.length; i++) toNode.appendChild(fromNode.childNodes[i].cloneNode(true));
		}
	}


	// removes all node children
	this.RemoveChildren = function(element) {
		if (typeof element == 'string') element = this.Id(element);
		if (element) while (element.lastChild) element.removeChild(element.lastChild);
	}


	// removes all ID attributes from a node and it's children
	this.RemoveID = function(element) {
		if (typeof element == 'string') element = this.Id(element);
		if (element.getAttribute("id")) element.removeAttribute('id');
		for (var i = 0; i < element.childNodes.length; i++) if (element.childNodes[i].nodeType == this.ElementNode) this.RemoveID(element.childNodes[i]);
		return element;
	}


	// find absolute x co-ordinate of element
	this.AbsoluteX = function(element) {
		var pos = 0;
		if (typeof element == 'string') element = this.Id(element);
		if (element && typeof element.offsetLeft != 'undefined') {
			pos = element.offsetLeft;
			while ((element = element.offsetParent)) pos += element.offsetLeft;
		}
		return pos;
	}


	// find absolute y co-ordinate of element
	this.AbsoluteY = function(element) {
		var pos = 0;
		if (typeof element == 'string') element = this.Id(element);
		if (element && typeof element.offsetTop != 'undefined') {
			pos = element.offsetTop;
			while ((element = element.offsetParent)) pos += element.offsetTop;
		}
		return pos;
	}
	
	
	// returns a DOM fragment generated from an object literal
	this.CreateFragment = function(ob, node) {

		var key, vtype, idk, cnode;

		for (key in ob) {
			if (typeof ob[key] != 'function') {
				vtype = typeof(ob[key]);
				idk = key.charAt(0);

				// child node
				if (vtype== 'object') {
					cnode = this.CreateFragment(ob[key], document.createElement(key));
					if (cnode) {
						if (node) node.appendChild(cnode);
						else node = cnode;
					}
				}

				// attribute node
				if (node && vtype == 'string' && idk != '#') {
					node.setAttribute(key, ob[key]);
					switch(key.toLowerCase()) {
						case 'class': node.className = ob[key]; break;
						case 'for': node.htmlFor = ob[key]; break;
					}
				}

				// text node
				if (node && vtype == 'string' && idk == '#') node.appendChild(document.createTextNode(ob[key]));
			}
		}
		return node;
	}


	// append an element to the HTML <head>
	this.HeadAppend = function(element) {
		var head = this.Tags("head");
		return (head.length == 1 ? head[0].appendChild(element) : null);
	}


	// remove an element from the HTML <head>
	this.HeadRemove = function(element) {
		var head = this.Tags("head");
		return (head.length == 1 ? head[0].removeChild(element) : null);
	}


	// load another JS file
	this.LoadJS = function(file) {
		var jsfrag = document.createElement("script");
		jsfrag.setAttribute("type", "text/javascript");
		jsfrag.setAttribute("src", file);
		return this.HeadAppend(jsfrag);
	}


	// load another CSS file
	this.LoadCSS = function(file) {
		var cssfrag = document.createElement("link");
		cssfrag.setAttribute("type", "text/css");
		cssfrag.setAttribute("rel", "stylesheet");
		cssfrag.setAttribute("media", "screen");
		cssfrag.setAttribute("href", file);
		return this.HeadAppend(cssfrag);
	}
}