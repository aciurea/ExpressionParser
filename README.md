# Expression Parser
This tool is composed from 2 parts:
- The expression builder where you can build an expression from graphics by using the query builder tool (it can be found here http://querybuilder.js.org);
- The expression created can be after translated back to graphics.

The expresion parser is using the query builder list of objects to build the expression (which can be saved somewhere on the server) and after, it can be translated back to objects and displayed.

![alt tag](https://github.com/aciurea/ExpressionParser/blob/master/expression.png)


Unlike other expression parsers where you need to know the order of operators (e.g. AND comes before OR) and which are using only recursion to translate the expression, this expression parser is using paranthesis to guarantee the order of the operators so you don't need to worry of that and it's using recursion only when it encounters groups of rules otherwise is doing a normal iteration and is really fast.

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


The expression parser can literally translate any expression into a list of objects which can be after displayed in the query builder like in the picture above.
Expressions can be inserted directly into the textbox or it can be created wihout the need of query builder.

More informatin about query builder and how it can be configured can be found at this link: http://querybuilder.js.org.

The query builder filters can be configured for any example that you might need but in this example I configured them to represent a cinema where you can make reservations based on some criteria.

Next step will be to improve the expression builder by using proper call tails, this way we release the stack after each recurive call. Of course, there will be speed performances. 

This tool has some limitations, especially if we want to use the regex match for parenthesis. Since we use the parenthesis to give the operators order, using it in regex match might cause some inconsistencies. This will be improved in time.
 
 The application can identify the browser that you are using and load the proper javascript file based on support of the new features!
