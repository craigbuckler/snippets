/*
Digita PAC Parser JavaScript
(C) OptimalWorks.net
Contact Craig Buckler, craig@optimalworks.net, 01395 276498

Handles:
	PAC XML files with multiple or single orders (no ZSSD_PAC_INFO)

Implements:
	drag & drop file handler
	file loading (Ajax and HTML5 File API)
	XML parsing
	rendering and event handlers
*/
(function() {

	// configuration
	var $C = {
	
		"nodeOrder": "ORDERS",					// root node
		"nodeOrderItem": "ZSSD_PAC_INFO",		// separates individual orders (optional)
	
		"Customer": {
			"FIRMNAME": { label: "Firm name", type: "str" },
			"CUSTOMERNUMBER": { label: "Firm number", type: "str" },
			"CONTACTFNAME": { label: "First name", type: "str" },
			"CONTACTLNAME": { label: "Last name", type: "str" },
			"CONTACT_NUM": { label: "Contact ref", type: "str" },
			"EMAILADDRESS": { label: "Email", type: "email" },
			"RESIDENTSTATE": { label: "Region", type: "str" },
			"PURCHASEDATE": { label: "Purchase date", type: "date" },
			"CREATE_DATE": { label: "Create date", type: "date" },
			"CREATE_TIME": { label: "Create time", type: "str" },
			"CREATED_BY": { label: "Created by", type: "str" }
		},
		
		"Subscription": {
			"ID": { label: "#", type: "int" },
			"SUB_ORDER": { label: "Sub-order", type: "str" },
			"LAPSE_CANCEL_IND": { label: "Lapse", type: "flag" },
			"MATERIAL_DESC": { label: "Material", type: "str" },
			"PAC_QTY_TYPE": { label: "Qty type", type: "str" },
			"PAC_QTY": { label: "PacQ", type: "int" },
			"ORDER_QTY": { label: "OrderQ", type: "int" },
			"CONTRACTSTART": { label: "Start", type: "date" },
			"EXPIRES": { label: "Expiry", type: "date" },
			"PRODUCTAVAILABLEDAT": { label: "Available", type: "date" },
			"LEGACY_ORDER_KEY": { label: "Legacy", type: "str" },
			"REFERENCE_ORDER": { label: "Ref", type: "str" },
			"SHIPPING": { label: "Adr", type: "int" }
		},
		
		"Shipping": {
			"ID": { label: "#", type: "int" },
			"ATTENTION_NAME": { label: "FAO", type: "str" },
			"PHONE_NBR": { label: "Phone", type: "str" },
			"COMPANY": { label: "Firm name", type: "str" },
			"SHIP_TO_CUSTOMER": { label: "Firm number", type: "str" },
			"STREET": { label: "Address", type: "str" },
			"STREET2": { label: "line 2", type: "str" },
			"STREET3": { label: "line 3", type: "str" },
			"STREET4": { label: "line 4", type: "str" },
			"STREET5": { label: "line 5", type: "str" },
			"CITY": { label: "Town/city", type: "str" },
			"ZIP_CODE": { label: "Postcode", type: "str" },
			"REGION": { label: "Region", type: "str" },
			"COUNTRY_CODE": { label: "Country code", type: "str" },
			"COUNTRY_NAME": { label: "Country name", type: "str" }		
		}
	
	}
	

	// getElementById
	function $(id, doc) {
		doc = doc || document;
		return doc.getElementById(id) || null;
	}

	// getElementsByTagName
	function $T(tag, doc) {
		doc = doc || document;
		return doc.getElementsByTagName(tag) || [];
	}

	// append child node and text
	function Append(node, e1, e2) {
		e2 = e2 || null;
		var e = document.createElement(e1);
		if (typeof e2 == "string") e.appendChild(document.createTextNode(e2));
		else if (e2 !== null) e.appendChild(e2);
		return node.appendChild(e);
	}

	// trim
	function Trim(str) { return String(str).replace(/^\s*|\s*$/g, ""); }


	// is class applied to element?
	function ClassExists(e, name) {
		var cn = " "+e.className+" ";
		return (name ? cn.indexOf(" "+name+" ") >= 0 : false);
	}
	

	// apply class to element
	function ClassApply(e, name) {
		var cn = " "+e.className+" ";
		if (cn.indexOf(" "+name+" ") < 0) {
			cn += name;
			e.className = Trim(cn);
		}
	}


	// remove class from element (pass classname of "" to remove all)
	function ClassRemove(e, name) {
		var cn = "";
		if (name) {
			cn = " "+e.className+" ";
			cn = Trim(cn.replace(new RegExp(" "+name+" ", "gi"), " "));
		}
		e.className = cn;
	}


	// remove child nodes
	function Clean(node) {
		while (node.lastChild) { node.removeChild(node.lastChild); }
	}


	// prevent event propagation
	function EventCancel(evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}


	// file upload hover
	function FileHover(evt) {
		EventCancel(evt);
		evt.target.className = (evt.type == "dragover" ? "hover" : "");
	}


	// file selection
	function FileSelect(evt) {
		FileHover(evt);
		var files;
		if (evt.target.id == "fileselect") files = evt.target.files;
		else files = evt.dataTransfer.files;

		// process all files
		for (var i = 0, f; f = files[i]; i++) {
			if (f.type == "text/xml") ReadFile(f, ProcessData);
		}

	}


	// read file
	function ReadFile(file, callback) {

		// filename
		var elements = CreateElements(file);

		var reader = new FileReader();
		if (callback) reader.onload = function(file) { callback(file, elements) };
		reader.readAsText(file);

	}


	// create elements
	function CreateElements(file, elements) {

		var t, o, c, fn = file.name.replace(/\.xml$/i, '');
		if (!$(fn+"-tab")) {

			// activate output window
			ClassApply(Output, "active");

			// new output section
			o = Append(Output, "div", "Parsing "+file.name);
			o.setAttribute("id", fn+"-out");
			o.className = "file";

			// new tab
			t = Append(Files, "li", fn);
			t.setAttribute("id", fn+"-tab");
			t.className = "loading";
			t.output = o;
			Append(t, "span", "X");

		}
		else {
			t = $(fn+"-tab");
			o = $(fn+"-out");
		}

		// return elements
		return { tab: t, out:o };

	}


	// process data
	function ProcessData(file, elements) {

		var XML, orders = [];
		try {
			var parser = new DOMParser();
			XML = parser.parseFromString(file.target.result, "text/xml");
		}
		catch(e){};

		if (XML) {

			// extract, parse and display XML data
			orders = $T($C.nodeOrder, XML);
			if (orders.length == 1) {
			
				// display order
				var multiple = Display(elements.out, ExtractData(orders[0]));
				
				// missing node
				if (!multiple) {
					ClassApply(elements.tab, "single");
					elements.tab.title = "missing " + $C.nodeOrderItem;
				}
				
				// activate first order
				var ul = $T("ul", elements.out);
				if (ul.length > 0) ActivateOrder(ul[0].firstElementChild);
			
			}

		}
		
		if (orders.length != 1) {
			Clean(elements.out);
			Append(elements.out, "p", "Not a valid XML document?");
		}

		ClassRemove(elements.tab, "loading");
		ActivateTab(elements.tab);
		
	}


	// extract data from XML
	function ExtractData(node) {

		var	data = {},
			a = {}, cname, cl;

		// child structural elements
		for (var c = 0, cnode; cnode = node.childNodes[c]; c++) {

			if (cnode.nodeType == 1) {

				cname = cnode.nodeName; // child node name

				if (cnode.childElementCount == 0) {

					// data element
					data[cname] = (cnode.firstChild && cnode.firstChild.nodeType == 3 ?
						Trim(cnode.firstChild.nodeValue) : ''
					);

				}
				else {

					// array structure?
					if (typeof a[cname] === "undefined") {
						cl = $T(cname, node).length;
						a[cname] = (cl > 1 ? 0 : null);
					}

					if (a[cname] !== null) {
						// array element
						if (!data[cname]) data[cname] = [];
						data[cname][a[cname]++] = ExtractData(cnode);
					}
					else {
						// object element
						data[cname] = ExtractData(cnode);
					}

				}

			}

		}

		return data;

	}


	// display order data
	function Display(e, data) {

		Clean(e);
		var multiple = true;
		
		// multiple orders
		if (data[$C.nodeOrderItem]) DisplayItem(e, data, $C.nodeOrderItem, DisplayOrder);
		// or single order
		else {
			multiple = false;
			DisplayOrder(e, data);
		}
		
		return multiple;
		
	}


	// handle data which may or may not be in an array
	function DisplayItem(e, data, item, callback) {

		if (!data[item]) return;
		if (data[item].constructor == Array) {
			for (var i = 0, di; di = data[item][i]; i++) callback(e, di);
		}
		else callback(e, data[item]);

	}


	// display order
	function DisplayOrder(e, data) {

		// create/locate order tabs
		var ul = $T("ul", e);
		if (ul.length == 0) {
			ul = Append(e, "ul");
			ul.className = "orders";
		}
		else ul = ul[0];

		// new dataset
		DataSet++;
		
		// add order tab
		var li = Append(ul, "li", (data.FIRMNAME || ""));
		li.id = "cn"+DataSet+"-tab";
		Append(li, "span", (data.CUSTOMERNUMBER || ""));
		
		// add order section
		var div = Append(e, "div");
		div.id = "cn"+DataSet+"-out";
		div.className = "order";
		
		// add customer section
		var dl = Append(div, "dl"), dt, dd, c;
		dl.className = "customer";
		for (c in $C.Customer) {
			dt = Append(dl, "dt", $C.Customer[c].label);
			dt.title = c;
			dd = Append(dl, "dd", FormatData(data[c], $C.Customer[c].type));
			dd.title = c;
		}
		
		// add subscription table
		var subs = Append(div, "div");
		subs.className = "products";
		var table = Append(subs, "table");
		table.id = "cn"+DataSet+"-sub";
		table.setAttribute("summary", "Subscriptions");
		var thead = Append(table, "thead"), th, s;
		thead = Append(thead, "tr");
		for (s in $C.Subscription) {
			th = Append(thead, "th", $C.Subscription[s].label);
			th.title = s;
			if ($C.Subscription[s].type == "int") th.className = "num";
			if (s == "ID") th.className = "up num";
		}

		// row data storage
		Data[DataSet] = {
			Ship: [],
			Sub: []
		};
		
		// parse subscription
		DisplayItem(Append(table, "tbody"), (data.PAC_PRODUCTS || null), "ZSSD_PAC_PRODUCTS", DisplaySubscription);
		
		// create shipping address elements
		var sl = Data[DataSet].Ship.length;
		for (s = 0; s < sl; s++) {
			dl = Append(div, "dl");
			dl.id = "pd"+DataSet+"-"+(s+1)+"-out";
			dl.className = "shipping";
			
			for (c in $C.Shipping) {
				dt = Append(dl, "dt", $C.Shipping[c].label);
				dt.title = c;
				dd = Append(dl, "dd", Data[DataSet].Ship[s][c]);
				dd.title = c;
			}
			
		}
		
	}
	
	
	// display subscriptions
	function DisplaySubscription(e, data) {

		var id = Data[DataSet].Sub.length, addr = {}, al = Data[DataSet].Ship.length, ae = 0, f = false, tr, td, s, c, v;
		Data[DataSet].Sub[id] = {};
		
		// define address
		addr.cs = '';
		for (s in $C.Shipping) {
			if (s != "ID") {
				addr[s] = FormatData(data[s], $C.Shipping[s].type);
				addr.cs += addr[s].toLowerCase().replace(/\W|_/g, ""); // address checksum
			}
		}
		
		// new address?
		while (ae < al && !f) {
			if (Data[DataSet].Ship[ae].cs == addr.cs) f = true;
			else ae++;
		}
		if (!f) {
			ae = al+1;
			addr.ID = FormatData(ae, "int");
			Data[DataSet].Ship[al] = addr;
		}
		else ae++;
	
		// create ID field
		data.ID = id + 1;
	
		// create sub-order field
		data.SUB_ORDER = (data.SUB_ORDER_KEY || "")+"-"+(data.SUB_ORDER_LINE || 0);
		
		// create address link
		data.SHIPPING = ae;
		
		// append row
		tr = Append(e, "tr");
		tr.id = "pd"+DataSet+"-"+ae+"-"+(data.ID+"tab").substr(0, 3);
		
		// append columns and data
		for (s in $C.Subscription) {
			Data[DataSet].Sub[id][s] = ($C.Subscription[s].type == "int" ? parseInt((data[s] || 0), 10) : (data[s] || ""));
			v = FormatData(data[s], $C.Subscription[s].type);
			v = v || " ";
			td = Append(tr, "td", v);
			td.title = s;
			c = "";
			if (s == "ID") c += "rec ";
			if ($C.Subscription[s].type == "int") c += "num ";
			else if ($C.Subscription[s].type == "flag") c += "important ";
			if (c) td.className = Trim(c);
		}
	
	}
	
	
	// format a data field
	function FormatData(d, type) {
	
		var ret;
		switch(type) {
		
			case "int":
				ret = String(parseInt(d, 10)).replace(/(\d+)(\d{3})/g, "$1,$2");
				break;
		
			case "email":
				ret = document.createElement("a");
				ret.setAttribute("href", "mailto:" + d);
				ret.appendChild(document.createTextNode(d));
				break;
				
			case "date":
				if (d.length == 10 && d != "0000-00-00") ret = d.substr(-2) + "-" + d.substr(5,2) + "-" + d.substr(0,4);
				else ret = "";
				break;
		
			default: ret = d || ""; break;
		}
		
		return ret;
	
	}


	// activate a tab and content
	var ActiveTab;
	function ActivateTab(t) {

		if (ActiveTab) {
			ClassRemove(ActiveTab, "active");
			ActiveTab.output.style.display = "none";
		}

		if (t) {
			ActiveTab = t;
			ClassApply(ActiveTab, "active");
			ActiveTab.output.style.display = "block";
		}

	}


	// file switch click event (change or close)
	function FileSwitchHandler(e) {
		e = (e ? e : window.event);
		if (e.type.toLowerCase() == "click") {
			var t = e.target;
			var element = t.nodeName.toLowerCase();

			// activate a tab and content
			if (element == "li") {
				ActivateTab(t);
			}
			// close tab
			else if (element == "span") {
				ActiveTab = null;
				var li = t.parentNode;
				var sib = li.previousElementSibling || li.parentNode.lastElementChild || null;
				if (sib != li) ActivateTab(sib);

				// remove content
				Output.removeChild(li.output);
				li.parentNode.removeChild(li);
				if (Output.childNodes.length == 0) ClassRemove(Output, "active");
			}
			if (e.stopPropagation) e.stopPropagation();
			e.cancelBubble = true;
		}
	}


	// output click event handler
	function OutputEventHandler(e) {

		e = (e ? e : window.event);
		var
			t = e.target,
			type = e.type.toLowerCase(),
			tn = t.nodeName.toLowerCase();

		if (type == "click") {

			if (tn == "span") {
				t = t.parentNode;
				tn = t.nodeName.toLowerCase();
			}
			if (tn == "li") ActivateOrder(t);
			else if (tn == "th") ReorderTable(t);

		}
		else if (type == "mouseover" && tn == "td") {
			ActivateProduct(t.parentNode);
		}

		if (e.stopPropagation) e.stopPropagation();
		e.cancelBubble = true;

	}


	// activate an order
	function ActivateOrder(t) {

		// show/hide orders
		var id, cont, li = t.parentNode.firstElementChild;
		do {

			id =  li.id;
			cont = $(id.substr(0, id.length-3)+"out");

			if (li == t) {
				ClassApply(li, "active");
				if (cont) {
				
					cont.style.display = "block";
					var tr, tbody = $T("tbody", cont);
					if (tbody.length > 0) {
						tr = $T("tr", tbody[0]);
						if (tr.length > 0) ActivateProduct(tr[0]);
					}
				
				}
				
			}
			else {
				ClassRemove(li, "active");
				if (cont) cont.style.display = "none";
			}
		}
		while ((li = li.nextElementSibling));

	}


	// activate a product
	function ActivateProduct(t) {

		var id = t.id, tbody = t.parentNode;
		var sh = $(id.substr(0, id.length-3)+"out");

		if (sh != tbody.shipping) {
			if (tbody.shipping) tbody.shipping.style.display = "none";
			sh.style.display = "block";
			tbody.shipping = sh;
		}

	}
	
	
	// reorder the table
	function ReorderTable(t) {
	
		// find dataset
		var table = t.parentNode.parentNode.parentNode;
		var ds = table.id;
		ds = parseInt(ds.substr(2, ds.length-6), 10);
	
		// determine field
		var field = t.title;
	
		// determine order
		var order = (ClassExists(t, "up") ? -1 : 1);
		
		// clear existing sort styles
		var th = $T("th", t.parentNode);
		for (var h = 0, thn; thn = th[h]; h++) {
			ClassRemove(thn, "up");
			ClassRemove(thn, "dn");
		}
		
		// sort data
		Data[ds].Sub.sort(
			function (a, b) {
				var r = 0;
				if (a[field] < b[field]) r = -1;
				else if (a[field] > b[field]) r = 1;
				return r * order;
			}
		)
		
		// populate table
		var tbody = $T("tbody", table);
		if (tbody.length != 1) return;
		var tr = $T("tr", tbody[0]), td, data, i, r, k, c;
		
		// rows
		for (i = 0; r = tr[i]; i++) {
			data = Data[ds].Sub[i];
			r.id = "pd"+ds+"-"+data.SHIPPING+"-"+(data.ID+"tab").substr(0, 3);
			
			// columns
			td = $T("td", r);
			for (k = 0; c = td[k]; k++) {
				//console.log(i, k, c.title, FormatData(data[c.title], $C.Subscription[c.title].type));
				c.firstChild.nodeValue = FormatData(data[c.title], $C.Subscription[c.title].type);
			}
		
		}
		
		// apply arrow
		ClassApply(t, (order == 1 ? "up" : "dn"));
	
	}


	// initialization
	var
		Files = $("files"),		// file tabs
		Output = $("output"),	// output element
		Data = [],				// data table
		DataSet = 0;			// current set of data

	function Setup() {

		// file select event
		$("fileselect").addEventListener("change", FileSelect, false);

		// file drop event
		var fileupload = $("fileupload");
		fileupload.addEventListener("dragover", FileHover, false);
		fileupload.addEventListener("drop", FileSelect, false);

		// display form
		$("uploader").style.display = "block";

		// output
		Clean(Output);
		Output.addEventListener("click", OutputEventHandler, false);
		Output.addEventListener("mouseover", OutputEventHandler, false);

		// file tabs
		Files.addEventListener("click", FileSwitchHandler, false);

	}


	// start
	if (window.File && window.FileReader && window.FileList && window.XMLHttpRequest && window.DOMParser && window.XSLTProcessor) {
		Setup();
	}
	else {
		// unsupported browser
		$("nosupport").style.display = "block";
	}


})();