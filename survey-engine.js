variables = {}

class Div {
	constructor({classes=[], children=[]}) {
		this.classes = classes;
		this.id = Div.count;
		Div.count ++;
		this.selector = "#" + this.id;

		this.children = children;
		this.visible = true;
	}
}
Div.count = 0;
Div.prototype.render = function(page) {
	var HTML = "<div id='" + this.id + "' class='" + this.classes.join(" ") + "'>";
	this.visible = true;
	this.children.forEach((c) => {
		HTML += c.render(page);
	})
	HTML += "</div>";
	return HTML
}
Div.prototype.isEmpty = function() {
	return this.children.find((c) => {return c.visible === true}) === undefined;
}

class SingularError {
	constructor({name, message, visibleIf, appearOnChange=true}) {
		this.name = name;
		this.message = message;
		if (!isFunction(visibleIf)) {
			throw Error ("Error visibility condition must be a function");
		}
		this.visibleIf = visibleIf;

		this.appearOnChange = appearOnChange;

		this.questions = [];
		this.id = name;
		this.selector = "#" + this.id;
	}
}
SingularError.prototype.render = function() {
	var HTML = "<div id='" + this.id + "' class='survey-error' hidden>" + this.message + "</div>";
	return HTML;
}
SingularError.prototype.updateVisibility = function(onChange) {
	var shouldBeVisible = this.visibleIf() && (this.appearOnChange === true || onChange === false);
	this.questions.forEach((q) => {
		if (q.disabledIf()) {
			shouldBeVisible = false;
		}
		if (!q.visibleIf()) {
			shouldBeVisible = false;
		}
	})
	if (shouldBeVisible === true) {
		$(this.selector).show();
	} else if (shouldBeVisible === false) {
		$(this.selector).hide();
	}
}
class TemplateError {
	constructor({name, message, appearOnChange=true, visibleIfFuncStrings={}, questionName}) {
		this.name = name;
		this.message = message;
		this.appearOnChange = appearOnChange;
		this.questionName = questionName;
		this.visibleIfFuncStrings = visibleIfFuncStrings;
	}
}
class SingularTemplateError {
	constructor({templateName, questionName}) {
		this.templateName = templateName;
		this.questionName = questionName;
	}
}

class Title {
	constructor({text, questionName}) {
		this.text = text;
		this.questionName = questionName;
	}
}
Title.prototype.render = function(page) {
	const correspondingQuestion = page.findQuestionByName(this.questionName);
	if (correspondingQuestion === undefined) {
		throw Error("Title does not correspond to any question");
	}
	if (!correspondingQuestion.visibleIf()) return "";
	return "<h1>" + this.text + "</div>";
}
class Question {
	constructor ({type, name, visibleIf=true, placeholder, defaultValue, disabledIf=false, isRequired=false}) {
		if (type === undefined) {
			throw Error("Question missing type");
		}
		this.type = type;		

		this.visibleIf = isFunction(visibleIf) ? visibleIf : function() {return visibleIf};
		this.visible = visibleIf();
		// only used for text atm
		this.disabledIf = isFunction(disabledIf) ? disabledIf : function() {return disabledIf};

		if (name === undefined) {
			throw Error("Question missing name");
		}
		this.name = name;

		this.inputId = "q_" + this.name + "_i";
		this.inputSelector = "#" + this.inputId;

		switch (this.type) {
			case Question.Types.TEXT:
				this.isRequired = isRequired;
				this.generateSkeletonHTML = function() {
					var HTML = "<input id='" + this.inputId + "' type='text'/>"
					return HTML;
				}
				if (placeholder !== undefined) {
					this.setPlaceholder = function() {
						$(this.inputSelector).prop('placeholder', placeholder);
					}
				}
				this.setDefaultValue = function() {
					var setVal = variables[this.name];
					if (setVal === undefined) {
						if (defaultValue !== undefined) {
							$(this.inputSelector).val(defaultValue);
						}
					} else {
						$(this.inputSelector).val(setVal);
					}
				}
				this.setVariable = function() {
					if (variables[this.name] === undefined) {
						variables[this.name] = $(this.inputSelector).val();
					}	
				}
				this.setDisability = function() {
					if (!this.visibleIf()) return;
					if (this.disabledIf() === true) {
						$(this.inputSelector).prop('disabled', true);
					} else if (this.disabledIf() === false) {
						$(this.inputSelector).prop('disabled', false);
					}
					this.errors.forEach((e) => {
						e.updateVisibility(true);
					})
				}
				this.updateVisibility = function(page) {
					if (this.visibleIf() === true && this.visible === false) {
						this.visible = true;
						page.showQuestion(this);
					} else if (this.visibleIf() === false && this.visible === true) {
						// set visible first because it is used to determine if parent divs need to be hidden
						this.visible = false;
						page.hideQuestion(this);
					}
					this.errors.forEach((e) => {
						e.updateVisibility(true);
					})
				}
				this.linkToVariable = function() {
					$(this.inputSelector).keydown(debounce(
						() => {
							variables[this.name] = $(this.inputSelector).val();
						}, 250
					));
				}
				this.visibilityDependants = [];
				this.disabilityDependants = [];
				this.linkToDependantQuestions = function(page) {
					page.questions().forEach((q) => {
						if (q.visibleIf.toString().includes('variables["' + this.name + '"]')) {
							this.visibilityDependants.push(q.name);
						} 
						if (q.disabledIf.toString().includes('variables["' + this.name + '"]')) {
							this.disabilityDependants.push(q.name);
						}
					});
					if (this.visibilityDependants.length !== 0) {
						$(this.inputSelector).keydown(debounce(
							() => {
								this.visibilityDependants.forEach((d) => {
									page.questions().find((q) => {return q.name === d}).updateVisibility(page);
								})
							}, 250
						));
					}
					if (this.disabilityDependants.length !== 0) {
						$(this.inputSelector).keydown(debounce(
							() => {
								this.disabilityDependants.forEach((d) => {
									page.questions().find((q) => {return q.name === d}).setDisability();
								})
							}, 250
						));
					}
				}
				this.errors = [];
				this.linkToErrors = function(page) {
					page.errors().forEach((e) => {
						if (e.visibleIf.toString().includes('variables["' + this.name + '"]')) {
							this.errors.push(e);
						}
					});
					if (this.errors.length !== 0) {
						$(this.inputSelector).keydown(debounce(
							() => {
								this.errors.forEach((e) => {
									e.updateVisibility(true);
								})
							}, 250
						));
					}
				}
				break;
		}
	}
}
Question.Types = {
	TEXT: "TEXT",
}

Question.prototype.render = function() {
	if (!this.visibleIf()) return "";

	var HTML = this.generateSkeletonHTML();
	return HTML
}
Question.prototype.setProperties = function() {
	this.setPlaceholder && this.setPlaceholder();
	this.setDefaultValue && this.setDefaultValue();
	this.setVariable && this.setVariable();
	this.setDisability && this.setDisability();
}

class Page {
	constructor({elements=[], visibleIf=true}) {
		this.errorsInitialized = false;
		this.elements = elements;
		var templateSingularsToConvertIndices = [];

		this.findElement = (className) => {
			const recurse = function(collection) {
				var results = [];
				for (var i in collection) {
					if (collection[i].constructor.name === className) {
						results.push(collection[i]);
					} else if (collection[i].constructor.name === "Div") {
						results = results.concat(recurse(collection[i].children));
					}
				}
				return results;
			}
			return recurse(this.elements);
		}

		this.initializeErrors = (templates) => {
			const qs = this.questions();
			const recurse = (collection) => {
				var i = 0;
				while (i < collection.length) {
					// find which to convert
					var singularTemplate = undefined;
					var insertBefore;
					if (collection[i].constructor.name === "SingularTemplateError") {
						singularTemplate = collection[i];
						insertBefore = false;
					} else if (collection[i].constructor.name === "Question") {
						/* -- high priority template registration */
						if (collection[i].isRequired === true) {
							singularTemplate = new SingularTemplateError({
								templateName: "required",
								questionName: collection[i].name,
							})
							insertBefore = true;
						}
					}
					if (singularTemplate !== undefined) {
						// convert
						const template = templates.find((temp) => {return temp.name === singularTemplate.templateName});
						const linkedQuestion = this.findQuestionByName(singularTemplate.questionName, qs);

						var visibleIfFuncString = template.visibleIfFuncStrings[linkedQuestion.type];
						visibleIfFuncString = visibleIfFuncString.replace("variables[]", 'variables["' + linkedQuestion.name + '"]');

						const singularError = new SingularError({
							name: singularTemplate.templateName + singularTemplate.questionName,
							message: template.message,
							visibleIf: eval("(" + visibleIfFuncString + ")"),
							appearOnChange: template.appearOnChange,
						})

						if (insertBefore === true) {
							collection.splice(i, 0, singularError);
							i ++;
						} else {
							collection[i] = singularError;
						}
					} else if (collection[i].constructor.name === "Div") {
						recurse(collection[i].children);
					}
					i ++;
				}
			}
			recurse(this.elements);

			// push questions each error depends on in terms of state (visible/disabled)
			const varRegex = /variables\["(.+?)"\]/g;
			this.errors().forEach((e) => {
				const fString = e.visibleIf.toString();	
				var match = varRegex.exec(fString);
				while (match != null) {
					e.questions.push(this.findQuestionByName(match[1], qs));
					match = varRegex.exec(fString);
				}
			})

			this.errorsInitialized = true;
		}

		this.visibleIf = isFunction(visibleIf) ? visibleIf : function() {return visibleIf};
	}
}
Page.prototype.render = function(containerJQuery) {
	var HTML = "<div id='page'></div>";
	containerJQuery.append(HTML);

	// pass 1: put elements into the DOM
	this.elements.forEach((elm) => {
		$("#page").append(elm.render(this));
	})

	// pass 2: set question properties
	this.questions().forEach((q) => {
		q.setProperties();
		q.linkToVariable && q.linkToVariable();
		q.linkToDependantQuestions && q.linkToDependantQuestions(this);
		q.linkToErrors && q.linkToErrors(this);
	})

	this.errors().forEach((e) => {
		e.updateVisibility(false);
	})
}
Page.prototype.hideQuestion = function(question) {
	$(question.inputSelector).remove();
	var parentDiv = question;
	do {
		parentDiv = this.getParentDiv(parentDiv);
		var hidden = true;
		if (parentDiv !== undefined && parentDiv !== this && parentDiv.isEmpty()) {
			$(parentDiv.selector).remove();
			parentDiv.visible = false;
		} else {
			hidden = false;
		}
	} while (hidden === true);
}
Page.prototype.showElement = function(element) {
	var parentDiv = element;
	var topElmToShow = element;
	do {
		parentDiv = this.getParentDiv(parentDiv);
		if (parentDiv !== this && parentDiv !== undefined && !parentDiv.visible) {
			topElmToShow = parentDiv;
		}
	} while (parentDiv !== undefined && parentDiv !== this && !parentDiv.visible);

	var collection = [];
	if (parentDiv === undefined || parentDiv === this) {
		collection = this.elements;
	} else if (parentDiv.constructor.name === "Div") {
		collection = parentDiv.children;
	}

	var pre = undefined;
	for (i in collection) {
		if (collection[i] === topElmToShow) break;
		else if ((collection[i].visibleIf && collection[i].visibleIf()) || collection[i].visible) {
			pre = collection[i];
		}
	}
	var parentSelector = (parentDiv === undefined || parentDiv === this) ? $("#page") : $(parentDiv.selector);
	if (pre === undefined) {
		parentSelector.prepend(topElmToShow.render(this));
	} else {
		parentSelector.after(topElmToShow.render(this));
	}
}
Page.prototype.showQuestion = function(question) {
	const title = this.findTitleByQuestionName(question.name);
	if (title !== undefined) {
		this.showElement(this.findTitleByQuestionName(question.name));
	}
	this.showElement(question);

	question.setProperties();
	question.linkToVariable && question.linkToVariable();
	question.linkToDependantQuestions && question.linkToDependantQuestions(this);
	question.linkToErrors && question.linkToErrors(this);
}
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

		return undefined;
	}
	return recurse(this);
}
/*
Page.prototype.showQuestion = function(question) {
	var prevElm = undefined;
	for (var i = this.findQuestionIndex(question) - 1; i >= 0; i --) {
		if (this.questions()[i].visibleIf()) {
			prevElm = $(this.questions()[i].inputSelector);
			prevElm.after(question.render());
			break;
		}
	}
	if (!prevElm) {
		prevElm = $("#page");
		prevElm.prepend(question.render());
	}
	question.setProperties();
	question.linkToVariable && question.linkToVariable();
	question.linkToDependantQuestions && question.linkToDependantQuestions(this);
	question.linkToErrors && question.linkToErrors(this);
}*/
Page.prototype.questions = function() {
	return this.findElement("Question");
}
Page.prototype.errors = function() {
	return this.findElement("SingularError");
}
Page.prototype.titles = function() {
	return this.findElement("Title");
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
	constructor({pages=[], templateErrors=[]}) {
		this.pages = pages;
		this.templateErrors = templateErrors;
	}
}
Survey.prototype.render = function(containerJQuery) {
	const page = this.pages.find((p) => {
		return p.visibleIf();
	})
	if (page.errorsInitialized === false) {
		page.initializeErrors(this.templateErrors);
	}
	page.render(containerJQuery);
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

var survey;
$(document).ready(function() {
 	survey = new Survey(surveyJSON)
	survey.render($("#surveyContainer"));
})



//	constructor({name, message, appearOnChange=true, visibleIfFuncs={}}) {
/// SURVEY
const surveyJSON = {
	templateErrors: [
		new TemplateError({
			name: "required",
			message: "Missing required field",
			appearOnChange: true,
			visibleIfFuncStrings: {
				[Question.Types.TEXT]: 'function() {return variables[] === ""}',
			}
		})
	],
	pages: [
		new Page({
			elements: [
				new Div({
					classes: ["row", "small-6 columns"],
					children: [
						/*
						new SingularTemplateError ({
							templateName: "required",
							questionName: "left",
						}),*/
						new SingularError ({
							name: "fuckyou",
							message: "fuck you",
							visibleIf: function() { return variables["left"] !== ""},
							appearOnChange: true,
						})
					]
				}),
				new Title({
					text: "PLEASE WORK",
					questionName: "left",
				}),
				new Div({
					classes: ["row", "small-6"],
					children: [
						new Div({
							classes: ["small-6 columns"],
							children: [new Div({
								children: [
									new Question({
										type: Question.Types.TEXT,
										placeholder: "left",
										defaultValue: "",
										visibleIf: function() {return variables["right"] === "1"},
										disabledIf: function() {return variables["right"] !== "2"},

										name: "left",
									}),
								],
							}),
							]
						}),
						new Div({
							classes: ["small-6 columns"],
							children: [
								new Question({
									type: Question.Types.TEXT,
									placeholder: "right",
									visibleIf: function() {return variables["left"] !== "bye"},

									name: "right",
								}),
							],
						})
					]
				}),
			],
		}),
	],
}