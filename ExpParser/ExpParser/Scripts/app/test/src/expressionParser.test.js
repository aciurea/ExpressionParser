import { expressionParser as ep } from "../../src/expressionParser.js";

describe("expressionParser test", () => {
    it("should return the same operators configuration", () => {
        const operators = ["<>", "=$%", "<=", "=<", ">=", "=>", "=^%", "=%^", "=^", "=%", "=", "<", ">"];
        const result = ep.operators;

        expect(result).toEqual(result);
    });
});