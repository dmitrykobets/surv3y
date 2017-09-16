const surveyData = {
	pages: [
		new Page({
			elements: [
				new Question({
					type: Question.Types.HTML,
					name: "html",
					id: "id",
					html: "<h1 id='id'>Inputs</h1>",
				}),

				new Title({
					text: "Text",
					questionName: "text",
				}),
				new Question({
					type: Question.Types.TEXT,
					name: "text",
				}),

				new Title({
					text: "Number",
					questionName: "number",
				}),
				new Question({
					type: Question.Types.NUMBER,
					name: "number",
				}),

				new Title({
					text: "Date",
					questionName: "date",
				}),
				new Question({
					type: Question.Types.DATE,
					name: "date",
				}),

				new Title({
					text: "Dropdown",
					questionName: "dropdown",
				}),
				new Question({
					type: Question.Types.DROPDOWN,
					name: "dropdown",
					options: [
						{value: "1", text: "one"},
						{value: "2", text: "two"},
						{value: "3", text: "three"},
					],
				}),

				new Title({
					text: "Radio group",
					questionName: "radiogroup",
				}),
				new Question({
					type: Question.Types.RADIOGROUP,
					name: "radiogroup",
					options: [
						{value: "1", text: "one"},
						{value: "2", text: "two"},
						{value: "3", text: "three"},
					],
				}),

				new Title({
					text: "Checkbox",
					questionName: "checkbox",
				}),
				new Question({
					type: Question.Types.CHECKBOX,
					name: "checkbox",
				}),
			],
		}),

		new Page({
			elements: [
				new Question({
					type: Question.Types.HTML,
					name: "html",
					id: "id",
					html: "<h1 id='id'>Text input</h1>",
				}),

				new Title({
					text: "Normal",
					questionName: "textNormal_inDepth",
				}),
				new Question({
					type: Question.Types.TEXT,
					name: "textNormal_inDepth",
				}),

				new Title({
					text: "Placeholder",
					questionName: "textPlaceholder_inDepth",
				}),
				new Question({
					type: Question.Types.TEXT,
					name: "textPlaceholder_inDepth",
					placeholder: "Placeholder"
				}),

				new Title({
					text: "Default value",
					questionName: "textDefault_inDepth",
				}),
				new Question({
					name: "textDefault_inDepth",
					type: Question.Types.TEXT,
					defaultValue: "Default value",
				}),

				new Title({
					text: "Disabled",
					questionName: "textDisabled_inDepth",
				}),
				new Question({
					name: "textDisabled_inDepth",
					type: Question.Types.TEXT,
					disabledIf: true,
				}),
			],
		}),

		new Page({
			elements: [
				new Title({
					text: "What is your name?",
					questionName: "name",
				}),
				new RequiredTextError({
					questionName: "name",
				}),
				new Question({
					type: Question.Types.TEXT,
					name: "name",
				}),

				new Title({
					text: "What is your age?",
					questionName: "age",
				}),
				new RequiredNumberError({
					questionName: "age",
				}),
				new NegativeNumberError({
					questionName: "age",
				}),
				new Question({
					type: Question.Types.NUMBER,
					name: "age",
				}),

				new Title({
					text: "What is your credit card number?",
					questionName: "cardNum",
				}),
				new RequiredNumberError({
					questionName: "cardNum",
				}),
				new Question({
					type: Question.Types.NUMBER,
					name: "cardNum",
					visibleIf: function() {return variables["age"] >= 18},
				}),
			]
		}),

		new Page({
			elements: [
				new Question({
					type: Question.Types.DYNAMIC_HTML,
					dynamicHTML: function() {
						var HTML = `<div id='id'>
						<h1>${variables["name"]}</h1>
						<h2>${variables["age"]}</h2>
						<h3>${variables["age"] >= 18 ? variables["cardNum"] : "too young!"}</h3>
						</div>`
						return HTML;
					},
					id: "id",
					name: "results",
					respondTo: "name",
				}),
			]
		})
	],
}





$(document).ready(() => {
	const survey = new Survey({pages: surveyData.pages, containerJQuery: $("#surveyContainer")})
	survey.render();
})