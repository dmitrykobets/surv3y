variables = {}

class Div {
	constructor({classes=[], children=[]}) {
		this.classes = classes;
		this.id = Div.count;
		Div.count ++;
		this.selector = "#" + this.id;

        this.visibleIf = function() {
            return this.isEmpty() === false;
        }
        this.isAlreadyVisible = function() {
            return $(this.selector).length !== 0;
        }
		this.children = children;
	}
}
Div.count = 0;
Div.prototype.render = function() {
    if (this.isAlreadyVisible()) return "";
    var HTML = "<div id='" + this.id + "' class='" + this.classes.join(" ") + "'>";
	this.children.forEach((c) => {
        if (!c.isAlreadyVisible()) {
            HTML += c.render();
        }
	})
	HTML += "</div>";
	return HTML
}
Div.prototype.isEmpty = function() {
	var empty = true;
	for (var i in this.children) {
		if (this.children[i].constructor.name === "Div") {
			empty = this.children[i].isEmpty();
		} else {
			empty = this.children[i].visibleIf() === false;
		}
		if (empty === false) break;
	}
	return empty;
}

class Error {
	constructor({name, message, logicVisibleIf, appearOnChange=true}) {
		this.name = name;
		this.message = message;
		if (!isFunction(logicVisibleIf)) {
			throw Error ("Error visibility condition must be a function");
        }

		this.id = name;
		this.selector = "#" + this.id;

		this.logicVisibleIf = logicVisibleIf;
		this.visibleIf = (onChange=false) => {
			return this.logicVisibleIf() && this.isVisibleBasedOnQuestionState(onChange);
		}
        this.isAlreadyVisible = function() {
            return $(this.selector).length !== 0;
        }

		this.appearOnChange = appearOnChange;

		this.questions = [];
	}
}
Error.prototype.render = function() {
	if (this.isAlreadyVisible()) return "";
	var HTML = "<div id='" + this.id + "' class='survey-error'>" + this.message + "</div>";
	return HTML;
}
Error.prototype.isVisibleBasedOnQuestionState = function(onChange) {
	var shouldBeVisible = this.appearOnChange === true || onChange === false;
	this.questions.forEach((q) => { // needs to be fixed -- right now, if ANY of the triggering questions are disabled/invisible, will remove this error even if remaining questions pass
		if (q.disabledIf()) {
			shouldBeVisible = false;
		}
		if (!q.visibleIf()) {
			shouldBeVisible = false;
		}
    })
    return shouldBeVisible;
}
Error.prototype.updateVisibility = function(onChange=false) {
	if (this.visibleIf(onChange) === true) {
		this.page.showElement(this);
	} else {
		this.page.hideElement(this);
	}
}

class Title {
	constructor({text, questionName}) {
		this.text = text;
		this.questionName = questionName;
		this.id = "title_" + questionName;
        this.selector = "#" + this.id;

        this.question = undefined;

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
Title.prototype.render = function(page) {
	if (this.isAlreadyVisible()) return "";
	return "<h1 id='" + this.id + "'>" + this.text + "</h1>";
}

class Question {
	constructor ({type, name, visibleIf=true, placeholder, defaultValue, disabledIf=false}) {
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

		this.inputId = "q_" + this.name + "_i";
        this.selector = "#" + this.inputId;
        


        this.generateSkeletonHTML = function() {
            switch (this.type) {
                case Question.Types.TEXT:
					var HTML = "<input id='" + this.inputId + "' type='text'/>"
					return HTML;
				case Question.Types.NUMBER:
					var HTML = "<input id='" + this.inputId + "' type='number'/>"
					return HTML;
            }
        }
        this.setPlaceholder = function() {
            if (placeholder !== undefined) {
                switch (this.type) {
                    case Question.Types.TEXT:
                        $(this.selector).prop('placeholder', placeholder);
                        break;
                    case Question.Types.NUMBER:
                        $(this.selector).prop('placeholder', placeholder);
                        break;
                }
            }
        }

        this.setDefaultValue = function() {
            switch (this.type) {
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
            }
        }

        this.setVariable = function() {
            switch (this.type) {
                case Question.Types.TEXT:
					if (variables[this.name] === undefined) {
						variables[this.name] = $(this.selector).val();
                    }	
                    break;
                case Question.Types.NUMBER:
					if (variables[this.name] === undefined) {
						variables[this.name] = parseFloat($(this.selector).val());
                    }	
                    break;
            }
        }

        this.setDisability = function() {
            switch (this.type) {
                case Question.Types.NUMBER:
                case Question.Types.TEXT:
					if (!this.visibleIf()) return;
					if (this.disabledIf() === true) {
						$(this.selector).prop('disabled', true);
					} else if (this.disabledIf() === false) {
						$(this.selector).prop('disabled', false);
					}
					this.errors.forEach((e) => {
						e.updateVisibility(true);
                    })
                    break;
            }
        }

        this.updateVisibility = function() {
            switch (this.type) {
				case Question.Types.NUMBER:
				case Question.Types.TEXT:
					if (this.visibleIf() === true) {
						this.page.showQuestion(this);
					} else {
						this.page.hideQuestion(this);
					}
					this.errors.forEach((e) => {
						e.updateVisibility(true);
					})
                    break;
            }
        }

        this.linkToVariable = function() {
            switch (this.type) {
                case Question.Types.TEXT:
					$(this.selector).keydown(debounce(
						() => {
							variables[this.name] = $(this.selector).val();
						}, 250
                    ));
                    break;
                case Question.Types.NUMBER:
					$(this.selector).keydown(debounce(
						() => {
							variables[this.name] = parseFloat($(this.selector).val());
						}, 250
                    ));
					$(this.selector).change(debounce(
						() => {
							variables[this.name] = parseFloat($(this.selector).val());
						}, 250
                    ));
                    break;
            }
        }
        this.visibilityDependants = [];
        this.disabilityDependants = [];

        this.linkToDependantQuestions = function() {
			this.page.questions().forEach((q) => {
				if (q.visibleIf.toString().includes('variables["' + this.name + '"]')) {
					this.visibilityDependants.push(q.name);
				} 
				if (q.disabledIf.toString().includes('variables["' + this.name + '"]')) {
					this.disabilityDependants.push(q.name);
				}
			});
            switch (this.type) {
                case Question.Types.NUMBER:
					if (this.visibilityDependants.length !== 0) {
						$(this.selector).change(debounce(
							() => {
								this.visibilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateVisibility();
								})
							}, 250
						));
					}
					if (this.disabilityDependants.length !== 0) {
						$(this.selector).change(debounce(
							() => {
								this.disabilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).setDisability();
								})
							}, 250
						));
					}
				case Question.Types.TEXT:
					if (this.visibilityDependants.length !== 0) {
						$(this.selector).keydown(debounce(
							() => {
								this.visibilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).updateVisibility();
								})
							}, 250
						));
					}
					if (this.disabilityDependants.length !== 0) {
						$(this.selector).keydown(debounce(
							() => {
								this.disabilityDependants.forEach((d) => {
									this.page.questions().find((q) => {return q.name === d}).setDisability();
								})
							}, 250
						));
                    }
					break;
            }
        }

        this.errors = [];

        this.linkToErrors = function() {
			this.page.errors().forEach((e) => {
				if (e.questions.indexOf(this) !== -1) {
					this.errors.push(e);
				}
			});
            switch (this.type) {
				case Question.Types.NUMBER:
					if (this.errors.length !== 0) {
						$(this.selector).change(debounce(
							() => {
								this.errors.forEach((e) => {
									e.updateVisibility(true);
								})
							}, 250
                        ));
                    }
                case Question.Types.TEXT:
					if (this.errors.length !== 0) {
						$(this.selector).keydown(debounce(
							() => {
								this.errors.forEach((e) => {
									e.updateVisibility(true);
								})
							}, 250
                        ));
                    }
					break;
            }
        }
	}
}
Question.Types = {
	TEXT: "TEXT",
	NUMBER: "NUMBER",
}

Question.prototype.render = function() {
	if (this.isAlreadyVisible()) return "";

	var HTML = this.generateSkeletonHTML();
	return HTML
}
Question.prototype.setProperties = function() {
	this.setPlaceholder();
	this.setDefaultValue();
	this.setVariable();
	this.setDisability();
}

class Page {
	constructor({elements=[], visibleIf=true}) {
		//this.errorsInitialized = false;
        this.elements = elements;

		this.findElements = (className=undefined) => {
			const recurse = function(collection) {
				var results = [];
				for (var i in collection) {
					if (className === undefined || collection[i].constructor.name === className) {
						results.push(collection[i]);
                    } 
                    if (collection[i].constructor.name === "Div") {
						results = results.concat(recurse(collection[i].children));
					}
				}
				return results;
			}
			return recurse(this.elements);
        }
        this.findElements().forEach((e) => {
            e.page = this;
        })
        
        const qs = this.questions();

        // push questions each error depends on in terms of state (visible/disabled)
        const varRegex = /variables\["(.+?)"\]/g;
        this.errors().forEach((e) => {
            const fString = e.logicVisibleIf.toString();	
            var match = varRegex.exec(fString);
            while (match != null) {
                e.questions.push(this.findQuestionByName(match[1], qs));
                match = varRegex.exec(fString);
            }
        })

        this.titles().forEach((t) => {
            t.question = this.findQuestionByName(t.questionName, qs)
        })

		this.visibleIf = isFunction(visibleIf) ? visibleIf : function() {return visibleIf};
	}
}
Page.prototype.render = function(containerJQuery) {
	var HTML = "<div id='page'></div>";
	containerJQuery.append(HTML);

	// pass 1: put elements into the DOM
    // If error conditions match but questions are disabled/hidden, then errors are still rendered
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
		q.linkToErrors();
	})

    // Hide errors that should not have been rendered in pass 1
	this.errors().forEach((e) => {
		e.updateVisibility(false);
	})
}
Page.prototype.hideElement = function(element) {
    if (!element.isAlreadyVisible()) return;
	$(element.selector).remove();
	var parentDiv = element;
	do {
		parentDiv = this.getParentDiv(parentDiv);
		var hidden = true;
		if (parentDiv !== undefined && parentDiv !== this && parentDiv.visibleIf() === false) {
			$(parentDiv.selector).remove();
		} else {
			hidden = false;
		}
	} while (hidden === true);
}
Page.prototype.showElement = function(element) {
    if (element.isAlreadyVisible()) return;
	var parentDiv = element;
    var topElmToShow = element;
	do {
		parentDiv = this.getParentDiv(parentDiv);
        var done = parentDiv === this || parentDiv === undefined || parentDiv.isAlreadyVisible() === true;
		if (!done) {
			topElmToShow = parentDiv;
		}
	} while (!done);

	var collection = [];
	if (parentDiv === undefined || parentDiv === this) {
		collection = this.elements;
	} else if (parentDiv.constructor.name === "Div") {
		collection = parentDiv.children;
    }

	var pre = undefined;
	for (i in collection) {
		if (collection[i] === topElmToShow) {
            break;
        }
		else if (collection[i].isAlreadyVisible()) {
			pre = collection[i];
		}
	}
	var parentSelector = (parentDiv === undefined || parentDiv === this) ? $("#page") : $(parentDiv.selector);
	if (pre === undefined) {
		parentSelector.prepend(topElmToShow.render(this));
	} else {
		$(pre.selector).after(topElmToShow.render(this));
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

	question.setProperties();
	question.linkToVariable();
	question.linkToDependantQuestions();
    question.linkToErrors();
    // at this point, error visibility has already been updated by the question
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
Page.prototype.questions = function() {
	return this.findElements("Question");
}
Page.prototype.errors = function() {
	return this.findElements("Error");
}
Page.prototype.titles = function() {
	return this.findElements("Title");
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
	constructor({pages=[]}) {
		this.pages = pages;
	}
}
Survey.prototype.render = function(containerJQuery) {
	const page = this.pages.find((p) => {
		return p.visibleIf();
    })
    if (page !== undefined) {
        page.render(containerJQuery);
    }
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
	pages: [
        new Page({
            elements: [
				new Div({
					children: [
						new Error({
							name: "num1error",
							logicVisibleIf: function() {return variables["num1"] === 0},
							message: "Num 1 cannot be 0",
						}),
						new Question({
							type: Question.Types.NUMBER,
							placeholder: "feet",
							name: "num1",
							disabledIf: function() {return variables["q3"] !== "num1"}
						}),
					],
				}),
                new Div({
                    children: [
                        new Div({
                            classes: ["green"],
                            children: [
                                new Error({
                                    name: "Error1",
                                    message: "Error 1",
                                    logicVisibleIf: function() {return variables["q1"] === "false"}
                                }),
                            ]
                        }),
                        new Title({
                            text: "TITLE",
                            questionName: "q1"
                        }),
                        new Question({
                            name: "q1",
                            type: Question.Types.TEXT,
                            visibleIf: function() {return variables["q2"] !== "q1" && isNaN(variables["num1"])},
                            disabledIf: function() {return variables["q3"] === "q3"}
                        }),
                        new Question({
                            name: "q2",
                            type: Question.Types.TEXT,
                        }),
                        new Error({
                            name: "Error2",
                            message: "Error 2",
                            logicVisibleIf: function() {return variables["q1"] === "false" || variables["q3"] === "true"}
                        }),
                        new Question({
							name: "q3",
							placeholder: "q3",
                            type: Question.Types.TEXT,
                        })
                    ]
                })
            ]
        })
    ],
}