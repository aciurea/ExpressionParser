import { segmentationBuilder } from '../../src/segmentationBuilder';

describe("segmentationBuilder test", () => {
    it("should have the equal operator", () => {
        const operator = segmentationBuilder.getOperator("=");

        expect("equal").toEqual(operator.text);
    });
});