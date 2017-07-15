variables = {}

class Question {
	constructor ({type, name, visibleIf=true, placeholder, defaultValue, disabledIf=false}) {
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
				}
				this.linkToVariable = function() {
					$(this.inputSelector).keydown(debounce(
						() => {
							variables[this.name] = $(this.inputSelector).val();
						}, 250
					));
				}
				this.linkToDependants = function(questions) {
					this.visibilityDependants = [];
					this.disabilityDependants = [];
					questions.forEach((q) => {
						if (q.visibleIf.toString().includes('variables["' + this.name + '"]')) {
							this.visibilityDependants.push(q.name);
						} else if (q.disabledIf.toString().includes('variables["' + this.name + '"]')) {
							this.disabilityDependants.push(q.name);
						}
					});
					if (this.visibilityDependants.length !== 0) {
						$(this.inputSelector).change(() => {
							// todo	
						});
					}
					if (this.disabilityDependants.length !== 0) {
						$(this.inputSelector).keydown(debounce(
							() => {
								this.disabilityDependants.forEach((d) => {
									questions.find((q) => {return q.name === d}).setDisability();
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
	TEXT: 0,
}

Question.prototype.render = function(containerJQuery, append) {
	if (!this.visibleIf()) return;

	var HTML = this.generateSkeletonHTML();
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
	constructor({questions=[], visibleIf=true}) {
		this.questions = questions;
		this.visibleIf = isFunction(visibleIf) ? visibleIf : function() {return visibleIf};
	}
}
Page.prototype.render = function(containerJQuery) {
	var HTML = "<div id='page'></div>";
	containerJQuery.append(HTML);

	// pass 1: put questions into the DOM
	this.questions.forEach((q) => {
		q.render($("#page"), true);
	})

	// pass 2: set question properties
	this.questions.forEach((q) => {
		q.setProperties();
		q.linkToVariable && q.linkToVariable();
		q.linkToDependants && q.linkToDependants(this.questions);
	})
}


class Survey {
	constructor({pages=[]}) {
		this.pages = pages;
	}
}
Survey.prototype.render = function(containerJQuery) {
	const page = this.pages.find((p) => {
		return p.visibleIf();
	})
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

$(document).ready(function() {
	const survey = new Survey(surveyJSON);
	survey.render($("#surveyContainer"));
})



/// SURVEY
const surveyJSON = {
	pages: [
		new Page({
			questions: [
				new Question({
					type: Question.Types.TEXT,
					placeholder: "hi",
					disabledIf: function() {return variables["d"] === "hi"},

					name: "hi",
					visibleIf: true,
				}),
				new Question({
					type: Question.Types.TEXT,

					name: "d",
				}),
			],
		}),
	],
}