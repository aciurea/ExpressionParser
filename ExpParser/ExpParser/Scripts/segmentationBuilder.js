$(document).ready(function () {
    $('#builder-basic').queryBuilder(options);

    $('#btnReset').on('click', function () {
        console.log("Click reset");
        $('#builder-basic').queryBuilder('reset');
    });

    $('#btnParse').on('click', function () {
        console.log("Click parse");
        var expressionData = $('#builder-basic').queryBuilder('getRules');
        console.log(expressionData);

        //var json = JSON.stringify(query, undefined, 2);
        //console.log(json);

        var parsedExpression = parseData(expressionData, isSimple = true, isNextGroup = false);

        if (parsedExpression && parsedExpression.indexOf('null') > -1) {
            parsedExpression = null;
        }
        console.log(parsedExpression);

        $('#txtExpression').val(parsedExpression);
    });

    $('#btnLoadJS').on('click', function () {
        var expression = $('#txtParseResult').val();
        console.log("(JS)Click load expression: " + expression);
        loadExpression(expression);
    });

    expressionParserPlugin();
});


function expressionToObjects() {
    $("#btnLoad").on('click', function () {
        var data = $('#txtParseResult').val();
        var json = JSON.parse(data);

        var result = buildDataFromExpression(data);

        console.log(result);

        if (result) {
            $('#builder-basic').queryBuilder('setRules', data);
        } else {
            $('#builder-basic').queryBuilder('reset');
        }
    });
}

var options = {
    allow_empty: false,
    plugins: {
        "not-group": null
    },

    filters: [
        { id: '@Lang', label: 'Lang', type: 'string', size: 30 },
        { id: '@anid', label: 'anid', type: 'string', size: 30 },
        { id: '@V7', label: 'V7', type: 'string', size: 30 },
        { id: '@sr', label: 'sr', type: 'string', size: 30 },
        { id: '@vip', label: 'vip', type: 'string', size: 30 },
        { id: '@cip', label: 'cip', type: 'string', size: 30 },
        { id: '@real', label: 'real', type: 'string', size: 30 },
        { id: '@flag', label: 'flag', type: 'string', size: 30 },
        { id: '@Domain', label: 'Domain', type: 'string', size: 30 },
        { id: '@IC', label: 'IC', type: 'string', size: 30 },
        { id: '@MKW', label: 'MKW', type: 'string', size: 30 },
        { id: '@RefType', label: 'RefType', type: 'string', size: 30 },
        { id: '@SearchLang', label: 'SearchLang', type: 'string', size: 30 },
        { id: '@SearchTerm', label: 'SearchTerm', type: 'string', size: 30 },
        { id: '@Country', label: 'Country', type: 'string', size: 30 },
        { id: '@isWin', label: 'isWin', type: 'string', size: 30 },
        { id: '@version', label: 'version', type: 'string', size: 30 },
        { id: '@currency', label: 'currency', type: 'string', size: 30 },
        { id: '@gpr', label: 'gpr', type: 'string', size: 30 }
    ],

    operators: [
        { type: 'exists', nb_inputs: 0, apply_to: ['string', 'number', 'datetime', 'boolean'] },
        { type: 'equal' },
        //{ type: 'equal_ignore_case', nb_inputs: 1, apply_to: ['string', 'datetime', 'boolean'] },
        { type: 'not_equal' },
        { type: 'less' },
        { type: 'less_or_equal', apply_to: ['string', 'number', 'datetime', 'boolean'] },
        { type: 'greater', apply_to: ['string', 'number', 'datetime', 'boolean'] },
        { type: 'greater_or_equal', apply_to: ['string', 'number', 'datetime', 'boolean'] },
        { type: 'contains', apply_to: ['string', 'number', 'datetime', 'boolean'] },
        //{ type: 'contains_ignore_case', nb_inputs: 1, apply_to: ['string', 'datetime', 'boolean'] },
        //{ type: 'regex_match', nb_inputs: 1, apply_to: ['string', 'number', 'datetime', 'boolean'] }
    ],


    conditions: ['AND', 'OR'],
    default_condition: 'AND'
};

function loadExpression(expression) {
    //if (!expression) {
    //    expression = $('#txtExpression').val();
    //}
    console.log("loadExpression: " + expression);

    var data = JSON.parse(expression);

    $('#builder-basic').queryBuilder('setRules', data);

}

function buildDataFromExpression(expression) {
    var result = {
        condition: "AND",
        rules: [
            {
                field: "@Domain",
                id: "@Domain",
                input: "text",
                operator: "not_equal",
                type: "string",
                value: "A"
            },
            {
                field: "@Domain",
                id: "@Domain",
                input: "text",
                operator: "not_equal",
                type: "string",
                value: "B"
            },
            {
                contition: "OR",
                rules: [
                 {
                     field: "@Domain",
                     id: "@Domain",
                     input: "text",
                     operator: "not_equal",
                     type: "string",
                     value: "C"
                 }]
            }
        ]
    };

    if (validateExpression(expression)) {
        console.log("Parsing...");
        return result;
    }

    return null;
}

function areMoreThanTwoRulesPerGroup(data, isNextGroup) {
    let numberOfRules = 0;
    if (isNextGroup) numberOfRules = 0;
    for (let i = 0; i < data.rules.length; i++) {
        if (!data.rules[i].condition) {
            numberOfRules++;
        }
    }
    if (numberOfRules > 2) return true;
    return false;
}

function parseData(data, isSimple, isNextGroup) {
    if (!validateData(data)) {
        return null;
    }

    let stop = areMoreThanTwoRulesPerGroup(data, isNextGroup);
    if (stop) {
        $('#errorOnParsing').css('display', ' block');
        return null;
    } else {
        $('#errorOnParsing').css('display', ' none');
    }

    let result;
    if (data.rules[0].condition) {

        result = "(" + parseData(data.rules[0]) + ")";
    } else {
        if (data.not && isSimple) {
            result = "NOT" + " " + parseRule(data.rules[0]);
            isSimple = false;
        } else {
            result = parseRule(data.rules[0]);
        }
    }

    if (data.rules.length > 1) {
        for (let i = 1; i < data.rules.length; i++) {
            if (data.rules[i].condition) {
                isNextGroup = true;
                result = "(" + result + ")";
                if (data.rules[i].not) {
                    result += " " + data.condition + " " + "NOT" + " (" + parseData(data.rules[i], false, isNextGroup) + ")";
                } else {
                    result += " " + data.condition + " (" + parseData(data.rules[i], false, isNextGroup) + ")";
                }
            } else {
                result += " " + data.condition + " " + parseRule(data.rules[i]);
            }
        }
    }

    return result;
}

function parseRule(rule) {
    var result = "";
    var operator = getOperatorSymbol(rule.operator);
    if (operator) {
        if (operator.isBasic) {
            result = rule.id + operator.text + "\"" + rule.value + "\"";
        } else {
            result = operator.text + "(" + rule.id + ")";
        }
    } else {
        console.log("Error on parsing rule: " + rule);
    }

    return "(" + result + ")";
}

function getOperatorSymbol(operator) {
    switch (operator) {
        case "equal": return { text: "=", isBasic: true };
        case "not_equal": return { text: "<>", isBasic: true };
        case "less": return { text: "<", isBasic: true };
        case "less_or_equal": return { text: "<=", isBasic: true };
        case "greater": return { text: ">", isBasic: true };
        case "greater_or_equal": return { text: ">=", isBasic: true };
        case "equal_ignore_case": return { text: "=^", isBasic: true };
        case "contains": return { text: "=%", isBasic: true };
        case "contains_ignore_case": return { text: "=%^", isBasic: true };
        case "regex_match": return { text: "=$%", isBasic: true };
        case "exists": return { text: "Exists", isBasic: false };
        default:
            console.log("Not implemented operator: " + operator);
    }

    return null;
}

function getOperator(operatorSymbol) {
    switch (operatorSymbol) {
        case "=": return { text: "equal", isBasic: true };
        case "<>": return { text: "not_equal>", isBasic: true };
        case "<": return { text: "less", isBasic: true };
        case "<=":
        case "=<": return { text: "less_or_equal", isBasic: true };
        case ">": return { text: "greater", isBasic: true };
        case ">=":
        case "=>": return { text: "greater_or_equal", isBasic: true };
        case "=^": return { text: "equal_ignore_case", isBasic: true };
        case "=%": return { text: "contains", isBasic: true };
        case "=%^":
        case "=^%": return { text: "contains_ignore_case", isBasic: true };
        case "=$%": return { text: "regex_match", isBasic: true };
        case "Exists": return { text: "exists", isBasic: false };
        default:
            console.log("Not implemented operator: " + operator);
    }

    return null;
}

function validateData(data) {
    return data.rules && data.rules.length > 0;
}

function validateExpression(expression) {
    if (!validateParanthesesNumber(expression)) {
        console.log("Wrong number of parantheses");
        return false;
    }

    if (!validateParanthesesOpenClose(expression)) {
        console.log("Wrong open/close parantheses");
        return false;
    }

    var tokens = getTokens(expression);

    return true;
}

function getTokens(expression) {
    var delimiterData = getDelimitersData(expression);

    if (delimiterData.length > 0) {

        var result = [];
        var token = expression.substring(0, delimiterData[0].position).trim();
        if (token) {
            result.push(token);
        }
        result.push(delimiterData[0].delimiter);

        var startPosition;
        var index;
        for (index = 1; index < delimiterData.length; index++) {
            startPosition = delimiterData[index - 1].position + delimiterData[index - 1].delimiter.length;
            token = expression.substring(startPosition, delimiterData[index].position).trim();
            if (token) {
                result.push(token);
            }
            result.push(delimiterData[index].delimiter);
        }

        index = delimiterData.length - 1;
        startPosition = delimiterData[index].position + delimiterData[index].delimiter.length;
        token = expression.substring(startPosition).trim();
        if (token) {
            result.push(token);
        }

        console.log(result);
        return result;
    }
}

var delimiters = ["(", ")", "and", "or", "AND", "OR", "not", "NOT"];
function getDelimitersData(expression) {
    var result = [];
    for (var i = 0; i < delimiters.length; i++) {
        var tempExpression = expression;
        var index;
        while (tempExpression.indexOf(delimiters[i]) >= 0) {
            index = tempExpression.indexOf(delimiters[i]);
            var delimiterData = { delimiter: delimiters[i], position: index };
            result.push(delimiterData);
            tempExpression = tempExpression.substring(index + delimiters[i].length);
        }
    }

    if (result.length > 0) {
        result.sort(
            function (a, b) {
                return a.position - b.position;
            });
    }

    console.log(result);
    return result;
}

function validateParanthesesNumber(expression) {
    var nrOpenParanthesis = (expression.split('(').length - 1);
    var nrCloseParanthesis = (expression.split(')').length - 1);
    return nrOpenParanthesis === nrCloseParanthesis;
}

function validateParanthesesOpenClose(expression) {
    var countParanthesis = 0;
    for (var i = 0; i < expression.length; i++) {
        if (expression[i] === "(") {
            countParanthesis++;
        }
        else if (expression[i] === ")") {
            countParanthesis--;
        }

        if (countParanthesis < 0) {
            return false;
        }
    }

    return countParanthesis === 0;
}