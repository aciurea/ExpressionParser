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
                result.rules.push(values.values);
                index = couple.ClosePIndex + operator.index + values.index;
            }
        }
        return result;
    }

    function checkNotOperator(couple, expression, index){
        let notObj = {index:0, not:false};
        expression = expression.substring(index).toLowerCase();
        const i = expression.indexOf('not');
        if(i === 1 || i === 0){
            notObj.index += 4 + i;
            notObj.not = true;
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
        const compareValue = expr.substring(index, couple.OpenPIndex);
        const res = {values:null, index:0};

        if (compareValue.indexOf("exists") === 1) {
            res.values = getValuesFromExistsExp(couple, expression);
            res.index = 1;
            return res;
        }
        if (compareValue.indexOf("exists") === 0) {
            res.values=getValuesFromExistsExp(couple, expression); 
            res.index=0;
            return res;
        }
        else {
            res.values=getValuesFromNormalExp(couple, expression, index);
            res.index=0; return res;
        }
    }

    function getCompareSign(data, fromIndex, couple) {
        const expression = data.slice(couple.OpenPIndex, couple.ClosePIndex);
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

    function getValuesFromNormalExp(couple, expression, index) {
        const res = getCompareSign(expression, index, couple);
        const parameter = expression.substring(couple.OpenPIndex + 1, res.index);
        const valueToCompareTo = expression.substring(res.index + res.operator.length + 1, couple.ClosePIndex - 1);
        const op = getOperator(res.operator);
        const result = {
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
        data = data.substring(fromIndex).toLowerCase();
        let index = data.indexOf("or");
        
        if (index === 0 || index ===1) {
            return { index: 2 + index, operator: "OR" };
        }
        index = data.indexOf('and');

        return { index: 3 + index, operator: "AND" };
    }

    function getCouples(expression) {
        expression = expression;
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

