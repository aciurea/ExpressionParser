$(document).ready(function () {
    $('#builder-basic').queryBuilder(options);
    $('#btnReset').on('click', function () {
        $('#txtParseResult').val('');
        $('#builder-basic').queryBuilder('reset');
    });

    $('#btnParse').on('click', function () {
        const expressionData = $('#builder-basic').queryBuilder('getRules');
        console.log(expressionData);
        if ($.isEmptyObject(expressionData)) return;
        const parsedExpression = parseData(expressionData);
        console.log(' \n\n The result from query builder is: ', JSON.stringify(expressionData));

        $('#txtExpression').val(parsedExpression);
        $('#queryBuilderExpression').val(JSON.stringify(expressionData));
    });
    $('#btnOldImpl').click(function () {
        $("#oldContent").toggleClass("tglOldImpl");
        $('i.glyphicon').toggleClass("glyphicon-menu-up").toggleClass("glyphicon-menu-down");
    });
    $('#addParam').click(function () {
        const param = $('#txtParam').val();
        const type = $('#paramType').val();
        AddNewParam(param, type);
    });

    $('#btnLoadExpression').on('click', function () {
        const expression = $('#txtParseResult').val();
        loadExpressionFromServer(expression);
    });
    disableNot();
});
const jsonFilters = [
    { id: '@lang', label: 'Lang', type: 'string', size: 30 },
    { id: '@anid', label: 'Anid', type: 'string', size: 30 },
    { id: '@v7', label: 'V7', type: 'string', size: 30 },
    { id: '@sr', label: 'SR', type: 'string', size: 30 },
    { id: '@vip', label: 'Vip', type: 'string', size: 30 },
    { id: '@cip', label: 'Cip', type: 'string', size: 30 },
    { id: '@real', label: 'Real', type: 'string', size: 30 },
    { id: '@flag', label: 'flag', type: 'string', size: 30 },
    { id: '@domain', label: 'Domain', type: 'string', size: 30 },
    { id: '@ic', label: 'IC', type: 'string', size: 30 },
    { id: '@mkw', label: 'MKW', type: 'string', size: 30 },
    { id: '@reftype', label: 'RefType', type: 'string', size: 30 },
    { id: '@searchlang', label: 'SearchLang', type: 'string', size: 30 },
    { id: '@searchterm', label: 'SearchTerm', type: 'string', size: 30 },
    { id: '@country', label: 'Country', type: 'string', size: 30 },
    { id: '@os', label: 'Os', type: 'string', size: 30 },
    { id: '@iswin', label: 'isWin', type: 'string', size: 30 },
    { id: '@version', label: 'Version', type: 'string', size: 30 },
    { id: '@currency', label: 'Currency', type: 'string', size: 30 },
    { id: '@gpr', label: 'Gpr', type: 'string', size: 30 },
    { id: '@referrer', label: 'Referrer', type: 'string', size: 30 },
    { id: '@ispokerpromotionreferrer', label: 'isPokerPromotionReferrer', type: 'string', size: 30 },
    { id: '@iscasinopromotionreferrer', label: 'isCasinoPromotionReferrer', type: 'string', size: 30 },
    { id: '@cookie_cstatus', label: 'COOKIE__CSTATUS', type: 'string', size: 30 },
    { id: '@useragent', label: 'userAgent', type: 'string', size: 30 },
    { id: '@vipnative', label: 'VIPNative', type: 'integer', size: 30 }
];
let options = {
    allow_empty: false,
    plugins: {
        "not-group": null
    },

    filters: jsonFilters,

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

function disableNot() {
    $("#builder-basic_group_0").bind("DOMSubtreeModified", function (object) {
        const target = object.target.className;
        if (target === "rules-list") {
            const count = object.target.childElementCount;
            if (count > 0) {
                const nodeName = object.target.children[0].nodeName;
                if (nodeName === "DL") {
                    const button = object.target.offsetParent.children[0].children[1].children[0];
                    if (count > 1) {
                        button.style.display = "block";
                    }
                    else button.style.display = "none";
                }
            }
        }
    });
}

function AddValues(data) {
    if (data.value != null && data.value.indexOf(' "') === 0) {
        data.value = data.value.slice(2);
    }

    return {
        field: data.field,
        id: data.id,
        input: data.input,
        operator: data.operator,
        type: data.type,
        value: data.value
    }
}

function BeautifyLeft(data, index, result, not, condition) {
    var rules = AddValues(data);
    if (not) {
        result.not = not;
    }
    if (condition !== result.condition) {
        if (condition === result.rules[result.rules.length - 1].condition && not === result.rules[result.rules.length - 1].not) {
            var lastGroup = result.rules[result.rules.length - 1];
            result.rules = result.rules.slice(0, -1);
            var actualResult = { condition: condition, not: not, rules: [] };
            actualResult.rules.push(result);
            actualResult.rules.push(lastGroup.rules[0], rules);
            return actualResult;
        }
        var res = { condition: condition, not: not, rules: [] }; res.rules.push(rules);
        result.rules.push(res);
        return result;
    }
    result.condition = condition;
    result.rules.push(rules);
    return result;
}
function BeautifyRight(data, result, condition, not) {
    var prevRes = BeautifyExpression(data);
    if (prevRes.condition !== condition) {
        var resultToBeReturned = { condition: condition, not: not, rules: [] };
        resultToBeReturned.rules.push(result);
        resultToBeReturned.rules.push(prevRes);
        return resultToBeReturned;
    }
    if (prevRes.condition !== data.condition) {
        var lastGroup = prevRes.rules[prevRes.rules.length - 1];
        prevRes.rules = prevRes.rules.slice(0, -1);
        var actualRes = { condition: data.condition, not: data.not, rules: [] };
        actualRes.rules.push(prevRes);
        actualRes.rules.push(lastGroup);
        result.rules.push(actualRes);
        return result;
    }
    if (result.rules.length === 2) {
        var tempResult = { condition: condition, not: not, rules: [] };
        tempResult.rules.push(result, prevRes);
        return tempResult;
    }
    result.rules.push(prevRes);

    return result;
}
function createJson(data, result) {
    if (data.rules && data.rules[0].condition) {
        const prevRes = BeautifyExpression(data.rules[0]);
        return prevRes;
    }
    const rules = [];
    rules.push(AddValues(data.rules[0]));
    if (result == undefined) result = { condition: data.condition, not: data.not, rules: rules }
    else result.rules.push(rules);

    return result;
}
function BeautifyExpression(data, result) {
    result = createJson(data, result);
    if (data.rules.length > 1) {
        for (let i = 1; i < data.rules.length; i++) {
            if (data.rules[i].condition) {
                result = BeautifyRight(data.rules[i], result, data.condition, data.not);
            } else {
                result = BeautifyLeft(data.rules[i], i, result, data.not, data.condition);
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
    console.log('Data from server is', data);
    if (data.rules[0].condition === "") data.rules[0].condition = "AND";
    const result = BeautifyExpression(data);
    //console.log("Result after parsing, is", result);
    if (result) {
        getData(result);
        $('#builder-basic').queryBuilder('setRules', result);
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
    const isEqual = options.filters.some(function (val) { return val.id === data.id });
    if (!isEqual) {
        options.filters.push({ id: data.id, label: data.field, type: data.type, size: 30 });
        $('#builder-basic').queryBuilder('destroy');
        $('#builder-basic').queryBuilder(options);
    }
}

function AddNewParam(value, type) {
    if (value !== "") {
        value = "@" + value;
        const isEqual = options.filters.some(function (val) {
            return val.id === value;
        });
        if (!isEqual) {
            options.filters.push({ id: value, label: value.slice(1), type: type, size: 30 });
            $('#builder-basic').queryBuilder('destroy');
            $('#builder-basic').queryBuilder(options);
        }
    }
}

function parseLeft(data, result, condition, index, not) {
    //if there are more than one rule
    if (index > 1) {
        //if we have not
        if (not) {
            let prevRes = result.replace('NOT ', '');
            prevRes = prevRes.slice(1, -1);
            result = "NOT " + "((" + prevRes + ") " + condition + " " + parseRule(data) + ")";
        }
        else result = "(" + result + ") " + condition + " " + parseRule(data);
    }
        //if there is a group or 2 rules that have not paranthessys
    else if (result.indexOf("AND") >= 0 || result.indexOf("OR") >= 0) {
        if (not) {
            result = "NOT" + " ((" + result + ") " + condition + " " + parseRule(data) + ")";
        }
        else result = "(" + result + ") " + condition + " " + parseRule(data);
    }
    else if (not) {
        result = "NOT (" + result + " " + condition + " " + parseRule(data) + ")";
    }
    else result += " " + condition + " " + parseRule(data);
    return result;
}
function parseRight(data, result, index, condition, not) {
    if (index >= 2) {
        if (data.rules.length >= 2) result = "(" + result + ")" + " " + condition + " (" + parseData(data) + ")";
        else if (not) {
            const prevRes = result.replace('NOT ', '');
            result = "NOT " + "(" + prevRes + " " + condition + " " + parseData(data) + ")";
        }
        else { result = "(" + result + ")" + " " + data.condition + " " + parseData(data); }
    }
    else if (data.rules.length >= 2) {
        if (result.match(/[(]/gi).length >= 2) {
            if (not) result = "NOT ((" + result + ")" + " " + condition + " (" + parseData(data) + "))";
            else result = "(" + result + ")" + " " + condition + " (" + parseData(data) + ")";
        }
        else if (not) result = "NOT (" + result + " " + data.condition + " (" + parseData(data) + "))";
        else result += " " + data.condition + " (" + parseData(data) + ")";
    }
    else if (result.indexOf("AND") >= 0 || result.indexOf("OR") >= 0) {
        if (not) result = "NOT ((" + result + ")" + " " + data.condition + " (" + parseData(data) + "))";
        else result = "(" + result + ")" + " " + data.condition + " (" + parseData(data) + ")";
    }
    else if (not) result = "NOT (" + result + " " + condition + " " + parseRule(data.rules[0]) + ")";
    else result += " " + data.condition + " " + parseRule(data.rules[0], data.not);
    return result;
}
function createExpression(data) {
    let result;
    if (data.rules && data.rules[0].condition)
        if (data.not && data.rules.length === 1) {
            console.log('I was here');
            result = "NOT (" + parseData(data.rules[0]) + ")";
        }
        else result = parseData(data.rules[0]);
    else if (data.not && data.rules && data.rules.length === 1) {
        result = "NOT " + parseRule(data.rules[0], data.not, data.rules.length);
    }
    else result = parseRule(data.rules[0], data.not, data.rules.length);
    return result;
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
    let result = "";
    const operator = getOperatorSymbol(rule.operator);
    if (operator) {
        if (operator.isBasic) {
            if (rule.type === "integer" && (rule.operator === "less" || rule.operator === "greater" || rule.operator === "greater_or_equal" || rule.operator === "less_or_equal")) {
                result = rule.id + operator.text + rule.value;
            } else {
                result = rule.id + operator.text + "\"" + rule.value + "\"";
            }
        } else {
            if (not && length === 1) {
                return "(" + operator.text + "(" + rule.id + "))";
            }
            return operator.text + "(" + rule.id + ")";
        }
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