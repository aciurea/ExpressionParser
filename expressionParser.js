$(document).ready(function () {
    $("#parse").on("click", function () {
        var data = '(@domain=$%"sdgfd")';
        debugger;
        var result = parseExpression(data);
    });
    var operators = ["<>", "=$%", "<=", "=<", ">=", "=>", "=^%", "=%^", "=^", "=%", "=", "<", ">"];
    function getCompareSign(data) {
        var res = {};
        operators.some(function (op) {
            var currentOpIndex = data.indexOf(op);
            return currentOpIndex !== -1 ? res = { operator: op, index: currentOpIndex } : res = "";
        });
        return res;
    }

    function buildObject(data) {
        var res = getCompareSign(data);
        if (res === "") {
            return;
        }
        var parameter = data.substring(1, res.index).trim();
        var valueIndex = res.index + res.operator.length + 1;
        var valueToCompareTo = data.substring(valueIndex, data.length - 1);
        var result = {
            operator: res.operator,
            field: parameter.toLowerCase(),
            id: parameter.toLowerCase(),
            input: "text",
            type: "string",
            value: valueToCompareTo.trim()
        };
        return result;
    }

    function parseExpression(data) {
        var result = analyzeCondition(data);
        return result;
    }

    function analyzeCondition(data, result) {
        if (isSimpleCompareCondition(data)) {
            var rules = buildObject(data);
            result = { condition: "AND", not: false, rules: [] };
            result.rules.push(rules);
            return result;
        }
        if (data.startsWith('(')) {
            result = buildObjectWhenMultipleExpression(data);
        }

        return result;
    }

    function buildObjectWhenMultipleExpression(data) {
        var comparatorIndex = data.indexOf("AND");
        var index = data.length;
        if (comparatorIndex === -1) {
            comparatorIndex = data.indexOf("OR");
        }

        while (comparatorIndex === data.length) {
            var firstExpression = data.substring(0, comparatorIndex - 1);

        }
    }
    function getCouple(data) {
        var openIndex = 0;
        var closeIndex = 0;
        for (var c of data) {
            if (c === "(") {
                openIndex++;
            }
            else if (c === ")") {
                closeIndex++;
            }
        }
    }


    function isSimpleCompareCondition(data) {
        if (data.indexOf('AND') === -1 || data.indexOf('OR') === -1) {
            return true;
        };
        return false;
    }
});