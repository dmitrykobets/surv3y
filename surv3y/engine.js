var variables = {} // a container of all questions in the survey -- see Question.linkToVariable() for initialization

class Div {
	/*
		classes -- a list of css classes to apply to the element
		children -- a list containing any of [Div, Question, Title, SurveyError]
		removeIfEmpty -- whether or not to remove the `div` element from the page once all of its children are hidden/removed
						 this is useful for foundation grid layouts, as an empty div will keep elements around it from moving
	*/
	constructor({classes=[], children=[], removeIfEmpty=true}) {
		this.id = Div.count;
		Div.count ++;
		this.selector = "#" + this.id;

		this.classes = classes;
		this.children = children;
		this.removeIfEmpty = removeIfEmpty;

		this.visibleIf = function() {
			//return !this.removeIfEmpty || this.isEmpty() === false;
			return this.isEmpty() === false;
		}
		this.isAlreadyVisible = function() {
			if (this.removeIfEmpty === false) {
				return $(this.selector).is(':visible') === true;
			} else {
				return $(this.selector).length !== 0;
			}
		}
	}
}
Div.count = 0; // used as the id of each div

Div.prototype.render = function() {
	if (this.isAlreadyVisible()) return "";

	var HTML = "<div id='" + this.id + "' class='" + this.classes.join(" ") + "'>";
	this.children.forEach((c) => {
		if (c.isAlreadyVisible() === false) {
			if (c.visibleIf() === true || c.removeIfEmpty === false) {
				HTML += c.render();
			}
			if (c.visibleIf() === false && c.removeIfEmpty === false) {
				this.page.hideElement(c);
			}
		}
	})
	HTML += "</div>";
	return HTML;
}
Div.prototype.isEmpty = function() {
	var empty = true;
	for (var i in this.children) {
		if (this.children[i].constructor.name === "Div") {
			empty = this.children[i].isEmpty() === true;
		} else {
			empty = this.children[i].visibleIf() === false;
		}
		if (empty === false) break;
	}
	return empty;
}

class SurveyError {
	/*
		logicVisibleIf -- a function which returns true if the error should be present based on the inputs that trigger it
							example: An error indicating that 'isItYourBirthday' is a required field should return true here when 'isItYourBirthday' is empty
		appearOnChange -- when false, this error only appears when the user presses the 'next' button; otherwise, the error appears as soon as the logicVisibleIf condition is true
	*/
	constructor({name, message, logicVisibleIf, appearOnChange=true}) {
		this.name = name;
		this.message = message;

		this.id = name;
		this.selector = "#" + this.id;

		if (!isFunction(logicVisibleIf)) {
			throw Error ("SurveyError visibility condition must be a function");
		}
		this.logicVisibleIf = logicVisibleIf;
		this.visibleIf = () => {
			return this.logicVisibleIf() && this.isVisibleBasedOnQuestionState();
		}
		this.isAlreadyVisible = function() {
			return $(this.selector).length !== 0;
		}

		this.appearOnChange = appearOnChange;

		// an array of questions that trigger this error
		this.questions = [];
	}
}
SurveyError.prototype.render = function() {
	if (this.isAlreadyVisible()) return "";
	var HTML = "<div id='" + this.id + "' class='survey-error'>" + this.message + "</div>";
	return HTML;
}
SurveyError.prototype.isVisibleBasedOnQuestionState = function() {
	var shouldBeVisible = this.appearOnChange === true || Page.onChange === false;
	// needs to be fixed -- right now, if ANY of the triggering questions are disabled/invisible, the error will be removed even if remaining questions are visible/enabled.
	// This does not currently affect the functionality of the app based on the referral workflow,
	// but might start to if two questions that trigger the same error could become individually disabled/invisible
	this.questions.forEach((q) => {
		if (q.disabledIf()) {
			shouldBeVisible = false;
		}
		if (!q.visibleIf()) {
			shouldBeVisible = false;
		}
	})
	return shouldBeVisible;
}
SurveyError.prototype.updateVisibility = function() {
	if (this.visibleIf() === true) {
		this.page.showElement(this);
	} else {
		this.page.hideElement(this);
	}
}
// These classes are used in shore-survey.js and simply make it less verbose to make the same error pattern for different questions
class RequiredTextError extends SurveyError {
	constructor({questionName}) {
		super({name: questionName + "_req", message: "Please fill in this field", logicVisibleIf: function() {return variables[questionName] === ""}, appearOnChange: false});
	}
}
class RequiredDateError extends SurveyError {
	constructor({questionName}) {
		super({name: questionName + "_req", message: "Please fill in this field", logicVisibleIf: function() {return variables[questionName] === undefined || isNaN(moment(variables[questionName]))}, appearOnChange: false});
	}
}
class RequiredNumberError extends SurveyError {
	constructor({questionName}) {
		super({name: questionName + "_req", message: "Please fill in this field", logicVisibleIf: function() {return isNaN(variables[questionName])}, appearOnChange: false});
	}
}
class RequiredDropdownError extends SurveyError {
	constructor({questionName, match}) {
		super({name: questionName + "_req", message: "Please fill in this field", logicVisibleIf: function() {return variables[questionName] === match}, appearOnChange: false});
	}
}
class RequiredRadiogroupError extends SurveyError {
	constructor({questionName}) {
		super({name: questionName + "_req", message: "Please fill in this field", logicVisibleIf: function() {return variables[questionName] === undefined}, appearOnChange: false});
	}
}
class DateInFutureError extends SurveyError {
	constructor({questionName}) {
		super({name: questionName + "_dif", message: "Date should not be in the future", logicVisibleIf: function() {return moment(variables[questionName]).isAfter(moment())}, appearOnChange: true});
	}
}
class NegativeNumberError extends SurveyError {
	constructor({questionName}) {
		super({name: questionName + "_neg", message: "Input should be positive", logicVisibleIf: function() {return variables[questionName] < 0}, appearOnChange: true});
	}
}

class Title {
	/*
		questionName -- the name of the question that this title is describing
	*/
	constructor({text, tagName="h5", questionName}) {
		this.text = text;
		this.tagName = tagName;
		this.questionName = questionName;

		this.id = "title_" + questionName;
		this.selector = "#" + this.id;

		this.question = undefined; // a direct reference to the question this title is describing

		this.visibleIf = () => {
			if (this.question === undefined) {
				throw Error("Title does not correspond to any question");
			}
			return this.question.visibleIf();
		}
		this.isAlreadyVisible = function() {
			return $(this.selector).length !== 0;
		}
	}
}
Title.prototype.setQuestion = function(question) {
	this.question = question;
}
Title.prototype.render = function() {
	if (this.isAlreadyVisible()) return "";
	return "<" + this.tagName + " id='" + this.id + "'>" + this.text + "</" + this.tagName + ">";
}

/* TODO:
	- split up different question types
*/
class Question {
	/*
		type -- one of Question.Types
		classes -- a list of css classes
		isVertical -- applies to Question.Types.RADIOGROUP -- whether or not the radio buttons should be vertical
		options -- a list of options for checkbox groups and radio groups -- {value, text, isDefault}
		id -- applies to Question.Types.HTML -- the id to use for this element
		html -- a string containing html for Question.Types.HTML
			-- the html should contain the question's id so that the it can be properly hidden
		dynamicHTML -- a function returning html for Question.Types.DYNAMIC_HTML
		respondTo -- applies to Question.Types.DYNAMIC_HTML -- a list of question names which trigger this question's render method
	*/
	constructor ({type, name, isVertical=false, visibleIf=true, placeholder, defaultValue, disabledIf=false, options=undefined, id=undefined, html=undefined, dynamicHTML=undefined, respondTo=[]}) {
		if (type === undefined) {
			throw Error("Question missing type");
		}
		this.type = type;

		this.visibleIf = isFunction(visibleIf) ? visibleIf : function() {return visibleIf};
		this.isAlreadyVisible = function() {
			return $(this.selector).length !== 0;
		}
		this.disabledIf = isFunction(disabledIf) ? disabledIf : function() {return disabledIf};

		if (name === undefined) {
			throw Error("Question missing name");
		}
		this.name = name;

		this.isVertical = isVertical;

		if (this.type === Question.Types.HTML || this.type === Question.Types.DYNAMIC_HTML) {
			if (id === undefined) {
				throw Error("Missing id for html: " + this.name);
			}
			this.inputId = id;
		} else {
			this.inputId = "q_" + this.name + "_i";
		}
		this.selector = "#" + this.inputId;

		if (this.type === Question.Types.RADIOGROUP || this.type === Question.Types.DROPDOWN) {
			if (options === undefined) {
				throw Error("Missing options for: '" + this.name);
			}
		}
		this.options = options;

		if (this.type === Question.Types.HTML) {
			if (html === undefined) {
				throw Error("Html '" + this.name + "' missing html");
			}
		}
		this.html = html;

		if (this.type === Question.Types.DYNAMIC_HTML) {
			if (dynamicHTML === undefined) {
				throw Error("Dynamic HTML '" + this.name + "' missing dynamic html");
			}
			if (respondTo.length === 0) {
				throw Error("Dynamic HTML '" + this.name + "' missing respondTo");
			}
		}
		this.dynamicHTML = dynamicHTML;
		this.respondTo = respondTo;

		this.updateDynamicHTML = function() {
			switch (this.type) {
				case Question.Types.DYNAMIC_HTML:
					this.page.hideQuestion(this);
					this.page.showQuestion(this);
			}
		}

		this.generateSkeletonHTML = function() {
			switch (this.type) {
				case Question.Types.HTML:
					return this.html;
				case Question.Types.DYNAMIC_HTML:
					return this.dynamicHTML();
				case Question.Types.TEXT:
					var HTML = "<input id='" + this.inputId + "' type='text' />"
					return HTML;
				case Question.Types.DATE:
				    var HTML = "<input id='" + this.inputId + "' type='date' />"
					return HTML;
				case Question.Types.NUMBER:
					var HTML = "<input id='" + this.inputId + "' type='number' />"
					return HTML;
				case Question.Types.CHECKBOX:
					var HTML = "<input id='" + this.inputId + "' type='checkbox'>"
					return HTML;
				case Question.Types.DROPDOWN:
					var HTML = "<select id='" + this.inputId + "'>"
					this.options.forEach((o) => {
						HTML += "<option value='" + o.value + "'>" + o.text + "</option>"
					})
					HTML += "</select>"
					return HTML;
				case Question.Types.RADIOGROUP:
					var HTML = "<div id='" + this.inputId + "'>";
					this.options.forEach((o) => {
						if (this.isVertical === true) {
							HTML += "<label><input type='radio' name='" + this.name + "' value='" + o.value + "' /> " + o.text + "</label>";
						} else {
							HTML += "<label style='display:inline;margin-right:2rem;'><input type='radio' name='" + this.name + "' value='" + o.value + "' /> " + o.text + "</label>";
						}
					})
					return HTML;
			}
		}

		// Set the HTML element's placeholder
		this.setPlaceholder = function() {
			if (placeholder !== undefined) {
				switch (this.type) {
					case Question.Types.DATE:
					case Question.Types.NUMBER:
					case Question.Types.TEXT:
						$(this.selector).prop('placeholder', placeholder);
						break;
				}
			}
		}

		// Set the HTML element's default value
		this.setDefaultValue = function() {
			switch (this.type) {
				case Question.Types.DATE:
					var setVal = variables[this.name];
					if (setVal === undefined) {
						if (defaultValue !== undefined) {
							$(this.selector).val(moment(defaultValue).format("YYYY-MM-DD"));
						}
					} else {
							$(this.selector).val(moment(variables[this.name]).format("YYYY-MM-DD"));
					}
					break;
				case Question.Types.NUMBER:
				case Question.Types.TEXT:
					var setVal = variables[this.name];
					if (setVal === undefined) {
						if (defaultValue !== undefined) {
							$(this.selector).val(defaultValue);
						}
					} else {
						$(this.selector).val(setVal);
					}
					break;
				case Question.Types.DROPDOWN:
					var setVal = variables[this.name];
					if (setVal === undefined) {
						this.options.forEach((o) => {
							if (o.isDefault === true) {
								$(this.selector).val(o.value);
							}
						})
					} else {
						$(this.selector).val(setVal);
					}
					break;
				case Question.Types.RADIOGROUP:
					var setVal = variables[this.name];
					if (setVal === undefined) {
						this.options.forEach((o) => {
							if (o.isDefault === true) {
								$("[name='" + this.name + "'][value='" + o.value + "']").prop("checked", true);
							}
						})
					} else {
						$("[name='" + this.name + "'][value='" + setVal + "']").prop("checked", true);
					}
					break;
				case Question.Types.CHECKBOX:
					var setVal = variables[this.name];
					if (setVal === undefined) {
						if (defaultValue !== undefined) {
							$(this.selector).prop('checked', defaultValue);
						}
					} else {
						$(this.selector).prop('checked', setVal);
					}
					break;
			}
		}

		// Set the variables[...] entry for this Question
		this.initializeVariable = function() {
			switch (this.type) {
				case Question.Types.TEXT: // if question is empty, variables[...] = ""
					if (variables[this.name] === undefined) {
						variables[this.name] = $(this.selector).val();
					}
					break;
				case Question.Types.CHECKBOX: // if question is empty, variables[...] = false
					if (variables[this.name] === undefined) {
						variables[this.name] = $(this.selector).is(":checked");
					}
					break;
				case Question.Types.NUMBER: // if question is empty, variables[...] = NaN
					if (variables[this.name] === undefined) {
						variables[this.name] = parseFloat($(this.selector).val());
					}
					break;
				case Question.Types.RADIOGROUP: // if question is empty, variables[...] = undefined
					if (variables[this.name] === undefined) {
						variables[this.name] = $("[name='" + this.name + "']:checked").val();
					}
					break;
				case Question.Types.DATE: // if question is empty, variables[...] = undefined
					if (variables[this.name] === undefined) {
						variables[this.name] = undefined;
					}
					break;
				case Question.Types.DROPDOWN: // this question cannot be empty -- can delegate a specific option like 'Choose one...' as the role of an empty selection
					if (variables[this.name] === undefined) {
						variables[this.name] = $(this.selector).val();
					}
					break;
			}
		}

		// enables/disables the Question
		this.updateDisability = function() {
			Page.onChange = true;
			switch (this.type) {
				case Question.Types.CHECKBOX:
				case Question.Types.DATE:
				case Question.Types.NUMBER:
				case Question.Types.DROPDOWN:
				case Question.Types.TEXT:
					if (!this.visibleIf()) return;
					if (this.disabledIf() === true) {
						$(this.selector).prop('disabled', true);
					} else if (this.disabledIf() === false) {
						$(this.selector).prop('disabled', false);
					}
					this.errors.forEach((e) => {
						e.updateVisibility();
					})
					break;
				case Question.Types.RADIOGROUP:
					if (!this.visibleIf()) return;
					if (this.disabledIf() === true) {
						this.options.forEach((o) => {
							$("[name='" + this.name + "'][value='" + o.value + "']").prop('disabled', true);
						})
					} else if (this.disabledIf() === false) {
						this.options.forEach((o) => {
							$("[name='" + this.name + "'][value='" + o.value + "']").prop('disabled', false);
						})
					}
					this.errors.forEach((e) => {
						e.updateVisibility();
					})
					break;
			}
		}

		// hide/show the Question
		this.updateVisibility = function() {
			Page.onChange = true;
			switch (this.type) {
				case Question.Types.HTML:
				case Question.Types.DYNAMIC_HTML:
					if (this.visibleIf() === true) {
						this.page.showQuestion(this);
					} else {
						this.page.hideQuestion(this);
					}
					break;
				case Question.Types.RADIOGROUP:
				case Question.Types.DROPDOWN:
				case Question.Types.CHECKBOX:
				case Question.Types.DATE:
				case Question.Types.NUMBER:
				case Question.Types.TEXT:
					if (this.visibleIf() === true) {
						this.page.showQuestion(this);
					} else {
						this.page.hideQuestion(this);
					}
					// should update the errors once the questions have been shown/hidden
					this.errors.forEach((e) => {
						e.updateVisibility(true);
					})
					break;
			}
		}

		// set events to update the Question's variables[...] entry when the Question's input is updated by the user
		this.linkToVariable = function() {
			switch (this.type) {
				case Question.Types.RADIOGROUP:
					this.options.forEach((o) => {
						$("[name='" + this.name + "'][value='" + o.value + "']").change(() => {
							variables[this.name] = $("[name='" + this.name + "'][value='" + o.value + "']").prop('value');
						})
					})
					break;
				case Question.Types.DROPDOWN:
					$(this.selector).change(() => {
						variables[this.name] = $(this.selector).val();
					});
					break;
				case Question.Types.CHECKBOX:
					$(this.selector).change(() => {
						variables[this.name] = $(this.selector).is(":checked");
					});
					break;
				case Question.Types.TEXT:
					$(this.selector).keydown(() => {
						const element = $(this.selector);
						registerDebounce(() => {
							variables[this.name] = element.val();
						}, 250)
					});
					break;
				case Question.Types.NUMBER:
					$(this.selector).keydown(() => {
						const element = $(this.selector);
						registerDebounce(() => {
							variables[this.name] = parseFloat(element.val());
						}, 250);
					});
					$(this.selector).change(() => {
						const element = $(this.selector);
						registerDebounce(() => {
							variables[this.name] = parseFloat(element.val());
						}, 250)
					})
					break;
				case Question.Types.DATE:
					$(this.selector).keydown(() => {
						const element = $(this.selector);
						registerDebounce(() => {
							const val = moment(element.val());
							if (isNaN(val)) {
								variables[this.name] = undefined;
							} else {
								variables[this.name] = val;
							}
						}, 250)
					})
					$(this.selector).change(() => {
						const element = $(this.selector);
						registerDebounce(() => {
							const val = moment(element.val());
							if (isNaN(val)) {
								variables[this.name] = undefined;
							} else {
								variables[this.name] = val;
							}
						}, 250)
					})
					break;
			}
		}
		// these arrays hold names of questions which directly depend on THIS question
		// i.e., if "B" is within A.visibilityDependants, then whenever A's value changes, question B's visibility on the page is updated
		this.visibilityDependants = [];
		this.disabilityDependants = [];
		this.dynamicHTMLDependants = [];

		this.linkToDependantQuestions = function() {
			this.visibilityDependants = [];
			this.disabilityDependants = [];
			this.dynamicHTMLDependants = [];

			// visibilityDependants and disabilityDependants depend on the other question Q's visibleIf and disabledIf functions to contain variable[Q.name] within them
			// this makes it less verbose to set up dependencies between questions. However, if there comes a time when this is insufficient, can use the `respondTo` approach
			// (which was made much later) and force the questions constructors to contain lists of questions they depend on
			this.page.questions().forEach((q) => {
				if (q.visibleIf.toString().includes('variables["' + this.name + '"]')) {
					this.visibilityDependants.push(q.name);
				}
				if (q.disabledIf.toString().includes('variables["' + this.name + '"]')) {
					this.disabilityDependants.push(q.name);
				}
				if (q.respondTo.indexOf(this.name) !== -1) {
					this.dynamicHTMLDependants.push(q.name);
				}
			});
			switch (this.type) {
				case Question.Types.RADIOGROUP:
					if (this.visibilityDependants.length !== 0) {
						this.options.forEach((o) => {
							$("[name='" + this.name + "'][value='" + o.value + "']").change(() => {
								this.visibilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateVisibility();
								})
							});
						})
					}
					if (this.disabilityDependants.length !== 0) {
						this.options.forEach((o) => {
							$("[name='" + this.name + "'][value='" + o.value + "']").change(() => {
								this.disabilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateDisability();
								})
							});
						})
					}
					break;
				case Question.Types.DROPDOWN:
					if (this.visibilityDependants.length !== 0) {
						$(this.selector).change(() => {
							this.visibilityDependants.forEach((d) => {
								this.page.questions().find((q) => {return q.name === d}).updateVisibility();
							})
						});
					}
					if (this.disabilityDependants.length !== 0) {
						$(this.selector).change(() => {
							this.disabilityDependants.forEach((d) => {
								this.page.questions().find((q) => {return q.name === d}).updateDisability();
							})
						});
					}
					break;
				case Question.Types.CHECKBOX:
					if (this.visibilityDependants.length !== 0) {
						$(this.selector).change(() => {
							if (this.changed === true) {
								this.changed = false;
								return;
							}
							this.visibilityDependants.forEach((d) => {
								this.page.questions().find((q) => {return q.name === d}).updateVisibility();
							})
						});
					}
					if (this.disabilityDependants.length !== 0) {
						$(this.selector).change(() => {
							this.disabilityDependants.forEach((d) => {
								this.page.questions().find((q) => {return q.name === d}).updateDisability();
							})
						});
					}
				case Question.Types.DATE:
				case Question.Types.NUMBER:
					if (this.visibilityDependants.length !== 0) {
						$(this.selector).change(() => {
							registerDebounce(() => {
								this.visibilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateVisibility();
								})
							}, 250)
						})
					}
					if (this.disabilityDependants.length !== 0) {
						$(this.selector).change(() => {
							registerDebounce(() => {
								this.disabilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateDisability();
								})
							}, 250)
						})
					}
					if (this.dynamicHTMLDependants.length !== 0) {
						$(this.selector).change(() => {
							registerDebounce(() => {
								this.dynamicHTMLDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateDynamicHTML();
								})
							}, 250)
						})
					}
				case Question.Types.TEXT:
					if (this.visibilityDependants.length !== 0) {
						$(this.selector).keydown(() => {
							registerDebounce(() => {
								this.visibilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateVisibility();
								})
							}, 250)
						})
					}
					if (this.disabilityDependants.length !== 0) {
						$(this.selector).keydown(() => {
							registerDebounce(() => {
								this.disabilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateDisability();
								})
							}, 250)
						})
					}
					if (this.dynamicHTMLDependants.length !== 0) {
						$(this.selector).keydown(() => {
							registerDebounce(() => {
								this.dynamicHTMLDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateDynamicHTML();
								})
							}, 250)
						})
					}
					break;
			}
		}

		this.errors = [];

		// Behaves similarly to linkToDependantQuestions, except for SurveyError that are influenced by this Question
		this.linkToSurveyErrors = function() {
			this.errors = [];
			this.page.errors().forEach((e) => {
				if (e.questions.indexOf(this) !== -1) {
					this.errors.push(e);
				}
			});
			switch (this.type) {
				case Question.Types.RADIOGROUP:
					this.options.forEach((o) => {
						$("[name='" + this.name + "'][value='" + o.value + "']").change(() => {
							Page.onChange = true;
							this.errors.forEach((e) => {
								e.updateVisibility();
							})
						});
					})
					break;
				case Question.Types.DROPDOWN:
				case Question.Types.CHECKBOX:
					if (this.errors.length !== 0) {
						$(this.selector).change(() => {
							Page.onChange = true;
							this.errors.forEach((e) => {
								e.updateVisibility();
							})
						});
					}
					break;
				case Question.Types.DATE:
				case Question.Types.NUMBER:
					if (this.errors.length !== 0) {
						$(this.selector).change(() => {
							registerDebounce(() => {
								Page.onChange = true;
								this.errors.forEach((e) => {
									e.updateVisibility();
								})
							}, 250)
						})
					}
				case Question.Types.TEXT:
					if (this.errors.length !== 0) {
						$(this.selector).keydown(() => {
							registerDebounce(() => {
								Page.onChange = true;
								this.errors.forEach((e) => {
									e.updateVisibility();
								})
							}, 250)
						});
					}
					break;
			}
		}
	}
}
Question.Types = {
	TEXT: "TEXT",
	NUMBER: "NUMBER",
	DATE: "DATE",
	RADIOGROUP: "RADIOGROUP",
	CHECKBOX: "CHECKBOX",
	DROPDOWN: "DROPDOWN",
	HTML: "HTML",
	DYNAMIC_HTML: "DYNAMIC_HTML",
}

Question.prototype.render = function() {
	if (this.isAlreadyVisible()) return "";

	var HTML = this.generateSkeletonHTML();
	return HTML
}
Question.prototype.setProperties = function() {
	this.setPlaceholder();
	this.setDefaultValue();
	this.initializeVariable();
}

class Page {
	/*
		elements -- an array of [Div, Question, SurveyError, Title]
	*/
	constructor({elements=[], visibleIf=true, nextBtnText="Next &#9654;&#xFE0E;", prevBtnText="&#9664;&#xFE0E; Previous", isNextButtonVisible=true}) {
		this.nextBtnText = nextBtnText;
		this.prevBtnText = prevBtnText;
		this.isNextButtonVisible = isNextButtonVisible;

		this.elements = elements;

		/*
			Recursively flatten all elements within this page into one array
			classNames -- the names of specific elements (i.e., "Question", "Div", ...) to find
		*/
		this.findElements = (classNames=[]) => {
			const recurse = function(collection) {
				var results = [];
				for (var i in collection) {
					if (classNames.length === 0 || classNames.indexOf(collection[i].constructor.name) !== -1) {
						results.push(collection[i]);
					}
					// Divs are themselves collections of elements, so perform the recursion on them
					if (collection[i].constructor.name === "Div") {
						results = results.concat(recurse(collection[i].children));
					}
				}
				return results;
			}
			return recurse(this.elements);
		}
		// Give each element an instance of this page so that various methods like getParentDiv are accessible
		this.findElements().forEach((e) => {
			e.page = this;
		})

		const qs = this.questions();

		// give each SurveyError a list of questions that it depends on (listed in logicVisibleIf)
		const varRegex = /variables\["(.+?)"\]/g;
		this.findElements(["SurveyError"]).forEach((e) => {
			const fString = e.logicVisibleIf.toString();
			var match = varRegex.exec(fString);
			while (match != null) {
				e.questions.push(this.findQuestionByName(match[1], qs));
				match = varRegex.exec(fString);
			}
		})

		// give each reusable SurveyError the question it depends on -- these have not been set in the SurveyError loop above because the regex expression does not match
		// the programatically generated logicVisibleIf within each reusable SurveyError -- see the reusable SurveyError (i.e., RequiredTextError) constructors
		this.findElements(["RequiredTextError", "RequiredNumberError", "RequiredDateError", "RequiredDropdownError", "RequiredRadiogroupError", "DateInFutureError", "NegativeNumberError"]).forEach((e) => {
			e.questions.push(this.findQuestionByName(e.name.substring(0, e.name.length - "_req".length), qs));
		})

		// give each title a reference to the question that it depends on
		this.titles().forEach((t) => {
			t.setQuestion(this.findQuestionByName(t.questionName, qs));
		})

		this.visibleIf = isFunction(visibleIf) ? visibleIf : function() {return visibleIf};
	}
}
Page.onChange = false;
Page.prototype.render = function(containerJQuery) {
	var HTML = "<div id='page'></div>";
	containerJQuery.append(HTML);

	// pass 1: put elements into the DOM
	// If error conditions match but questions that these errors are meant for are initially disabled/hidden, then errors are still rendered
	this.elements.forEach((elm) => {
		if (elm.visibleIf()) {
			$("#page").append(elm.render());
		}
	})

	// pass 2: set question properties
	this.questions().forEach((q) => {
		q.setProperties();
		q.linkToVariable();
		q.linkToDependantQuestions();
		q.linkToSurveyErrors();
	})

	// pass3: set question visibility/disability
	this.questions().forEach((q) => {
		q.updateDisability();
		q.updateVisibility();
	})

	// Hide errors that should not have been rendered in pass 1
	this.errors().forEach((e) => {
		Page.onChange = true;
		e.updateVisibility();
	})
}
/*
	element -- one of [SurveyError, Title, Question] to be removed from the page

	If the element is the last visible child of a parent Div, remove that Div
*/
Page.prototype.hideElement = function(element) {
	const hideDiv = function(div) {
		if (div.removeIfEmpty === true) {
			$(div.selector).remove();
		} else {
			$(div.selector).hide();
		}
	}

	if (!element.isAlreadyVisible()) return;
	$(element.selector).remove();

	var parentDiv = element;
	do {
		parentDiv = this.getParentDiv(parentDiv);
		var parentDivNeedsToBeRemoved = parentDiv !== this && parentDiv.visibleIf() === false;
		if (parentDivNeedsToBeRemoved) {
			hideDiv(parentDiv);
		}
	} while (parentDivNeedsToBeRemoved === true);
}

/*
	element -- one of [SurveyError, Title, Question] to be shown on the page
		-- any parent divs that were hidden are also shown
*/
Page.prototype.showElement = function(element) {
	if (element.isAlreadyVisible()) return;

	var hiddenButNotRemovedAncestors = []; // contains elements that have hidden visibility and are not children of `highestRemovedAncestor`
	var highestRemovedAncestor = undefined;

	var lowestVisibleAncestorInDOM = element;
	do {
		lowestVisibleAncestorInDOM = this.getParentDiv(lowestVisibleAncestorInDOM);
		isAncestorHidden = lowestVisibleAncestorInDOM !== this && lowestVisibleAncestorInDOM.isAlreadyVisible() === false;
		if (isAncestorHidden) {
			if (lowestVisibleAncestorInDOM.removeIfEmpty === true) {
				highestRemovedAncestor = lowestVisibleAncestorInDOM;
				hiddenButNotRemovedAncestors = []; // all divs in this array were children of `highestRemovedAncestor` and will be re-rendered when it is re-added
			} else {
				hiddenButNotRemovedAncestors.push(lowestVisibleAncestorInDOM);
			}
		}
	} while (isAncestorHidden);

	if (hiddenButNotRemovedAncestors.length !== 0) {
		lowestVisibleAncestorInDOM = hiddenButNotRemovedAncestors[0];
		for (i = hiddenButNotRemovedAncestors.length - 1; i >= 0; i --) {
			$(hiddenButNotRemovedAncestors[i].selector).show();
		}
	}

	var childrenOfLowestVisibleAncestorInDOM = lowestVisibleAncestorInDOM === this ? this.elements : lowestVisibleAncestorInDOM.children;
	var selectorOflowestVisibleAncestorInDOM = lowestVisibleAncestorInDOM === this ? $("#page") : $(lowestVisibleAncestorInDOM.selector);
	var objectToRender = highestRemovedAncestor === undefined ? element : highestRemovedAncestor;

	var pre = undefined;
	for (i in childrenOfLowestVisibleAncestorInDOM) {
		if (childrenOfLowestVisibleAncestorInDOM[i] === objectToRender || childrenOfLowestVisibleAncestorInDOM[i].removeIfEmpty === false) {
			break;
		}
		else if (childrenOfLowestVisibleAncestorInDOM[i].isAlreadyVisible()) {
			pre = childrenOfLowestVisibleAncestorInDOM[i];
		}
	}

	if (pre === undefined) {
		selectorOflowestVisibleAncestorInDOM.prepend(objectToRender.render());
	} else {
		$(pre.selector).after(objectToRender.render());
	}
}
Page.prototype.hideQuestion = function(question) {
	this.hideElement(question);
	const title = this.findTitleByQuestionName(question.name);
	if (title !== undefined) {
		this.hideElement(title);
	}
}
Page.prototype.showQuestion = function(question) {
	const title = this.findTitleByQuestionName(question.name);
	if (title !== undefined) {
		this.showElement(title);
	}
	this.showElement(question);
	// perform sequence of question initialization, as in Page.prototype.render()
	question.setProperties();
	question.linkToVariable();
	question.linkToDependantQuestions();
	question.linkToSurveyErrors();
	question.updateDisability();
	// don't need to update visibility, because this method call is a direct product of that method having been called
	// at this point, error visibility has already been updated by the question
}

/*
	elm -- an element (Div, Question, SurveyError, Title) whose parent is the one to find
	Return: a Div or Page element which is the closest ancestor of `elm`, or undefined if `elm` cannot be found
		Perform a depth-first search on the page structure
*/
Page.prototype.getParentDiv = function(elm) {
	const recurse = (source) => {
		var collection = [];
		if (source === this) {
			collection = this.elements;
		} else if (source.constructor.name === "Div") {
			collection = source.children;
		}
		var ret = undefined;
		if (collection.length !== 0) {
			for (i in collection) {
				if (collection[i] === elm) {
					ret = source;
				} else {
					ret = recurse(collection[i])
				}
				if (ret !== undefined) return ret;
			}
		}

		return ret;
	}
	const ret = recurse(this);
	if (ret === undefined) {
		throw Error("Unable to find element " + elm.name);
	}
	return ret;
}
Page.prototype.questions = function() {
	return this.findElements(["Question"]);
}
Page.prototype.errors = function() {
	return this.findElements(["SurveyError", "RequiredTextError", "RequiredNumberError", "RequiredDateError", "RequiredDropdownError", "RequiredRadiogroupError", "DateInFutureError", "NegativeNumberError"]);
}
Page.prototype.titles = function() {
	return this.findElements(["Title"]);
}

// return true if no errors are present on the page; otherwise, return false
Page.prototype.runValidators = function() {
	var noErrors = true;
	this.errors().forEach((e) => {
		Page.onChange = false;
		e.updateVisibility();
		if (e.isAlreadyVisible()) {
			noErrors = false;
		}
	})
	return noErrors;
}

Page.prototype.findQuestionIndex = function(question) {
	return this.questions().indexOf(question);
}
Page.prototype.findQuestionByName = function(qName, preloaded=undefined) {
	if (preloaded !== undefined) {
		return preloaded.find((q) => {return q.name === qName});
	} else {
		return this.questions().find((q) => {return q.name === qName});
	}
}
Page.prototype.findTitleByQuestionName = function(qName) {
	return this.titles().find((t) => {return t.questionName === qName});
}

class Survey {
	/*
		containerJQuery -- the div on the page into which this survey is being inserted
	*/
	constructor({pages=[], containerJQuery=undefined}) {
		this.pages = pages;
		this.currentPageIdx = 0;
		if (containerJQuery === undefined) {
			throw Error("Missing container for survey")
		}
		this.containerJQuery = containerJQuery;

		this.onComplete = function(){}
		this.onNextPage = function(){}
		this.onPrevPage = function(){}
	}
}
Survey.prototype.render = function() {
	this.containerJQuery.empty();

	while (this.currentPageIdx < this.pages.length && this.pages[this.currentPageIdx].visibleIf() === false) {
		this.currentPageIdx ++;
	}
	const page = this.currentPageIdx === this.pages.length ? undefined : this.pages[this.currentPageIdx]
	if (page !== undefined) {
		page.render(this.containerJQuery);
	}

	var NAV = "<div id='nav' class='row small-11 medium-8 large-5 columns text-center'>";

	if (this.currentPageIdx !== 0) {
		NAV += "<input id='prev-btn' type='button' class='button' value='" + this.currentPage().prevBtnText + "'/>"
	}
	if (this.currentPage().isNextButtonVisible === true) {
		NAV += "<input id='next-btn' type='button' class='button' value='" + this.currentPage().nextBtnText + "'/>"
	}
	NAV += "</div>"
	$("#page").after(NAV)

	$("#prev-btn").click(() => {
		this.goToPrevPage();
	})

	$("#next-btn").click(() => {
		this.attemptToGoToNextPage();
	})
}
Survey.prototype.attemptToGoToNextPage = function() {
	// wait for all elements (errors, questions, ...) to have finished rendering
	awaitDebounce(() => {
		const noErrors = this.currentPage().runValidators(true);
		if (noErrors) {
			this.goToNextPage();
		}
	})
}
Survey.prototype.goToNextPage = function() {

	const oldPageIdx = this.currentPageIdx;
	do {
		this.currentPageIdx ++;
	} while (this.currentPageIdx !== this.pages.length && this.currentPage().visibleIf() === false);

	if (this.currentPageIdx === this.pages.length) {
		this.currentPageIdx = oldPageIdx;
		this.onComplete();
	} else {
		this.render();
		this.onNextPage();
	}
}
Survey.prototype.goToPrevPage = function() {
	if (this.currentPageIdx === 0) return;
	do {
		this.currentPageIdx --;
	} while (this.currentPageIdx > 0 && this.currentPage().visibleIf() === false);

	this.render();
	this.onPrevPage();
}

Survey.prototype.currentPage = function() {
	return this.pages[this.currentPageIdx];
}

Survey.prototype.findPageByQuestionName = function(qName) {
	return this.pages.find((p) => {
		return p.findQuestionByName(qName) !== undefined;
	})
}

/*
	Return whether or not the user can get to the question named `qName` based on the already input answers
*/
Survey.prototype.isQuestionPartOfWorkflow = function(qName) {
	const page = this.findPageByQuestionName(qName);
	return page.visibleIf() === true && page.findQuestionByName(qName).visibleIf() === true;
}

function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}
// Source: https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

const debounceQueue = [];
var debounceToken = 0;
function registerDebounce(action, duration) {
	const tok = ++ debounceToken;
	debounceQueue.push(tok);
	debounce(() => {
		unregisterDebounce(tok);
		action();
	}, duration)()
}
function unregisterDebounce(tok) {
	const idx = debounceQueue.indexOf(tok);
	if (idx !== -1) {
		debounceQueue.splice(idx, 1);
	}
}
function isDebouncing() {
	return debounceQueue.length !== 0;
}
function awaitDebounce(func) {
	if (isDebouncing() === true) {
		const waitForDb = setInterval(() => {
			if (isDebouncing() === false) {
				clearInterval(waitForDb);
				func();
			}
		}, 1);
	} else {
		func();
	}
}