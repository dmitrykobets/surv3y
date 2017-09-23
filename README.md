# surv3y

## This is a javascript library which allows the creation of dynamic and responsive surveys for single-page WebApps

## Here are the basic features in GIF form

### 7 input types, with optionally set default values

![solarized vim](https://github.com/dmitrykobets/surv3y/raw/surv3y-demo/doc_images/inputs_and_defaults.gif)

### View the survey results in JSON format

![solarized vim](https://github.com/dmitrykobets/surv3y/raw/surv3y-demo/doc_images/survey_results.gif)

### Custom and default input validation

![solarized vim](https://github.com/dmitrykobets/surv3y/raw/surv3y-demo/doc_images/validation.gif)

### Toggling disabled questions and visible questions based on the results of other questions

![solarized vim](https://github.com/dmitrykobets/surv3y/raw/surv3y-demo/doc_images/disabling_visibility.gif)



# Survey datastructure

## The entire survey workflow is captured in the `Survey` object. [Here](https://github.com/dmitrykobets/surv3y/blob/master/docs/validation_example.txt) is the Javascript code for the validation example from above

### In the following section:
- any elements followed by a `?` are optional arguments
- elements followed by `[...]` will take the contents of those brackets as a default parameter
- consequently, any element that is followed by `[...]` is also implicitly followed by `?`, but for the sake of readibility the `?` will not be omitted

## Survey
Must contain a `pages` array which can contain:
- `page` -- an instance of a `Page` object

## Page:

Each `Page` object corresponds to a page of the survey

- `elements` -- an array containing a mixture of `SurveyError` and its variants, `Question`, `Title`, `Div`. These are the items that will show up on each page of the survey
- `visibleIf`?[true] -- a boolean, or a function which returns a boolean -- if true, then the page is included in the survey -- otherwise, it is skipped -- note, if the return type is a function which returns a boolean, then the page's visibility can be conditional
- `nextBtnText`?["Next &#9654;&#xFE0E;"] - a string -- the text to appear on the 'next page' button
- `prevBtnText`?["&#9664;&#xFE0E; Previous"] - a string -- the text to appear on the 'previous page' button
- `isNextButtonVisible`?[true] -- a boolean -- if true, then the 'next page' button is visible; otherwise, only the 'previous page' button is visible

## Question:
- `type` -- one of the enum `Question.Types` (`TEXT`, `NUMBER`, `DATE`, `RADIOGROUP`, `CHECKBOX`, `DROPDOWN`, `HTML`, `DYNAMIC_HTML`) -- this type directly affects what other parameters should be included for the `Question` object
- `name` -- a string -- a unique name for the question
- `visibleIf` -- a boolean or a function returning a boolean -- if true, then this question is visible on the page; otherwise, this question is not present within the DOM

## TODO
- Add documentation for all the question types
- Add documentation for the `Div` type
- Add documentation for the `SurveyError` type
- Provide code for the example GIFs

