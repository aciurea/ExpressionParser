import { segmentationBuilder as sb } from '../../src/segmentationBuilder.js';

describe("segmentationBuilder test", () => {
    it("should have the equal operator", () => {
        const operator = sb.getOperator("=");

        expect("equal").toEqual(operator.text);
    });

    it("should have the expression equal to Exists(movie) AND (reservationNum=3)", () => {
        const obj = {
            condition: "AND",
            not: false,
            rules: [
                {
                    field: "movie",
                    id: "movie",
                    input: "text",
                    operator: "exists",
                    type: "string",
                    value: null

                },
                {
                    field: "reservationNum",
                    id: "reservationNum",
                    input: "text",
                    operator: "equal",
                    type: "integer",
                    value: 3
                }],
            valid: true
        };
        const expected = sb.parseData(obj);

        expect(expected).toEqual(`Exists(movie) AND (reservationNum="3")`);
    });

    it("should return true if is a basic operator", () => {
        const expected = sb.isBasicOperator("greater");

        expect(expected).toEqual(true);
    });

    it("should return =% for operator contains", () => {
        const operatorSymbol = sb.getOperatorSymbol("contains");

        expect(operatorSymbol.text).toEqual("=%");
    });

    it("should return undefined for not found operator", () => {
        const operator = sb.getOperator(">>");

        expect(operator).toBeUndefined();
    });

    it("should have the same options configuration object", () => {
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
        const expectedOptions = sb.options;

        expect(expectedOptions).toBeDefined();
        expect(expectedOptions).toEqual(options);
    });

    it(`should have the result equal to: NOT (Exists(boxOffice) AND (rate="2")) AND ((ticket="1") OR (review=%"wonderul review"))`, () => {
        const obj = `{"condition":"AND","rules":[{"condition":"AND","rules":[{"id":"boxOffice","field":"boxOffice","type":"boolean","input":"text","operator":"exists","value":null},{"id":"rate","field":"rate","type":"double","input":"text","operator":"equal","value":"2"}],"not":false},{"condition":"OR","rules":[{"id":"ticket","field":"ticket","type":"string","input":"text","operator":"equal","value":"1"},{"id":"review","field":"review","type":"string","input":"textarea","operator":"contains","value":"wonderul review"}],"not":false}],"not":true,"valid":true}`;
        const objData = JSON.parse(obj);
        const result = sb.parseData(objData);

        expect(result).toEqual(`NOT (Exists(boxOffice) AND (rate="2")) AND ((ticket="1") OR (review=%"wonderul review"))`);
    });

    it(`should have the result equal to: NOT (NOT Exists(boxOffice) AND (rate="2")) AND (NOT (ticket="1") OR (review=%"wonderul review")) AND (NOT Exists(movie) AND (NOT (reservationNum="1"))) AND (NOT Exists(language) AND (NOT (promotionCode="12"))) AND ((promotionCode="21") AND (review=$%"hello world"))`, () => {
        const obj = `{"condition":"AND","rules":[{"condition":"AND","rules":[{"id":"boxOffice","field":"boxOffice","type":"boolean","input":"text","operator":"exists","value":null},{"id":"rate","field":"rate","type":"double","input":"text","operator":"equal","value":"2"}],"not":true},{"condition":"OR","rules":[{"id":"ticket","field":"ticket","type":"string","input":"text","operator":"equal","value":"1"},{"id":"review","field":"review","type":"string","input":"textarea","operator":"contains","value":"wonderul review"}],"not":true},{"condition":"AND","rules":[{"id":"movie","field":"movie","type":"string","input":"text","operator":"exists","value":null},{"condition":"AND","rules":[{"id":"reservationNum","field":"reservationNum","type":"integer","input":"text","operator":"equal","value":"1"}],"not":true}],"not":true},{"condition":"AND","rules":[{"id":"language","field":"language","type":"string","input":"text","operator":"exists","value":null},{"condition":"AND","rules":[{"id":"promotionCode","field":"promotionCode","type":"double","input":"text","operator":"equal","value":"12"}],"not":true}],"not":true},{"condition":"AND","rules":[{"id":"promotionCode","field":"promotionCode","type":"double","input":"text","operator":"equal","value":"21"},{"id":"review","field":"review","type":"string","input":"textarea","operator":"regex_match","value":"hello world"}],"not":false}],"not":true,"valid":true}`;
        const objData = JSON.parse(obj);
        const expression = `NOT (NOT Exists(boxOffice) AND (rate="2")) AND (NOT (ticket="1") OR (review=%"wonderul review")) AND (NOT Exists(movie) AND (NOT (reservationNum="1"))) AND (NOT Exists(language) AND (NOT (promotionCode="12"))) AND ((promotionCode="21") AND (review=$%"hello world"))`;
        const result = sb.parseData(objData);

        expect(result).toEqual(expression);
    });
    it("should return undefined for no expression object", () => {
        const expression = undefined;
        const result = sb.parseData(expression);

        expect(result).toBeUndefined();
    });
});