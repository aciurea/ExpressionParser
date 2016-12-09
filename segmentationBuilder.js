$(document).ready(function () {
    setFilters();
    $('#btnReset').on('click', function () {
        $('#txtParseResult').val('');
        $('#builder-basic').queryBuilder('reset');
    });

    $('#btnParse').on('click', function () {
        const expressionData = $('#builder-basic').queryBuilder('getRules');
        if ($.isEmptyObject(expressionData)) return;
        const parsedExpression = parseData(expressionData);

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
        result = result === undefined ? prevRes : result;
        return result;
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
    if (index > 1) {
        if (not) {
            result = result.replace('NOT ', '').slice(1, -1);
            return result = "NOT " + "(" + result + " " + condition + " " + parseRule(data) + ")";
        }
        return result += " " + condition + " " + parseRule(data);
    }
    else if (result.indexOf("AND") >= 0 || result.indexOf("OR") >= 0) {
        if (not) {
            if (result.startsWith("(NOT")) {
                return result = "NOT" + " (" + result.slice(1, -1) + " " + condition + " " + parseRule(data) + ")";
            }
            return result = "NOT" + " (" + result + " " + condition + " " + parseRule(data) + ")";
        }
        return result += " " + condition + " " + parseRule(data);
    }
    if (not) {
        if (result.startsWith("(NOT")) {
            return result = "NOT (" + result.slice(1, -1) + " " + condition + " " + parseRule(data) + ")";
        }
        return result = "NOT (" + result + " " + condition + " " + parseRule(data) + ")";
    }
    return result += " " + condition + " " + parseRule(data);
}
function parseNotGroups(notOnGroup, not, data, result, condition) {
    if (notOnGroup) {
        if (not) {
            result = result.slice(0, -1);
            return result += " " + condition + " " + parseData(data) + ")";
        }
        return result += " " + condition + " " + parseData(data);
    } else if (not) { return result.slice(0, -1) + " " + condition + " (" + parseData(data) + "))"; }
    return result += " " + condition + " (" + parseData(data) + ")";
}
function parseRight(data, result, index, condition, not, notOnGroup) {
    if (index >= 2) {
        if (data.rules.length >= 2) {
            return result = parseNotGroups(notOnGroup, not, data, result, condition);
        }
        if (not) {
            let prevRes = result.replace('NOT ', '');
            if (prevRes.startsWith('(NOT')) {
                prevRes = result.slice(0, -1);
                return result = prevRes + " " + condition + " " + parseData(data) + ")";
            }
            return result = "NOT " + "(" + prevRes.slice(1, -1) + " " + condition + " " + parseData(data) + ")";
        }
        return result += " " + data.condition + " " + parseData(data);
    }
    if (data.rules.length >= 2) {
        if (result.match(/[(]/gi).length >= 2) {
            if (not) {
                return result = notOnGroup ? "NOT " + result.slice(0, -1) + " " + condition + " " + parseData(data) + ")" :
                                           "NOT (" + result.slice(1, -1) + "" + " " + condition + " (" + parseData(data) + "))";
            }
            if (notOnGroup) return result += " " + condition + " " + parseData(data) + "";
            return result += " " + condition + " (" + parseData(data) + ")";
        }
        if (not) {
            return result = notOnGroup ? "NOT (" + result + ") " + data.condition + " " + parseData(data) : "NOT (" + result + " " + data.condition + " (" + parseData(data) + "))";
        }
        return result += notOnGroup ? " " + data.condition + " " + parseData(data) + " " : " " + data.condition + " (" + parseData(data) + ")"
    }
    if (result.indexOf("AND") >= 0 || result.indexOf("OR") >= 0) {
        if (not && !notOnGroup) {
            return result = "NOT (" + result.slice(1, -1) + " " + " " + data.condition + " " + parseData(data) + ")";
        }
        return result = notOnGroup ? "NOT (" + result.slice(1, -1) + " " + data.condition + " " + parseData(data) + ") " : result + " " + data.condition + " (" + parseData(data) + ")";
    }
    if (not) {
        return result = notOnGroup ? "NOT (" + result + ") " + condition + " NOT (" + parseRule(data.rules[0]) + ")" : "NOT (" + result + " " + condition + " " + parseRule(data.rules[0]) + ")";
    }
    return result += notOnGroup ? " " + condition + " NOT (" + parseRule(data.rules[0]) + ")" : " " + data.condition + " " + parseRule(data.rules[0], data.not);
}
function createExpression(data) {
    if (data.rules && data.rules[0].condition) {
        if (data.not && data.rules.length === 1) {
            return "NOT (" + parseData(data.rules[0]) + ")";
        }
        if (data.rules.length === 1 && data.rules[0].rules && data.rules[0].rules.length === 1) return parseData(data.rules[0]);
        return "(" + parseData(data.rules[0]) + ")";
    }
    if (data.not && data.rules && data.rules.length === 1) {
        return "NOT " + parseRule(data.rules[0], data.not, data.rules.length);
    }
    return parseRule(data.rules[0], data.not, data.rules.length);
}
function parseData(data) {
    let result;
    result = createExpression(data);
    if (data.rules && data.rules.length > 1) {
        for (let i = 1; i < data.rules.length; i++) {
            if (data.rules[i].condition) {
                result = parseRight(data.rules[i], result, i, data.condition, data.not, data.rules[i].not);
            } else {
                result = parseLeft(data.rules[i], result, data.condition, i, data.not);
            }
        }
    }
    return result;
}

function parseRule(rule, not, length) {
    const operator = getOperatorSymbol(rule.operator);
    if (operator) {
        if (operator.isBasic) {
            if (rule.type === "integer" && (rule.operator === "less" || rule.operator === "greater" || rule.operator === "greater_or_equal" || rule.operator === "less_or_equal")) {
                return rule.id + operator.text + rule.value;
            }
            return rule.id + operator.text + "\"" + rule.value + "\"";
        }
        if (not && length === 1) {
            return "(" + operator.text + "(" + rule.id + "))";
        }
        return operator.text + "(" + rule.id + ")";
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