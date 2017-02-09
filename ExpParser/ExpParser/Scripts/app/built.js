"use strict";
(function () {
    $(document).ready(function () {
        console.log(d1);
        setFilters();
        $("#btnReset").on("click", function () {
            $("#txtParseResult").val("");
            $("#builder-basic").queryBuilder("reset");
        });

        $("#btnParse").on("click", function () {
            const expressionData = $("#builder-basic").queryBuilder("getRules");
            console.log('Expression parsed is: ', expressionData);
            if ($.isEmptyObject(expressionData)) return;
            const parsedExpression = parseData(expressionData);
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
    const options = {
        allow_empty: false,
        plugins: {
            "not-group": null
        },
        filters: [],
        operators: [
            { type: "exists", nb_inputs: 0, apply_to: ["string", "integer", "datetime", "boolean"] },
            { type: "equal" },
            { type: "equal_ignore_case", nb_inputs: 1, apply_to: ["string", "datetime", "boolean"] },
            { type: "not_equal" },
            { type: "less" },
            { type: "less_or_equal" },
            { type: "greater" },
            { type: "greater_or_equal" },
            { type: "contains" },
            { type: "contains_ignore_case", nb_inputs: 1, apply_to: ["string", "datetime", "boolean"] },
            { type: "regex_match", nb_inputs: 1, apply_to: ["string", "number", "datetime", "boolean"] }
        ],

        conditions: ["AND", "OR"],
        default_condition: "AND"
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
            expression = $("#txtParseResult").val();
        }
        const data = JSON.parse(expression);
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
            $("#builder-basic").queryBuilder("destroy");
            $("#builder-basic").queryBuilder(options);
        }
    }

    function parseLeft(data, result, condition, index, not) {
        if (not) {
            if ((data.operator === "less" || data.operator === "greater" || data.operator === "greater_or_equal" || data.operator === "less_or_equal")) {
                result = `(${result})`;
            }
            result = result.slice(0, -1);
            result += ` ${condition} ${parseRule(data)})`;
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
        prevRes = ` ${condition} (${prevRes})`;
        return result + prevRes;
    }
    function createExpression(data) {
        if (data.rules && data.rules[0].condition) {
            if (data.not) {
                return `NOT (${parseData(data.rules[0])})`;
            }
            let result = `(${parseData(data.rules[0])})`;
            if (result.indexOf("(NOT") === 0 || result.indexOf("((") === 0) result = result.slice(1, -1);
            return result;
        }
        if (data.not) {
            return `NOT ${parseRule(data.rules[0], data.not, data.rules.length)}`;
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
                    return `(${rule.id}${operator.text}${rule.value})`;
                }
                result = `(${rule.id}${operator.text}"${rule.value}")`;
                if (not) {
                    if (length === 1) { return result; }
                    return `(${result})`;
                }
                return result;
            }
            if (not) {
                return `(${operator.text}(${rule.id}))`;
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
})();
"use strict";
$(document).ready(function () {
    $("#btnExpressionParser").on("click", function () {
        index = 0;
        const data = $("#txtExpression").val();
        const result = analyzeCondition(data);
        console.log(result);

        $("#builder-basic").queryBuilder("setRules", result);
    });
    var operators = ["<>", "=$%", "<=", "=<", ">=", "=>", "=^%", "=%^", "=^", "=%", "=", "<", ">"];
    var index = 1;
    function analyzeCondition(expression) {
        const couples = getCouples(expression);
        const groupedCouples = getGroupCouples(couples, 0);
        console.log(groupedCouples);
        const result = buildObjectFromExpression(groupedCouples, expression, 0);

        return result;
    }



    function buildObjectFromExpression(couples, expression) {
        let result;
        if (!(couples instanceof Array)) {
            couples = new Array(couples);
            couples = couples[0].couples;
        }
        for (let couple of couples) {

        //if is group, do it recursively 
            if (couple.isGroup) {
                const prevRes = buildObjectFromExpression(couple, expression);
                const operator = getOperatorIndex(expression, couple.ClosePIndex);
                index += 1;
                if (!result) {
                    result = { condition: operator.operator, not: false, rules: new Array(prevRes) };
                } else {
                    result.rules.push(prevRes);
                }
            }
                //no Groups, just normal rules
            else if (!couple.isGroup) {
                const values = getDataFromSimpleExpression(couple, expression, index);
                const operator = getOperatorIndex(expression, couple.ClosePIndex);
                //no not for the moment
                if (!result) {
                    result = { condition: operator.operator, not: false, rules: [] }
                }
                result.rules.push(values);
                index = couple.ClosePIndex + operator.index;
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
        const groupedCouples = [];
        for(let couple of couples) {
            if (couple.ClosePIndex <= lastIndexRule && !isInGroup) {
                //ignore the rule/couple
            }
            else {
                if (couple.isGroup) {
                    isInGroup = true;
                    const grCouples = getCouplesFromGroup(couples, couple);
                    lastIndexRule = couple.ClosePIndex;
                    const prevRes = getGroupCouples(grCouples, lastIndexRule, isInGroup);
                    isInGroup = false;
                    if (groupedCouples.couples == undefined) {
                        const prevCouples = { isGroup: true, couples: prevRes };
                        groupedCouples.push(prevCouples);
                    }
                    else {
                        const prevCouples = { isGroup: true, couples: prevRes };
                        groupedCouples.push(prevCouples);
                    }
                }
                else {
                    groupedCouples.push(couple);
                }
            }
        }
        return groupedCouples;
    }
    function getCouplesFromGroup(couples, couple) {
        const insideCouples = [];
        for(let c of couples) {
            if (c.ClosePIndex < couple.ClosePIndex && c.OpenPIndex > couple.OpenPIndex)
                insideCouples.push(c);
        }
        return insideCouples;
    }
    function getDataFromSimpleExpression(couple, expression, index) {
        const compareValue = expression.substring(index, couple.OpenPIndex).trim();
        if (compareValue.indexOf("(Exists") === 0) {
            console.log(`I've been here.....`);
            index += 1;
            return getValuesFromExistsExp(couple, expression);
        }
        if (compareValue.indexOf("Exists") === 0) {
            return getValuesFromExistsExp(couple, expression);
        }
        else { return getValuesFromNormalExp(couple, expression, index); }
    }
    function getCompareSign(data, fromIndex, couple) {
        const expression = data.slice(couple.OpenPIndex, couple.ClosePIndex);
        var opr;
        operators.some(function (op) {
            const o = expression.indexOf(op);
            if (o !== -1) {
                opr = op;
            }
            return opr;
        });
        const currentOpIndex = data.indexOf(opr, fromIndex);
        return { operator: opr, index: currentOpIndex };
    }
    function getValuesFromNormalExp(couple, expression, index) {
        const res = getCompareSign(expression, index, couple);
        const parameter = expression.substring(couple.OpenPIndex + 1, res.index).trim();
        const valueToCompareTo = expression.substring(res.index + res.operator.length + 1, couple.ClosePIndex - 1);
        const op = getOperator(res.operator);
        const result = {
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
        const value = expression.substring(couple.OpenPIndex + 1, couple.ClosePIndex);
        return {
            operator: "exists",
            field: value,
            id: value,
            input: "text",
            type: "string",
            value: null
        }
    }
    function getOperatorIndex(data, fromIndex) {
        const index = data.indexOf("OR", fromIndex);
        if (index === -1 || index - fromIndex > 5) {
            return { index: 5, operator: "AND" };
        }
        return { index: 4, operator: "OR" };
    }
    function getCouples(condition) {
        condition = condition.trim();
        var indexOfCharInCondition = -1;
        var indexOfLastOpenP = 0;
        var dicPCouplesSource = [];
        var couplesIndex = -1;
        var coupleToCloseFounded = false;

        for (var c of condition) {

            indexOfCharInCondition++;
            if (c === '(') {
                indexOfLastOpenP++;
                //are multiple paranthesis open, we deal with a group
                if (indexOfLastOpenP > 1 && dicPCouplesSource[dicPCouplesSource.length - 1].ClosePIndex === -1) {
                    dicPCouplesSource[dicPCouplesSource.length - 1].isGroup = true;
                }
                dicPCouplesSource.push({ OpenPIndex: indexOfCharInCondition, ClosePIndex: -1, isGroup: false });
            }
            else if (c === ')') {
                couplesIndex = dicPCouplesSource.length;
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
        return dicPCouplesSource;
    }
});


"use strict";
 import {Employee, gigel, d1} from "./employeeModule";
(function () {
    console.log(gigel);
    const emp = new Employee("Vasilica");
    const d = emp.doWork();
    console.log(d);
})();