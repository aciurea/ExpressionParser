$(document).ready(function () {
    setFilters();
    $('#btnReset').on('click', function () {
        $('#txtParseResult').val('');
        $('#builder-basic').queryBuilder('reset');
    });

    $('#btnParse').on('click', function () {
        const expressionData = $('#builder-basic').queryBuilder('getRules');
        console.log(expressionData);
        if ($.isEmptyObject(expressionData)) return;
        var parsedExpression = parseData(expressionData);
        $('#txtExpression').val(parsedExpression);
    });
    $('#btnOldImpl').click(function () {
        $("#oldContent").toggleClass("tglOldImpl");
        $('i.glyphicon').toggleClass("glyphicon-menu-up").toggleClass("glyphicon-menu-down");
    });

    $('#btnLoadExpression').on('click', function () {
        const expression = $('#txtParseResult').val();
        loadExpressionFromServer(expression);
    });

});
function setFilters() {
    $.getJSON("./filters.json", function (data) {
        options.filters = data;
        const sessionParams = loadSessionParameters();

        if (sessionParams) {
            sessionParams.forEach(function (val) {
                options.filters.push({ id: "@" + val, label: val, type: "boolean", size: 30 });
            });
        }
        $('#builder-basic').queryBuilder(options);
    });
}
const options = {
    allow_empty: false,
    plugins: {
        "not-group": null
    },
    filters: [],
    operators: [
        { type: 'exists', nb_inputs: 0, apply_to: ['string', 'integer', 'datetime', 'boolean'] },
        { type: 'equal' },
        { type: 'equal_ignore_case', nb_inputs: 1, apply_to: ['string', 'datetime', 'boolean'] },
        { type: 'not_equal' },
        { type: 'less' },
        { type: 'less_or_equal' },
        { type: 'greater' },
        { type: 'greater_or_equal' },
        { type: 'contains' },
        { type: 'contains_ignore_case', nb_inputs: 1, apply_to: ['string', 'datetime', 'boolean'] },
        { type: 'regex_match', nb_inputs: 1, apply_to: ['string', 'number', 'datetime', 'boolean'] }
    ],

    conditions: ['AND', 'OR'],
    default_condition: 'AND'
};
function loadSessionParameters() {
    const parameters = $("#sessionParameters").val();
    return parameters !== "" ? JSON.parse(parameters) : null;
}
function AddValues(data) {
    return {
        field: data.field,
        id: data.id,
        input: data.input,
        operator: data.operator,
        type: data.type,
        value: data.value
    }
}

function BeautifyLeft(data, index, result) {
    const rules = AddValues(data);
    return result.rules.push(rules);
}
function BeautifyRight(data, index, result) {
    const rules = [];
    const prevRest = BeautifyExpression(data);
    rules.push(result);
    rules.push(prevRest);
    return result = { data: data.condition, not: data.not, rules: rules };
}
function createJson(data, result) {
    if (data.rules && data.rules[0].condition) {
        const prevRes = BeautifyExpression(data.rules[0]);
        return result === undefined ? prevRes : result;
    } else {
        const rules = [];
        const isSimpleGroup = data.rules[0] && data.rules[1] && !data.rules[1].condition;

        rules.push(AddValues(data.rules[0]));
        result = isSimpleGroup ? { condition: data.condition, not: data.not, rules: rules } : result.rules.push(rules);
    }
    return result;
}
function BeautifyExpression(data, result) {
    result = createJson(data, result);
    if (data.rules.length > 1) {
        for (let i = 1; i < data.rules.length; i++) {
            if (data.rules[i].condition) {
                result = BeautifyRight(data.rules[i], i, result);
            } else {
                result = BeautifyLeft(data.rules[i], i, result);
            }
        }
    }
    return result;

}
function loadExpressionFromServer(expression) {
    if (!expression) {
        expression = $('#txtParseResult').val();
    }
    const data = JSON.parse(expression);
    //const result = BeautifyExpression(data);
    if (data) {
        getData(data);
        $('#builder-basic').queryBuilder('setRules', data);
    } else {
        $('#builder-basic').queryBuilder('reset');
    }
}

function getData(data) {
    if (data.rules && data.rules[0].condition) {
        getData(data.rules[0]);
    }
    if (data.rules && data.rules[0].condition && data.rules[1]) {
        getData(data.rules[1]);
    }
    else if (data.rules) { checkParameters(data.rules[0]); }
    else { checkParameters(data); }
    if (data.rules && data.rules.length > 1 && !data.rules[0].condition) {
        for (let i = 0; i < data.rules.length; i++) {
            if (data.rules[i].condition) {
                getData(data.rules[i]);
            } else {
                checkParameters(data.rules[i]);
            }
        }
    }
}
function checkParameters(data) {
    const isParameter = options.filters.some(function (val) { return val.id === data.id });
    if (!isParameter) {
        options.filters.push({ id: data.id, label: data.field, type: data.type, size: 30 });
        $('#builder-basic').queryBuilder('destroy');
        $('#builder-basic').queryBuilder(options);
    }
}

function parseLeft(data, result, condition, index, not) {
    if (not) {
        if ((data.operator === "less" || data.operator === "greater" || data.operator === "greater_or_equal" || data.operator === "less_or_equal")) {
            result = "(" + result + ")";
        }
        result = result.slice(0, -1);
        result += " " + condition + " " + parseRule(data) + ")";
        return result;
    }
    return result + " " + condition + " " + parseRule(data);
}
function parseRight(data, result, index, condition, not) {
    var prevRes = parseData(data);
    if (not) {
        result = result.slice(0, -1);
        if (data.not || data.rules.length === 1) return result + " " + condition + " " + prevRes + ")";

        return result + " " + condition + " (" + prevRes + "))";
    }
    if (data.not || data.rules.length === 1) {
        return result + " " + condition + " " + prevRes;
    }
    prevRes = " " + condition + " (" + prevRes + ")";
    return result + prevRes;
}
function createExpression(data) {
    if (data.rules && data.rules[0].condition) {
        if (data.not) {
            return "NOT (" + parseData(data.rules[0]) + ")";
        }

        var result = "(" + parseData(data.rules[0]) + ")";
        if (result.indexOf("(NOT") === 0 || result.indexOf("((") === 0) result = result.slice(1, -1);
        return result;
    }
    if (data.not) {
        return "NOT " + parseRule(data.rules[0], data.not, data.rules.length);
    }
    return parseRule(data.rules[0], data.not);
}
function parseData(data) {
    let result;
    result = createExpression(data);
    if (data.rules && data.rules.length > 1) {
        for (let i = 1; i < data.rules.length; i++) {
            if (data.rules[i].condition) {
                result = parseRight(data.rules[i], result, i, data.condition, data.not);
            } else {
                result = parseLeft(data.rules[i], result, data.condition, i, data.not);
            }
        }
    }
    return result;
}

function parseRule(rule, not, length) {
    var result;
    const operator = getOperatorSymbol(rule.operator);
    if (operator) {
        if (operator.isBasic) {
            if (rule.type === "integer" && (rule.operator === "less" || rule.operator === "greater" || rule.operator === "greater_or_equal" || rule.operator === "less_or_equal")) {
                return "(" + rule.id + operator.text + rule.value + ')';
            }
            result = "(" + rule.id + operator.text + '"' + rule.value + '")';
            if (not) {
                if (length === 1) { return result; }
                return "(" + result + ')';
            }
            return result;
        }
        if (not) {
            return "(" + operator.text + "(" + rule.id + "))";
        }
        return operator.text + "(" + rule.id + ")";
    }
    return "";
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
        case "<>": return { text: "not_equal", isBasic: true };
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