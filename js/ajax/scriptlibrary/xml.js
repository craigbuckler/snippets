/*
XML class (static), by Craig Buckler
Provides various XML manipulation methods

Dependencies:
	none
*/
var XML = new function() {

	// common node types
	this.ElementNode = 1;
	this.AttributeNode = 2;
	this.TextNode = 3;
	this.CommentNode = 8;


	// create a new XML document
	this.New = function() {
		var xml = null;
		if (document.implementation && document.implementation.createDocument) {
			try { xml = document.implementation.createDocument("", "xml", null); }
			catch(e) {}
		}
		else {
			var ieDOM = [ "MSXML4.DOMDocument", "MSXML3.DOMDocument", "MSXML2.DOMDocument", "MSXML.DOMDocument", "Microsoft.XMLDOM"];
			for (var i = 0; i < ieDOM.length && !xml; i++) {
				try { xml = new ActiveXObject(ieDOM[i]); }
				catch(e) {}
			}
		}
		return xml;
	}


	// transform XML using XSL
	this.Transform = function() {
		var trans = null;
		if (window.XSLTProcessor) {
			try {
				var xslp = new XSLTProcessor();
				xslp.importStylesheet(xsl);
				trans = xslp.transformToDocument(xml, document);
			}
			catch(e) {}
		}
		else {
			try {
				trans = this.New();
				trans.loadXML( xml.transformNode(xsl) );
			}
			catch(e) {}
		}

		if (trans.documentElement.childNodes.length == 0) trans = null;
		return trans;
	}


	// copies the children of addNode (in an XML document) to the children of docNode (DOM, XML document, etc.)
	this.Copy = function(addNode, docNode, level) {

		if (typeof level == "undefined") level = 1;

		// create node
		if (addNode.nodeType == this.ElementNode && level != 1) {

			var i;
			var thisNode = document.createElement(addNode.nodeName);

			// append attributes
			for (i = 0; i < addNode.attributes.length; i++) {
				if (addNode.attributes[i].name == "class") thisNode.className = addNode.attributes[i].value; // class attribute fails in IE
				else thisNode.setAttribute(addNode.attributes[i].name, addNode.attributes[i].value);
			}

			// add node to document
			docNode = docNode.appendChild(thisNode);
		}

		// append text node (ensure it is not a comment)
		if (addNode.nodeType == this.TextNode && addNode.nodeValue && level != 1) {
			var nval = addNode.nodeValue.Trim();
			if (nval.indexOf("<!--") != 0 && nval.indexOf("-->") != (nval.length - 3)) docNode.appendChild(document.createTextNode(nval));
		}

		// recurse child nodes
		for (i = 0; i < addNode.childNodes.length; i++) this.Copy(addNode.childNodes[i], docNode, level+1);

		// return document
		return docNode;
	}


	// removes all node children
	this.RemoveChildren = function(node) {
		while (node.lastChild) node.removeChild(node.lastChild);
	}

}