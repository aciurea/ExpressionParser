import {getOperator} from "./segmentationBuilder";
"use strict";

$(document).ready(function () {
    $("#btnExpressionParser").on("click", function () {
        const expression = $("#txtExpression").val();
        const result = analyzeCondition(expression);
        console.log(result);

        $("#builder-basic").queryBuilder("setRules", result);
    });
    var operators = ["<>", "=$%", "<=", "=<", ">=", "=>", "=^%", "=%^", "=^", "=%", "=", "<", ">"];
    function analyzeCondition(expression) {
        expression = expression.replace(/ /g,'');
        const couples = getCouples(expression);
        const groupedCouples = getGroupCouples(couples, 0);
        console.log(groupedCouples);
        let index = 0;
        const result = buildObjectFromExpression(groupedCouples, expression, index);

        return result;
    }

    function buildObjectFromExpression(couples, expression, index) {
        let result;
        if (!(couples instanceof Array)) {
            couples = new Array(couples);
            couples = couples[0].couples;
        }
        for (let couple of couples) {
        //if is group, do it recursively 
            if (couple.isGroup) {
                const isNot = checkNotOperator(couple, expression, index);
                index += isNot.not? isNot.index : 0;

                const prevRes = buildObjectFromExpression(couple, expression, index);
                const operator = getOperatorIndex(expression, couple.ClosePIndex);
                index += 1;
                if (!result) {
                    result = { condition: operator.operator, not: isNot.not, rules: new Array(prevRes) };
                } else {
                    result.rules.push(prevRes);
                }
            }
                //no Groups, just normal rules
            else {
                const isNot = checkNotOperator(couple, expression, index);
                index += isNot ? isNot.index : 0;
                const values = getDataFromSimpleExpression(couple, expression, index);
                const operator = getOperatorIndex(expression, couple.ClosePIndex);
                //no not for the moment
                if (!result) {
                    result = { condition: operator.operator, not: isNot.not, rules: [] }
                }
                result.rules.push(values);
                index = couple.ClosePIndex + operator.index;
            }
        }
        return result;
    }

    //function getNotIndex(expression, fromIndex) {
    //    var notIndex = expression.indexOf("NOT", fromIndex);
    //    if (notIndex === -1) {
    //        notIndex = expression.indexOf("not", fromIndex);
    //        if (notIndex === -1) {
    //            notIndex = expression.indexOf("Not", fromIndex);
    //        }
    //    }
    //    return notIndex;
    //}
    function checkNotOperator(couple, expression, index){
        let notObj ={index:0, not:false};
        expression = expression.substring(index).toLowerCase();
        const i = expression.indexOf('not');
        if(i === 1){
            notObj.index += 4;
            notObj.not = true;
        }
        if(i === 0){
            notObj.not = true; 
            notObj.index +=3
        }       
        return notObj;
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
        const expr = expression.toLowerCase();
        const compareValue = expr.substring(index, couple.OpenPIndex).trim();
        if (compareValue.indexOf("exists") === 1) {
            index += 1;
            return getValuesFromExistsExp(couple, expression);
        }
        if (compareValue.indexOf("exists") === 0) {
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
        const index = data.indexOf("or", fromIndex);
        if (index === -1 || index - fromIndex > 5) {
            return { index: 3, operator: "AND" };
        }
        return { index: 2, operator: "OR" };
    }
    function getCouples(expression) {
        expression = expression.trim();
        let indexOfCharInCondition = -1;
        let indexOfLastOpenP = 0;
        let dicPCouplesSource = [];
        for (let c of expression) {

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
                let couplesIndex = -1;
                couplesIndex = dicPCouplesSource.length;
                let coupleToCloseFounded = false;
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

