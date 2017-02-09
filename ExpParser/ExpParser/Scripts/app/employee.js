"use strict";
 import {Employee, gigel, d1} from "./employeeModule";
(function () {
    console.log(gigel);
    const emp = new Employee("Vasilica");
    const d = emp.doWork();
    console.log(d);
})();