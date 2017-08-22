const surveyData = {
	pages: [
		new Page({
			elements: [
				new Question({
					type: Question.Types.TEXT,
					name: "question1",
				}),
			],
		}),
	],
}
$(document).ready(() => {
	const survey = new Survey({pages: surveyData.pages, containerJQuery: $("#surveyContainer")})
	survey.render();
})