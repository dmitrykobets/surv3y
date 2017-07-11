var variables = {};

class Question {
	constructor ({name, type, visibleIf = true, disabledIf = false, title, isRequired, dropdownOptions = [], checkboxOptions = [], radioOptions=[], html="", radioVertical=false}) {
		this.name = name;
		if (!variables.hasOwnProperty(name)) {
			variables[name] = Question.getDefaultValueForType(type);		
		}
		this.title = title;
		this.type = type;
		this.visibleIf = isFunction(visibleIf) ? visibleIf : function() {return visibleIf};
		this.disabledIf = isFunction(disabledIf) ? disabledIf : function() {return disabledIf};
		this.dependants = [];

		this.containerId = "q_" + this.name;
		this.errorsId = "e_" + this.name;
		this.titleId = this.containerId + "_t";
		this.inputId;
		switch (this.type) {
			case Question.Types.TEXT:
				this.inputId = this.containerId + "_i";
				break;
			case Question.Types.NUMBER:
				this.inputId = this.containerId + "_i";
				break;
			case Question.Types.CHECKBOX:
				this.inputId = this.containerId + "_i";
				break;
			case Question.Types.DROPDOWN:
				this.inputId = this.containerId + "_i";
				break;
			case Question.Types.CHECKBOXGROUP:
				this.inputId = this.containerId + "_i";
				break;
			case Question.Types.RADIOGROUP:
				this.inputId = this.containerId + "_i";
				break;
			case Question.Types.HTML:
				this.inputId = this.containerId + "_h";
				break;
			case Question.Types.DATE:
				this.inputId = this.containerId + "_i";
				break;
			default:
				throw Error("Unsupported question type");
		};

		this.containerSelector = "#" + this.containerId;
		this.errorsSelector = "#" + this.errorsId;
		this.titleSelector = "#" + this.titleId;
		this.inputSelector = "#" + this.inputId;

		this.errors = [];
		this.isRequired = isRequired;

		// DROPDOWN
		this.dropdownOptions = dropdownOptions;

		// CHECKBOX GROUP
		this.checkboxOptions = checkboxOptions;
		this.checkboxIdPrefix = this.inputId + "_c_";
		this.checkboxSelectorPrefix = "#" + this.checkboxIdPrefix;
		this.checkboxLabelIdPrefix = this.inputId + "_cl_";
		this.checkboxLabelSelectorPrefix = "#" + this.checkboxLabelIdPrefix;

		// RADIO GROUP
		this.radioOptions = radioOptions;
		this.radioIdPrefix = this.inputId + "_r_";
		this.radioLabelIdPrefix = this.inputId + "_rl_";
		this.radioSelectorPrefix = "#" + this.radioIdPrefix;
		this.radioLabelSelectorPrefix = "#" + this.radioLabelIdPrefix;
		this.radioVertical = radioVertical;

		// HTML
		this.html = html;
	}
}
Question.Types = {TEXT: 0, NUMBER: 1, CHECKBOX: 2, DROPDOWN: 3, CHECKBOXGROUP: 4, RADIOGROUP: 5, HTML: 6, DATE: 7};
Question.prototype.getErrorId = function(e, i = -1) {
	if (i === -1) {
		i = this.errors.indexOf(e);
	}
	return this.containerId + "_e_" + i;
}
Question.prototype.getErrorSelector = function(e, i = -1) {
	return "#" + this.getErrorId(e, i);
}
Question.prototype.generateHTML = function() {
	switch (this.type) {
		case Question.Types.TEXT:
			return this.generateTextHTML();
		case Question.Types.NUMBER:
			return this.generateNumberHTML();
		case Question.Types.CHECKBOX:
			return this.generateCheckboxHTML();
		case Question.Types.DROPDOWN:
			return this.generateDropdownHTML();
		case Question.Types.CHECKBOXGROUP:
			return this.generateCheckboxgroupHTML();
		case Question.Types.RADIOGROUP:
			return this.generateRadiogroupHTML();
		case Question.Types.HTML:
			const html = "<div id='" + this.containerId + "'>" + this.html + "</div>";
			return html;
		case Question.Types.DATE:
			return this.generateDateHTML();
		default:
			throw Error("Unsupported question type");
	}
}
Question.prototype.generateTextHTML = function() {
	const titleHTML = "<div id='" + this.titleId + "'>" + this.title + "</div>";
	const errorsHTML = this.renderErrors(false);
	const inputHTML = "<input id='" + this.inputId + "' type='text'" + (this.disabledIf() ? " disabled" : "") + "/>";
	const HTML = "<div id='" + this.containerId +  "'>" + titleHTML + errorsHTML + inputHTML + "</div>";

	return HTML;
}
Question.prototype.generateNumberHTML = function() {
	const titleHTML = "<div id='" + this.titleId + "'>" + this.title + "</div>";
	const errorsHTML = this.renderErrors(false);
	const inputHTML = "<input id='" + this.inputId + "' type='number'" + (this.disabledIf() ? " disabled" : "") + "/>";
	const HTML = "<div id='" + this.containerId +  "'>" + titleHTML + errorsHTML + inputHTML + "</div>";

	return HTML;
}
Question.prototype.generateCheckboxHTML = function() {
	const titleHTML = "<div id='" + this.titleId + "'>" + this.title + "</div>";
	const errorsHTML = this.renderErrors(false);
	const inputHTML = "<input id='" + this.inputId + "' type='checkbox'" + (this.disabledIf() ? " disabled" : "") + "/>";
	const HTML = "<div id='" + this.containerId +  "'><label>" + titleHTML + errorsHTML + inputHTML + "</label></div>";

	return HTML;
}
Question.prototype.generateDropdownHTML = function() {
	const titleHTML = "<div id='" + this.titleId + "'>" + this.title + "</div>";
	const errorsHTML = this.renderErrors(false);
	var inputHTML = "<select id='" + this.inputId + "'" + (this.disabledIf() ? " disabled" : "") + ">";
	this.dropdownOptions.forEach(function(o) {
		inputHTML += "<option value='" + o.value + "'>" + o.text + "</option>"
	});
	inputHTML += "</select>"
	const HTML = "<div id='" + this.containerId +  "'>" + titleHTML + errorsHTML + inputHTML + "</div>";

	return HTML;
}
Question.prototype.generateCheckboxgroupHTML = function() {
	const titleHTML = "<div id='" + this.titleId + "'>" + this.title + "</div>";
	const errorsHTML = this.renderErrors(false);
	var inputHTML = "<div id='" + this.inputId + "'>"
	this.checkboxOptions.forEach((o) => {
		inputHTML += "<label>";
		inputHTML += "<input id='" + this.checkboxIdPrefix + o.value + "' type='checkbox' value='" + o.value + "'" + (this.disabledIf() ? " disabled" : "") + "/>";
		inputHTML += "<span id='" + this.checkboxLabelIdPrefix + o.value + "'>" + o.text + "</span>";
		inputHTML += "</label>";
	});
	inputHTML += "</div>"
	const HTML = "<div id='" + this.containerId +  "'>" + titleHTML + errorsHTML + inputHTML + "</div>";

	return HTML;
}
Question.prototype.generateRadiogroupHTML = function() {
	const titleHTML = "<div id='" + this.titleId + "'>" + this.title + "</div>";
	const errorsHTML = this.renderErrors(false);
	var inputHTML = "<div id='" + this.inputId + "'>";
	this.radioOptions.forEach((o) => {
		if (this.radioVertical) {
			inputHTML += "<label class='radio-vertical'>";
		} else {
			inputHTML += "<label class='radio-horizontal'>";
		}
		inputHTML += "<input id='" + this.radioIdPrefix + o.value + "' name='" + this.name + "' type='radio' value='" + o.value + "'" + (this.disabledIf() ? " disabled" : "") + "/>";
		inputHTML += "<span id='" + this.radioLabelIdPrefix + o.value + "'> " + o.text + "</span>";
		inputHTML += "</label>";
	});
	inputHTML += "</div>"
	const HTML = "<div id='" + this.containerId +  "'>" + titleHTML + errorsHTML + inputHTML + "</div>";

	return HTML;
}
Question.prototype.generateDateHTML = function() {
	const titleHTML = "<div id='" + this.titleId + "'>" + this.title + "</div>";
	const errorsHTML = this.renderErrors(false);
	const inputHTML = "<input id='" + this.inputId + "' type='date'" + (this.disabledIf() ? " disabled" : "") + "/>";
	const HTML = "<div id='" + this.containerId +  "'>" + titleHTML + errorsHTML + inputHTML + "</div>";

	return HTML;
}
Question.getDefaultValueForType = function (type) {
	switch (type) {
		case Question.Types.TEXT:
			return "";
		case Question.Types.NUMBER:
			return "";
		case Question.Types.CHECKBOX:
			return false;
		case Question.Types.DROPDOWN:
			return "";
		case Question.Types.CHECKBOXGROUP:
			return {};
		case Question.Types.RADIOGROUP:
			return "";
		case Question.Types.RADIO:
			return false;
		case Question.Types.HTML:
			return "";
		case Question.Types.DATE:
			return "";
		default:
			throw Error("Unsupported question type");
	}
};
Question.prototype.setDefaultValue = function () {
	switch (this.type) {
		case Question.Types.CHECKBOXGROUP:
			//variables[this.name] = {};
			this.checkboxOptions.forEach((o) => {
				var defVal = Question.getDefaultValueForType(Question.Types.CHECKBOX);
				if (variables.hasOwnProperty(this.name)) {
					defVal = variables[this.name][o.value];
				}
				$(this.checkboxSelectorPrefix + o.value).prop('checked', defVal);
			});
			break;
		case Question.Types.RADIOGROUP:
			this.radioOptions.forEach((o) => {
				var defVal = Question.getDefaultValueForType(Question.Types.RADIOGROUP);
				if (variables.hasOwnProperty(this.name)) {
					defVal = o.value === variables[this.name];
				}
				$(this.radioSelectorPrefix + o.value).prop('checked', defVal);
			});
			break;
		case Question.Types.CHECKBOX:
			var defVal = Question.getDefaultValueForType(this.type);
			if (variables.hasOwnProperty(this.name)) {
				defVal = variables[this.name];
			}
			$(this.inputSelector).prop('checked', defVal);
			break;
		case Question.Types.DATE:
			var defVal = Question.getDefaultValueForType(this.type);
			if (variables.hasOwnProperty(this.name)) {
				defVal = moment(variables[this.name]).format("YYYY-MM-DD");
			}
			$(this.inputSelector).val(defVal);
			break;
		default:
			var defVal = Question.getDefaultValueForType(this.type);
			if (variables.hasOwnProperty(this.name)) {
				defVal = variables[this.name];
			}
			$(this.inputSelector).val(defVal);
	}
}
Question.prototype.render = function() {
	if (!this.visibleIf()) return "";
	return this.generateHTML();
}
Question.prototype.renderErrors = function(existInDOM) {
	var errorsHTML = "";
	this.errors.forEach((e, i) => {
		errorsHTML += "<div id='" + this.getErrorId(e, i) + "' class='survey-error'>" + e + "</div>";
	});
	if (existInDOM) {
		$(this.errorsSelector).empty();
		if (errorsHTML !== "") {
			$(this.errorsSelector).html(errorsHTML);
		}
	} else {
		errorsHTML = "<div id='" + this.errorsId + "'>" + errorsHTML;
		errorsHTML += "</div>";
		return errorsHTML;
	}
}
Question.prototype.clearErrors = function() {
	$(this.errorsSelector).empty();
	this.errors = [];
}
Question.prototype.validateAndShowErrors = function(showNewErrors) {
	this.errors = [];
	var noErrors = true;
	if (this.visibleIf()) {
		if (!this.validateRequired(showNewErrors)) {
			noErrors = false;
		}
	}
	this.renderErrors(true);	
	return noErrors;
}
Question.prototype.validateRequired = function(showNewErrors) {
	if (!this.isRequired || this.disabledIf() || this.type === Question.Types.HTML) return true;
	var passedTest = false;
	switch (this.type) {
		case Question.Types.CHECKBOXGROUP:
			this.checkboxOptions.find((o) => {
				if ($(this.checkboxSelectorPrefix + o.value).is(":checked")) {
					passedTest = true;
				}
			})
			break;
		case Question.Types.RADIOGROUP:
			passedTest = !!$("[name='" + this.name + "']:checked").val();
			break;
		default:
			passedTest = !!$(this.inputSelector).val();
	}
	if (!passedTest && showNewErrors) {
		this.errors.push("Missing required field");
	}
	return passedTest;
}
Question.prototype.setVariable = function(checkboxName = undefined) {
	switch (this.type) {
		case Question.Types.TEXT:
			variables[this.name] = $(this.inputSelector).val();
			break;
		case Question.Types.NUMBER:
			variables[this.name] = parseInt($(this.inputSelector).val());
			break;
		case Question.Types.CHECKBOX:
			variables[this.name] = $(this.inputSelector).is(":checked");	
			break;
		case Question.Types.DROPDOWN:
			variables[this.name] = $(this.inputSelector + " option:selected").val();	
			break;
		case Question.Types.CHECKBOXGROUP:
			variables[this.name][checkboxName] = $(this.checkboxSelectorPrefix + checkboxName).is(":checked");
			break;
		case Question.Types.RADIOGROUP:
			variables[this.name] = $("[name='" + this.name + "']:checked").val();
			break;
		case Question.Types.DATE:
			variables[this.name] = moment($(this.inputSelector).val());
			break;
		default:
			throw Error("Unsupported question type");
	}
}
Question.prototype.setOnChange = function() {
	switch (this.type) {
		case Question.Types.CHECKBOXGROUP:
			this.checkboxOptions.forEach((o) => {
				$(this.checkboxSelectorPrefix + o.value).change(() => {
					this.setVariable(o.value);
					this.validateAndShowErrors(false);
				});
			});
			break;
		case Question.Types.RADIOGROUP:
			this.radioOptions.forEach((o) => {
				$(this.radioSelectorPrefix + o.value).click(() => {
					this.setVariable();
					this.validateAndShowErrors(false);
				})
			});
			break;
		default:
			$(this.inputSelector).change(() => {
				this.setVariable();
				this.validateAndShowErrors(false);
			});
	}
}
Question.prototype.disable = function() {
	switch (this.type) {
		case Question.Types.DATE:
		case Question.Types.TEXT:
		case Question.Types.NUMBER:
		case Question.Types.CHECKBOX:
		case Question.Types.DROPDOWN:
			$(this.inputSelector).prop('disabled', true);
			break;
		case Question.Types.CHECKBOXGROUP:
			this.checkboxOptions.forEach((o) => {
				$(this.checkboxSelectorPrefix + o.value).prop('disabled', true);
			});
			break;
		case Question.Types.RADIOGROUP:
			this.radioOptions.forEach((o) => {
				$(this.radioSelectorPrefix + o.value).prop('disabled', true);
			});
			break;
		default:
			throw Error("Unsupported question type");
	}
}
Question.prototype.enable = function() {
	switch (this.type) {
		case Question.Types.DATE:
		case Question.Types.TEXT:
		case Question.Types.NUMBER:
		case Question.Types.CHECKBOX:
		case Question.Types.DROPDOWN:
			$(this.inputSelector).prop('disabled', false);
			break;
		case Question.Types.CHECKBOXGROUP:	
			this.checkboxOptions.forEach((o) => {
				$(this.checkboxSelectorPrefix + o.value).prop('disabled', false);
			});
			break;
		case Question.Types.RADIOGROUP:
			this.radioOptions.forEach((o) => {
				$(this.radioSelectorPrefix + o.value).prop('disabled', false);
			});
			break;
		default:
			throw Error("Unsupported question type");
	}
}


class Page {
	constructor ({pageClass = "", visibleIf = true, questions, nextVisibleIf = true}) {
		this.pageClass = pageClass;
		this.visibleIf = isFunction(visibleIf) ? visibleIf : function() {return visibleIf};
		this.questions = questions;
		this.containerId = "page";
		this.containerSelector = "#" + this.containerId;
		this.nextVisibleIf = isFunction(nextVisibleIf) ? nextVisibleIf : function() {return nextVisibleIf};
	}
}
Page.globalClassRules = [];
Page.lastRule = false;
Page.addGlobalClassRule = function(classRule) {
	classRule[0] = isFunction(classRule[0]) ? classRule[0] : function() {return classRule[0]};
	Page.globalClassRules.push(classRule);
}
Page.getVisibleClassesAsArray = function() {
	return Page.globalClassRules.filter((r) => {
		return r[0]() === true;
	}).map((o) => {
		return o[1];
	})
}
Page.prototype.clearErrors = function() {
	this.questions.forEach((q) => {
		q.clearErrors();
	})
}
Page.prototype.render = function() {
	var html = "";
	const classes = Page.getVisibleClassesAsArray();
	console.log("class; " + this.pageClass + " classes: " + classes)
	if (classes.length !== 0) {
		html += "<div id='page' class='" + classes.join(" ") + "'>";
	} else {
		html += "<div id='page'>";
	}

		this.questions.forEach(function(q) {
			html += q.render();
		});
	html += "</div>";
	return html;
}
Page.prototype.linkQuestionsToVariables = function() {
	this.questions.forEach(function(q) {
		q.setOnChange();
	});
}
Page.prototype.linkQuestionsToTriggers = function(survey) {
	this.questions.forEach(function(q) {
		q.dependants = [];
		this.questions.forEach(function(q2) {
			if (q2.visibleIf.toString().includes('variables["' + q.name + '"]')) {
				q.dependants.push(q2.name);	
			} else if (q2.disabledIf.toString().includes('variables["' + q.name + '"]')) {
				q.dependants.push(q2.name);	
			}
		}, this);
		if (q.dependants.length !== 0) {
			$(q.inputSelector).change(() => {
				this.updateQuestionVisibility(q);
				this.updateQuestionDisability(q);
			});
		}
	}, this);
}
Page.prototype.hideQuestion = function(q) {
	$(q.containerSelector).remove();
	q.clearErrors();
}
Page.prototype.showQuestion = function(q) {
	var prevElm = undefined;
	for (var i = this.findQuestionIndex(q) - 1; i >= 0; i --) {
		if (this.questions[i].visibleIf()) {
			prevElm = $(this.questions[i].containerSelector);
			prevElm.after(q.render());
			break;
		}
	}
	if (!prevElm) {
		prevElm = $(this.containerSelector);
		prevElm.append(q.render());
	}

	q.setDefaultValue();
	q.setOnChange();
	$(q.inputSelector).change(() => {
		this.updateQuestionVisibility(q);
		this.updateQuestionDisability(q);
	});
}
Page.prototype.updateQuestionVisibility = function(trigger) {
	trigger.dependants.forEach(function(d) {
		if (!this.findQuestionByName(d).visibleIf()) {
			this.hideQuestion(this.findQuestionByName(d));
		} else if ($(this.findQuestionByName(d).inputSelector).length === 0) {
			this.showQuestion(this.findQuestionByName(d));
		}
	}, this);
}
Page.prototype.updateQuestionDisability = function(trigger) {
	trigger.dependants.forEach(function(d) {
		if ($(this.findQuestionByName(d).inputSelector).length === 0) return;
		if (this.findQuestionByName(d).disabledIf()) {
			this.findQuestionByName(d).validateAndShowErrors(false);
			this.findQuestionByName(d).disable();
		} else {
			this.findQuestionByName(d).enable();
		}
	}, this);
}
Page.prototype.findQuestionByName = function(name) {
	return this.questions.find(function(q) {
		return q.name === name;
	});
}
Page.prototype.findQuestionIndexByName = function(name) {
	return this.questions.findIndex(function(q) {
		return q.name === name;
	});
}
Page.prototype.findQuestionIndex = function(q) {
	return this.questions.indexOf(q);
}
Page.prototype.runValidators = function() {
	var noErrors = true;
	this.questions.forEach(function(q) {
		if (!q.validateAndShowErrors(true)) {
			noErrors = false;
		}
	});
	return noErrors;
}


// survey
class Survey {
	constructor({containerId, pages}) {
		this.containerId = containerId;
		this.containerSelector = "#" + this.containerId;
		this.pages = pages;
		this.currentPageIdx = 0;
		this.defaultButtonClasses = [];
		this.defaultNavClasses = [];
	}
}
Survey.prototype.getCurrentPage = function() {
	return this.pages[this.currentPageIdx];
}
Survey.prototype.addDefaultButtonClass = function(buttonClass) {
	this.defaultButtonClasses.push(buttonClass);
}
Survey.prototype.addDefaultNavClass = function(navClass) {
	this.defaultNavClasses.push(navClass);
}
Survey.prototype.goToNextPage = function() {
	const newPage = this.pages.find(function(p, i) {
		if (i <= this.currentPageIdx) return false;
		this.currentPageIdx ++;
		return p.visibleIf();
	}, this);
	if (!newPage) {
		this.renderDone();
	} else {
		this.render();
	}
}
Survey.prototype.attemptToGoToNextPage = function() {
	const noErrors = this.getCurrentPage().runValidators();
	if (noErrors) {
		this.goToNextPage();
	}
}
Survey.prototype.goToPrevPage = function() {
	for (var i = this.pages.length - 1; i >= 0; i --) {
		if (i >= this.currentPageIdx) continue;
		this.currentPageIdx --;
		if (this.pages[i].visibleIf()) break;
	}
	if (this.currentPageIdx === -1) {
		this.renderDone();
	} else {
		this.render();
	}
}
Survey.prototype.renderDone = function() {
	$(this.containerSelector).html("<div id='done'>Done</div>");
}
Survey.prototype.render = function() {
	$(this.containerSelector).empty();
	var html = "<div id='survey'>"
		html += this.pages[this.currentPageIdx].render();
	html += "</div>";

	html += "<div id='survey-nav' class='" + this.defaultNavClasses.join(" ") + "'>";
	if (this.currentPageIdx !== 0) {
		html += "<input id='prev-btn' type='button' value='Previous' class='" + this.defaultButtonClasses.join(" ") + "'></input>";
	}

	if (this.pages[this.currentPageIdx].nextVisibleIf()) {
		html += "<input id='next-btn' type='button' value='Next' class='" + this.defaultButtonClasses.join(" ") + "'></input>";
	}
	html += "</div>"; // close nav

	$(this.containerSelector).html(html);

	this.pages[this.currentPageIdx].linkQuestionsToVariables();
	this.pages[this.currentPageIdx].linkQuestionsToTriggers(this);
	this.pages[this.currentPageIdx].questions.forEach(function(q) {
		q.setDefaultValue();
	});

	$("#prev-btn").click(() => {
		this.getCurrentPage().clearErrors();
		this.goToPrevPage();
	})
	if (this.pages[this.currentPageIdx].nextVisibleIf()) {
		$("#next-btn").click((e) => {
			this.attemptToGoToNextPage();
		})
	}
}



function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

var pages = [
	// main page
	new Page({
		pageClass: "centerText",
		questions: [
			new Question({
				name: "introText",
				type: Question.Types.HTML,
				html: "<h1>HI THERE</h1>"
			}),
		]
	}),
	new Page({
		questions: [
			new Question({
				name: "disclaimer",
				type: Question.Types.HTML,
				html: "<h1>Disclaimer</h1><p>Some text</p>"
			}),
		]
	}),
	new Page({
		questions: [
			new Question({
				name: "gender",
				type: Question.Types.TEXT,
				title: "Your gender",
				isRequired: true,
			}),
			new Question({
				name: "age",
				type: Question.Types.NUMBER,
				title: "Your age",
				isRequired: true,
			}),
			new Question({
				name: "location",
				type: Question.Types.DROPDOWN,
				title: "Your location",
				dropdownOptions: [
					{ value: "cambridge", text: "Cambridge"},
					{ value: "kitchener", text: "Kitchener"},
					{ value: "guelph", text: "Guelph"},
					{ value: "waterloo", text: "Waterloo"},
					{ value: "other", text: "Other"},
				],
				isRequired: true,
			}),
			new Question({
				name: "locationOther",
				type: Question.Types.TEXT,
				title: "Other location",
				visibleIf: function() {return variables["location"] === "other"},
				isRequired: true,
			}),
			new Question({
				name: "hearAbout",
				type: Question.Types.DROPDOWN,
				title: "How did you hear about SHORE Centre",
				dropdownOptions: [
					{ value: "internet", text: "Internet"},
					{ value: "healthcare", text: "A health care provider"},
					{ value: "person", text: "Person"},
					{ value: "other", text: "Other"},
				],
				isRequired: true,
			}),
			new Question({
				name: "hearAboutOther",
				type: Question.Types.TEXT,
				title: "Other",
				visibleIf: function() {return variables["hearAbout"] === "other"},
				isRequired: true,
			}),
		]
	}),
	new Page({
		questions: [
			new Question({
				name: "isPregnancyTestPositive",
				type: Question.Types.RADIOGROUP,
				title: "Have you taken a pregnancy test that was positive?",
				radioOptions: [
					{ value: "true", text: "Yes" },
					{ value: "false", text: "No" },
				],
				isRequired: true,
				radioVertical: false,
			})
		]
	}),
	new Page({
		pageClass: "centerText",
		visibleIf: function() {return variables["isPregnancyTestPositive"] === "false"},
		questions: [
			new Question({
				name: "pregnancyReferral",
				type: Question.Types.HTML,
				html: "<h1>PREGNANCY TEST REFERRAL</h1><p>some clinics</p><ul><li>clinic1</li><li>clinic2</li></ul>",
			})
		],
		nextVisibleIf: false,
	}),
	new Page({
		visibleIf: function() {return variables["isPregnancyTestPositive"] === "true"},
		questions: [
			new Question({
				name: "menstrualDate",
				type: Question.Types.DATE,
				title: "Period thing",
				disabledIf: function() {return variables["dontKnowMenstrual"]},
				isRequired: true,
			}),
			new Question({
				name: "dontKnowMenstrual",
				type: Question.Types.CHECKBOX,
				title: "I don't know",
			}),
		]
	}),
	new Page({
		visibleIf: function() {return variables["isPregnancyTestPositive"] === "true" &&
									variables["dontKnowMenstrual"]},
		questions: [
			new Question({
				name: "knowUltrasound",
				type: Question.Types.RADIOGROUP,
				title: "Have you had an ultrasound to date your pregnancy?",
				radioOptions: [
					{ value: "true", text: "Yes" },
					{ value: "false", text: "No" },
				],
				isRequired: true,
				radioVertical: false,
			}),
			new Question({
				name: "ultrasoundDate",
				type: Question.Types.NUMBER,
				title: "Days since ultrasound",
				visibleIf: function() {return variables["knowUltrasound"] === "true"},
				disabledIf: function() {return variables["missingUltrasoundInfo"]},
				isRequired: true,
			}),
			
			new Question({
				name: "ultrasoundWeeksDaysTitle",
				type: Question.Types.HTML,
				html: "<h4>What was the result, in weeks and days?</h4>",
				visibleIf: function() {return variables["knowUltrasound"] === "true"},
				isRequired: true,
			}),
			
			new Question({
				name: "ultrasoundWeeks",
				title: "Weeks",
				type: Question.Types.NUMBER,
				visibleIf: function() {return variables["knowUltrasound"] === "true"},
				disabledIf: function() {return variables["missingUltrasoundInfo"]},
				isRequired: true,
			}),
			new Question({
				name: "ultrasoundDays",
				title: "Days",
				type: Question.Types.NUMBER,
				visibleIf: function() {return variables["knowUltrasound"] === "true"},
				disabledIf: function() {return variables["missingUltrasoundInfo"]},
				isRequired: true,
			}),
			new Question({
				name: "missingUltrasoundInfo",
				title: "I do not have this information",
				type: Question.Types.CHECKBOX,
				visibleIf: function() {return variables["knowUltrasound"] === "true"},
			}),
		]
	}),
	new Page({
		pageClass: "centerText",
		visibleIf: function() {return variables["missingUltrasoundInfo"] && variables["knowUltrasound"] === "true"},
		questions: [
			new Question({
				name: "missingUltrasoundInfoPage",
				type: Question.Types.HTML,
				html: "<h1>Missing ultrasound info</h1><p>some stuff</p>",
			})
		],
		nextVisibleIf: false,
	}),
	new Page({
		pageClass: "centerText",
		visibleIf: function() {return variables["knowUltrasound"] === "false"},
		questions: [
			new Question({
				name: "ultrasoundReferral",
				type: Question.Types.HTML,
				html: "<h1>Ultrasound referral</h1><p>get an ultrasound!!!</p>",
			})
		],
		nextVisibleIf: false,
	}),
	new Page({
		pageClass: "centerText",
		visibleIf: function() {return variables["knowUltrasound"] === "true" && !variables["missingUltrasoundInfo"] &&
									(variables["ultrasoundDate"] + variables["ultrasoundWeeks"] + variables["ultrasoundDays"] >= 100)},
		questions: [
			new Question({
				name: "weight",
				type: Question.Types.HTML,
				html: "<h1>TOO LONG FOR PREGNANCY!</h1>"
			}),
		]
	}),
	new Page({
		visibleIf: function() {return variables["knowUltrasound"] === "true" && !variables["missingUltrasoundInfo"] &&
									(variables["ultrasoundDate"] + variables["ultrasoundWeeks"] + variables["ultrasoundDays"] < 100)},
		questions: [
			new Question({
				name: "weight",
				title: "Your weight?",
				type: Question.Types.NUMBER,
				isRequired: true,
			}),
			new Question({
				name: "height",
				title: "Your height?",
				type: Question.Types.NUMBER,
				isRequired: true,
			})
		]
	}),
	new Page({
		visibleIf: function() {return variables["knowUltrasound"] === "true" && !variables["missingUltrasoundInfo"] &&
									(variables["ultrasoundDate"] + variables["ultrasoundWeeks"] + variables["ultrasoundDays"] < 100) &&
									getBMI(variables["weight"], variables["height"]) < 40},
		questions: [
			new Question({
				name: "preferSurgical",
				title: "What type of abortion procedure would you prefer?",
				radioOptions: [
					{ value: "false", text: "Medication" },
					{ value: "true", text: "Surgical" },
				],
				type: Question.Types.RADIOGROUP,
				isRequired: true,
				radioVertical: false,
			}),
			new Question({
				name: "medicalVsSurgicalDifferences",
				type: Question.Types.HTML,
				html: "<a href='www.google.ca'>See the differences</a>"
			})
		]
	}),
	new Page({
		visibleIf: function() {return variables["knowUltrasound"] === "true" && !variables["missingUltrasoundInfo"] &&
									(variables["ultrasoundDate"] + variables["ultrasoundWeeks"] + variables["ultrasoundDays"] < 100) &&
									getBMI(variables["weight"], variables["height"]) < 40 &&
									(variables["preferSurgical"] === "true")},
		questions: [
			new Question({
				name: "preferFemaleDoctor",
				title: "Do you prefer to have a female doctor?",
				radioOptions: [
					{value: "true", text: "Yes"},
					{value: "false", text: "Doesn't matter"},
				],
				type: Question.Types.RADIOGROUP,
				isRequired: true,
				radioVertical: false,
			}),
			new Question({
				name: "requireSaturday",
				title: "Do you require a Saturday appointment?",
				radioOptions: [
					{value: "true", text: "Yes"},
					{value: "false", text: "No"},
				],
				type: Question.Types.RADIOGROUP,
				isRequired: true,
				radioVertical: false,
			}),
			new Question({
				name: "supportPersonRol",
				type: Question.Types.CHECKBOXGROUP,
				title: "If you bring a support person, how would you like them to be involved?",
				checkboxOptions: [
					{value: "procedure", text: "Be in the procedure room with me"},
					{value: "waiting", text: "Wait in the waiting room with me"},
					{value: "both", text: "I don't have a preference"},
				],
				isRequired: true,
			})
		]
	}),
	new Page({
		pageClass: "centerText",
		visibleIf: function() {return variables["knowUltrasound"] === "true" && !variables["missingUltrasoundInfo"] &&
									(variables["ultrasoundDate"] + variables["ultrasoundWeeks"] + variables["ultrasoundDays"] < 100)},
		questions: [
			new Question({
				name: "referrals",
				html: "<h1>Referrals</h1><p>here they are</p>",
				type: Question.Types.HTML,
			}),
		],
		nextVisibleIf: false,
	}),
];

// main
$(document).ready(function() {
	survey = new Survey({containerId: "surveyContainer", pages: pages});
	survey.addDefaultButtonClass(["button"]);
	survey.addDefaultNavClass(["row small-11 medium-8 large-5 columns text-center"]);
	Page.addGlobalClassRule([function() {return survey.getCurrentPage().pageClass === "centerText"}, "row small-11 medium-8 large-5 columns text-center"]);
	Page.addGlobalClassRule([function() {return survey.getCurrentPage().pageClass !== "centerText"}, "row small-11 medium-8 large-5 columns"]);
	survey.render();
});


// custom
function getBMI(imperialWeight, imperialHeight) {
    // Assumes that values provided are imperial units. Convert to metric.
    var metricWeight = parseInt(imperialWeight) * .453592;
    var metricHeight = parseInt(imperialHeight) * .0254;
    
    var theBMI = metricWeight / (metricHeight * metricHeight);
    
    return theBMI;
}