"use strict";
$(document).ready(function () {
    $("#btnExpressionParser").on("click", function () {
        const data = $("#txtExpression").val();
        const result = parseExpression(data);
        $('#builder-basic').queryBuilder('setRules', result);
    });
    var operators = ["<>", "=$%", "<=", "=<", ">=", "=>", "=^%", "=%^", "=^", "=%", "=", "<", ">"];
    function getCompareSign(data) {
        var res = {};

        operators.some(function (op) {
            const currentOpIndex = data.indexOf(op);
            return currentOpIndex !== -1 ? res = { operator: op, index: currentOpIndex } : res = "";
        });
        return res;
    }

    function buildObject(data) {
        data.trim();
        const res = getCompareSign(data);
        if (res === "") {
            if (data.indexOf('Exists') === 0) {
                const value = data.substring(data.indexOf('(') + 1);
                return {
                    operator: "exists",
                    field: value,
                    id: value,
                    input: "text",
                    type: "string",
                    value: null
                }
            }
        }
        const parameter = data.substring(1, res.index).trim();
        const valueIndex = res.index + res.operator.length + 1;
        const valueToCompareTo = data.substring(valueIndex, data.length - 1);
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

    function parseExpression(data) {
        const result = analyzeCondition(data);
        return result;
    }

    function analyzeCondition(expression, result) {
        if (isSimpleCompareCondition(expression)) {
            const rules = buildObject(expression);
            result = { condition: "AND", not: false, rules: [] };
            result.rules.push(rules);
            return result;
        }
        let couples = getCouples(expression);
        result = buildObjectWhenMultipleExpression(couples);

        return result;
    }
    function getOperatorIndex(data) {
        var index = data.indexOf("AND");
        var operator = "AND";
        if (index === -1) {
            index = data.indexOf("OR") + 2;
            operator = "OR";
            index += 2;
        } else {
            index += 3;
        }

        return { index: index, op: operator };
    }
    function detectCouple(expression, couple) {
        var partCond = expression.substring(couple.OpenPIndex, couple.ClosePIndex);
        if ((partCond.indexOf("AND") !== -1) || partCond.indexOf("OR") !== -1) {
            return true;
        }
        return false;
    }

    function getLastIndexCouple(couples, parentCouple) {
        var counter = 0;
        for (var c of couples) {
            if (c.OpenPIndex > parentCouple.ClosePIndex) {
                counter++;
            }
        }
        return counter;
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

    function buildObjectWhenMultipleExpression(couples) {
        debugger;
        let result;
        let groupPCIndex = 0;

        /*
        IMPORTANT
        if are multiple groups inside a group add a variable to store the level of group. It is possible 
        to have multiple level. A while loop might be necessary. */

        for (let couple of couples) {

        //if is group, set groupPCIndex to ClosePIndex
            if (couple.isGroup) {
                groupPCIndex = couple.ClosePIndex;
                console.log('I am a group');
            }

        //if closePIndex is less than grouPCIndex, is inside group
            if (groupPCIndex > couple.ClosePIndex) {

            }
            else {
                //add normal rules
                console.log('add normal rules');
            }


        }

        return result;
    }

    function getNotIndex(expression) {
        var notIndex = expression.indexOf("NOT");
        if (notIndex === -1) {
            notIndex = expression.indexOf("not");
            if (notIndex === -1) {
                notIndex = expression.indexOf("Not");
            }
        }
        return notIndex;
    }
    function isSimpleCompareCondition(data) {
        if (data.indexOf('AND') === -1 && data.indexOf('OR') === -1) {
            return true;
        };
        return false;
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