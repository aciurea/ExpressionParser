﻿"use strict";
$(document).ready(function () {
    $("#btnExpressionParser").on("click", function () {
        const data = $("#txtExpression").val();
        const result = analyzeCondition(data);
        $('#builder-basic').queryBuilder('setRules', result);
    });
    var operators = ["<>", "=$%", "<=", "=<", ">=", "=>", "=^%", "=%^", "=^", "=%", "=", "<", ">"];

    function analyzeCondition(expression) {
        let result;
        const couples = getCouples(expression);
        result = buildObjectWhenMultipleExpression(couples, expression);

        return result;
    }


    function getCouplesFromGroup(couples, expression) {
        debugger;
        let defaultCouple = couples.shift(); const insideCouples = []; let isGroup = false; let c = {}; const insideRules = []; let isFirstTime = true; let counter = 0;
        let lastIndexOfGroup = 0;
        couples.forEach(function (couple) {
            if (couple.OpenPIndex < lastIndexOfGroup) { return; }
            //couple with couples
            if (defaultCouple.ClosePIndex > couple.OpenPIndex) {
                const isCoupleInside = detectCouple(expression, couple);
                if (isCoupleInside) {
                    //need to do it recursively
                    const index = getLastIndexCouple(couples, couple);
                    const data = couples.slice(counter, couples.length - index);
                    const result = getCouplesFromGroup(data, expression);
                    console.log(result);
                    insideRules.push(result);
                    lastIndexOfGroup = result[result.length - 1].rules[result[result.length - 1].rules.length - 1].ClosePIndex;
                    defaultCouple = couple;
                    return;
                }
                counter++;
                isGroup = true;
                c = { OpenPIndex: couple.OpenPIndex, ClosePIndex: couple.ClosePIndex };
                insideRules.push(c);
                isFirstTime = false;

            } else {
                counter++;
                if (isGroup) {
                    var prevRes = { isGroup: true, rules: insideRules.slice() };
                    insideCouples.push(prevRes);
                    insideRules.length = 0;
                };
                if (couples[counter]) {
                    if (couple.ClosePIndex > couples[counter].ClosePIndex) { defaultCouple = couple; return; }
                }
                c = { OpenPIndex: couple.OpenPIndex, ClosePIndex: couple.ClosePIndex };
                if (couples.length === 1 || isFirstTime) {
                    insideCouples.push(defaultCouple, c);
                    isFirstTime = false;
                }
                else { insideCouples.push(c) }
                isGroup = false;
            }
        });
        if (isGroup) {
            var prevRes = { isGroup: true, rules: insideRules };
            insideCouples.push(prevRes);
        };
        console.log("Exit from group", insideCouples);
        return insideCouples;
    }
    function isSimpleCompareCondition(data) {
        if (data.indexOf('AND') === -1 && data.indexOf('OR') === -1) {
            return true;
        };
        return false;
    }




    function buildObjectWhenMultipleExpression(couples, expression) {
        debugger;
        let result;
        let index = 0;
        let isNestedGroup = false;
        let groupProp = {};
        let indexOfGroups = 0;
        /*
        IMPORTANT
        if are multiple groups inside a group add a variable to store the level of group. It is possible 
        to have multiple level. A while loop might be necessary. */

        for (let couple of couples) {
        //if is group, set groupPCIndex to ClosePIndex
            if (couple.isGroup) {
                //isNestedGroup = checkForNestedGroup(couple, couples)
                //if (couples[indexCouples + 1] && couples[indexCouples + 1].isGroup) {
                //    //there is another couple inside couple
                //}
                //groupPCIndex++;
                indexOfGroups++;
                var operator = getOperatorIndex(expression, couple.ClosePIndex);
                groupProp = { groupPCIndex: couple.ClosePIndex, condition: operator.op, not: false };
                index = couple.OpenPIndex + 1;
            }
                //if closePIndex is less than grouPCIndex, is inside group
            else if (groupProp.groupPCIndex > couple.ClosePIndex) {
                var values = getDataFromSimpleExpression(couple, expression, index);
                var operator = getOperatorIndex(expression, couple.ClosePIndex);
                var prevRes = {};

                if (!result) {
                    prevRes = { condition: operator.op, not: false, rules: new Array(values) };
                    result = { condition: groupProp.condition, not: groupProp.not, rules: new Array(prevRes) }
                }
                    //is nextGroup
                else if (indexOfGroups > 1) {
                    prevRes = { condition: operator.op, not: false, rules: new Array(values) };
                    result.rules.push(prevRes);
                    indexOfGroups--;
                }
                else {
                    //var prevValues = new Array(values);
                    result.rules[result.rules.length - 1].rules.push(values);
                }
                index = couple.ClosePIndex + operator.index;
            }

                //no Groups, just normal rules
            else if (!couple.isGroup) {
                var values = getDataFromSimpleExpression(couple, expression, index);
                var operator = getOperatorIndex(expression, couple.ClosePIndex);
                //no not for the moment
                if (!result) {
                    result = { condition: operator.op, not: false, rules: [] }
                }
                result.rules.push(values);
                index = couple.ClosePIndex + operator.index;
            }
        }
        return result;
    }


    function checkForNesteGroup(couple, couples) {

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


    function getDataFromSimpleExpression(couple, expression, index) {
        const compareValue = expression.substring(index, couple.OpenPIndex).trim();

        return compareValue.indexOf("Exists") === 0 ? getValuesFromExistsExp(couple, expression) : getValuesFromNormalExp(couple, expression, index);
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
            id: parameter.toLowerCase(),
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
        var index = data.indexOf("AND", fromIndex);
        var operator = "AND";
        if (index === -1) {
            index = data.indexOf("OR", fromIndex) + 2;
            operator = "OR";
            index = 4;       //2 charachters + 2 for spaceses 
        } else {
            index = 5;
        }

        return { index: index, op: operator };
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