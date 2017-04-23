const data = (function () {
    function add(x, y) {
        return x + y;
    }
    return { add: add };
}());

export function test(x) {
    return x;
}