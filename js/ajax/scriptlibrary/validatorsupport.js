/*
validatorsupport.js
The FormValidator object will prevent invalid inputs and stop submission if there are one or more invalid inputs. Any graphical effects are handled by the funcion specified in the .ReportingFunction property. By default, this is set to ValidationReport - a function defined here.
*/
var FocusStyle = "focus"; // the style applied to the focused text box or select (no :focus in IE) and label
var ErrorStyle = "inputerror"; // the style applied to labels and input boxes that are not valid
var DisabledStyle = "disabled"; // the style applied to labels and input boxes that are disabled

// enable or disable a FormElement object
function ElementEnable(Element, enable) {
	enable = (enable || typeof enable == "undefined");
	Element.InputNode.disabled = !enable;
	Element.InputNode.readOnly = !enable;
	if (enable) {
		Graphic.ClassRemove(Element.InputNode, DisabledStyle);
		Graphic.ClassRemove(Element.LabelNode, DisabledStyle);
	}
	else {
		Graphic.ClassApply(Element.InputNode, DisabledStyle);
		Graphic.ClassApply(Element.LabelNode, DisabledStyle);
	}
}


// passed an FormElement object when an event occurs (load, focus, blur, submit, unload)
function ValidationReport(Element) {

	// fetch element and event details
	var event = Element.EventType;
	var input = Element.InputNode;
	var iType = input.getAttribute("type");
	var label = Element.LabelNode;
	var help = Element.HelpNode;

	// hide help elements on load
	if (event == "load" && help) help.style.display = "none";

	// apply the focus style
	if (event == "focus") {
		if (iType != "checkbox" && iType != "radio") Graphic.ClassApply(input, FocusStyle);
		if (label) Graphic.ClassApply(label, FocusStyle);
		input.setAttribute("title", ""); // remove title text
	}
	else if (event == "blur") {
		if (iType != "checkbox" && iType != "radio") Graphic.ClassRemove(input, FocusStyle);
		if (label) Graphic.ClassRemove(label, FocusStyle);
		input.setAttribute("title", Element.TitleText); // reapply title text
	}

	// apply the error style
	if (!Element.Valid) {
		if (iType != "checkbox" && iType != "radio") Graphic.ClassApply(input, ErrorStyle);
		if (label) Graphic.ClassApply(label, ErrorStyle);
	}
	else {
		if (iType != "checkbox" && iType != "radio") Graphic.ClassRemove(input, ErrorStyle);
		if (label) Graphic.ClassRemove(label, ErrorStyle);
	}

	// show help box on focus
	if (event == "focus") FieldHelpBox(input, help); else FieldHelpBox();

}


// generate field help box
function FieldHelpBox(InputNode, HelpNode) {

	var boxid = "fieldhelpbox";
	var iframeid = "fieldhelpiframe";
	var box = DOM.Id(boxid);
	var ibox = DOM.Id(iframeid);

	// create box if not defined
	if (!box) {

		var body = DOM.Tags('body');
		if (body.length > 0) {

			// create IFRAME for IE5.5+
			if (Graphic.IFrameRequired()) {
				var ifBox = document.createElement("iframe");
				ifBox.id = iframeid;
				ifBox.src = "none";
				ifBox.frameBorder = "0";
				ifBox.scrolling = "no";
				ifBox.style.position = "absolute";
				ifBox.style.width = "1px";
				ifBox.style.height = "1px";
				ifBox.style.top = "0px";
				ifBox.style.left = "0px";
				ifBox.style.filter='progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)';
				body[0].appendChild(ifBox);
				ibox = DOM.Id(iframeid);
			}

			// create help box
			var fhBox = document.createElement("div");
			fhBox.id = boxid;
			var div = document.createElement("div"); div.id = "fht"; fhBox.appendChild(div);
			div = document.createElement("div"); div.id = "fhc"; fhBox.appendChild(div);
			div = document.createElement("div"); div.id = "fhb"; fhBox.appendChild(div);
			div = document.createElement("div"); div.id = "fhs"; fhBox.appendChild(div);
			body[0].appendChild(fhBox);
			box = DOM.Id(boxid);

		}
	}

	if (box) {

		// hide box
		if (ibox) ibox.style.visibility = "hidden";
		box.style.visibility = "hidden";
		Graphic.HideElements(null,-1,-1,-1,-1); // show hidden elements in IE5.0

		// show help box
		if (InputNode && HelpNode) {

			// copy help text to box
			DOM.RemoveChildren(box.childNodes[1]);
			DOM.Copy(HelpNode, box.childNodes[1]);

			// viewport width
			var vw = 600;
			var viewport = DOM.Tags("html");
			if (viewport.length > 0) vw = viewport[0].offsetWidth - 24;

			// calculate box co-ordinates
			var xOffset = -7;
			var yOffset = 1;
			var bw = box.offsetWidth;
			var bh = box.offsetHeight;
			var bx = DOM.AbsoluteX(InputNode) + InputNode.offsetWidth + xOffset;
			if (bx + bw > vw) bx = vw - bw;
			var by = DOM.AbsoluteY(InputNode);
			if (by - bh + yOffset > 0) by += yOffset - bh;
			else by += InputNode.offsetHeight - yOffset;
			bx -= DOM.AbsoluteX(box.offsetParent);
			by -= DOM.AbsoluteY(box.offsetParent);

			// move and show iframe
			if (ibox) {
				ibox.style.left = bx + "px";
				ibox.style.top = by + "px";
				ibox.style.width = bw;
				ibox.style.height = bh;
				ibox.style.visibility = "visible";
			}

			// hide elements (IE5.0)
			Graphic.HideElements(InputNode, bx, by, bw, bh);

			// move and show box
			box.style.left = bx + "px";
			box.style.top = by + "px";
			box.style.visibility = "visible";
		}

	}

}