variables = {}

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
		this.visible = false;
	}
}
SingularError.prototype.render = function() {
	var HTML = "<div id='" + this.id + "' hidden>" + this.message + "</div>";
	return HTML;
}
SingularError.prototype.setVisibility = function(onChange) {
	var shouldBeVisible = this.visibleIf() && (this.appearOnChange === true || onChange === false);
	this.questions.forEach((q) => {
		if (q.disabled) {
			shouldBeVisible = false;
		}
		if (!q.visible) {
			shouldBeVisible = false;
		}
	})
	if (shouldBeVisible === true && this.visible === false) {
		$(this.selector).show();
		this.visible = true;
	} else if (shouldBeVisible === false && this.visible === true) {
		$(this.selector).hide();
		this.visible = false;
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

class Question {
	constructor ({type, name, visibleIf=true, placeholder, defaultValue, disabledIf=false, isRequired=false}) {
		if (type === undefined) {
			throw Error("Question missing type");
		}
		this.type = type;		

		this.visibleIf = isFunction(visibleIf) ? visibleIf : function() {return visibleIf};
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
				this.disabled = false;
				this.setDisability = function() {
					if (this.disabledIf() === true && this.disabled === false) {
						$(this.inputSelector).prop('disabled', true);
						this.disabled = true;
					} else if (this.disabledIf() === false && this.disabled === true) {
						$(this.inputSelector).prop('disabled', false);
						this.disabled = false;
					}
					this.errors.forEach((e) => {
						e.setVisibility(true);
					})
				}
				this.visible = true;
				this.setVisibility = function(page) {
					if (this.visibleIf() === true && this.visible === false) {
						//page.makeQuestionVisible(this);
						$(this.inputSelector).show();
						this.visible = true;
					} else if (this.visibleIf() === false && this.visible === true) {
						//$(this.inputSelector).remove();
						$(this.inputSelector).hide();
						this.visible = false;
						this.disabled = false; // might want to refactor this
					}
					this.errors.forEach((e) => {
						e.setVisibility(true);
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
					page.questions.forEach((q) => {
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
									page.questions.find((q) => {return q.name === d}).setVisibility(page);
								})
							}, 250
						));
					}
					if (this.disabilityDependants.length !== 0) {
						$(this.inputSelector).keydown(debounce(
							() => {
								this.disabilityDependants.forEach((d) => {
									page.questions.find((q) => {return q.name === d}).setDisability();
								})
							}, 250
						));
					}
				}
				this.errors = [];
				this.linkToErrors = function(page) {
					page.errors.forEach((e) => {
						if (e.visibleIf.toString().includes('variables["' + this.name + '"]')) {
							this.errors.push(e);
						}
					});
					if (this.errors.length !== 0) {
						$(this.inputSelector).keydown(debounce(
							() => {
								this.errors.forEach((e) => {
									e.setVisibility(true);
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
	if (!this.visibleIf()) return undefined;

	var HTML = this.generateSkeletonHTML();
	return HTML
	if (append === true) {
		containerJQuery.append(HTML);	
	}	
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
		this.questions = [];
		this.errors = [];
		this.elements = elements;
		var templateSingularsToConvertIndices = [];
		var i = 0;
		while (i < this.elements.length) {
			const elm = this.elements[i];
			if (elm.constructor.name === "Question") {
				/* -- high priority template registration */
				if (elm.isRequired === true) {
					this.elements.splice(i, 0, new SingularTemplateError ({
						templateName: "required",
						questionName: elm.name,
					}));
					templateSingularsToConvertIndices.push({elmIdx: i, errIdx: this.errors.length});
				}
				this.questions.push(elm);
				i ++;
			} else if (elm.constructor.name === "SingularError") {
				this.errors.push(elm);
			} else if (elm.constructor.name === "SingularTemplateError") {
				templateSingularsToConvertIndices.push({elmIdx: i, errIdx: this.errors.length});
			}
			i ++;
		}

		this.initializeErrors = function(templates) {
			templateSingularsToConvertIndices.forEach((indices) => {
				const templateSingular = this.elements[indices.elmIdx];
				const template = templates.find((temp) => {return temp.name === templateSingular.templateName});
				const linkedQuestion = this.findQuestionByName(templateSingular.questionName);

				var visibleIfFuncString = template.visibleIfFuncStrings[linkedQuestion.type];
				visibleIfFuncString = visibleIfFuncString.replace("variables[]", 'variables["' + linkedQuestion.name + '"]');

				this.errors.splice(indices.errIdx, 0, new SingularError({
					name: templateSingular.templateName + templateSingular.questionName,
					message: template.message,
					visibleIf: eval("(" + visibleIfFuncString + ")"),
					appearOnChange: template.appearOnChange,
				}))
				this.elements[indices.elmIdx] = this.errors[indices.errIdx]
			})

			// push questions each error depends on in terms of state (visible/disabled)
			const varRegex = /variables\["(.+?)"\]/g;
			this.errors.forEach((e) => {
				const fString = e.visibleIf.toString();	
				var match = varRegex.exec(fString);
				while (match != null) {
					e.questions.push(this.findQuestionByName(match[1]));
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
		$("#page").append(elm.render());
	})


	// pass 2: set question properties
	this.questions.forEach((q) => {
		q.setProperties();
		q.linkToVariable && q.linkToVariable();
		q.linkToDependantQuestions && q.linkToDependantQuestions(this);
		q.linkToErrors && q.linkToErrors(this);
	})

	this.errors.forEach((e) => {
		e.setVisibility(false);
	})
}
Page.prototype.makeQuestionVisible = function(question) {
	var prevElm = undefined;
	for (var i = this.findQuestionIndex(question) - 1; i >= 0; i --) {
		if (this.questions[i].visibleIf()) {
			prevElm = $(this.questions[i].inputSelector);
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
}
Page.prototype.findQuestionIndex = function(question) {
	return this.questions.indexOf(question);
}
Page.prototype.findQuestionByName = function(qName) {
	return this.questions.find((q) => {return q.name === qName});
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
				/*
				new SingularTemplateError ({
					templateName: "required",
					questionName: "hi",
				}),*/
				new Question({
					type: Question.Types.TEXT,
					placeholder: "hi",
					visibleIf: function() {return variables["d"] !== "bye"},

					name: "hi",
					isRequired: true,
				}),
				new SingularError({
					name: "e1",
					message: "error",
					visibleIf: function() {return variables["d"] === ""},
				}),
				new Question({
					type: Question.Types.TEXT,
					placeholder: "plasework",
					defaultValue: "",
					visibleIf: function() {return variables["hi"] !== "1"},
					disabledIf: function() {return variables["hi"] !== "2"},

					name: "d",
				}),
			],
		}),
	],
}