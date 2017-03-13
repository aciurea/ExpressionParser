(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _segmentationBuilder = require("./segmentationBuilder");

"use strict";

$(document).ready(function () {
    var objIndex = { length: 0 };
    $("#btnExpressionParser").on("click", function () {
        objIndex.length = 0;
        var expression = $("#txtExpression").val();
        var result = analyzeCondition(expression);

        $("#builder-basic").queryBuilder("setRules", result);
    });
    var operators = ["<>", "=$%", "<=", "=<", ">=", "=>", "=^%", "=%^", "=^", "=%", "=", "<", ">"];
    function analyzeCondition(expression) {
        expression = expression.replace(/ /g, '');
        var couples = getCouples(expression);
        var groupedCouples = getGroupCouples(couples, 0);
        var index = 0;
        var result = buildObjectFromExpression(groupedCouples, expression, index, false);

        return result;
    }

    function buildObjectFromExpression(couples, expression, index, isRcv) {
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

                debugger;
                //if is group, do it recursively 
                if (couple.isGroup) {

                    var isNot = checkNotOperator(couple, expression, index);
                    index += isNot.not ? isNot.index + 1 : 1;

                    var prevRes = buildObjectFromExpression(couple, expression, index, true);
                    var operator = getOperatorIndex(expression, couple.ClosePIndex);

                    //prevRes.not = isNot.not;
                    if (!result) {
                        var _isNot = checkNotOperator(couple, expression, index);
                        result = { condition: operator.operator, not: _isNot.not, rules: new Array(prevRes) };
                    } else {
                        result.rules.push(prevRes);
                    }
                }
                //no Groups, just normal rules
                else {
                        if (index < objIndex.length) {
                            index = isRcv ? objIndex.length + 1 : objIndex.length;
                        }

                        var _isNot2 = checkNotOperator(couple, expression, index);
                        index += _isNot2 ? _isNot2.index : 0;
                        var values = getDataFromSimpleExpression(couple, expression, index);
                        var _operator = getOperatorIndex(expression, couple.ClosePIndex);
                        //no not for the moment
                        if (!result) {
                            result = { condition: _operator.operator, not: _isNot2.not, rules: [] };
                        }
                        result.rules.push(values);
                        objIndex.length = index = couple.ClosePIndex + _operator.index;
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

    function checkNotOperator(couple, expression, index) {
        expression = expression.substring(index).toLowerCase();

        var i = expression.indexOf('not');

        return i === 0 ? { index: 3, not: true } : { index: 0, not: false };
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
        var expr = expression.toLowerCase();
        var compareValue = expr.substring(index, couple.OpenPIndex);

        if (compareValue.indexOf("exists") === 0) {
            var result = getValuesFromExistsExp(couple, expression);
            return result;
        } else {
            var _result = getValuesFromNormalExp(couple, expression, index);
            return _result;
        }
    }

    function getCompareSign(data, fromIndex, couple) {
        var expression = data.slice(couple.OpenPIndex, couple.ClosePIndex);
        var opr = void 0;

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
        var parameter = expression.substring(couple.OpenPIndex + 1, res.index);
        var valueToCompareTo = expression.substring(res.index + res.operator.length + 1, couple.ClosePIndex - 1);
        var op = (0, _segmentationBuilder.getOperator)(res.operator);
        var result = {
            operator: op.text,
            field: parameter.toLowerCase(),
            id: parameter,
            input: "text",
            type: "string",
            value: valueToCompareTo
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
        data = data.substring(fromIndex).toLowerCase();
        var index = data.indexOf("or");

        if (index === 0 || index === 1) {
            return { index: 2 + index, operator: "OR" };
        }
        index = data.indexOf('and');

        return { index: 3 + index, operator: "AND" };
    }

    function getCouples(expression) {
        expression = expression;
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

},{"./segmentationBuilder":2}],2:[function(require,module,exports){
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
        if ($.isEmptyObject(expressionData)) return;
        var parsedExpression = parseData(expressionData);
        $("#txtExpression").val(parsedExpression);
    });
    $("#btnOldImpl").click(function () {
        $("#oldContent").toggleClass("tglOldImpl");
        $("i.glyphicon").toggleClass("glyphicon-menu-up").toggleClass("glyphicon-menu-down");
    });
});

//#### Query Builder Settings
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
//##### End Query Builder Settings

// ####### expression builder ##########
function createExpression(data) {
    if (data.rules && data.rules[0].condition) {
        var _result = parseData(data.rules[0]);

        _result = data.not ? "NOT (" + _result + ")" : "(" + _result + ")";
        return _result;
    }
    var result = parseRule(data.rules[0], data.not);

    result = data.not ? "NOT " + result : result;
    return result;
}
function parseData(data) {
    var result = void 0;
    result = createExpression(data);
    if (data.rules && data.rules.length > 1) {
        for (var i = 1; i < data.rules.length; i++) {
            var arrP = [data.rules[i], result, data.condition];

            result = data.rules[i].condition ? parseRightSide.apply(undefined, arrP) : parseLeftSide.apply(undefined, arrP);
        }
    }
    return result;
}
function parseRightSide(data, result, condition) {
    return result + " " + condition + " (" + parseData(data) + ")";
}
function parseLeftSide(data, result, condition) {
    return result + " " + condition + " " + parseRule(data);
}
function parseRule(rule, not) {
    var operator = getOperatorSymbol(rule.operator);

    if (operator) {
        if (operator.isBasic) {
            if (rule.type === "integer" && isBasicOperator(rule.operator)) {
                return "(" + rule.id + operator.text + rule.value + ")";
            }
            return "(" + rule.id + operator.text + "\"" + rule.value + "\")";
        }
        return operator.text + "(" + rule.id + ")";
    }
    return undefined;
}
function isBasicOperator(operator) {
    return operator === "less" || operator === "greater" || operator === "greater_or_equal" || operator === "less_or_equal";
}
// ####### end expression builder ######

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

    return undefined;
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

    return undefined;
};

},{}]},{},[1,2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJTY3JpcHRzXFxhcHBcXHNyY1xcZXhwcmVzc2lvblBhcnNlci5qcyIsIlNjcmlwdHNcXGFwcFxcc3JjXFxzZWdtZW50YXRpb25CdWlsZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQzs7QUFDRDs7QUFFQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVk7QUFDMUIsUUFBSSxXQUFXLEVBQUUsUUFBUSxDQUFWLEVBQWY7QUFDQSxNQUFFLHNCQUFGLEVBQTBCLEVBQTFCLENBQTZCLE9BQTdCLEVBQXNDLFlBQVk7QUFDOUMsaUJBQVMsTUFBVCxHQUFrQixDQUFsQjtBQUNBLFlBQU0sYUFBYSxFQUFFLGdCQUFGLEVBQW9CLEdBQXBCLEVBQW5CO0FBQ0EsWUFBTSxTQUFTLGlCQUFpQixVQUFqQixDQUFmOztBQUVBLFVBQUUsZ0JBQUYsRUFBb0IsWUFBcEIsQ0FBaUMsVUFBakMsRUFBNkMsTUFBN0M7QUFDSCxLQU5EO0FBT0EsUUFBSSxZQUFZLENBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxJQUFkLEVBQW9CLElBQXBCLEVBQTBCLElBQTFCLEVBQWdDLElBQWhDLEVBQXNDLEtBQXRDLEVBQTZDLEtBQTdDLEVBQW9ELElBQXBELEVBQTBELElBQTFELEVBQWdFLEdBQWhFLEVBQXFFLEdBQXJFLEVBQTBFLEdBQTFFLENBQWhCO0FBQ0EsYUFBUyxnQkFBVCxDQUEwQixVQUExQixFQUFzQztBQUNsQyxxQkFBYSxXQUFXLE9BQVgsQ0FBbUIsSUFBbkIsRUFBd0IsRUFBeEIsQ0FBYjtBQUNBLFlBQU0sVUFBVSxXQUFXLFVBQVgsQ0FBaEI7QUFDQSxZQUFNLGlCQUFpQixnQkFBZ0IsT0FBaEIsRUFBeUIsQ0FBekIsQ0FBdkI7QUFDQSxZQUFJLFFBQVEsQ0FBWjtBQUNBLFlB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O0FBQ0EsYUFBSyxJQUFMO0FBQVcsbUJBQU8sRUFBRSxNQUFNLGtCQUFSLEVBQTRCLFNBQVMsSUFBckMsRUFBUDtBQUNYLGFBQUssSUFBTDtBQUFXLG1CQUFPLEVBQUUsTUFBTSxtQkFBUixFQUE2QixTQUFTLElBQXRDLEVBQVA7QUFDWCxhQUFLLElBQUw7QUFBVyxtQkFBTyxFQUFFLE1BQU0sVUFBUixFQUFvQixTQUFTLElBQTdCLEVBQVA7QUFDWCxhQUFLLEtBQUw7QUFDQSxhQUFLLEtBQUw7QUFBWSxtQkFBTyxFQUFFLE1BQU0sc0JBQVIsRUFBZ0MsU0FBUyxJQUF6QyxFQUFQO0FBQ1osYUFBSyxLQUFMO0FBQVksbUJBQU8sRUFBRSxNQUFNLGFBQVIsRUFBdUIsU0FBUyxJQUFoQyxFQUFQO0FBQ1osYUFBSyxRQUFMO0FBQWUsbUJBQU8sRUFBRSxNQUFNLFFBQVIsRUFBa0IsU0FBUyxLQUEzQixFQUFQO0FBQ2Y7QUFDSSxvQkFBUSxHQUFSLENBQVksK0JBQStCLGNBQTNDO0FBaEJSOztBQW1CQSxXQUFPLFNBQVA7QUFDSCxDQXJCTSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCLvu79pbXBvcnQge2dldE9wZXJhdG9yfSBmcm9tIFwiLi9zZWdtZW50YXRpb25CdWlsZGVyXCI7XHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgbGV0IG9iakluZGV4ID0geyBsZW5ndGg6IDAgfTtcclxuICAgICQoXCIjYnRuRXhwcmVzc2lvblBhcnNlclwiKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBvYmpJbmRleC5sZW5ndGggPSAwO1xyXG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSAkKFwiI3R4dEV4cHJlc3Npb25cIikudmFsKCk7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYW5hbHl6ZUNvbmRpdGlvbihleHByZXNzaW9uKTtcclxuXHJcbiAgICAgICAgJChcIiNidWlsZGVyLWJhc2ljXCIpLnF1ZXJ5QnVpbGRlcihcInNldFJ1bGVzXCIsIHJlc3VsdCk7XHJcbiAgICB9KTtcclxuICAgIHZhciBvcGVyYXRvcnMgPSBbXCI8PlwiLCBcIj0kJVwiLCBcIjw9XCIsIFwiPTxcIiwgXCI+PVwiLCBcIj0+XCIsIFwiPV4lXCIsIFwiPSVeXCIsIFwiPV5cIiwgXCI9JVwiLCBcIj1cIiwgXCI8XCIsIFwiPlwiXTtcclxuICAgIGZ1bmN0aW9uIGFuYWx5emVDb25kaXRpb24oZXhwcmVzc2lvbikge1xyXG4gICAgICAgIGV4cHJlc3Npb24gPSBleHByZXNzaW9uLnJlcGxhY2UoLyAvZywnJyk7XHJcbiAgICAgICAgY29uc3QgY291cGxlcyA9IGdldENvdXBsZXMoZXhwcmVzc2lvbik7XHJcbiAgICAgICAgY29uc3QgZ3JvdXBlZENvdXBsZXMgPSBnZXRHcm91cENvdXBsZXMoY291cGxlcywgMCk7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBidWlsZE9iamVjdEZyb21FeHByZXNzaW9uKGdyb3VwZWRDb3VwbGVzLCBleHByZXNzaW9uLCBpbmRleCwgZmFsc2UpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBidWlsZE9iamVjdEZyb21FeHByZXNzaW9uKGNvdXBsZXMsIGV4cHJlc3Npb24sIGluZGV4LCBpc1Jjdikge1xyXG4gICAgICAgIGxldCByZXN1bHQ7XHJcbiAgICAgICAgaWYgKCEoY291cGxlcyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgICAgICBjb3VwbGVzID0gbmV3IEFycmF5KGNvdXBsZXMpO1xyXG4gICAgICAgICAgICBjb3VwbGVzID0gY291cGxlc1swXS5jb3VwbGVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgY291cGxlIG9mIGNvdXBsZXMpIHtcclxuICAgICAgICAgICAgZGVidWdnZXI7XHJcbiAgICAgICAgLy9pZiBpcyBncm91cCwgZG8gaXQgcmVjdXJzaXZlbHkgXHJcbiAgICAgICAgICAgIGlmIChjb3VwbGUuaXNHcm91cCkgeyAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaXNOb3QgPSBjaGVja05vdE9wZXJhdG9yKGNvdXBsZSwgZXhwcmVzc2lvbiwgaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgaW5kZXggKz0gaXNOb3Qubm90PyBpc05vdC5pbmRleCArIDE6IDE7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZXZSZXMgPSBidWlsZE9iamVjdEZyb21FeHByZXNzaW9uKGNvdXBsZSwgZXhwcmVzc2lvbiwgaW5kZXgsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3BlcmF0b3IgPSBnZXRPcGVyYXRvckluZGV4KGV4cHJlc3Npb24sIGNvdXBsZS5DbG9zZVBJbmRleCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vcHJldlJlcy5ub3QgPSBpc05vdC5ub3Q7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzTm90ID0gY2hlY2tOb3RPcGVyYXRvcihjb3VwbGUsIGV4cHJlc3Npb24sIGluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB7IGNvbmRpdGlvbjogb3BlcmF0b3Iub3BlcmF0b3IsIG5vdDogaXNOb3Qubm90LCBydWxlczogbmV3IEFycmF5KHByZXZSZXMpIH07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ydWxlcy5wdXNoKHByZXZSZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL25vIEdyb3VwcywganVzdCBub3JtYWwgcnVsZXNcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZihpbmRleCA8IG9iakluZGV4Lmxlbmd0aCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpc1JjdiA/IG9iakluZGV4Lmxlbmd0aCArIDE6IG9iakluZGV4Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpc05vdCA9IGNoZWNrTm90T3BlcmF0b3IoY291cGxlLCBleHByZXNzaW9uLCBpbmRleCk7XHJcbiAgICAgICAgICAgICAgICBpbmRleCArPSBpc05vdCA/IGlzTm90LmluZGV4IDogMDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IGdldERhdGFGcm9tU2ltcGxlRXhwcmVzc2lvbihjb3VwbGUsIGV4cHJlc3Npb24sIGluZGV4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9wZXJhdG9yID0gZ2V0T3BlcmF0b3JJbmRleChleHByZXNzaW9uLCBjb3VwbGUuQ2xvc2VQSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgLy9ubyBub3QgZm9yIHRoZSBtb21lbnRcclxuICAgICAgICAgICAgICAgIGlmICghcmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geyBjb25kaXRpb246IG9wZXJhdG9yLm9wZXJhdG9yLCBub3Q6IGlzTm90Lm5vdCwgcnVsZXM6IFtdIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3VsdC5ydWxlcy5wdXNoKHZhbHVlcyk7XHJcbiAgICAgICAgICAgICAgICBvYmpJbmRleC5sZW5ndGggPSBpbmRleCA9IGNvdXBsZS5DbG9zZVBJbmRleCArIG9wZXJhdG9yLmluZGV4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2hlY2tOb3RPcGVyYXRvcihjb3VwbGUsIGV4cHJlc3Npb24sIGluZGV4KXtcclxuICAgICAgICBleHByZXNzaW9uID0gZXhwcmVzc2lvbi5zdWJzdHJpbmcoaW5kZXgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICBcclxuICAgICAgICBjb25zdCBpID0gZXhwcmVzc2lvbi5pbmRleE9mKCdub3QnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGkgPT09IDAgPyB7IGluZGV4OiAzLCBub3Q6dHJ1ZX0gOiB7aW5kZXg6MCwgbm90OmZhbHNlfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRHcm91cENvdXBsZXMoY291cGxlcywgbGFzdEluZGV4UnVsZSwgaXNJbkdyb3VwKSB7XHJcbiAgICAgICAgY29uc3QgZ3JvdXBlZENvdXBsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yKGxldCBjb3VwbGUgb2YgY291cGxlcykge1xyXG4gICAgICAgICAgICBpZiAoY291cGxlLkNsb3NlUEluZGV4IDw9IGxhc3RJbmRleFJ1bGUgJiYgIWlzSW5Hcm91cCkge1xyXG4gICAgICAgICAgICAgICAgLy9pZ25vcmUgdGhlIHJ1bGUvY291cGxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY291cGxlLmlzR3JvdXApIHtcclxuICAgICAgICAgICAgICAgICAgICBpc0luR3JvdXAgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyQ291cGxlcyA9IGdldENvdXBsZXNGcm9tR3JvdXAoY291cGxlcywgY291cGxlKTtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXhSdWxlID0gY291cGxlLkNsb3NlUEluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZXZSZXMgPSBnZXRHcm91cENvdXBsZXMoZ3JDb3VwbGVzLCBsYXN0SW5kZXhSdWxlLCBpc0luR3JvdXApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlzSW5Hcm91cCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChncm91cGVkQ291cGxlcy5jb3VwbGVzID09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmV2Q291cGxlcyA9IHsgaXNHcm91cDogdHJ1ZSwgY291cGxlczogcHJldlJlcyB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cGVkQ291cGxlcy5wdXNoKHByZXZDb3VwbGVzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZXZDb3VwbGVzID0geyBpc0dyb3VwOiB0cnVlLCBjb3VwbGVzOiBwcmV2UmVzIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwZWRDb3VwbGVzLnB1c2gocHJldkNvdXBsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwZWRDb3VwbGVzLnB1c2goY291cGxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZ3JvdXBlZENvdXBsZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Q291cGxlc0Zyb21Hcm91cChjb3VwbGVzLCBjb3VwbGUpIHtcclxuICAgICAgICBjb25zdCBpbnNpZGVDb3VwbGVzID0gW107XHJcblxyXG4gICAgICAgIGZvcihsZXQgYyBvZiBjb3VwbGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChjLkNsb3NlUEluZGV4IDwgY291cGxlLkNsb3NlUEluZGV4ICYmIGMuT3BlblBJbmRleCA+IGNvdXBsZS5PcGVuUEluZGV4KVxyXG4gICAgICAgICAgICAgICAgaW5zaWRlQ291cGxlcy5wdXNoKGMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaW5zaWRlQ291cGxlcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXREYXRhRnJvbVNpbXBsZUV4cHJlc3Npb24oY291cGxlLCBleHByZXNzaW9uLCBpbmRleCkge1xyXG4gICAgICAgIGNvbnN0IGV4cHIgPSBleHByZXNzaW9uLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgY29uc3QgY29tcGFyZVZhbHVlID0gZXhwci5zdWJzdHJpbmcoaW5kZXgsIGNvdXBsZS5PcGVuUEluZGV4KTtcclxuXHJcbiAgICAgICAgaWYgKGNvbXBhcmVWYWx1ZS5pbmRleE9mKFwiZXhpc3RzXCIpID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGdldFZhbHVlc0Zyb21FeGlzdHNFeHAoY291cGxlLCBleHByZXNzaW9uKTsgXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBnZXRWYWx1ZXNGcm9tTm9ybWFsRXhwKGNvdXBsZSwgZXhwcmVzc2lvbiwgaW5kZXgpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRDb21wYXJlU2lnbihkYXRhLCBmcm9tSW5kZXgsIGNvdXBsZSkge1xyXG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBkYXRhLnNsaWNlKGNvdXBsZS5PcGVuUEluZGV4LCBjb3VwbGUuQ2xvc2VQSW5kZXgpO1xyXG4gICAgICAgIGxldCBvcHI7XHJcblxyXG4gICAgICAgIG9wZXJhdG9ycy5zb21lKGZ1bmN0aW9uIChvcCkge1xyXG4gICAgICAgICAgICBjb25zdCBvID0gZXhwcmVzc2lvbi5pbmRleE9mKG9wKTtcclxuICAgICAgICAgICAgaWYgKG8gIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBvcHIgPSBvcDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gb3ByO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRPcEluZGV4ID0gZGF0YS5pbmRleE9mKG9wciwgZnJvbUluZGV4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgb3BlcmF0b3I6IG9wciwgaW5kZXg6IGN1cnJlbnRPcEluZGV4IH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0VmFsdWVzRnJvbU5vcm1hbEV4cChjb3VwbGUsIGV4cHJlc3Npb24sIGluZGV4KSB7XHJcbiAgICAgICAgY29uc3QgcmVzID0gZ2V0Q29tcGFyZVNpZ24oZXhwcmVzc2lvbiwgaW5kZXgsIGNvdXBsZSk7XHJcbiAgICAgICAgY29uc3QgcGFyYW1ldGVyID0gZXhwcmVzc2lvbi5zdWJzdHJpbmcoY291cGxlLk9wZW5QSW5kZXggKyAxLCByZXMuaW5kZXgpO1xyXG4gICAgICAgIGNvbnN0IHZhbHVlVG9Db21wYXJlVG8gPSBleHByZXNzaW9uLnN1YnN0cmluZyhyZXMuaW5kZXggKyByZXMub3BlcmF0b3IubGVuZ3RoICsgMSwgY291cGxlLkNsb3NlUEluZGV4IC0gMSk7XHJcbiAgICAgICAgY29uc3Qgb3AgPSBnZXRPcGVyYXRvcihyZXMub3BlcmF0b3IpO1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgb3BlcmF0b3I6IG9wLnRleHQsXHJcbiAgICAgICAgICAgIGZpZWxkOiBwYXJhbWV0ZXIudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgaWQ6IHBhcmFtZXRlcixcclxuICAgICAgICAgICAgaW5wdXQ6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxyXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWVUb0NvbXBhcmVUb1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRWYWx1ZXNGcm9tRXhpc3RzRXhwKGNvdXBsZSwgZXhwcmVzc2lvbikge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gZXhwcmVzc2lvbi5zdWJzdHJpbmcoY291cGxlLk9wZW5QSW5kZXggKyAxLCBjb3VwbGUuQ2xvc2VQSW5kZXgpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG9wZXJhdG9yOiBcImV4aXN0c1wiLFxyXG4gICAgICAgICAgICBmaWVsZDogdmFsdWUsXHJcbiAgICAgICAgICAgIGlkOiB2YWx1ZSxcclxuICAgICAgICAgICAgaW5wdXQ6IFwidGV4dFwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxyXG4gICAgICAgICAgICB2YWx1ZTogbnVsbFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRPcGVyYXRvckluZGV4KGRhdGEsIGZyb21JbmRleCkge1xyXG4gICAgICAgIGRhdGEgPSBkYXRhLnN1YnN0cmluZyhmcm9tSW5kZXgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gZGF0YS5pbmRleE9mKFwib3JcIik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGluZGV4ID09PSAwIHx8IGluZGV4ID09PTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgaW5kZXg6IDIgKyBpbmRleCwgb3BlcmF0b3I6IFwiT1JcIiB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbmRleCA9IGRhdGEuaW5kZXhPZignYW5kJyk7XHJcblxyXG4gICAgICAgIHJldHVybiB7IGluZGV4OiAzICsgaW5kZXgsIG9wZXJhdG9yOiBcIkFORFwiIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Q291cGxlcyhleHByZXNzaW9uKSB7XHJcbiAgICAgICAgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb247XHJcbiAgICAgICAgbGV0IGluZGV4T2ZDaGFySW5Db25kaXRpb24gPSAtMTtcclxuICAgICAgICBsZXQgaW5kZXhPZkxhc3RPcGVuUCA9IDA7XHJcbiAgICAgICAgbGV0IGRpY1BDb3VwbGVzU291cmNlID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgYyBvZiBleHByZXNzaW9uKSB7XHJcblxyXG4gICAgICAgICAgICBpbmRleE9mQ2hhckluQ29uZGl0aW9uKys7XHJcbiAgICAgICAgICAgIGlmIChjID09PSAnKCcpIHtcclxuICAgICAgICAgICAgICAgIGluZGV4T2ZMYXN0T3BlblArKztcclxuICAgICAgICAgICAgICAgIC8vYXJlIG11bHRpcGxlIHBhcmFudGhlc2lzIG9wZW4sIHdlIGRlYWwgd2l0aCBhIGdyb3VwXHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXhPZkxhc3RPcGVuUCA+IDEgJiYgZGljUENvdXBsZXNTb3VyY2VbZGljUENvdXBsZXNTb3VyY2UubGVuZ3RoIC0gMV0uQ2xvc2VQSW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGljUENvdXBsZXNTb3VyY2VbZGljUENvdXBsZXNTb3VyY2UubGVuZ3RoIC0gMV0uaXNHcm91cCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkaWNQQ291cGxlc1NvdXJjZS5wdXNoKHsgT3BlblBJbmRleDogaW5kZXhPZkNoYXJJbkNvbmRpdGlvbiwgQ2xvc2VQSW5kZXg6IC0xLCBpc0dyb3VwOiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChjID09PSAnKScpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb3VwbGVzSW5kZXggPSAtMTtcclxuICAgICAgICAgICAgICAgIGNvdXBsZXNJbmRleCA9IGRpY1BDb3VwbGVzU291cmNlLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGxldCBjb3VwbGVUb0Nsb3NlRm91bmRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgY291cGxlVG9DbG9zZUZvdW5kZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChjb3VwbGVzSW5kZXggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpY1BDb3VwbGVzU291cmNlW2NvdXBsZXNJbmRleCAtIDFdLkNsb3NlUEluZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaWNQQ291cGxlc1NvdXJjZVtjb3VwbGVzSW5kZXggLSAxXS5DbG9zZVBJbmRleCA9IGluZGV4T2ZDaGFySW5Db25kaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdXBsZVRvQ2xvc2VGb3VuZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhPZkxhc3RPcGVuUC0tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY291cGxlc0luZGV4LS07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoY291cGxlVG9DbG9zZUZvdW5kZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiZXJyb3JcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGljUENvdXBsZXNTb3VyY2U7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuIiwi77u/XCJ1c2Ugc3RyaWN0XCI7XHJcbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgIHNldEZpbHRlcnMoKTtcclxuICAgICQoXCIjYnRuUmVzZXRcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJChcIiN0eHRQYXJzZVJlc3VsdFwiKS52YWwoXCJcIik7XHJcbiAgICAgICAgJChcIiNidWlsZGVyLWJhc2ljXCIpLnF1ZXJ5QnVpbGRlcihcInJlc2V0XCIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJChcIiNidG5QYXJzZVwiKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCBleHByZXNzaW9uRGF0YSA9ICQoXCIjYnVpbGRlci1iYXNpY1wiKS5xdWVyeUJ1aWxkZXIoXCJnZXRSdWxlc1wiKTtcclxuICAgICAgICBpZiAoJC5pc0VtcHR5T2JqZWN0KGV4cHJlc3Npb25EYXRhKSkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IHBhcnNlZEV4cHJlc3Npb24gPSBwYXJzZURhdGEoZXhwcmVzc2lvbkRhdGEpO1xyXG4gICAgICAgICQoXCIjdHh0RXhwcmVzc2lvblwiKS52YWwocGFyc2VkRXhwcmVzc2lvbik7XHJcbiAgICB9KTtcclxuICAgICQoXCIjYnRuT2xkSW1wbFwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJChcIiNvbGRDb250ZW50XCIpLnRvZ2dsZUNsYXNzKFwidGdsT2xkSW1wbFwiKTtcclxuICAgICAgICAkKFwiaS5nbHlwaGljb25cIikudG9nZ2xlQ2xhc3MoXCJnbHlwaGljb24tbWVudS11cFwiKS50b2dnbGVDbGFzcyhcImdseXBoaWNvbi1tZW51LWRvd25cIik7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vLyMjIyMgUXVlcnkgQnVpbGRlciBTZXR0aW5nc1xyXG5mdW5jdGlvbiBzZXRGaWx0ZXJzKCkge1xyXG4gICAgJC5nZXRKU09OKFwiLi9maWx0ZXJzLmpzb25cIiwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICBvcHRpb25zLmZpbHRlcnMgPSBkYXRhO1xyXG4gICAgICAgICQoXCIjYnVpbGRlci1iYXNpY1wiKS5xdWVyeUJ1aWxkZXIob3B0aW9ucyk7XHJcbiAgICB9KTtcclxufVxyXG5jb25zdCBvcHRpb25zID0ge1xyXG4gICAgYWxsb3dfZW1wdHk6IGZhbHNlLFxyXG4gICAgcGx1Z2luczoge1xyXG4gICAgICAgIFwibm90LWdyb3VwXCI6IG51bGxcclxuICAgIH0sXHJcbiAgICBmaWx0ZXJzOiBbXSxcclxuICAgIG9wZXJhdG9yczogW1xyXG4gICAgICAgIHsgdHlwZTogXCJleGlzdHNcIiwgbmJfaW5wdXRzOiAwLCBhcHBseV90bzogW1wic3RyaW5nXCIsIFwiaW50ZWdlclwiLCBcImRhdGV0aW1lXCIsIFwiYm9vbGVhblwiXSB9LFxyXG4gICAgICAgIHsgdHlwZTogXCJlcXVhbFwiIH0sXHJcbiAgICAgICAgeyB0eXBlOiBcImVxdWFsX2lnbm9yZV9jYXNlXCIsIG5iX2lucHV0czogMSwgYXBwbHlfdG86IFtcInN0cmluZ1wiLCBcImRhdGV0aW1lXCIsIFwiYm9vbGVhblwiXSB9LFxyXG4gICAgICAgIHsgdHlwZTogXCJub3RfZXF1YWxcIiB9LFxyXG4gICAgICAgIHsgdHlwZTogXCJsZXNzXCIgfSxcclxuICAgICAgICB7IHR5cGU6IFwibGVzc19vcl9lcXVhbFwiIH0sXHJcbiAgICAgICAgeyB0eXBlOiBcImdyZWF0ZXJcIiB9LFxyXG4gICAgICAgIHsgdHlwZTogXCJncmVhdGVyX29yX2VxdWFsXCIgfSxcclxuICAgICAgICB7IHR5cGU6IFwiY29udGFpbnNcIiB9LFxyXG4gICAgICAgIHsgdHlwZTogXCJjb250YWluc19pZ25vcmVfY2FzZVwiLCBuYl9pbnB1dHM6IDEsIGFwcGx5X3RvOiBbXCJzdHJpbmdcIiwgXCJkYXRldGltZVwiLCBcImJvb2xlYW5cIl0gfSxcclxuICAgICAgICB7IHR5cGU6IFwicmVnZXhfbWF0Y2hcIiwgbmJfaW5wdXRzOiAxLCBhcHBseV90bzogW1wic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwiZGF0ZXRpbWVcIiwgXCJib29sZWFuXCJdIH1cclxuICAgIF0sXHJcblxyXG4gICAgY29uZGl0aW9uczogW1wiQU5EXCIsIFwiT1JcIl0sXHJcbiAgICBkZWZhdWx0X2NvbmRpdGlvbjogXCJBTkRcIlxyXG59O1xyXG4vLyMjIyMjIEVuZCBRdWVyeSBCdWlsZGVyIFNldHRpbmdzXHJcblxyXG4vLyAjIyMjIyMjIGV4cHJlc3Npb24gYnVpbGRlciAjIyMjIyMjIyMjXHJcbmZ1bmN0aW9uIGNyZWF0ZUV4cHJlc3Npb24oZGF0YSkge1xyXG4gICAgaWYgKGRhdGEucnVsZXMgJiYgZGF0YS5ydWxlc1swXS5jb25kaXRpb24pIHtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gcGFyc2VEYXRhKGRhdGEucnVsZXNbMF0pO1xyXG5cclxuICAgICAgICByZXN1bHQgPSBkYXRhLm5vdCA/IGBOT1QgKCR7cmVzdWx0fSlgOmAoJHtyZXN1bHR9KWA7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIGxldCByZXN1bHQgPSBwYXJzZVJ1bGUoZGF0YS5ydWxlc1swXSwgZGF0YS5ub3QpOyAgICBcclxuICAgIFxyXG4gICAgcmVzdWx0ID0gZGF0YS5ub3QgPyBgTk9UICR7cmVzdWx0fWA6IHJlc3VsdDtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuZnVuY3Rpb24gcGFyc2VEYXRhKGRhdGEpIHtcclxuICAgIGxldCByZXN1bHQ7XHJcbiAgICByZXN1bHQgPSBjcmVhdGVFeHByZXNzaW9uKGRhdGEpO1xyXG4gICAgaWYgKGRhdGEucnVsZXMgJiYgZGF0YS5ydWxlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBkYXRhLnJ1bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFyclAgPSBbZGF0YS5ydWxlc1tpXSwgcmVzdWx0LCBkYXRhLmNvbmRpdGlvbl07XHJcblxyXG4gICAgICAgICAgICByZXN1bHQgPSBkYXRhLnJ1bGVzW2ldLmNvbmRpdGlvbiA/ICBwYXJzZVJpZ2h0U2lkZSguLi5hcnJQKSA6IHBhcnNlTGVmdFNpZGUoLi4uYXJyUCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5mdW5jdGlvbiBwYXJzZVJpZ2h0U2lkZShkYXRhLCByZXN1bHQsIGNvbmRpdGlvbikge1xyXG4gICAgcmV0dXJuIGAke3Jlc3VsdH0gJHtjb25kaXRpb259ICgke3BhcnNlRGF0YShkYXRhKX0pYDtcclxufVxyXG5mdW5jdGlvbiBwYXJzZUxlZnRTaWRlKGRhdGEsIHJlc3VsdCwgY29uZGl0aW9uKSB7XHJcbiAgICByZXR1cm4gYCR7cmVzdWx0fSAke2NvbmRpdGlvbn0gJHtwYXJzZVJ1bGUoZGF0YSl9YDtcclxufVxyXG5mdW5jdGlvbiBwYXJzZVJ1bGUocnVsZSwgbm90KSB7XHJcbiAgICBjb25zdCBvcGVyYXRvciA9IGdldE9wZXJhdG9yU3ltYm9sKHJ1bGUub3BlcmF0b3IpO1xyXG5cclxuICAgIGlmIChvcGVyYXRvcikge1xyXG4gICAgICAgIGlmIChvcGVyYXRvci5pc0Jhc2ljKSB7XHJcbiAgICAgICAgICAgIGlmIChydWxlLnR5cGUgPT09IFwiaW50ZWdlclwiICYmIGlzQmFzaWNPcGVyYXRvcihydWxlLm9wZXJhdG9yKSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYCgke3J1bGUuaWR9JHtvcGVyYXRvci50ZXh0fSR7cnVsZS52YWx1ZX0pYDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYCgke3J1bGUuaWR9JHtvcGVyYXRvci50ZXh0fVwiJHtydWxlLnZhbHVlfVwiKWA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBgJHtvcGVyYXRvci50ZXh0fSgke3J1bGUuaWR9KWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcbmZ1bmN0aW9uIGlzQmFzaWNPcGVyYXRvcihvcGVyYXRvcikge1xyXG4gICAgcmV0dXJuIG9wZXJhdG9yID09PSBcImxlc3NcIiB8fCBvcGVyYXRvciA9PT0gXCJncmVhdGVyXCIgfHwgb3BlcmF0b3IgPT09IFwiZ3JlYXRlcl9vcl9lcXVhbFwiIHx8IG9wZXJhdG9yID09PSBcImxlc3Nfb3JfZXF1YWxcIjtcclxufVxyXG4vLyAjIyMjIyMjIGVuZCBleHByZXNzaW9uIGJ1aWxkZXIgIyMjIyMjXHJcblxyXG5mdW5jdGlvbiBnZXRPcGVyYXRvclN5bWJvbChvcGVyYXRvcikge1xyXG4gICAgc3dpdGNoIChvcGVyYXRvcikge1xyXG4gICAgICAgIGNhc2UgXCJlcXVhbFwiOiByZXR1cm4geyB0ZXh0OiBcIj1cIiwgaXNCYXNpYzogdHJ1ZSB9O1xyXG4gICAgICAgIGNhc2UgXCJub3RfZXF1YWxcIjogcmV0dXJuIHsgdGV4dDogXCI8PlwiLCBpc0Jhc2ljOiB0cnVlIH07XHJcbiAgICAgICAgY2FzZSBcImxlc3NcIjogcmV0dXJuIHsgdGV4dDogXCI8XCIsIGlzQmFzaWM6IHRydWUgfTtcclxuICAgICAgICBjYXNlIFwibGVzc19vcl9lcXVhbFwiOiByZXR1cm4geyB0ZXh0OiBcIjw9XCIsIGlzQmFzaWM6IHRydWUgfTtcclxuICAgICAgICBjYXNlIFwiZ3JlYXRlclwiOiByZXR1cm4geyB0ZXh0OiBcIj5cIiwgaXNCYXNpYzogdHJ1ZSB9O1xyXG4gICAgICAgIGNhc2UgXCJncmVhdGVyX29yX2VxdWFsXCI6IHJldHVybiB7IHRleHQ6IFwiPj1cIiwgaXNCYXNpYzogdHJ1ZSB9O1xyXG4gICAgICAgIGNhc2UgXCJlcXVhbF9pZ25vcmVfY2FzZVwiOiByZXR1cm4geyB0ZXh0OiBcIj1eXCIsIGlzQmFzaWM6IHRydWUgfTtcclxuICAgICAgICBjYXNlIFwiY29udGFpbnNcIjogcmV0dXJuIHsgdGV4dDogXCI9JVwiLCBpc0Jhc2ljOiB0cnVlIH07XHJcbiAgICAgICAgY2FzZSBcImNvbnRhaW5zX2lnbm9yZV9jYXNlXCI6IHJldHVybiB7IHRleHQ6IFwiPSVeXCIsIGlzQmFzaWM6IHRydWUgfTtcclxuICAgICAgICBjYXNlIFwicmVnZXhfbWF0Y2hcIjogcmV0dXJuIHsgdGV4dDogXCI9JCVcIiwgaXNCYXNpYzogdHJ1ZSB9O1xyXG4gICAgICAgIGNhc2UgXCJleGlzdHNcIjogcmV0dXJuIHsgdGV4dDogXCJFeGlzdHNcIiwgaXNCYXNpYzogZmFsc2UgfTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vdCBpbXBsZW1lbnRlZCBvcGVyYXRvcjogXCIgKyBvcGVyYXRvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGdldE9wZXJhdG9yID0gKG9wZXJhdG9yU3ltYm9sKSA9PiB7XHJcbiAgICBzd2l0Y2ggKG9wZXJhdG9yU3ltYm9sKSB7XHJcbiAgICAgICAgY2FzZSBcIj1cIjogcmV0dXJuIHsgdGV4dDogXCJlcXVhbFwiLCBpc0Jhc2ljOiB0cnVlIH07XHJcbiAgICAgICAgY2FzZSBcIjw+XCI6IHJldHVybiB7IHRleHQ6IFwibm90X2VxdWFsXCIsIGlzQmFzaWM6IHRydWUgfTtcclxuICAgICAgICBjYXNlIFwiPFwiOiByZXR1cm4geyB0ZXh0OiBcImxlc3NcIiwgaXNCYXNpYzogdHJ1ZSB9O1xyXG4gICAgICAgIGNhc2UgXCI8PVwiOlxyXG4gICAgICAgIGNhc2UgXCI9PFwiOiByZXR1cm4geyB0ZXh0OiBcImxlc3Nfb3JfZXF1YWxcIiwgaXNCYXNpYzogdHJ1ZSB9O1xyXG4gICAgICAgIGNhc2UgXCI+XCI6IHJldHVybiB7IHRleHQ6IFwiZ3JlYXRlclwiLCBpc0Jhc2ljOiB0cnVlIH07XHJcbiAgICAgICAgY2FzZSBcIj49XCI6XHJcbiAgICAgICAgY2FzZSBcIj0+XCI6IHJldHVybiB7IHRleHQ6IFwiZ3JlYXRlcl9vcl9lcXVhbFwiLCBpc0Jhc2ljOiB0cnVlIH07XHJcbiAgICAgICAgY2FzZSBcIj1eXCI6IHJldHVybiB7IHRleHQ6IFwiZXF1YWxfaWdub3JlX2Nhc2VcIiwgaXNCYXNpYzogdHJ1ZSB9O1xyXG4gICAgICAgIGNhc2UgXCI9JVwiOiByZXR1cm4geyB0ZXh0OiBcImNvbnRhaW5zXCIsIGlzQmFzaWM6IHRydWUgfTtcclxuICAgICAgICBjYXNlIFwiPSVeXCI6XHJcbiAgICAgICAgY2FzZSBcIj1eJVwiOiByZXR1cm4geyB0ZXh0OiBcImNvbnRhaW5zX2lnbm9yZV9jYXNlXCIsIGlzQmFzaWM6IHRydWUgfTtcclxuICAgICAgICBjYXNlIFwiPSQlXCI6IHJldHVybiB7IHRleHQ6IFwicmVnZXhfbWF0Y2hcIiwgaXNCYXNpYzogdHJ1ZSB9O1xyXG4gICAgICAgIGNhc2UgXCJFeGlzdHNcIjogcmV0dXJuIHsgdGV4dDogXCJleGlzdHNcIiwgaXNCYXNpYzogZmFsc2UgfTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vdCBpbXBsZW1lbnRlZCBvcGVyYXRvcjogXCIgKyBvcGVyYXRvclN5bWJvbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxufSJdfQ==
