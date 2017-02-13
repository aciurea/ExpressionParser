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

