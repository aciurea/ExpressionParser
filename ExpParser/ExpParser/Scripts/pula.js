export class Employee {
    constructor(name) {
        this._name = name;
    }
    get name() {
        return this.name;
    }
    doWork() {
        return `${this.name} is working`;
    }
}