# Expression Parser
This tool is composed from 2 parts:
- The expression builder where you can build an expression from graphics by using the query builder tool (it can be found here http://querybuilder.js.org);
- The expression created can be after translated back to graphics.

The expresion parser is using the query builder list of objects to build the expression (which can be saved somewhere on the server) and after, it can be translated back to objects and displayed.

![alt tag](https://github.com/aciurea/ExpressionParser/blob/master/expression.png)


Unlike other expression builders this tool is using paranthesis to give the order of the operator and it's using recursion only when it encounters groups of rules and is really fast.

The expressionParser support multiple operators like: 
-  equal: =
-  not_equal: <>
-  less: <
-  greater: >
- less or equal: <=
- greater or equal: >=
- equal ignore case: =^
- contains: =%
- contains ignore case: =^%, =%^
- regex match: =$%
- exists: exists
Logical Operators:
- OR
- AND
- NOT

The priority between logical operators is given by paranthesis that are added between each group. The paranthesis are needed to grant the operators order.

The expression parser can literally transform any expression into graphics if the operators that are used are the same as the ones from list above.
Expressions can be inserted manually wihout the need of query builder.

More informatin about query builder and how it can be configured can be found at this link: http://querybuilder.js.org.

In this repository I configured the filters for a movie reservation based on some criteria but it can be used for other purposes too!

Next step will be to improve the expression builder by using proper call tails, this way we release the stack after each recurive call. Of course, there will be speed performances. 

This tool has some limitations, especially if we want to use the regex match for parenthesis. Since we use the parenthesis to give the operators order, using it in regex match might cause some inconsistencies. This will be improved in time.
 
