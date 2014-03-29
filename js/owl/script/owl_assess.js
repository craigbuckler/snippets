/*	---------------------------------------------

	owl.Assess

	--------------------------------------------- */
if (owl && owl.innerHTML && owl.Screen && owl.Effect && !owl.Assess) {

	// Assess object
	owl.Assess = function(node) {

		// shortcuts
		var $C = owl.Css;
		var $D = owl.Dom;
		var $E = owl.Event;
		var $Conf = owl.Assess.Config;
	
		// define new assessment
		if (!$C.ClassExists(node, $Conf.ActiveClass)) {

			// find nodes
			var QLn = $D.Get($Conf.QuestionListNodes, node); // question list
			var Qn = owl.Array.Make($D.Get($Conf.QuestionNode, node), null)[0]; // active question
			var An = owl.Array.Make($D.Get($Conf.AnswerContainer, node), null)[0]; // answer container list (of links)
			var Rn = $D.Get($Conf.ResultNodes, node); // results nodes
			var Qclass, Qnext, Qclick, Answer, Score;
			var Ready = true;
			
			// validate nodes and start
			if (QLn.length > 0 && Qn && An && Rn.length > 0) {

				// activate
				$C.ClassApply(node, $Conf.ActiveClass);
				
				// store original classes
				Qclass = [];
				owl.Each(QLn, function(n, i) { Qclass[i] = n.className; });
				
				new $E($D.Get("a", owl.innerHTML(node, $Conf.RestartHTML, false)), "click", Start); // restart link and event
				new $E(QLn, "click", ChangeQuestion); // change question events
				new $E($D.Get("a", An), "click", AnswerQuestion); // answer events
				
				Start();
			}
		}

		// hide questions and initialise
		function Start(e) {

			// restart link event
			if (e && e.StopDefaultAction) {
				e.StopDefaultAction();
				e.Element.blur();
			}
			owl.Each(QLn, function(n, i) { n.className = Qclass[i]; }); // reset question classes
			owl.Each(Rn, function(n) { n.style.display = "none"; }); // hide answers
			Qnext = -1;
			Qclick = null;
			Answer = [];
			Score = 0;
			NextQuestion();
		}

		// show next question
		function NextQuestion() {
			if (Qclick === null) { if (Qnext < QLn.length) Qnext++; }
			else Qclick = null;

			if (Qnext < QLn.length) ShowQuestion(Qnext);
			else ShowResult();
		}

		// change the current question
		function ChangeQuestion(e) {
			e = e.Element;
			if (e.blur) e.blur();
			Qclick = null;
			owl.Each(QLn, function(n, i) { if (e == n) Qclick = i; return (Qclick === null); });
			if (Qclick !== null) {
				// hide current question and show clicked
				if (Qnext < QLn.length) {
					$Conf.Effect.HideQuestion(Qn);
					$Conf.Effect.HideQuestion(An, function() { ShowQuestion(Qclick); });
				}
				else ShowQuestion(Qclick);
			}
		}
		
		// show question q
		function ShowQuestion(q) {
			var qt = $Conf.QuestionText;
			qt = qt.replace(/\[QN\]/gi, q+1);
			qt = qt.replace(/\[QT\]/gi, QLn.length);
			owl.innerHTML(Qn, qt);
			$D.Clone(QLn[q], Qn);

			// show question block and position
			$Conf.Effect.ShowQuestion(Qn);
			$Conf.Effect.ShowQuestion(An, function() { if (q > 0 || Qnext > 0) owl.Screen.ScrollToElement(An, 0, 100, 0, 70); });
			Ready = true;
		}
		
		// answer the questions
		function AnswerQuestion(e) {
			e.StopDefaultAction();
			var link = e.Element;
			link.blur();
			link = owl.Dom.Ancestors(link, "a");
			
			if (Ready && link) {
	
				Ready = false;
				var sc = owl.Number.toInt(link.href.replace(/.+#(\d+)$/, '$1'));
				var thisq = Qnext;
				if (Qclick !== null) {
						thisq = Qclick;
						Score -= Answer[thisq];
				}
				Answer[thisq] = sc;
				Score += sc;
	
				// reset and apply new class to the original question
				QLn[thisq].className = Qclass[thisq];
				$C.ClassApply(QLn[thisq], $D.Text(link));

				// hide question block
				$Conf.Effect.HideQuestion(Qn);
				$Conf.Effect.HideQuestion(An, NextQuestion);
			}
		}

		// show result
		function ShowResult() {
			var R = 0, Rs = 0;
			owl.Each(Rn, function(node, i) {
				node.style.display = "none";
				var sc = owl.Number.toInt(node.className.replace(/^[.+\s|]score(\d+).*/, '$1'));
				if (Score >= sc && sc > Rs) { R = i; Rs = sc; }
			});
			
			// hide question and show chosen answer
			Qn.style.display = "none";
			An.style.display = "none";
			$Conf.Effect.ShowResult(Rn[R]);
		}

	};

	/* ---------------------------------------------
	owl.YesNo.Config
	--------------------------------------------- */
	owl.Assess.Config = {
		AutoStart: true,
		Element: ".assess",
		ActiveClass: "active",
		QuestionListNodes: "ol li",
		QuestionNode: "p.ask",
		AnswerContainer: "ul",
		ResultNodes: "p[class!='ask']",
		QuestionText: '<strong>Question [QN] of [QT]:</strong> ',
		RestartHTML: '<p class="restart"><a href="#restart">Restart assessment...</a></p>',
		Effect: {
			ShowQuestion: owl.Effect.FadeIn,
			HideQuestion: owl.Effect.FadeOut,
			ShowResult: owl.Effect.FadeIn
		}
	};

	// auto-start yesno
	if (owl.Assess.Config.AutoStart) new owl.Event(window, "load", function (e) {
		owl.Each(owl.Dom.Get(owl.Assess.Config.Element), function(n) { new owl.Assess(n); });
	}, 99999);

}