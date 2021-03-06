﻿import { segmentationBuilder } from "./segmentationBuilder";
"use strict";
const objIndex = { length: 0 };

$(document).ready(function () {
    $("#btnExpressionParser").on("click", function () {
        objIndex.length = 0;
        const expression = $("#txtExpression").val();
        const result = analyzeCondition(expression);

        $("#builder-basic").queryBuilder("setRules", result);
    });
});

const operators = ["<>", "=$%", "<=", "=<", ">=", "=>", "=^%", "=%^", "=^", "=%", "=", "<", ">"];
const EXISTS = "exists";
const REGEX_OP = "=$%";

function analyzeCondition(expression) {
    expression = expression.replace(/\s/g, '');
    const couples = getCouples(expression);
    const groupedCouples = getGroupCouples(couples, 0);
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
            const isNot = checkNotOperator(expression, index);

            index += isNot.not ? isNot.index : 0;

            const insideResult = buildObjectFromExpression(couple, expression, index + 1);
            const operator = getLogicalOperator(expression, couple.ClosePIndex + 1);

            result ? result.rules.push(insideResult) : result = { condition: operator.operator, not: isNot.not, rules: new Array(insideResult) };
        }
       
        else {
            index = index < objIndex.length ? objIndex.length : index;
       
            const notResult = checkNotOperator(expression, index);

            index += notResult.not ? notResult.index : 0;

            const operator = expression.substring(index, couple.OpenPIndex).toLowerCase();
            const values = operator.indexOf(EXISTS) === 0 ? getExistsOpValues(couple, expression) : getNormalOpValues(couple, expression, index);
            const operators = getLogicalOperator(expression, couple.ClosePIndex + 1);

            if (result === undefined) {
                result = { condition: operators.operator, not: notResult.not, rules: [] };
            }

            result.rules.push(values);
        }

        const operator = getLogicalOperator(expression, couple.ClosePIndex + 1);
        objIndex.length = index = couple.ClosePIndex + 1 + operator.index;
    }
    return result;
}


function checkNotOperator(expression, index) {
    expression = expression.substring(index).toLowerCase();

    return expression.indexOf('not') === 0 ? { index: 3, not: true } : { index: 0, not: false };
}


function getCompareSign(data, fromIndex, couple) {
    const expression = data.substring(couple.OpenPIndex + 1, couple.ClosePIndex);
    let opr;

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

function getNormalOpValues(couple, expression, index) {
    const comparator = getCompareSign(expression, index, couple);
   
    const field = expression.substring(couple.OpenPIndex + 1, comparator.index);
    const opStartIndex = comparator.index + comparator.operator.length + 1;
    const value = expression.substring(opStartIndex, couple.ClosePIndex - 1);

    const operators = segmentationBuilder.getOperator(comparator.operator);

    return  {
        operator: operators.text,
        field: field.toLowerCase(),
        id: field,
        input: "text",
        type: "string",
        value: value
    };
}

function getExistsOpValues(couple, expression) {
    const value = expression.substring(couple.OpenPIndex + 1, couple.ClosePIndex);

    return {
        operator: EXISTS,
        field: value,
        id: value,
        input: "text",
        type: "string",
        value: null
    };
}

function getLogicalOperator(expression, fromIndex) {
    expression = expression.substring(fromIndex).toLowerCase();
    const index = expression.indexOf("or");

    return index === 0 ? { index: 2, operator: "OR" } : { index: 3, operator: "AND" };
}

/* ===> STRAT GROUPING THE COUPLES <=== */

function getGroupCouples(couples, lastIndexRule, isInGroup) {
    const groupedCouples = [];
    for (let couple of couples) {
        if (couple.ClosePIndex <= lastIndexRule && !isInGroup) {
            continue;
        }

        if (couple.isGroup) {
            const grCouples = getCouplesFromGroup(couples, couple);

            isInGroup = true;
            lastIndexRule = couple.ClosePIndex;
            const prevRes = getGroupCouples(grCouples, lastIndexRule, isInGroup);
            isInGroup = false;

            const prevCouples = { isGroup: true, couples: prevRes, ClosePIndex: lastIndexRule, OpenPIndex: couple.OpenPIndex };
            groupedCouples.push(prevCouples);
        }
        else {
            groupedCouples.push(couple);
        }
    }
    return groupedCouples;
}


function getCouplesFromGroup(couples, couple) {
    const insideCouples = [];

    for (let insideCouple of couples) {
        if (insideCouple.ClosePIndex < couple.ClosePIndex && insideCouple.OpenPIndex > couple.OpenPIndex)
            insideCouples.push(insideCouple);
    }
    return insideCouples;
}

/* ===> END OF GROUPING THE COUPLES <=== */


/* ===> GET INITIAL COUPLES <=== */

function getCouples(expression) {
    let indexOfCharInCondition = -1;
    let indexOfLastOpenP = 0;
    let dicPCouplesSource = []; 
    let isRegex = identifyRegExp(expression, 0);

    for (let c of expression) {
        indexOfCharInCondition++;

        if (isRegex.startIndex !== -1 && indexOfCharInCondition >= isRegex.startIndex && indexOfCharInCondition < isRegex.endIndex) {
            debugger;
            if (indexOfCharInCondition >= isRegex.endIndex - 1) {
                isRegex = identifyRegExp(expression, indexOfCharInCondition);
            } else {
                continue;
            }
        }


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

function identifyRegExp(expression, index) {
    const startIndex = expression.indexOf(REGEX_OP, index);
    const orIndex = startIndex !==-1 ? expression.toLowerCase().indexOf("or", index + 2):-1;
    const andIndex = startIndex !==-1 ? expression.toLowerCase().indexOf("and", index + 3):-1;
    const endIndex = orIndex === -1 && andIndex === -1 ? expression.length : orIndex !== -1 && orIndex < andIndex ? orIndex : andIndex;
    
    return { startIndex, endIndex };
}

/* ===> END OF iNITIAL COUPLES <=== */

export const expressionParser = {
    operators
};