/*
FormValidator class, by Craig Buckler
Validates form input values according to data defined in the class attribute.
Characters are checked and inputs are formatted in accordance with the current locale.

Dependencies:
	misc.js
	dom.js
	events.js
	localisation.js
	validatorsupport.js
*/
new Event(window, "load", FormValidatorSetup);

// automatically applies validation to all form nodes with a class of 'validate'
function FormValidatorSetup() {
	var forms = DOM.Class("validate", "form");
	for (var i = 0; i < forms.length; i++) new FormValidator(forms[i]);
}


// generic form validator
function FormValidator(form) {

	this.ReportingFunction = ValidationReport; // the function called after field validation

	this.ValidForm = false;
	this.Element = new Array(); // array of form elements
	this.ElementLength = 0; // number of elements
	this.InvalidCount = 0; // private - creates Element.InvalidIndex
	this.FirstElement = null; // private - first element
	this.LastElement = null; // private - last element

	this.Form = (typeof form == "string" ? DOM.Id(form) : form); // this form element
	if (this.Form && this.Form.getAttribute("validated") != "true") this.Initialise(); // initialise if not already being validated

}


// form initialisation
FormValidator.prototype.Initialise = function() {

	this.Form.setAttribute("validated", "true"); // mark form as validated
	this.FindInputs(this.Form); // find all inputs

	var FV = this;
	new Event(this.Form, "submit", function(evt) { FV.ValidateForm(evt); }); // form submit event
	new Event(window, "unload", function(evt) { FV.ValidateForm("unload"); }); // window unload event
	this.ValidateForm("load"); // load "event"

	this.Highlight(); // focus first field
}


// set focus to an element (first element is used if none is specified)
FormValidator.prototype.Highlight = function(eName) {
	if (!eName && this.FirstElement != null) eName = this.FirstElement;
	if (eName && this.Element.Exists(eName)) {
		var input = this.Element[eName].InputNode;
		var type = input.nodeName.toLowerCase();
		var subtype = (type == "input" ? String(input.getAttribute("type")).Trim().toLowerCase() : "");
		if (subtype == "null" || subtype == "password") subtype = "text";

		var cauto = input.getAttribute("autocomplete"); if (!cauto) cauto = "on";
		input.setAttribute("autocomplete", "off"); // stops Mozilla error (bug)

		if ((type == "input" && subtype == "text") || type == "textarea") { try { input.select(); } catch(e) {}; }
		try { input.focus(); } catch(e) {};

		input.setAttribute("autocomplete", cauto);
	}
}


// recurse all elements to find inputs, selects or textareas
FormValidator.prototype.FindInputs = function(node) {

	var cnode = DOM.ChildElements(node);
	for (var i = 0; i < cnode.length; i++) {

		// handle input element
		var type = cnode[i].nodeName.toLowerCase();
		if (type == "input" || type == "select" || type == "textarea") {

			// determine element name
			this.ElementLength++;
			var eName = cnode[i].id;
			if (eName == "" || this.Element.Exists(eName)) eName = "element"+this.ElementLength;

			// add parsed element to array
			this.Element[eName] = this.ParseInput(cnode[i]);
			if (this.FirstElement == null) this.FirstElement = eName;
			this.LastElement = eName;

			// define events
			var FV = this;
			var handle = function(evt) { FV.EventHandler(eName, evt); } // generic handler function
			new Event(this.Element[eName].InputNode, "focus", handle); // focus event
			new Event(this.Element[eName].InputNode, "blur", handle); // blur event

			// find input subtype (text, radio, checkbox, submit)
			var subtype = (type == "input" ? String(cnode[i].getAttribute("type")).Trim().toLowerCase() : "");
			if (subtype == "null" || subtype == "password") subtype = "text";
			if ((type == "input" && subtype == "text") || type == "textarea") new Event(this.Element[eName].InputNode, "keypress", handle); // define keypress event for text box
		}

		// handle help element
		var cDef = " "+cnode[i].className.toLowerCase()+" ";
		if (cDef.indexOf(" fieldhelp ") >= 0 && this.LastElement != null) {
			this.Element[this.LastElement].HelpNode = cnode[i];
		}

		// recurse child nodes
		this.FindInputs(cnode[i]);
	}

}


// parse an input node and return an appropriate element object
FormValidator.prototype.ParseInput = function(node) {

	var eId, eName, i;
	eId = node.id; // find input ID
	eName = node.name; // find input name

	// define an approproate form element object
	var fe;
	switch(this.GetClassValue(node, "valid")) {
		case "string": fe = new StringElement(); break;
		case "alpha": fe = new AlphaElement(); break;
		case "text": fe = new TextElement(); break;
		case "email": fe = new EmailElement(); break;
		case "url": fe = new UrlElement(); break;
		case "date": fe = new DateElement(); break;
		case "digit": fe = new DigitElement(); break;
		case "number": fe = new NumberElement(); break;
		case "currency": fe = new CurrencyElement(); break;
		case "percent": fe = new PercentElement(); break;
		default: fe = new NullElement(); break;
	}

	// define input node
	fe.InputNode = node;

	// define label node
	if (fe.InputNode.parentNode.nodeName.toLowerCase() == "label") fe.LabelNode = fe.InputNode.parentNode;
	else {
		var labels = DOM.Tags("label", this.Form); // search all labels within form
		var lfor;
		for (i = 0; i < labels.length && !fe.LabelNode; i++) {
			lfor = labels[i].getAttribute("for");
			if (!lfor && labels[i].attributes["for"]) lfor = labels[i].attributes["for"].nodeValue; // IE cannot get for attribute?
			if (lfor == eId || lfor == eName) fe.LabelNode = labels[i];
		}
	}

	// define title text
	var title = fe.InputNode.getAttribute("title");
	if (!title && fe.LabelNode) title = fe.LabelNode.getAttribute("title");
	if (title) {
		fe.TitleText = title;
		fe.InputNode.setAttribute("title", title);
		if (fe.LabelNode) fe.LabelNode.setAttribute("title", title);
	}

	// other values
	fe.Required = (this.GetClassValue(fe.InputNode, "req") != null); // required
	fe.DP = this.GetClassValue(fe.InputNode, "dp"); if (fe.DP == null) fe.DP = 0; else fe.DP = fe.DP.toNumber().toInt(); // decimal places
	fe.SetLimits(this.GetClassValue(fe.InputNode, "min"), this.GetClassValue(fe.InputNode, "max")); // set minimum and maximum

	return fe; // return element object
}


// find a value within the defined class
FormValidator.prototype.GetClassValue = function(input, find) {
	var iClass = " "+input.className.toLowerCase()+" ";
	find = find.toLowerCase();
	var ret = null;
	var ps = iClass.lastIndexOf(" "+find);
	if (ps >= 0) {
		if (find == "req") ret = "req";
		else {
			var pe = iClass.indexOf(" ", ps+1);
			if (pe >= ps) ret = iClass.substring(ps+find.length+1, pe);
		}
	}
	return ret;
}


// handle an input event
FormValidator.prototype.EventHandler = function(eName, evt) {

	var eType = (typeof evt == "string" ? evt : evt.Raised.Type); // event type

	if (eType == "keypress") {
		// handle keypress event: stop invalid characters or strings exceeding limit
		var k = evt.Raised.Key;
		if (k != "" && !this.Element[eName].KeyCheck(k)) evt.Raised.StopDefaultAction();
	}
	else {
		// handle other events: check validity, format and pass to reporting function
		this.Element[eName].EventType = eType;
		this.Element[eName].Validate();
		if (this.Element[eName].Value != this.Element[eName].ValueLast && eType != "load") this.Element[eName].UserChanged = true; // user changed
		if (this.Element[eName].Valid || eType == "load") this.Element[eName].ValueLast = this.Element[eName].Value; // last valid (or starting) value
		this.ValidForm = (this.ValidForm && this.Element[eName].Valid);
		if (!this.Element[eName].Valid) this.Element[eName].InvalidIndex = this.InvalidCount;
		if (typeof this.ReportingFunction == "function") this.ReportingFunction(this.Element[eName]);
	}

}


// handle a submit event - check all values
FormValidator.prototype.ValidateForm = function(evt) {

	var eType = (typeof evt == 'undefined' ? 'check' : (typeof evt == 'string' ? evt : evt.Raised.Type)); // event type
	this.ValidForm = true;
	var firstInvalid;

	// check all inputs
	this.InvalidCount = 1;
	for (e in this.Element) {
		if (this.Element.Exists(e)) {
			this.EventHandler(e, eType);
			if (!this.Element[e].Valid) {
				if (this.InvalidCount == 1) firstInvalid = e;
				this.InvalidCount++;
			}
		}
	}
	this.InvalidCount = 0;

	// sets focus to first invalid field and stops submit
	if (!this.ValidForm) {
		if (eType != "load") this.Highlight(firstInvalid);
		if (eType == "submit") evt.Raised.StopDefaultAction();
	}

	return this.ValidForm;
}


// ________________________________________________________
// string element (base object)
function StringElement() {
	this.InputNode = null; // input node
	this.LabelNode = null; // label node
	this.HelpNode = null; // help node
	this.TitleText = null; // title (in label or input)
	this.Required = null; // required value
	this.Min = null; // minimum value
	this.Max = null; // maximum value
	this.DP = null; // decimal places
	this.MaxLength = null; // maximum string length
	this.Value = null; // the real value (null if not valid)
	this.ValueLast = null; // last valid value
	this.Valid = null; // valid value
	this.InvalidIndex = null; // invalid index (e.g first invalid value = 1)
	this.EventType = null; // event type (focus, blur, etc)
	this.UserChanged = false; // set to true if the user enters a valid value
}

// check a keypress: stop invalid characters or strings exceeding maximum length
StringElement.prototype.KeyCheck = function(key, noLimitTest) {
	var keyOK = this.KeyValid(key);
	if (keyOK && noLimitTest != true && this.MaxLength > 0) {
		// selected characters
		var sChars = 0;
		if (typeof(this.InputNode.selectionStart) != 'undefined') sChars = this.InputNode.selectionEnd - this.InputNode.selectionStart;
		else if (document.selection) sChars = document.selection.createRange().text.length;
		keyOK = (this.InputNode.value.length - sChars +1 <= this.MaxLength);
	}
	return keyOK;
}

// check key is a string character
StringElement.prototype.KeyValid = function(key) { return key.validStringCharacter(); }

// validate string
StringElement.prototype.Validate = function() {
	var realVal = this.InputNode.value.Trim();
	if (realVal != '' && this.Min != null && realVal.length < this.Min) realVal = null;
	if (realVal != '' && realVal !=null && this.Max != null && realVal.length > this.Max) realVal = null;
	for (var i = 0; realVal != null && i < realVal.length; i++) if (!this.KeyCheck(realVal.charAt(i), true)) realVal = null;
	this.UpdateField(realVal);
}

// update field value
StringElement.prototype.UpdateField = function(newValue) {
	this.Value = newValue;
	this.Valid = ((newValue != null && newValue !='') || (newValue == '' && !this.Required));
	if (this.Valid && this.InputNode.value != newValue) this.InputNode.value = newValue;
}

// format a value
StringElement.prototype.FormatValue = function(newValue) { return newValue; }

// set minimum and maximum limit
StringElement.prototype.SetLimits = function(minV, maxV) {
	if (typeof(minV) != 'undefined' && minV != null) this.Min = minV.toNumber().toInt();
	if (typeof(maxV) != 'undefined' && maxV != null) this.Max = maxV.toNumber().toInt();
	this.SetMaxLength();
}

// set the element maxlength
StringElement.prototype.SetMaxLength = function() {
	this.MaxLength = this.FindMaxlength();
}

// find the element maximum length
StringElement.prototype.FindMaxlength = function() {
	var minL = (this.Min != null ? this.Min : 0);
	var maxL = (this.Max != null ? this.Max : 0);
	return Math.max(minL, maxL);
}


// ________________________________________________________
// alpha element
function AlphaElement() {}
AlphaElement.prototype = new StringElement;

// check key is an alpha character
AlphaElement.prototype.KeyValid = function(key) { return key.validAlphaCharacter(); }


// ________________________________________________________
// text element
function TextElement() {}
TextElement.prototype = new StringElement;

// check key is a text character
TextElement.prototype.KeyValid = function(key) { return key.validTextCharacter(); }


// ________________________________________________________
// email element
function EmailElement() {}
EmailElement.prototype = new StringElement;

// validate email
EmailElement.prototype.Validate = function() {
	var value = this.InputNode.value.Trim();
	if (value == "") this.UpdateField("");
	else {
		var realVal = value.toEmail();
		if (realVal != null && this.Min != null && realVal.length < this.Min) realVal = null;
		if (realVal != null && this.Max != null && realVal.length > this.Max) realVal = null;
		this.UpdateField(realVal);
	}
}


// ________________________________________________________
// URL element
function UrlElement() {}
UrlElement.prototype = new StringElement;

// validate URL
UrlElement.prototype.Validate = function() {
	var value = this.InputNode.value.Trim();
	if (value == "") this.UpdateField("");
	else {
		var realVal = value.toURL();
		if (realVal != null && this.Min != null && realVal.length < this.Min) realVal = null;
		if (realVal != null && this.Max != null && realVal.length > this.Max) realVal = null;
		this.UpdateField(realVal);
	}
}


// ________________________________________________________
// date element
function DateElement() {}
DateElement.prototype = new StringElement;

// check key is a date character
DateElement.prototype.KeyValid = function(key) { return key.validDateCharacter(); }

// validate date
DateElement.prototype.Validate = function() {
	var value = this.InputNode.value.Trim();
	if (value == "") this.UpdateField("");
	else {
		var realVal = value.toDate();
		if (realVal != null && this.Min != null && realVal < this.Min) realVal = null;
		if (realVal != null && this.Max != null && realVal > this.Max) realVal = null;
		this.UpdateField(this.FormatValue(realVal));
	}
}

// format to a localised date
DateElement.prototype.FormatValue = function(newValue) { return (newValue == null ? null : newValue.formatDate()); }

// set minimum and maximum limit
DateElement.prototype.SetLimits = function(minV, maxV) {
	// convert string to a date
	var StrToDate = function(dstr) {
		dstr = String(dstr);
		var d = dstr.toDate();
		if (d == null && dstr.length == 8) d = dstr.SerialToDate();
		return d;
	}
	if (typeof(minV) != 'undefined' && minV != null) this.Min = StrToDate(minV);
	if (typeof(maxV) != 'undefined' && maxV != null) this.Max = StrToDate(maxV);
	this.SetMaxLength();
}


// find the element maximum length
DateElement.prototype.FindMaxlength = function() {
	var minL = (this.Min != null ? String(this.Min.formatDate()).length : 0);
	var maxL = (this.Max != null ? String(this.Max.formatDate()).length : 0);
	return Math.max(minL, maxL);
}


// ________________________________________________________
// digit element
function DigitElement() {}
DigitElement.prototype = new StringElement;

// check key is an alpha character
DigitElement.prototype.KeyValid = function(key) { return key.validDigitCharacter(); }


// ________________________________________________________
// number element
function NumberElement() {}
NumberElement.prototype = new StringElement;

// check key is a number character
NumberElement.prototype.KeyValid = function(key) { return key.validNumberCharacter(); }

// validate number
NumberElement.prototype.Validate = function() {
	var value = this.InputNode.value.Trim();
	if (value == "") this.UpdateField("");
	else {
		var realVal = value.toNumber();
		if (realVal != null && this.Min != null && realVal < this.Min) realVal = null;
		if (realVal != null && this.Max != null && realVal > this.Max) realVal = null;
		this.UpdateField(this.FormatValue(realVal));
	}
}

// format to a localised number
NumberElement.prototype.FormatValue = function(newValue) { return (newValue == null ? null : newValue.formatNumber(this.DP)); }

// set minimum and maximum limit
NumberElement.prototype.SetLimits = function(minV, maxV) {
	if (typeof(minV) != 'undefined' && minV != null) this.Min = minV.toNumber();
	if (typeof(maxV) != 'undefined' && maxV != null) this.Max = maxV.toNumber();
	this.SetMaxLength();
}

// find the element maximum length
NumberElement.prototype.FindMaxlength = function() {
	var minL = (this.Min != null ? String(this.FormatValue(this.Min)).length : 0);
	var maxL = (this.Max != null ? String(this.FormatValue(this.Max)).length : 0);
	return Math.max(minL, maxL);
}


// ________________________________________________________
// currency element
function CurrencyElement() {}
CurrencyElement.prototype = new NumberElement;

// check key is a currency character
CurrencyElement.prototype.KeyValid = function(key) { return key.validCurrencyCharacter(); }

// format to a localised currency
CurrencyElement.prototype.FormatValue = function(newValue) { return (newValue == null ? null : newValue.formatCurrency(this.DP)); }


// ________________________________________________________
// percent element
function PercentElement() {}
PercentElement.prototype = new NumberElement;

// check key is a percent character
PercentElement.prototype.KeyValid = function(key) { return key.validPercentCharacter(); }

// format to a localised currency
PercentElement.prototype.FormatValue = function(newValue) { return (newValue == null ? null : newValue.formatPercent(this.DP)); }


// ________________________________________________________
// null element: no checks required
function NullElement() {}
NullElement.prototype = new StringElement;

// keypress check
NullElement.prototype.KeyValid = function(key) { return true; }

// validate
NullElement.prototype.Validate = function() { this.Value = this.InputNode.value; this.Valid = true; }