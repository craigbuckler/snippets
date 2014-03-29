/*	---------------------------------------------

	owl.Dom

	--------------------------------------------- */
if (owl && owl.Css && !owl.Dom && document.getElementById && document.getElementsByTagName) owl.Dom = function() {

	// node types
	var ElementNode = 1;
	var AttributeNode = 2;
	var TextNode = 3;
	var CommentNode = 8;

	// regular expressions
	var CSSclean = /[^\w|\s|\-|#|\.|,|\[|\]|=|~|!|*]/g;
	var CSSwhitespace = /\s+/g;
	var reTag = /^[^#|\.|\[]*/;
	var reID = /#[^#|\.|\[]+/;
	var reClass = /\.[^#|\.|\[]+/;
	var reAttribute = /\[(.+)\]/;
	var reAttrExp = /([~|!|*]*=)/;
	var reAttrName = /(^[^=|~|!|*])+/;

	// array defaults
	var $A = owl.Array, doc = [document];

	// find a node collection
	function Get(css, nodes) {

		nodes = $A.Make(nodes, doc);
		css = owl.String.Trim(String(css).replace(CSSclean, "").replace(CSSwhitespace, " "));
		var allNodes = [], args = css.split(","), arg, exp, a, al, e, el;

		// all arguments
		for (a = 0, al = args.length; a < al; a++) {
			arg = owl.String.Trim(args[a]);
			var sNodes = nodes.slice();

			// all argument elements
			exp = arg.split(" ");
			for (e = 0, el = exp.length; e < el; e++) if (nodes.length > 0) sNodes = parseGet(exp[e], sNodes);
			owl.Each(sNodes, function(s) { $A.Push(allNodes, s); });
		}

		return allNodes;
	}

	// parse Get expression
	function parseGet(exp, nodes) {

		var nCollect = [], subnodes, tempnodes, n, nl, s, sl, t, tl;
		var nType = { Tag: '', ID: '', Class: '', AttribCheck: function() { return true; } };
		nType.Tag = reTag.exec(exp); nType.Tag = (nType.Tag ? nType.Tag[0].toLowerCase() : '*'); if (nType.Tag == "") nType.Tag = "*";
		nType.ID = reID.exec(exp); nType.ID = (nType.ID ? nType.ID[0].substr(1) : '');
		nType.Class = reClass.exec(exp); nType.Class = (nType.Class ? nType.Class[0].substr(1) : '');

		// attributes
		var attr = reAttribute.exec(exp);
		if (attr) {
			attr = attr[1];
			var aName, aValue = null, aExp = reAttrExp.exec(attr);
			aExp = (aExp ? aExp[1] : null);
			if (aExp) {
				var p = attr.indexOf(aExp);
				aName = attr.substr(0, p);
				aValue = attr.substr(p+aExp.length);
			}
			else aName = attr;

			nType.AttribCheck = function(node) {
				var a;
				switch (aName) {
					case "class": a = node.className; break;
					case "for": a = node.htmlFor; break;
					default: a = node.getAttribute(aName); break;
				}
				a = (a ? a : "");
				return (
					(a == '' && (!aExp || aExp == '!=')) || (!aExp || (
						(aExp == '=' && a == aValue) ||
						(aExp == '!=' && a != aValue) ||
						(aExp == '*=' && a.indexOf(aValue) >= 0) ||
						(aExp == '~=' && (" "+a+" ").indexOf(" "+aValue+" ") >= 0)
					))
				);
			};
		}

		// do all roots
		for (n = 0, nl = nodes.length; n < nl; n++) {

			subnodes = [];

			// ID passed
			if (nType.ID) {
				tempnodes = document.getElementById(nType.ID);
				if (tempnodes && (nType.Tag == '*' || tempnodes.nodeName.toLowerCase() == nType.Tag) && (!nType.Class || owl.Css.ClassExists(tempnodes, nType.Class)) && nType.AttribCheck(tempnodes) ) subnodes[0] = tempnodes;
			}
			else {
				// other types
				var checkNode = function(node) {
					return (
						(nType.Tag == "*" || node.nodeName.toLowerCase() == nType.Tag) &&
						(nType.Class == "" || owl.Css.ClassExists(node, nType.Class)) &&
						nType.AttribCheck(node)
					);
				};
				if (nType.Tag == "*") subnodes = Descendents(nodes[n], 0, checkNode);
				else {
					tempnodes = nodes[n].getElementsByTagName(nType.Tag);
					for (t = 0, tl = tempnodes.length; t < tl; t++) if (checkNode(tempnodes[t])) subnodes[subnodes.length] = tempnodes[t];
				}
			}

			// add subnodes to collection
			for (s = 0, sl = subnodes.length; s < sl; s++) nCollect[nCollect.length] = subnodes[s];
		}

		return nCollect;
	}


	// returns all descendent elements (to optional level n, e.g. 1 = immediate children and condition function)
	function Descendents(element, maxLevel, condition) {
		var recurseNodes = function(eNodes, level) {
			var cNodes = [], e, el, node;
			if (!level) level = 1;
			for (e = 0, el = eNodes.childNodes.length; e < el; e++) {
				node = eNodes.childNodes[e];
				if (node.nodeType == ElementNode && node.nodeName != "!") {
					if (!condition || condition(node)) cNodes[cNodes.length] = node;
					if (eNodes.childNodes.length > 0 && (!maxLevel || level < maxLevel)) cNodes = cNodes.concat(recurseNodes(node, level++));
				}
			}
			return cNodes;
		};

		element = $A.Make(element, doc);
		var nodes = [];
		owl.Each(element, function(e) { nodes = nodes.concat(recurseNodes(e)); });
		return nodes;
	}

	
	// find a node by type and work up parents until found
	function Ancestors(nodes, nodename) {
		var ret = [];
		nodename = (nodename.toLowerCase() || 'div');
		owl.Each($A.Make(nodes), function(n, i) {
			while (n.nodeName.toLowerCase() != nodename && n.parentNode) n = n.parentNode;
			ret[i] = (n.nodeName.toLowerCase() == nodename ? n : null);
		});
		if (!owl.Array.Is(nodes)) ret = ret[0];
		return ret;
	}
	

	// clones nodes (from, to, move nodes, clear original children)
	function Clone(nFrom, nTo, move, clear) {
		nFrom = $A.Make(nFrom, doc); nTo = $A.Make(nTo, doc);
		owl.Each(nTo, function(node, i) {
			if (clear) RemoveChildren(node);
			var nf = Math.min(i, nFrom.length-1);
			for (var t = 0, tl = nFrom[nf].childNodes.length; t < tl; t++) node.appendChild(nFrom[nf].childNodes[t].cloneNode(true));
			if (move) RemoveChildren(nFrom[nf]);
			else RemoveIDs(node);
		});
	}


	// remove child node IDs
	function RemoveIDs(nodes) {
		owl.Each($A.Make(nodes, doc), function(n) { Descendents(n, null, function(e) { if (e.id) e.removeAttribute('id'); return true; }) });
	}


	// remove child nodes
	function RemoveChildren(nodes) {
		owl.Each($A.Make(nodes, doc), function(n) { while (n.lastChild) n.removeChild(n.lastChild); });
	}


	// find text node (private)
	function FindTextNode(node) {
		var found = false;
		for (var c = 0, cl = node.childNodes.length; c < cl && !found; c++) found = ( node.childNodes[c].nodeType == TextNode ? node.childNodes[c] : FindTextNode(node.childNodes[c]) );
		return found;
	}


	// get or set text
	function Text(nodes, str) {
		var rep = (typeof str != 'undefined');
		str = (rep ? (typeof str == 'string' ? [str] : str) : "");
		owl.Each($A.Make(nodes, doc), function(node, i) {
			var tn = FindTextNode(node);
			if (rep) {
				var newstr = str[Math.min(i, str.length-1)];
				if (tn) tn.nodeValue = newstr;
				else tn = node.appendChild(document.createTextNode(newstr));
			}
			else if (tn) str += (str == '' ? '' : "\n") + tn.nodeValue;
		});
		return (rep ? true : str);
	}


	return {
		ElementNode: ElementNode,
		AttributeNode: AttributeNode,
		TextNode: TextNode,
		CommentNode: CommentNode,
		Get: Get,
		Descendents: Descendents,
		Ancestors: Ancestors,
		Clone: Clone,
		RemoveIDs: RemoveIDs,
		RemoveChildren: RemoveChildren,
		Text: Text
	};

}();