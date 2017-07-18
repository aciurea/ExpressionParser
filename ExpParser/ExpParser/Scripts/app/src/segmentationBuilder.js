import { filters } from "./filters";

"use strict";
const log = console.log;
$(document).ready(function () {
    $("#builder-basic").queryBuilder(options);
    $("#btnReset").on("click", function () {
        $("#txtParseResult").val("");
        $("#txtExpression").val("");
        $("#builder-basic").queryBuilder("reset");
    });

    $("#btnParse").on("click", function (event) {
        const expressionData = $("#builder-basic").queryBuilder("getRules");
        if (!expressionData || Object.keys(expressionData).length === 0) {
            event.stopPropagation();
        }
        const parsedExpression = parseData(expressionData);
        $("#txtExpression").val(parsedExpression);
    });
    $("#btnOldImpl").click(function () {
        $("#oldContent").toggleClass("tglOldImpl");
        $("i.glyphicon").toggleClass("glyphicon-menu-up").toggleClass("glyphicon-menu-down");
    });
});

//#### Query Builder Settings
const options = {
    allow_empty: false,
    plugins: {
        "not-group": null
    },
    filters: filters,
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
//##### End Query Builder Settings

// ####### expression builder ##########
function createExpression(data) {
    if (data.rules && data.rules[0].condition) {
        let result = parseData(data.rules[0]);

        result = data.not ? `NOT (${result})` : `(${result})`;
        return result;
    }
    let result = parseRule(data.rules[0], data.not);

    result = data.not ? `NOT ${result}` : result;
    return result;
}
function parseData(data) {
    if (!data) { return undefined; }
    let result;
    result = createExpression(data);
    if (data.rules && data.rules.length > 1) {
        for (let i = 1; i < data.rules.length; i++) {
            const arrP = [data.rules[i], result, data.condition];

            result = data.rules[i].condition ? parseRightSide(...arrP) : parseLeftSide(...arrP);
        }
    }
    return result;
}
function parseRightSide(data, result, condition) {
    return `${result} ${condition} (${parseData(data)})`;
}
function parseLeftSide(data, result, condition) {
    return `${result} ${condition} ${parseRule(data)}`;
}
function parseRule(rule, not) {
    const operator = getOperatorSymbol(rule.operator);

    if (operator) {
        if (operator.isBasic) {
            if (rule.type === "integer" && isBasicOperator(rule.operator)) {
                return `(${rule.id}${operator.text}${rule.value})`;
            }
            return `(${rule.id}${operator.text}"${rule.value}")`;
        }
        return `${operator.text}(${rule.id})`;
    }
    return undefined;
}
function isBasicOperator(operator) {
    return operator === "less" || operator === "greater" || operator === "greater_or_equal" || operator === "less_or_equal";
}
// ####### end expression builder ######

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
        default: log("Not implemented operator: " + operator); break;
    }
    return undefined;
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
        default: log("Not implemented operator: " + operatorSymbol); break;
    }
    return undefined;
}

export const segmentationBuilder = {
    parseData,
    getOperator,
    getOperatorSymbol,
    isBasicOperator,
    options
};