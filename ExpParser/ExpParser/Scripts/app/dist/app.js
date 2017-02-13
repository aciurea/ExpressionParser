(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _employeeModule = require("./employeeModule");

(function () {
    console.log(_employeeModule.gigel);
    var emp = new _employeeModule.Employee("Vasilica");
    var d = emp.doWork();
    console.log(d);
})();

},{"./employeeModule":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Employee = function () {
    function Employee(name) {
        _classCallCheck(this, Employee);

        this._name = name;
    }

    _createClass(Employee, [{
        key: "doWork",
        value: function doWork() {
            return this._name + " is working";
        }
    }, {
        key: "name",
        get: function get() {
            return this._name;
        }
    }]);

    return Employee;
}();

exports.Employee = Employee;


var gigel = {
    "gigel": 1,
    "ionel": 2,
    "vasilica": 3
};
exports.gigel = gigel;
var d1 = exports.d1 = 1321321321;

},{}],3:[function(require,module,exports){
"use strict";

var _segmentationBuilder = require("./segmentationBuilder");

"use strict";

$(document).ready(function () {
    var index = 0;
    $("#btnExpressionParser").on("click", function () {
        index = 0;
        debugger;
        var expression = $("#txtExpression").val();
        var result = analyzeCondition(expression);
        console.log(result);

        $("#builder-basic").queryBuilder("setRules", result);
    });
    var operators = ["<>", "=$%", "<=", "=<", ">=", "=>", "=^%", "=%^", "=^", "=%", "=", "<", ">"];
    //var index = 1;
    function analyzeCondition(expression) {
        var couples = getCouples(expression);
        var groupedCouples = getGroupCouples(couples, 0);
        console.log(groupedCouples);
        var result = buildObjectFromExpression(groupedCouples, expression);

        return result;
    }

    function buildObjectFromExpression(couples, expression) {
        var result = void 0;
        if (!(couples instanceof Array)) {
            couples = new Array(couples);
            couples = couples[0].couples;
        }
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = couples[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var couple = _step.value;


                //if is group, do it recursively 
                if (couple.isGroup) {
                    var prevRes = buildObjectFromExpression(couple, expression);
                    var operator = getOperatorIndex(expression, couple.ClosePIndex);
                    index += 1;
                    if (!result) {
                        result = { condition: operator.operator, not: false, rules: new Array(prevRes) };
                    } else {
                        result.rules.push(prevRes);
                    }
                }
                //no Groups, just normal rules
                else {
                        var values = getDataFromSimpleExpression(couple, expression, index);
                        var _operator = getOperatorIndex(expression, couple.ClosePIndex);
                        //no not for the moment
                        if (!result) {
                            result = { condition: _operator.operator, not: false, rules: [] };
                        }
                        result.rules.push(values);
                        index = couple.ClosePIndex + _operator.index;
                    }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return result;
    }

    function getNotIndex(expression, fromIndex) {
        var notIndex = expression.indexOf("NOT", fromIndex);
        if (notIndex === -1) {
            notIndex = expression.indexOf("not", fromIndex);
            if (notIndex === -1) {
                notIndex = expression.indexOf("Not", fromIndex);
            }
        }
        return notIndex;
    }

    function getGroupCouples(couples, lastIndexRule, isInGroup) {
        var groupedCouples = [];
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = couples[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var couple = _step2.value;

                if (couple.ClosePIndex <= lastIndexRule && !isInGroup) {
                    //ignore the rule/couple
                } else {
                    if (couple.isGroup) {
                        isInGroup = true;
                        var grCouples = getCouplesFromGroup(couples, couple);
                        lastIndexRule = couple.ClosePIndex;
                        var prevRes = getGroupCouples(grCouples, lastIndexRule, isInGroup);
                        isInGroup = false;
                        if (groupedCouples.couples == undefined) {
                            var prevCouples = { isGroup: true, couples: prevRes };
                            groupedCouples.push(prevCouples);
                        } else {
                            var _prevCouples = { isGroup: true, couples: prevRes };
                            groupedCouples.push(_prevCouples);
                        }
                    } else {
                        groupedCouples.push(couple);
                    }
                }
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        return groupedCouples;
    }
    function getCouplesFromGroup(couples, couple) {
        var insideCouples = [];
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = couples[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var c = _step3.value;

                if (c.ClosePIndex < couple.ClosePIndex && c.OpenPIndex > couple.OpenPIndex) insideCouples.push(c);
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        return insideCouples;
    }
    function getDataFromSimpleExpression(couple, expression, index) {
        var compareValue = expression.substring(index, couple.OpenPIndex).trim();
        if (compareValue.indexOf("(Exists") === 0) {
            console.log("I've been here.....");
            index += 1;
            return getValuesFromExistsExp(couple, expression);
        }
        if (compareValue.indexOf("Exists") === 0) {
            return getValuesFromExistsExp(couple, expression);
        } else {
            return getValuesFromNormalExp(couple, expression, index);
        }
    }
    function getCompareSign(data, fromIndex, couple) {
        var expression = data.slice(couple.OpenPIndex, couple.ClosePIndex);
        var opr;
        operators.some(function (op) {
            var o = expression.indexOf(op);
            if (o !== -1) {
                opr = op;
            }
            return opr;
        });
        var currentOpIndex = data.indexOf(opr, fromIndex);
        return { operator: opr, index: currentOpIndex };
    }
    function getValuesFromNormalExp(couple, expression, index) {
        var res = getCompareSign(expression, index, couple);
        var parameter = expression.substring(couple.OpenPIndex + 1, res.index).trim();
        var valueToCompareTo = expression.substring(res.index + res.operator.length + 1, couple.ClosePIndex - 1);
        var op = (0, _segmentationBuilder.getOperator)(res.operator);
        var result = {
            operator: op.text,
            field: parameter.toLowerCase(),
            id: parameter,
            input: "text",
            type: "string",
            value: valueToCompareTo.trim()
        };
        return result;
    }
    function getValuesFromExistsExp(couple, expression) {
        var value = expression.substring(couple.OpenPIndex + 1, couple.ClosePIndex);
        return {
            operator: "exists",
            field: value,
            id: value,
            input: "text",
            type: "string",
            value: null
        };
    }
    function getOperatorIndex(data, fromIndex) {
        var index = data.indexOf("OR", fromIndex);
        if (index === -1 || index - fromIndex > 5) {
            return { index: 5, operator: "AND" };
        }
        return { index: 4, operator: "OR" };
    }
    function getCouples(expression) {
        expression = expression.trim();
        var indexOfCharInCondition = -1;
        var indexOfLastOpenP = 0;
        var dicPCouplesSource = [];
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = expression[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var c = _step4.value;


                indexOfCharInCondition++;
                if (c === '(') {
                    indexOfLastOpenP++;
                    //are multiple paranthesis open, we deal with a group
                    if (indexOfLastOpenP > 1 && dicPCouplesSource[dicPCouplesSource.length - 1].ClosePIndex === -1) {
                        dicPCouplesSource[dicPCouplesSource.length - 1].isGroup = true;
                    }
                    dicPCouplesSource.push({ OpenPIndex: indexOfCharInCondition, ClosePIndex: -1, isGroup: false });
                } else if (c === ')') {
                    var couplesIndex = -1;
                    couplesIndex = dicPCouplesSource.length;
                    var coupleToCloseFounded = false;
                    coupleToCloseFounded = false;
                    while (couplesIndex > 0) {
                        if (dicPCouplesSource[couplesIndex - 1].ClosePIndex === -1) {
                            dicPCouplesSource[couplesIndex - 1].ClosePIndex = indexOfCharInCondition;
                            coupleToCloseFounded = true;
                            indexOfLastOpenP--;
                            break;
                        }
                        couplesIndex--;
                    }
                    if (coupleToCloseFounded === false) {
                        return "error";
                    }
                }
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }

        return dicPCouplesSource;
    }
});

},{"./segmentationBuilder":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
$(document).ready(function () {
    setFilters();
    $("#btnReset").on("click", function () {
        $("#txtParseResult").val("");
        $("#builder-basic").queryBuilder("reset");
    });

    $("#btnParse").on("click", function () {
        var expressionData = $("#builder-basic").queryBuilder("getRules");
        console.log('Expression parsed is: ', expressionData);
        if ($.isEmptyObject(expressionData)) return;
        var parsedExpression = parseData(expressionData);
        $("#txtExpression").val(parsedExpression);
    });
    $("#btnOldImpl").click(function () {
        $("#oldContent").toggleClass("tglOldImpl");
        $("i.glyphicon").toggleClass("glyphicon-menu-up").toggleClass("glyphicon-menu-down");
    });
});
function setFilters() {
    $.getJSON("./filters.json", function (data) {
        options.filters = data;
        $("#builder-basic").queryBuilder(options);
    });
}
var options = {
    allow_empty: false,
    plugins: {
        "not-group": null
    },
    filters: [],
    operators: [{ type: "exists", nb_inputs: 0, apply_to: ["string", "integer", "datetime", "boolean"] }, { type: "equal" }, { type: "equal_ignore_case", nb_inputs: 1, apply_to: ["string", "datetime", "boolean"] }, { type: "not_equal" }, { type: "less" }, { type: "less_or_equal" }, { type: "greater" }, { type: "greater_or_equal" }, { type: "contains" }, { type: "contains_ignore_case", nb_inputs: 1, apply_to: ["string", "datetime", "boolean"] }, { type: "regex_match", nb_inputs: 1, apply_to: ["string", "number", "datetime", "boolean"] }],

    conditions: ["AND", "OR"],
    default_condition: "AND"
};
function loadSessionParameters() {
    var parameters = $("#sessionParameters").val();
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
    };
}

function BeautifyLeft(data, index, result) {
    var rules = AddValues(data);
    return result.rules.push(rules);
}
function BeautifyRight(data, index, result) {
    var rules = [];
    var prevRest = BeautifyExpression(data);
    rules.push(result);
    rules.push(prevRest);
    return result = { data: data.condition, not: data.not, rules: rules };
}
function createJson(data, result) {
    if (data.rules && data.rules[0].condition) {
        var prevRes = BeautifyExpression(data.rules[0]);
        return result === undefined ? prevRes : result;
    } else {
        var rules = [];
        var isSimpleGroup = data.rules[0] && data.rules[1] && !data.rules[1].condition;

        rules.push(AddValues(data.rules[0]));
        result = isSimpleGroup ? { condition: data.condition, not: data.not, rules: rules } : result.rules.push(rules);
    }
    return result;
}
function BeautifyExpression(data, result) {
    result = createJson(data, result);
    if (data.rules.length > 1) {
        for (var i = 1; i < data.rules.length; i++) {
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
        expression = $("#txtParseResult").val();
    }
    var data = JSON.parse(expression);
    //const result = BeautifyExpression(data);
    if (data) {
        getData(data);
        $("#builder-basic").queryBuilder("setRules", data);
    } else {
        $("#builder-basic").queryBuilder("reset");
    }
}

function getData(data) {
    if (data.rules && data.rules[0].condition) {
        getData(data.rules[0]);
    }
    if (data.rules && data.rules[0].condition && data.rules[1]) {
        getData(data.rules[1]);
    } else if (data.rules) {
        checkParameters(data.rules[0]);
    } else {
        checkParameters(data);
    }
    if (data.rules && data.rules.length > 1 && !data.rules[0].condition) {
        for (var i = 0; i < data.rules.length; i++) {
            if (data.rules[i].condition) {
                getData(data.rules[i]);
            } else {
                checkParameters(data.rules[i]);
            }
        }
    }
}
function checkParameters(data) {
    var isParameter = options.filters.some(function (val) {
        return val.id === data.id;
    });
    if (!isParameter) {
        options.filters.push({ id: data.id, label: data.field, type: data.type, size: 30 });
        $("#builder-basic").queryBuilder("destroy");
        $("#builder-basic").queryBuilder(options);
    }
}

function parseLeft(data, result, index, condition, not) {
    if (not) {
        if (data.operator === "less" || data.operator === "greater" || data.operator === "greater_or_equal" || data.operator === "less_or_equal") {
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
    var result = void 0;
    result = createExpression(data);
    if (data.rules && data.rules.length > 1) {
        for (var i = 1; i < data.rules.length; i++) {
            var arrP = [data.rules[i], result, i, data.condition, data.not];
            result = data.rules[i].condition ? parseRight.apply(undefined, arrP) : parseLeft.apply(undefined, arrP);
        }
    }
    return result;
}

function parseRule(rule, not, length) {
    var result;
    var operator = getOperatorSymbol(rule.operator);
    if (operator) {
        if (operator.isBasic) {
            if (rule.type === "integer" && (rule.operator === "less" || rule.operator === "greater" || rule.operator === "greater_or_equal" || rule.operator === "less_or_equal")) {
                return "(" + rule.id + operator.text + rule.value + ")";
            }
            result = "(" + rule.id + operator.text + "\"" + rule.value + "\")";
            if (not) {
                if (length === 1) {
                    return result;
                }
                return "(" + result + ")";
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
        case "equal":
            return { text: "=", isBasic: true };
        case "not_equal":
            return { text: "<>", isBasic: true };
        case "less":
            return { text: "<", isBasic: true };
        case "less_or_equal":
            return { text: "<=", isBasic: true };
        case "greater":
            return { text: ">", isBasic: true };
        case "greater_or_equal":
            return { text: ">=", isBasic: true };
        case "equal_ignore_case":
            return { text: "=^", isBasic: true };
        case "contains":
            return { text: "=%", isBasic: true };
        case "contains_ignore_case":
            return { text: "=%^", isBasic: true };
        case "regex_match":
            return { text: "=$%", isBasic: true };
        case "exists":
            return { text: "Exists", isBasic: false };
        default:
            console.log("Not implemented operator: " + operator);
    }

    return null;
}

var getOperator = exports.getOperator = function getOperator(operatorSymbol) {
    switch (operatorSymbol) {
        case "=":
            return { text: "equal", isBasic: true };
        case "<>":
            return { text: "not_equal", isBasic: true };
        case "<":
            return { text: "less", isBasic: true };
        case "<=":
        case "=<":
            return { text: "less_or_equal", isBasic: true };
        case ">":
            return { text: "greater", isBasic: true };
        case ">=":
        case "=>":
            return { text: "greater_or_equal", isBasic: true };
        case "=^":
            return { text: "equal_ignore_case", isBasic: true };
        case "=%":
            return { text: "contains", isBasic: true };
        case "=%^":
        case "=^%":
            return { text: "contains_ignore_case", isBasic: true };
        case "=$%":
            return { text: "regex_match", isBasic: true };
        case "Exists":
            return { text: "exists", isBasic: false };
        default:
            console.log("Not implemented operator: " + operatorSymbol);
    }

    return null;
};

},{}]},{},[1,2,3,4]);
