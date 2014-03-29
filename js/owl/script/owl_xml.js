/*	---------------------------------------------

	owl.Xml

	--------------------------------------------- */
if (owl && !owl.Xml) owl.Xml = function() {

	// node types
	var ElementNode = 1;
	var AttributeNode = 2;
	var TextNode = 3;
	var CommentNode = 8;


	// create a new empty XML document
	function New() {
		var xml = null;
		if (document.implementation && document.implementation.createDocument) xml = document.implementation.createDocument("", "xml", null);
		else {
			// IE XML
			owl.Each(
				["MSXML2.DOMDocument", "MSXML.DOMDocument", "Microsoft.XMLDOM"],
				function(dom) { try { xml = new ActiveXObject(dom); } catch(e) {}; return !!xml; }
			);
		}
		return xml;
	}


	// create an XML document from a string
	function Load(str) {
		var xml = null;
		if (!str) xml = New();
		else {
			if (typeof DOMParser != "undefined") xml = (new DOMParser()).parseFromString(str, "application/xml");
			else { xml = New(); if (xml) xml.loadXML(str); }
		}
		return xml;
	}
	
	
	// create node event (private)
	function AddEvent(node, evt, fn) { node[evt] = function() { return eval(fn); }; }


	// copy XML node children to DOM node
	function Copy(xmlDoc, domNode, level) {

		if (typeof level == "undefined") level = 1;
		if (level > 1) {

			if (xmlDoc.nodeType == 1) {
				// element node
				var thisNode = document.createElement(xmlDoc.nodeName);

				// attributes
				var handler = {};
				for (var a = 0, attr = xmlDoc.attributes.length; a < attr; a++) {
					var aName = xmlDoc.attributes[a].name, aValue = xmlDoc.attributes[a].value, evt = (aName.substr(0,2) == "on");
					if (evt) handler[aName] = aValue;
					else {
						switch (aName) {
							case "class": thisNode.className = aValue; break;
							case "for": thisNode.htmlFor = aValue; break;
							default: thisNode.setAttribute(aName, aValue); break;
						}
					}
				}

				// append node
				domNode = domNode.appendChild(thisNode);
				
				// attach events
				for (evt in handler) AddEvent(domNode, evt, handler[evt]);
				
			}
			else if (xmlDoc.nodeType == 3) {
				// text node
				var text = (xmlDoc.nodeValue ? xmlDoc.nodeValue : "");
				var test = owl.String.Trim(text);
				if (test.length < 7 || (test.indexOf("<!--") != 0 && test.indexOf("-->") != (test.length - 3))) domNode.appendChild(document.createTextNode(text));
			}
		}

		// recurse child nodes
		for (var i = 0; i < xmlDoc.childNodes.length; i++) Copy(xmlDoc.childNodes[i], domNode, level+1);
		
		// return last child added
		return (domNode.lastChild ? domNode.lastChild : domNode);
	}


	// transform XML using XSL
	function Transform(xml, xsl) {
		var trans = null;
		if (window.XSLTProcessor) {
			try {
				var xslp = new XSLTProcessor();
				xslp.importStylesheet(xsl);
				trans = xslp.transformToDocument(xml, document);
			} catch(e) {};
		}
		else {
			try {
				trans = this.New();
				trans.loadXML( xml.transformNode(xsl) );
			} catch(e) {};
		}
		return (trans && trans.documentElement && trans.documentElement.childNodes.length ? trans : null);
	}


	return {
		ElementNode: ElementNode,
		AttributeNode: AttributeNode,
		TextNode: TextNode,
		CommentNode: CommentNode,
		New: New,
		Load: Load,
		Copy: Copy,
		Transform: Transform
	};

}();