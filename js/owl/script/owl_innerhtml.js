/*	---------------------------------------------

	owl.innerHTML

	--------------------------------------------- */
if (owl && owl.Dom && owl.Xml && !owl.innerHTML) owl.innerHTML = function(node, str, clear) {

	clear = (clear != false);
	node = owl.Array.Make(node);
	if (node.length > 0) {
		var xml = owl.Xml.Load("<root>"+str+"</root>");
		if (xml && xml.documentElement) owl.Each(node, function(n) {
			if (clear) owl.Dom.RemoveChildren(n);
			node = owl.Xml.Copy(xml.documentElement, n);
		});
	}

	return node;
};