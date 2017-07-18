import { segmentationBuilder } from "./segmentationBuilder";
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

function analyzeCondition(expression) {
    expression = expression.replace(/\s/g, '');
    const couples = getCouples(expression);
    const groupedCouples = getGroupCouples(couples, 0);
    let index = 0;
    debugger;
    const result = buildObjectFromExpression(groupedCouples, expression, index, false);

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
            console.log(`first: ${objIndex.length + 1} index: ${index}`); 
            objIndex.length += 1;
            index += isNot.not ? isNot.index : 0;

            const prevRes = buildObjectFromExpression(couple, expression, index + 1);
            const operator = getLogicalOperator(expression, couple.ClosePIndex + 1);

            result ? result.rules.push(prevRes) : result = { condition: operator.operator, not: isNot.not, rules: new Array(prevRes) };
            console.log(result);
        }
       
        else {
            if (index < objIndex.length) {
                index = objIndex.length;
            }
            const notResult = checkNotOperator(expression, index);

            index += notResult.not ? notResult.index : 0;


            console.log(`expression is: ======>>> \n ${expression.substring(index, couple.ClosePIndex)} \n<=====`);

            const operator = expression.substring(index, couple.OpenPIndex).toLowerCase();
            const values = operator.indexOf(EXISTS) === 0 ? getExistsOpValues(couple, expression) : getNormalOpValues(couple, expression, index);
            const operators = getLogicalOperator(expression, couple.ClosePIndex + 1);

            if (result === undefined) {
                result = { condition: operators.operator, not: notResult.not, rules: [] };
            }

            result.rules.push(values);
            objIndex.length = index = couple.ClosePIndex + 1 + operators.index;
            console.log(objIndex.length);
        }
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
    let index = expression.indexOf("or");
    console.log(`in logical Operator: ${expression}`);

    return index === 0 ? { index: 2, operator: "OR" } : { index: 3, operator: "AND" }
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

            const prevCouples = { isGroup: true, couples: prevRes };
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

/* ===> END OF iNITIAL COUPLES <=== */


export const expressionParser = {
    operators
};

