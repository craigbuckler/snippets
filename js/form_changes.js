// An evolution of http://www.sitepoint.com/javascript-form-change-checker/
// ensure script is loaded at end of page

// find all forms and hidden elements
(function() {

  // parse all forms
  var f, i, h, form = document.getElementsByTagName("form");
  for (f = form.length - 1; f >= 0; f--) {

    // count form elements
    form[f].fcElementCount = form[f].elements.length;

    // store hidden element initial value
    for (i = form[f].elements.length - 1; i >= 0; i--) {
      h = form[f].elements[i];
      if (h.nodeName.toLowerCase() == "input" && h.type.toLowerCase() == "hidden") {
        h.fcDefaultValue = h.value;
      }
    }
  }

}());


// FormChanges(id-string|node) - pass a form node or ID
// Returns an array of nodes of inputs changed since the page was loaded
// (If elements are removed, the last item will be the form node itself)
// e.g. if (FormChanges("myform").length > 0) { console.log("changed"); }
function FormChanges(form) {
  if (typeof form == "string") form = document.getElementById(form);
  if (!form || !form.nodeName || form.nodeName.toLowerCase() != "form") return null;

  var changed = [], n, c, def, o, ol, opt;

  for (var e = 0, el = form.elements.length; e < el; e++) {
    n = form.elements[e];
    c = false;

    switch (n.nodeName.toLowerCase()) {

    // select boxes
    case "select":
      def = 0;
      for (o = 0, ol = n.options.length; o < ol; o++) {
        opt = n.options[o];
        c = c || (opt.selected != opt.defaultSelected);
        if (opt.defaultSelected) def = o;
      }
      if (c && !n.multiple) c = (def != n.selectedIndex);
      break;

    // input / textarea
    case "textarea":
    case "input":

      switch (n.type.toLowerCase()) {
        case "checkbox":
        case "radio":
          // checkbox / radio
          c = (n.checked !== n.defaultChecked);
          break;
        case "hidden":
          // hidden value
          c = (n.value !== n.fcDefaultValue);
          break;
        default:
          // standard values
          c = (n.value !== n.defaultValue);
          break;
      }
      break;
    }
    if (c) changed.push(n);
  }

  // have inputs been added or removed?
  if (el !== form.fcElementCount) changed.push(form);

  return changed;
}
