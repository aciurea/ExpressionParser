# ExpressionParser
In GetGroupCouples function need to check if there is NOT word in expression: 
- if is not add a new property to groupedCouples object: isNot: true or false, depend on value;
- if there is a "not" after "not" there is an error on couples, need to regroup the groupedCouples, add isNot accordingly

This needs to be done because it will ease the implementation later.
This behaviour happens when multiple NOTs appears one after another.



Another solution it will be to change the segmentation builder like this:
- if there is a "NOT" and if in expression is already a NOT in front, do not add the parentheses. This way when grouping the couples 
there won't any extra group so it behaves correctly. 


https://www.linkedin.com/pulse/how-hire-right-employees-robert-frith?trk=v-feed&lipi=urn%3Ali%3Apage%3Ad_flagship3_feed%3Bi5c65qoP1U4lgEV47TWhIw%3D%3D
