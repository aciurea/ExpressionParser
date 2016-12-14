using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;
using System.Reflection;
using System.Web.Caching;
using System.Configuration;
using System.Text.RegularExpressions;
using PF.Contracts.Framework;
using PF.Web.Utils.LoggerWrapper.Contracts;
using Autofac;
using Web.AutofacContainer;

namespace ExpressionParser
{
    public class ExpressionParser
    {
        private readonly ILogger<ExpressionParser> logger;

        #region private members
        string logModuleName = "ExpressionParser: ";
        public Dictionary<int, PCouple> dicPCouples = null;//<openPIndex,closePIndex>
        private Dictionary<ELogicalBinaryOperators,
            Func<Dictionary<string, string>,
                Func<Dictionary<string, string>, bool>,
                Func<Dictionary<string, string>, bool>,
                bool>
            > dicLogicalBinaryOperators = null;
        private Dictionary<ELogicalUnaryOperators,
            Func<Dictionary<string, string>,
                     Func<Dictionary<string, string>, bool>, bool>> dicLogicalUnaryOperators = null;

        private Dictionary<ELogicalUnaryOperators, Func<Dictionary<string, string>, string, bool>> dicUnarySpecialOperators = null;
        private Dictionary<ECompareOperators, Func<Dictionary<string, string>, string, long, bool>> dicCompareNumericOperators = null;
        private Dictionary<ECompareOperators, Func<Dictionary<string, string>, string, DateTime, bool>> dicCompareDateTimeOperators = null;
        private Dictionary<ECompareOperators, Func<Dictionary<string, string>, string, string, bool>> dicCompareStringsOperators = null;
        public Dictionary<string, string> dicMasterParams = null;//Holds the Session params and the Cookie params
        private static object lockObject = new object();
        private int? segmentationResultsCacheExpirationInMinutes = null;

        //private HttpContextBase HttpContextCurrent
        //{
        //    get
        //    {
        //        return HttpContextCurrentService.GetContext();
        //    }
        //}

        //private IHttpContextCurrentService HttpContextCurrentService { get; }

        #endregion
        #region consts
        private string ERROR_EMPTY_CONDITION = "No segmentation statement";
        private string ERROR_OPEN_PARENTHESYS_MISSING = "You forgot to open a bracket for closing bracket at ";
        private string ERROR_CLOSE_PARENTHESYS_MISSING = "You forgot to close a bracket for opening bracket at ";
        private string ERROR_EXTRA_NOT_SEPARATED_PARENTHESIS = "There are trinity of not separated conditions, like '() and () and ()' at ";

        private string ERROR_INVALID_VALUE_TOCOMPARE = "There is invalid value for compare at ";
        private string ERROR_INVALID_STRING_VALUE_START = "There is invalid value(it didn't start with quote) for string compare at ";
        private string ERROR_INVALID_STRING_VALUE_END = "There is invalid value(it didn't end with quote) for string compare at ";
        private string ERROR_INVALID_NUMERIC_VALUE = "There is invalid value for numeric compare at ";
        private string ERROR_INVALID_SESSION_PARAM = "There is invalid session param name ({0}) at ";
        private string ERROR_INVALID_BINARY_LOGICAL_OPERATOR = "There is invalid logical binary operator (like AND) at ";
        private string ERROR_INVALID_UNARY_LOGICAL_OPERATOR = "There is invalid logical unary operator (like NOT) at ";
        private string ERROR_INVALID_LOGICAL_OPERATORS_COMBINATION = "There is invalid logical operator combination at ";
        private string ERROR_INVALID_COMPARE_OPERATOR = "There is invalid compare operator at ";
        private string ERROR_INVALID_NOT_SEPARATED_TEXT = "There is invalid text after two conditions with logical operator at ";

        private string ERROR_UNEXPECTED_PARSE_CONDITION = "Unexpected error in Parse Condition";
        private string ERROR_BUG_1 = "Bug in search for new couple at ";

        #endregion

        //public ExpressionParser() : this(new HttpContextCurrentService())
        //{

        //}

        //public ExpressionParser(IHttpContextCurrentService httpContextCurrentService)
        //{
        //    this.HttpContextCurrentService = httpContextCurrentService;
        //    this.logger = ServiceResolver.Resolve<ILoggerFactory>().GetLogger<ExpressionParser>();
        //}


        public Func<Dictionary<string, string>, bool> ParseCondition(string conditionToParse, out string error)
        {
            LogicalRule logicalRule = null;
            return ParseCondition(conditionToParse, out error, ref logicalRule);
        }
        /// <summary>
        /// Check that condition is valid: parse condition to small parts and check that succeeded in this process.
        /// Used by segmentation custom page.
        /// </summary>
        /// <param name="conditionToParse"></param>
        /// <param name="error"></param>
        /// <returns></returns>
        public Func<Dictionary<string, string>, bool> ParseCondition(string conditionToParse, out string error, ref LogicalRule logicalRule)
        {

            logicalRule = null;
            error = string.Empty;
            Func<Dictionary<string, string>, bool> fResult = null;
            Boolean toCompile = false;
            Boolean isProcessing = false;
            try
            {
                //fResult = TryToGetParsedConditionFromCache(conditionToParse, ref isProcessing);

                if (fResult == null)
                {
                    toCompile = true;
                    if (toCompile)
                    {

                        var couples = new Dictionary<int, PCouple>();
                        error = ParseParenthesis(conditionToParse, ref couples);
                        if (!string.IsNullOrEmpty(error))
                        {
                            var result = BuildObject(conditionToParse);
                        }

                        if (error != string.Empty)
                        {
                            return fResult;
                        }

                        FillOperatorsDictionaries();


                        int errorIndex;

                        fResult = AnalyzeCondition(conditionToParse, 0, out error, out errorIndex, ref logicalRule);

                        if (error != string.Empty || errorIndex != -1)
                        {
                            error += (errorIndex + 1).ToString();//1 = user start count with 1 and in code we start with 0
                        }
                        if (fResult == null && error == string.Empty)
                        {
                            error = ERROR_UNEXPECTED_PARSE_CONDITION + " on condition:" + conditionToParse;
                        }

                        if (fResult != null)
                        {
                            lock (lockObject)
                            {
                                if (HttpRuntime.Cache[conditionToParse] != null)
                                    HttpRuntime.Cache.Remove(conditionToParse);
                                HttpRuntime.Cache.Insert(conditionToParse, fResult, null, DateTime.Now.AddMinutes(SegmentationResultsCacheExpirationInMinutes), Cache.NoSlidingExpiration);
                            }
                        }
                    }

                }
            }
            catch (Exception err)
            {
                error = ERROR_UNEXPECTED_PARSE_CONDITION;
                logger.ErrorFormat("Error in ExpressionParser. Error is : {0} , trace is : {1}", error, err);
                //if (HttpContextCurrent != null)
                //{
                //    logger.Error("Session ID: " + HttpContextCurrent.Session.SessionID);
                //}
            }

            return fResult;
        }

        /// <summary>
        /// Get bool value of condition, based on session params.
        /// </summary>
        /// <param name="condition"></param>
        /// <param name="error"></param>
        /// <returns></returns>
        public bool EvaluateCondition(string condition, out string error)
        {
            bool result = false;
            error = string.Empty;
            try
            {
                Func<Dictionary<string, string>, bool> funcToExecute = ParseCondition(condition, out error);
                if (error != string.Empty)
                {
                    logger.Normal(logModuleName + error);
                    return result;
                }
                else if (funcToExecute == null)
                {
                    logger.NormalFormat("EvaluateCondition on condition {0} failed due to processing state", condition);
                    return result;
                }
                FillMasterParamsDictionary();

                result = funcToExecute(dicMasterParams);
                logger.Normal(logModuleName + "Condition:" + condition + " evaluated to " + result.ToString());

            }
            catch (Exception err)
            {
                //By design:
                //If param not in session – inside condition evaluated to false
                //All other errors – all condition evaluated to false (because we can’t know if the problem is value or wrong parse because one missing parenthesis.
                result = false;
                logger.ErrorFormat("Error in EvaluateCondition in Expression parser.Error is : {0}", err);
            }

            return result;
        }

        /// <summary>
        /// Get bool value of condition, based on query params dictionary recieved as parameter
        /// </summary>
        public bool EvaluateCondition(string condition, out string error, Dictionary<string, string> dicQueryParams)
        {
            bool result = false;
            error = string.Empty;
            try
            {
                Func<Dictionary<string, string>, bool> funcToExecute = ParseCondition(condition, out error);
                if (error != string.Empty)
                {
                    logger.Normal(logModuleName + error);
                    return result;
                }
                else if (funcToExecute == null)
                {
                    logger.NormalFormat("EvaluateCondition on condition {0} failed due to processing state", condition);
                    return result;
                }

                //FillSessionParamsDictionary();

                // update global dictionary variable
                dicMasterParams = dicQueryParams;

                result = funcToExecute(dicMasterParams);
                logger.Normal(logModuleName + "Condition:" + condition + " evaluated to " + result.ToString());

            }
            catch (Exception err)
            {
                //By design:
                //If param not in session – inside condition evaluated to false
                //All other errors – all condition evaluated to false (because we can’t know if the problem is value or wrong parse because one missing parenthesis.
                result = false;
                logger.ErrorFormat("Error in EvaluateCondition in expression parser . Error is: {0}", err);
            }

            return result;
        }


        #region private functions

        public Func<Dictionary<string, string>, bool> AnalyzeCondition(string conditionToParse, int dicPCouplesRelativeIndex, out string error, out int errorIndex)
        {
            LogicalRule logicalRule = null;
            return AnalyzeCondition(conditionToParse, dicPCouplesRelativeIndex, out error, out errorIndex, ref logicalRule);
        }

        public Func<Dictionary<string, string>, bool> AnalyzeCondition(string conditionToParse, int dicPCouplesRelativeIndex, out string error, out int errorIndex, ref LogicalRule logicalRule)
        {
            Func<Dictionary<string, string>, bool> fResult = null;
            error = string.Empty;
            errorIndex = -1;

            logicalRule = new LogicalRule { Rules = new List<Rule>() };

            if (IsSimpleCompareCondition(ref conditionToParse, ref dicPCouplesRelativeIndex))
            {
                //Condition has no ()
                //Condition looks like "@a>2" or "@a==aaaa"
                SimpleRule simpleRule = new SimpleRule();
                GetLogicalFunctionResult result = BuildCompareFunc(conditionToParse, out simpleRule);
                fResult = result.Func;
                if (result.HasError)
                {
                    error = result.Error;
                    errorIndex = result.ErrorIndex + dicPCouplesRelativeIndex;
                    return fResult;
                }
                logicalRule.Rules.Add(simpleRule);
            }
            else
            {
                //complex condition with ()
                int initialLength = conditionToParse.Length;
                conditionToParse = conditionToParse.TrimStart();
                int currentLength = conditionToParse.Length;
                int addToErrorIndex = initialLength - currentLength;
                dicPCouplesRelativeIndex += addToErrorIndex;

                if (conditionToParse.StartsWith("("))
                {
                    ParseLogicalCondResult p = ParseLogicalCondition(conditionToParse, dicPCouplesRelativeIndex, ELogicalUnaryOperators.NotDefined);
                    if (p.HasError)
                    {
                        error = p.Error;
                        errorIndex = p.ErrorIndex;
                        return fResult;
                    }

                    GetLogicalFunctionResult result = BuildBinaryLogicalFunc(p, dicPCouplesRelativeIndex, logicalRule);

                    fResult = result.Func;
                    if (result.HasError)
                    {
                        error = result.Error;
                        errorIndex = result.ErrorIndex;
                        return fResult;
                    }
                }
                else
                {
                    //Condition looks like
                    //"Not () And/Or Not()"
                    //"Not () And/Or ()"
                    //"Not ()"
                    string unaryOperatorString = conditionToParse.Substring(0, conditionToParse.IndexOf('('));
                    ELogicalUnaryOperators unaryOperator = unaryOperatorString.ParseTo<ELogicalUnaryOperators>(true);
                    if (unaryOperator == ELogicalUnaryOperators.NotDefined)
                    {
                        error = ERROR_INVALID_UNARY_LOGICAL_OPERATOR;
                        errorIndex = dicPCouplesRelativeIndex;
                        return fResult;
                    }

                    ParseLogicalCondResult p = ParseLogicalCondition(conditionToParse, dicPCouplesRelativeIndex, unaryOperator);
                    if (p.HasError)
                    {
                        error = p.Error;
                        errorIndex = p.ErrorIndex;
                        return fResult;
                    }
                    GetLogicalFunctionResult r = BuildComplexLogicalFunc(p, unaryOperator, dicPCouplesRelativeIndex, ref logicalRule);

                    if (r.HasError)
                    {
                        error = r.Error;
                        errorIndex = r.ErrorIndex;
                        return fResult;
                    }
                    else
                    {
                        fResult = r.Func;
                    }
                }
            }

            return fResult;
        }

        /// <summary>
        /// SimpleCompareCondition can look like :
        ///     @A>1 ; (@A>1) ; ((@A>1))
        /// </summary>
        /// <param name="conditionToParse"></param>
        /// <param name="dicPCouplesRelativeIndex"></param>
        /// <returns></returns>
        private bool IsSimpleCompareCondition(ref string conditionToParse, ref int dicPCouplesRelativeIndex)
        {
            bool result = false;

            if (conditionToParse.IndexOfAny(new char[] { '(', ')' }) == -1)
            {
                result = true;
            }
            else
            {
                string tempConditionToParse = conditionToParse;

                int initialLength = conditionToParse.Length;
                tempConditionToParse = conditionToParse.TrimStart();


                if (tempConditionToParse.StartsWith("("))
                {
                    int currentLength = tempConditionToParse.Length;
                    int addToErrorIndexStart = initialLength - currentLength;
                    //dicPCouplesRelativeIndex += addToErrorIndexStart;  

                    tempConditionToParse = tempConditionToParse.TrimEnd();
                    if (tempConditionToParse.EndsWith(")"))
                    {
                        tempConditionToParse = tempConditionToParse.Substring(1, tempConditionToParse.Length - 2);
                        if (IsSimpleCompareCondition(ref tempConditionToParse, ref dicPCouplesRelativeIndex))
                        {
                            //if (tempConditionToParse.IndexOfAny(new char[] { '(', ')' }) == -1)
                            //{
                            dicPCouplesRelativeIndex += addToErrorIndexStart + 1;//1 - removed from start '('
                            conditionToParse = tempConditionToParse;
                            result = true;
                            //}

                        }
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// This function parses conditions like 
        /// [unary operator][left condition][binary operator][unary operator][right condition]
        /// </summary>
        /// <param name="conditionToParse"></param>
        /// <param name="dicPCouplesRelativeIndex"></param>
        /// <param name="startsWithUnaryOperator">Set NotDefined, if there is no unar op at the beginning</param>
        /// <returns></returns>
        private ParseLogicalCondResult ParseLogicalCondition(string conditionToParse, int dicPCouplesRelativeIndex, ELogicalUnaryOperators startsWithUnaryOperator)
        {
            ParseLogicalCondResult result = new ParseLogicalCondResult();

            //get left () indexes
            PCouple leftSideCouple = ParseLeftConditionInLogicalCondition(conditionToParse, dicPCouplesRelativeIndex, startsWithUnaryOperator, ref result);
            if (result.HasError)
            {
                return result;
            }

            //Try to find right side and logical operator between
            PCouple nextCouple = GetNextCouple(conditionToParse, dicPCouplesRelativeIndex, startsWithUnaryOperator, leftSideCouple, ref result);
            if (result.HasError)
            {
                return result;
            }

            if (nextCouple != null)//it will be null in condition like not () - no right side
            {
                ParseRightSideInLogicalCondition(conditionToParse, dicPCouplesRelativeIndex, nextCouple, ref result);
                if (result.HasError)
                {
                    return result;
                }

                ParseOperatorInLogicalConditionAndFixRightCondition(conditionToParse, dicPCouplesRelativeIndex, nextCouple, ref result);
                if (result.HasError)
                {
                    return result;
                }
            }

            return result;
        }

        /// <summary>
        /// Help function for ParseLogicalCondition
        /// </summary>
        /// <param name="conditionToParse"></param>
        /// <param name="dicPCouplesRelativeIndex"></param>
        /// <param name="nextCouple"></param>
        /// <param name="result"></param>
        private void ParseOperatorInLogicalConditionAndFixRightCondition(string conditionToParse, int dicPCouplesRelativeIndex, PCouple nextCouple, ref ParseLogicalCondResult result)
        {
            if (result.LogicalOperators.Trim().IndexOf(' ') > 0)
            {
                //it means that LogicalOperators looks like "[binary logical op] [unary logical op]"
                string[] logicalOperators = result.LogicalOperators.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                if (logicalOperators.Length != 2)
                {
                    result.Error = ERROR_INVALID_LOGICAL_OPERATORS_COMBINATION;
                    result.ErrorIndex = result.LeftConditionCouple.ClosePIndex + 1 + dicPCouplesRelativeIndex;
                    return;
                }
                else
                {
                    //right condition will contain unary operator
                    result.LogicalOperators = logicalOperators[0];
                    int unaryOpStartIndex = conditionToParse.IndexOf(" " + logicalOperators[1], result.LeftConditionCouple.ClosePIndex + 1);
                    result.RightConditionCouple.OpenPIndex = unaryOpStartIndex;
                    result.RightCondition = conditionToParse.Substring(
                        result.RightConditionCouple.OpenPIndex,
                        result.RightConditionCouple.ClosePIndex - result.RightConditionCouple.OpenPIndex + 1);//do not remove ()
                    result.RightConditionHasUnaryOperator = true;
                }
            }
        }
        /// <summary>
        /// Help function for ParseLogicalCondition
        /// </summary>
        /// <param name="conditionToParse"></param>
        /// <param name="dicPCouplesRelativeIndex"></param>
        /// <param name="nextCouple"></param>
        /// <param name="result"></param>
        private void ParseRightSideInLogicalCondition(string conditionToParse, int dicPCouplesRelativeIndex, PCouple nextCouple, ref ParseLogicalCondResult result)
        {
            result.RightConditionCouple.OpenPIndex = nextCouple.OpenPIndex - dicPCouplesRelativeIndex;
            result.RightConditionCouple.ClosePIndex = nextCouple.ClosePIndex - dicPCouplesRelativeIndex; //dicPCouples[nextOpenPIndex].ClosePIndex - dicPCouplesRelativeIndex;

            //Check after right side there is nothing            
            string afterRightSideCouple = conditionToParse.Substring(result.RightConditionCouple.ClosePIndex + 1);
            afterRightSideCouple = afterRightSideCouple.Trim();
            if (afterRightSideCouple != string.Empty)
            {
                result.Error = ERROR_INVALID_NOT_SEPARATED_TEXT;
                result.ErrorIndex = result.RightConditionCouple.ClosePIndex + 1 + dicPCouplesRelativeIndex;
                return;
            }


            result.RightCondition = conditionToParse.Substring(
                result.RightConditionCouple.OpenPIndex + 1,
                result.RightConditionCouple.ClosePIndex - result.RightConditionCouple.OpenPIndex - 1);//remove ()

            //Get logical op between left() and right()
            result.LogicalOperators = conditionToParse.Substring(
                result.LeftConditionCouple.ClosePIndex + 1,
                result.RightConditionCouple.OpenPIndex - result.LeftConditionCouple.ClosePIndex - 1).Trim();
        }
        /// <summary>
        /// Help function for ParseLogicalCondition        
        /// </summary>
        /// <param name="conditionToParse"></param>
        /// <param name="dicPCouplesRelativeIndex"></param>
        /// <param name="startsWithUnaryOperator"></param>
        /// <param name="leftSideCouple"></param>
        /// <param name="result"></param>
        /// <returns></returns>
        private PCouple GetNextCouple(string conditionToParse, int dicPCouplesRelativeIndex, ELogicalUnaryOperators startsWithUnaryOperator,
            PCouple leftSideCouple, ref ParseLogicalCondResult result)
        {
            PCouple nextCouple = null;

            var nextCouples = from pair in dicPCouples
                              where pair.Key > leftSideCouple.ClosePIndex &&
                              pair.Value.ClosePIndex < (conditionToParse.Length + dicPCouplesRelativeIndex)
                              orderby pair.Key ascending
                              select pair.Value;
            int foundedCouplesCount = nextCouples.Count();
            if (foundedCouplesCount > 0)
            {
                nextCouple = nextCouples.First();
            }
            else
            {
                //If  we have binary op at the beginning it is OK not to have second condition
                //Check condition like this : NOT(@anid>1)
                if ((foundedCouplesCount == 0 && startsWithUnaryOperator != ELogicalUnaryOperators.NotDefined))
                {
                    //check there are no  text in condition after NOT(@anid>1)
                    string tail = conditionToParse.Substring(leftSideCouple.ClosePIndex + 1 - dicPCouplesRelativeIndex);
                    int lengthBefore = tail.Length;
                    tail = tail.TrimStart();
                    int lengthAfter = tail.Length;
                    if (tail.TrimEnd() != string.Empty)
                    {
                        result.Error = ERROR_INVALID_NOT_SEPARATED_TEXT;
                        result.ErrorIndex = leftSideCouple.ClosePIndex + 1 + (lengthBefore - lengthAfter);
                    }
                }
                else
                {
                    result.Error = ERROR_BUG_1;
                    result.ErrorIndex = result.LeftConditionCouple.ClosePIndex;
                }
            }

            return nextCouple;
        }
        /// <summary>
        /// Help function for ParseLogicalCondition   
        /// </summary>
        /// <param name="conditionToParse"></param>
        /// <param name="dicPCouplesRelativeIndex"></param>
        /// <param name="startsWithUnaryOperator"></param>
        /// <param name="result"></param>
        /// <returns></returns>
        private PCouple ParseLeftConditionInLogicalCondition(string conditionToParse, int dicPCouplesRelativeIndex, ELogicalUnaryOperators startsWithUnaryOperator, ref ParseLogicalCondResult result)
        {
            result.LeftConditionCouple.OpenPIndex = 0;
            if (startsWithUnaryOperator != ELogicalUnaryOperators.NotDefined)
            {
                //after unary operator can be multiple whitespaces
                result.LeftConditionCouple.OpenPIndex = conditionToParse.IndexOf('(');
            }
            PCouple couple = dicPCouples[result.LeftConditionCouple.OpenPIndex + dicPCouplesRelativeIndex];
            result.LeftConditionCouple.ClosePIndex = couple.ClosePIndex - dicPCouplesRelativeIndex;
            result.LeftCondition = conditionToParse.Substring(result.LeftConditionCouple.OpenPIndex + 1,
                result.LeftConditionCouple.ClosePIndex - result.LeftConditionCouple.OpenPIndex - 1);//remove ()

            return couple;
        }

        /// <summary>
        /// Condition inside p should look like :
        ///     //"UnaryOperator () And/Or UnaryOperator()"
        ///     //"UnaryOperator () And/Or ()"
        ///     //"() And/Or UnaryOperator()"
        ///     //UnaryOperator ()
        ///     UnaryOperator can be :
        ///         operator that have logical condition evaluated to bool
        ///         operator that have SessionParam name as parameter
        /// </summary>
        /// <param name="p"></param>
        /// <param name="unaryOperator"></param>
        /// <param name="dicPCouplesRelativeIndex"></param>
        /// <returns></returns>
        private GetLogicalFunctionResult BuildComplexLogicalFunc(ParseLogicalCondResult p, ELogicalUnaryOperators unaryOperator, int dicPCouplesRelativeIndex, ref LogicalRule logicalRule)
        {
            GetLogicalFunctionResult result = new GetLogicalFunctionResult();
            Func<Dictionary<string, string>, bool> funcUnaryOpOnleftSide = null;

            UnaryOperatorParameterType t = GetCustomAttributeValue<ELogicalUnaryOperators, UnaryOperatorParameterType>(unaryOperator);
            EUnaryOperatorsParameterTypes operatorParameterType = t.ParameterType;

            logicalRule.condition = p.LogicalOperators;

            if (operatorParameterType == EUnaryOperatorsParameterTypes.SessionParam)
            {
                result = BuildFuncForUnaryOperatorOnSessionParam(p, unaryOperator, dicPCouplesRelativeIndex, logicalRule);
                if (result.HasError)
                {
                    return result;
                }
                else
                {
                    funcUnaryOpOnleftSide = result.Func;
                }
            }
            else if (operatorParameterType == EUnaryOperatorsParameterTypes.Bool)
            {
                LogicalRule lr1 = null;
                var funcLeft = AnalyzeCondition(p.LeftCondition, dicPCouplesRelativeIndex + p.LeftConditionCouple.OpenPIndex + 1, out result.Error, out result.ErrorIndex, ref lr1);//1 = removed (
                if (result.HasError)
                {
                    return result;
                }

                if (lr1.Rules.First() is SimpleRule)
                {
                    if (unaryOperator == ELogicalUnaryOperators.NOT)
                    {
                        lr1.Not = true;
                    }
                    else
                    {
                        lr1.condition = unaryOperator.ToString();
                    }
                }
                if (unaryOperator == ELogicalUnaryOperators.NOT)
                {
                    lr1.Not = true;
                }

                logicalRule = lr1;

                var funcUnaryOperator = dicLogicalUnaryOperators[unaryOperator];
                funcUnaryOpOnleftSide = d => funcUnaryOperator(d, funcLeft);
            }

            if (p.RightCondition == string.Empty)
            {
                //"Not ()
                result.Func = funcUnaryOpOnleftSide;
            }
            else
            {
                //"Not () And/Or Not()"
                //"Not () And/Or ()"
                //LogicalRule lr2 = null;
                result = BuildFuncForBinaryOperatorWithLeadingUnaryOperator(p, funcUnaryOpOnleftSide, dicPCouplesRelativeIndex, logicalRule);
                //logicalRule.Rules.Add(lr2);

                return result;
            }

            return result;
        }

        /// <summary>
        /// Condition inside p should look like :
        ///     //"Not () And/Or Not()"
        ///     //"Not () And/Or ()"
        /// </summary>
        /// <param name="p"></param>
        /// <param name="unaryOperator"></param>
        /// <param name="dicPCouplesRelativeIndex"></param>
        /// <returns></returns>
        private GetLogicalFunctionResult BuildFuncForBinaryOperatorWithLeadingUnaryOperator(ParseLogicalCondResult p, Func<Dictionary<string, string>, bool> funcUnaryOpOnleftSide, int dicPCouplesRelativeIndex, LogicalRule logicalRule)
        {
            GetLogicalFunctionResult result = new GetLogicalFunctionResult();

            int dicPCouplesRelativeIndexForRight = dicPCouplesRelativeIndex + p.RightConditionCouple.OpenPIndex;
            if (!p.RightConditionHasUnaryOperator)// '(' was removed
            {
                dicPCouplesRelativeIndexForRight += 1;
            }

            ELogicalBinaryOperators logicalOperator = p.LogicalOperators.ParseTo<ELogicalBinaryOperators>(true);
            if (logicalOperator == ELogicalBinaryOperators.NotDefined)
            {
                result.Error = ERROR_INVALID_BINARY_LOGICAL_OPERATOR;
                result.ErrorIndex = p.LeftConditionCouple.ClosePIndex + 1 + dicPCouplesRelativeIndex;
                return result;
            }
            else
            {
                LogicalRule logicalRuleRightCondition = null;
                var funcRight = AnalyzeCondition(p.RightCondition, dicPCouplesRelativeIndexForRight, out result.Error, out result.ErrorIndex, ref logicalRuleRightCondition);//1 = removed (
                if (result.HasError)
                {
                    return result;
                }
                if (logicalRuleRightCondition.Not)
                {
                    if (string.IsNullOrEmpty(logicalRuleRightCondition.condition))
                    {
                        logicalRuleRightCondition.condition = "AND";
                    }
                    logicalRule.Rules.Add(logicalRuleRightCondition);
                }
                else if (logicalRuleRightCondition.Rules.Count == 2)
                {
                    logicalRule.Rules.Add(logicalRuleRightCondition);
                }

                else if (logicalRuleRightCondition.Rules[0] is SimpleRule)
                {
                    logicalRule.Rules.Add(logicalRuleRightCondition.Rules[0]);
                }
                else
                {
                    logicalRule.Rules.Add(logicalRuleRightCondition);
                }

                var funcLogicalOperator = dicLogicalBinaryOperators[logicalOperator];
                result.Func = d => funcLogicalOperator(d, funcUnaryOpOnleftSide, funcRight);
                return result;
            }
        }

        private GetLogicalFunctionResult BuildFuncForUnaryOperatorOnSessionParam(ParseLogicalCondResult p, ELogicalUnaryOperators unaryOperator, int dicPCouplesRelativeIndex, LogicalRule logicalRule)
        {
            GetLogicalFunctionResult result = new GetLogicalFunctionResult();

            ValidateResult validationResult = ValidateSessionOrCookieParam(ref p.LeftCondition);//p.LeftCondition = session param name
            if (validationResult.Valid)
            {
                SimpleRule simpleRule = new SimpleRule() { @operator = unaryOperator.ToString(), Field = '@' + p.LeftCondition.ToLower() };
                logicalRule.Rules.Add(simpleRule);

                var funcUnaryOperator = dicUnarySpecialOperators[unaryOperator];
                result.Func = d => funcUnaryOperator(d, p.LeftCondition);
                return result;
            }
            else
            {
                result.Error = string.Format(ERROR_INVALID_SESSION_PARAM, p.LeftCondition);
                result.ErrorIndex = p.LeftConditionCouple.OpenPIndex + 1 + dicPCouplesRelativeIndex + validationResult.Shift;//1 - open parenthesis itself
                return result;
            }
        }

        private GetLogicalFunctionResult BuildBinaryLogicalFunc(ParseLogicalCondResult input, int dicPCouplesRelativeIndex, LogicalRule logicalRule)
        {
            try
            {
                GetLogicalFunctionResult result = new GetLogicalFunctionResult();
                Func<Dictionary<string, string>, Func<Dictionary<string, string>, bool>, Func<Dictionary<string, string>, bool>, bool> binaryLogicOperatorFunc = null;

                ELogicalBinaryOperators logicalOperator = input.LogicalOperators.ParseTo<ELogicalBinaryOperators>(true);
                if (logicalOperator == ELogicalBinaryOperators.NotDefined)
                {
                    result.Error = ERROR_INVALID_BINARY_LOGICAL_OPERATOR;
                    result.ErrorIndex = input.LeftConditionCouple.ClosePIndex + 1 + dicPCouplesRelativeIndex;
                    return result;
                }
                else
                {

                    logicalRule.condition = logicalOperator.ToString();

                    LogicalRule logicalRuleLeft = null;
                    var leftFunc = AnalyzeCondition(input.LeftCondition, dicPCouplesRelativeIndex + input.LeftConditionCouple.OpenPIndex + 1, out result.Error, out result.ErrorIndex, ref logicalRuleLeft);//1 = removed (
                    if (result.HasError)
                    {
                        return result;
                    }

                    logicalRule.Rules.Add(logicalRuleLeft.condition == null
                        ? logicalRuleLeft.Rules.First()
                        : logicalRuleLeft);

                    int dicPCouplesRelativeIndexForRight = dicPCouplesRelativeIndex + input.RightConditionCouple.OpenPIndex;
                    if (!input.RightConditionHasUnaryOperator)
                    {
                        dicPCouplesRelativeIndexForRight += 1;
                    }
                    LogicalRule logicalRuleRight = null;
                    var rightFunc = AnalyzeCondition(input.RightCondition, dicPCouplesRelativeIndexForRight, out result.Error, out result.ErrorIndex, ref logicalRuleRight);//1 = removed (
                    if (result.HasError)
                    {
                        return result;
                    }
                    if (string.IsNullOrEmpty(logicalRuleRight.condition) && logicalRuleRight.Not)
                    {
                        logicalRuleRight.condition = input.LogicalOperators;
                    }

                    if (string.IsNullOrEmpty(logicalRuleRight.condition) && !logicalRuleRight.Not)
                    {
                        logicalRule.Rules.Add(logicalRuleRight.Rules.First());
                    }
                    else
                    {
                        logicalRule.Rules.Add(logicalRuleRight);
                    }

                    binaryLogicOperatorFunc = dicLogicalBinaryOperators[logicalOperator];
                    result.Func = d => binaryLogicOperatorFunc(d, leftFunc, rightFunc);
                }

                return result;
            }
            catch (Exception ex)
            {
                logger.ErrorFormat("Error in BuildBinaryLogicalFunc. error is : {0}", ex);
                throw ex;
            }
        }

        private GetLogicalFunctionResult BuildCompareFunc(string conditionToParse, out SimpleRule simpleRule)
        {
            simpleRule = null;
            GetLogicalFunctionResult result = new GetLogicalFunctionResult();

            int signIndex = -1;
            string operatorString = GetCompareSign(conditionToParse, out signIndex);
            if (signIndex == -1 || operatorString == string.Empty)
            {
                result.Error = ERROR_INVALID_COMPARE_OPERATOR;
                result.ErrorIndex = 0;//TODO : Ophir - we can try to check where session param ends to help with index
                //try to find more closer index to sign : after the parameter
                int whiteSpaceIndex = conditionToParse.IndexOf(' ');
                result.ErrorIndex = whiteSpaceIndex + 1;

                return result;
            }

            string sessionParamName = conditionToParse.Substring(0, signIndex).Trim();
            int valueToCompareToIndex = signIndex + operatorString.Length;
            string valueToCompareTo = conditionToParse.Substring(valueToCompareToIndex);

            simpleRule = new SimpleRule();
            simpleRule.@operator = Helpers.GetOperator(operatorString)?.text;
            simpleRule.Field = sessionParamName.ToLower();
            simpleRule.Value = valueToCompareTo.TrimStart('"').TrimEnd('"');

            result = BuildCompareFunc(operatorString, sessionParamName, valueToCompareTo);

            switch (result.ErrorIndex)
            {
                case 1://operatorString
                    result.ErrorIndex = signIndex;
                    break;
                case 2://sessionParamName
                    result.ErrorIndex = 0;
                    break;
                case 3://valueToCompareTo
                    result.ErrorIndex = valueToCompareToIndex;
                    break;
            }
            return result;
        }
        private GetLogicalFunctionResult BuildCompareFunc(string operatorString, string sessionParamName, string valueToCompareTo)
        {
            GetLogicalFunctionResult result = new GetLogicalFunctionResult();

            ValidateResult validationResult = ValidateSessionOrCookieParam(ref sessionParamName);
            if (!validationResult.Valid)
            {
                result.Error = string.Format(ERROR_INVALID_SESSION_PARAM, sessionParamName);
                result.ErrorIndex = 2; //invalidParamIndex
                return result;
            }

            ECompareOperators compareOperator = operatorString.ParseTo<ECompareOperators>(true);
            if (compareOperator != ECompareOperators.NotDefined)
            {
                valueToCompareTo = valueToCompareTo.Trim();
                if (!ValidateToCompareValue(valueToCompareTo))
                {
                    result.Error = ERROR_INVALID_VALUE_TOCOMPARE;
                    result.ErrorIndex = 3;//valueToCompareTo
                    return result;
                }

                //Eval compare op
                //If the comparison of 2 elements has either = or <> and value sorrounded with quotes then do a STRING comparison.
                //If the comparison of 2 elements has either <, >, <=, >= then well need to do CASTING on the values to INTEGER or DateTime.
                if ((compareOperator == ECompareOperators.Equal || compareOperator == ECompareOperators.NotEqual ||
                    compareOperator == ECompareOperators.Contains || compareOperator == ECompareOperators.EqualIgnoreCase ||
                    compareOperator == ECompareOperators.ContainsIgnoreCase || compareOperator == ECompareOperators.RegexMatch)
                    && valueToCompareTo.Contains("\""))
                {
                    //Additional validation for string value - it should be surrounded by quotes
                    if (!valueToCompareTo.StartsWith("\""))
                    {
                        result.Error = ERROR_INVALID_STRING_VALUE_START;
                        result.ErrorIndex = 3;//valueToCompareTo
                        return result;
                    }
                    else if (!valueToCompareTo.EndsWith("\""))
                    {
                        result.Error = ERROR_INVALID_STRING_VALUE_END;
                        result.ErrorIndex = 3;//valueToCompareTo
                        return result;
                    }
                    //remove surround quotes
                    valueToCompareTo = valueToCompareTo.Substring(1, valueToCompareTo.Length - 2);
                    Func<Dictionary<string, string>, string, string, bool> f = dicCompareStringsOperators[compareOperator];
                    result.Func = d => f(d, sessionParamName, valueToCompareTo);
                }
                else
                {
                    DateTime dtRes;
                    // if value is of type DateTime
                    if (DateTime.TryParse(valueToCompareTo.ToString(), out dtRes))
                    {
                        Func<Dictionary<string, string>, string, DateTime, bool> f = dicCompareDateTimeOperators[compareOperator];
                        result.Func = d => f(d, sessionParamName, dtRes);
                    }
                    else
                    {
                        long numericValue;
                        if (long.TryParse(valueToCompareTo, out numericValue))
                        {
                            Func<Dictionary<string, string>, string, long, bool> f = dicCompareNumericOperators[compareOperator];
                            result.Func = d => f(d, sessionParamName, numericValue);
                        }
                        else
                        {
                            result.Error = ERROR_INVALID_NUMERIC_VALUE;
                            result.ErrorIndex = 3;//valueToCompareTo
                            return result;
                        }
                    }
                }
            }
            else
            {
                result.Error = ERROR_INVALID_COMPARE_OPERATOR;
                result.ErrorIndex = 1;//operatorString
                return result;
            }

            return result;
        }

        /// <summary>
        /// This function get custom attribute's value from value of the enum ELogicalUnaryOperators
        /// </summary>
        /// <param name="unaryOperator">value to read custom attribute from</param>
        /// <returns></returns>
        private static EUnaryOperatorsParameterTypes GetUnaryOperatorParameterType(ELogicalUnaryOperators unaryOperator)
        {
            //Type unaryOpType = typeof(ELogicalUnaryOperators);

            //FieldInfo field = unaryOpType.GetField(unaryOperator.ToString());
            //object[] attributes = field.GetCustomAttributes(typeof(UnaryOperatorParameterType), false);
            UnaryOperatorParameterType t = GetCustomAttributeValue<ELogicalUnaryOperators, UnaryOperatorParameterType>(unaryOperator);
            //(UnaryOperatorParameterType)attributes[0];
            return t.ParameterType;
        }

        /// <summary>
        /// Today value can be string or numeric(Long)
        /// This function does not check if it possible to parse to Long
        /// String value can have whitespaces inside
        /// It can not have compare signs inside ( =,>,< )
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        private bool ValidateToCompareValue(string value)
        {
            bool result = true;
            if (value.IndexOfAny(new char[] { '<', '>', '=' }) >= 0)
            {
                result = false;
            }
            return result;
        }

        private ValidateResult ValidateSessionOrCookieParam(ref string paramName)
        {
            ValidateResult result = new ValidateResult() { Valid = true };

            int paramNameBefore = paramName.Length;
            paramName = paramName.TrimStart();
            int paramNameAfter = paramName.Length;
            result.Shift = paramNameBefore - paramNameAfter;

            //alphanumeric, starts with one @, and spaces at the end
            string paramNameRegexSession = "^@{1}[a-zA-Z0-9_]{1,}[ ]{0,}$";
            string paramNameRegexCookies = "^#{1}[a-zA-Z0-9_]{1,}[ ]{0,}$";
            if (Regex.IsMatch(paramName, paramNameRegexSession))
            {
                result.Valid = true;

                //Try to fix to right case
                ESessionParamsNames eParamName = paramName.ParseTo<ESessionParamsNames>(true);
                if (eParamName != ESessionParamsNames.NotDefined)
                {
                    paramName = eParamName.ToString();
                }
                else
                {
                    paramName = paramName.Substring(1);
                }
            }
            else if (Regex.IsMatch(paramName, paramNameRegexCookies))
            {
                result.Valid = true;

                //Try to fix to right case
                ECookiesParamsNames eParamName = paramName.ParseTo<ECookiesParamsNames>(true);
                if (eParamName != ECookiesParamsNames.NotDefined)
                {
                    paramName = eParamName.ToString();
                }
                else
                {
                    paramName = paramName.Substring(1);
                }
            }
            else
            {
                result.Valid = false;

            }

            return result;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="conditionToParse"></param>
        /// <param name="signIndex"></param>
        /// <returns>sign string</returns>
        private string GetCompareSign(string conditionToParse, out int signIndex)
        {
            string compareSign = "";
            signIndex = -1;
            string[] operators = EnumsExtensions.GetECompareOperatorsNames();
            //It is really important op "<=" will be before "<" or "="
            int currentOpIndex = -1;
            foreach (string op in operators)
            {
                currentOpIndex = conditionToParse.IndexOf(op);
                if (currentOpIndex >= 0)
                {
                    compareSign = op;
                    signIndex = currentOpIndex;
                    break;
                }
            }

            return compareSign;
        }
        /// <summary>
        /// This function should build couples of indexes "Open Parenthesis" + "Close Parenthesis"
        /// If we find out that there is some close parenthesis without one opens it - we will return false
        /// </summary>
        /// <param name="conditionToParse"></param>
        /// <returns>Error string</returns>
        public string ParseParenthesis(string conditionToParse, ref Dictionary<int, PCouple> couples)
        {
            string error = "";

            if (conditionToParse.Trim() == string.Empty)
            {
                error = ERROR_EMPTY_CONDITION;
                return error;
            }

            int indexOfCharInCondition = -1;//I
            int indexOfLastOpenP = 0;//X start with 0
            //dictionary < key = string, value = Couple (OpenP + CloseP) > couples
            Dictionary<int, PCouple> dicPCouplesSource = new Dictionary<int, PCouple>();

            int couplesIndex = -1;
            bool coupleToCloseFounded = false;
            foreach (char c in conditionToParse)
            {
                indexOfCharInCondition++;
                if (c == '(')
                {
                    indexOfLastOpenP++;
                    dicPCouplesSource.Add(indexOfLastOpenP, new PCouple() { OpenPIndex = indexOfCharInCondition, ClosePIndex = -1 });
                }
                else if (c == ')')
                {
                    //try to find couple to close from the last to first couple
                    couplesIndex = dicPCouplesSource.Count;
                    coupleToCloseFounded = false;
                    while (couplesIndex > 0)
                    {
                        if (dicPCouplesSource[couplesIndex].ClosePIndex == -1)
                        {
                            dicPCouplesSource[couplesIndex].ClosePIndex = indexOfCharInCondition;
                            coupleToCloseFounded = true;
                            break;
                        }
                        couplesIndex--;
                    }
                    if (coupleToCloseFounded == false)
                    {
                        error = ERROR_OPEN_PARENTHESYS_MISSING + (indexOfCharInCondition + 1).ToString();
                        return error;
                    }
                }
            }

            //Check if there are unclosed couples and Fill dictionary with OpenIndex as a key
            dicPCouples = new Dictionary<int, PCouple>();
            PCouple couple = null;
            int index = 1;
            int count = dicPCouplesSource.Count + 1;
            while (index < count)
            {
                couple = dicPCouplesSource[index];
                if (couple.ClosePIndex == -1)
                {
                    error = ERROR_CLOSE_PARENTHESYS_MISSING + (couple.OpenPIndex + 1).ToString();
                    return error;
                }
                else
                {
                    //Fill dictionary with OpenIndex as a key
                    dicPCouples.Add(couple.OpenPIndex, couple);
                }
                index++;
            }
            var result = new List<PCouple>();
            //try to check "() and () and ()"          
            error = CheckTrinities();
            if (!string.IsNullOrEmpty(error))
            {
                couples = dicPCouplesSource;
            }


            return error;
        }

        public List<PCouple> BuildObject(string condition)
        {
            var couples = new Dictionary<int, PCouple>();
            var error = ParseParenthesis(condition, ref couples);

            var closePIndex = 0;
            var listWithBigCouples = new List<PCouple>();
            GetBigCouplesList(couples, closePIndex, listWithBigCouples);
            foreach (var listWithBigCouple in listWithBigCouples)
            {
                var firstExpression = condition.Substring(0, listWithBigCouple.ClosePIndex);
                if (IsSimpleCondition(firstExpression))
                {

                }

            }
            return listWithBigCouples;
        }

        private bool IsSimpleCondition(string condition)
        {
            if (condition.IndexOf("AND", StringComparison.Ordinal) == -1 && condition.IndexOf("OR", StringComparison.Ordinal) == -1) { return true; }
            return false;
        }
        private static void GetBigCouplesList(Dictionary<int, PCouple> couples, int closePIndex, List<PCouple> listWithBigCouples)
        {
            foreach (var couple in couples)
            {
                if (closePIndex == 0)
                {
                    closePIndex = couple.Value.ClosePIndex;
                    listWithBigCouples.Add(couple.Value);
                }
                if (closePIndex < couple.Value.ClosePIndex)
                {
                    closePIndex = couple.Value.ClosePIndex;
                    listWithBigCouples.Add(couple.Value);
                }
            }
        }

        /// <summary>
        /// Try to check "() and () and ()"    
        /// </summary>       
        /// <returns>error string</returns>
        private string CheckTrinities()
        {
            string error = string.Empty;

            //Find all possible trinities of () that are not on inside other
            //they should look like "() and () and ()"
            var allPossibleTrinities = from pair1 in dicPCouples
                                       from pair2 in dicPCouples
                                       from pair3 in dicPCouples
                                       where pair1.Value.ClosePIndex < pair2.Value.OpenPIndex && pair2.Value.ClosePIndex < pair3.Value.OpenPIndex
                                       select new
                                       {
                                           O1 = pair1.Value.OpenPIndex,
                                           C1 = pair1.Value.ClosePIndex,
                                           O2 = pair2.Value.OpenPIndex,
                                           C2 = pair2.Value.ClosePIndex,
                                           O3 = pair3.Value.OpenPIndex,
                                           C3 = pair3.Value.ClosePIndex
                                       };
            //Find all trinities that are separated one from other by anothe opening or closing parenthesys.
            var allValidTrinities = (from trinity in allPossibleTrinities
                                     from pair in dicPCouples
                                     where (trinity.C1 < pair.Value.OpenPIndex && pair.Value.OpenPIndex < trinity.O2) ||
                                             (trinity.C2 < pair.Value.OpenPIndex && pair.Value.OpenPIndex < trinity.O3) ||
                                             (trinity.C1 < pair.Value.ClosePIndex && pair.Value.ClosePIndex < trinity.O2) ||
                                             (trinity.C2 < pair.Value.ClosePIndex && pair.Value.ClosePIndex < trinity.O3)
                                     select trinity).Distinct();

            //Check if we have trinities that are not separated.            
            //right trinities should look like "(() and ()) and ()" or "() and (() and ())"
            if (allPossibleTrinities.Count() > allValidTrinities.Count())
            {
                var allIllegalTrinities = allPossibleTrinities.Except(allValidTrinities);

                //there is trinities that not separated
                error = ERROR_EXTRA_NOT_SEPARATED_PARENTHESIS + (allIllegalTrinities.First().O3 + 1).ToString();
            }
            return error;
        }

        private Func<Dictionary<string, string>, bool> TryToGetParsedConditionFromCache(string conditionToParse, ref Boolean isProcessing)
        {
            Func<Dictionary<string, string>, bool> fResult = null;

            object oFuncDelegateFromCache = HttpRuntime.Cache.Get(conditionToParse);
            if (oFuncDelegateFromCache is Boolean)
            {
                isProcessing = Boolean.Parse(oFuncDelegateFromCache.ToString());
            }
            else if (oFuncDelegateFromCache is Func<Dictionary<string, string>, bool>)
            {
                fResult = (Func<Dictionary<string, string>, bool>)oFuncDelegateFromCache;
            }
            return fResult;
        }

        /// <summary>
        /// This function should be used before start Parse Condition.
        /// </summary>
        public void FillOperatorsDictionaries()
        {
            FillCompareOperatorsDictionary();
            FillLogicalOperatorsDictionary();

            dicUnarySpecialOperators = new Dictionary<ELogicalUnaryOperators, Func<Dictionary<string, string>, string, bool>>();
            Expression<Func<Dictionary<string, string>, string, bool>> eExist = (d, p) => Exist(d, p);
            var delegExist = eExist.Compile();
            dicUnarySpecialOperators.Add(ELogicalUnaryOperators.exists, delegExist);
        }
        /// <summary>
        /// Logical operator today devided into 2 dictionaries : binary and unary operators.
        /// Binary dictionary filled with OR,AND
        /// Unary dictionary filled with NOT
        /// </summary>
        private void FillLogicalOperatorsDictionary()
        {
            dicLogicalBinaryOperators = new Dictionary<ELogicalBinaryOperators,
                Func<Dictionary<string, string>,
                    Func<Dictionary<string,
                        string>,
                        bool>,
                    Func<Dictionary<string,
                        string>,
                        bool>,
                    bool>>();

            Expression<Func<
                    Dictionary<string, string>,
                    Func<Dictionary<string,
                        string>,
                        bool>,
                    Func<Dictionary<string,
                        string>,
                        bool>,
                    bool>> eAND = (d, i, j) => i(d) && j(d);
            var delegAND = eAND.Compile();
            dicLogicalBinaryOperators.Add(ELogicalBinaryOperators.AND, delegAND);

            Expression<Func<Dictionary<string, string>,
                        Func<Dictionary<string, string>, bool>,
                        Func<Dictionary<string, string>, bool>, bool>> eOR = (d, f1, f2) => f1(d) || f2(d);
            var delegOR = eOR.Compile();
            dicLogicalBinaryOperators.Add(ELogicalBinaryOperators.OR, delegOR);

            dicLogicalUnaryOperators = new Dictionary<ELogicalUnaryOperators, Func<Dictionary<string, string>, Func<Dictionary<string, string>, bool>, bool>>();
            Expression<Func<Dictionary<string, string>,
                        Func<Dictionary<string, string>, bool>, bool>> eNOT = (d, f1) => !(f1(d));
            var delegNOT = eNOT.Compile();
            dicLogicalUnaryOperators.Add(ELogicalUnaryOperators.NOT, delegNOT);




        }
        /// <summary>
        /// Today all possible compare signs added to this dictionary : check ECompareOperators enum
        /// </summary>
        private void FillCompareOperatorsDictionary()
        {
            dicCompareStringsOperators = new Dictionary<ECompareOperators, Func<Dictionary<string, string>, string, string, bool>>();

            Expression<Func<Dictionary<string, string>, string, string, bool>> fEquals = (d, i, j) => EqualTo(d, i, j);
            Func<Dictionary<string, string>, string, string, bool> delegEqual = fEquals.Compile();
            dicCompareStringsOperators.Add(ECompareOperators.Equal, delegEqual);

            Expression<Func<Dictionary<string, string>, string, string, bool>> fNotEquals = (d, i, j) => NotEqualTo(d, i, j);
            Func<Dictionary<string, string>, string, string, bool> delegNotEqual = fNotEquals.Compile();
            dicCompareStringsOperators.Add(ECompareOperators.NotEqual, delegNotEqual);

            Expression<Func<Dictionary<string, string>, string, string, bool>> fEqualToIgnoreCase = (d, i, j) => EqualToIgnoreCase(d, i, j);
            Func<Dictionary<string, string>, string, string, bool> delegEqualToIgnoreCase = fEqualToIgnoreCase.Compile();
            dicCompareStringsOperators.Add(ECompareOperators.EqualIgnoreCase, delegEqualToIgnoreCase);

            Expression<Func<Dictionary<string, string>, string, string, bool>> fContains = (d, i, j) => Contains(d, i, j);
            Func<Dictionary<string, string>, string, string, bool> delegContains = fContains.Compile();
            dicCompareStringsOperators.Add(ECompareOperators.Contains, delegContains);

            Expression<Func<Dictionary<string, string>, string, string, bool>> fContainsIgnoreCase = (d, i, j) => ContainsIgnoreCase(d, i, j);
            Func<Dictionary<string, string>, string, string, bool> delegContainsIgnoreCase = fContainsIgnoreCase.Compile();
            dicCompareStringsOperators.Add(ECompareOperators.ContainsIgnoreCase, delegContainsIgnoreCase);

            Expression<Func<Dictionary<string, string>, string, string, bool>> fRegexMatchIgnoreCase = (d, i, j) => RegexMatch(d, i, j);
            Func<Dictionary<string, string>, string, string, bool> delegRegexMatchIgnoreCase = fRegexMatchIgnoreCase.Compile();
            dicCompareStringsOperators.Add(ECompareOperators.RegexMatch, delegRegexMatchIgnoreCase);

            dicCompareNumericOperators = new Dictionary<ECompareOperators, Func<Dictionary<string, string>, string, long, bool>>();

            Expression<Func<Dictionary<string, string>, string, long, bool>> fLower = (d, i, j) => LowerThan(d, i, j);
            Func<Dictionary<string, string>, string, long, bool> delegLower = fLower.Compile();
            dicCompareNumericOperators.Add(ECompareOperators.Lower, delegLower);

            Expression<Func<Dictionary<string, string>, string, long, bool>> fLowerEqual = (d, i, j) => LowerOrEqualThan(d, i, j);
            Func<Dictionary<string, string>, string, long, bool> delegLowerEqual = fLowerEqual.Compile();
            dicCompareNumericOperators.Add(ECompareOperators.LowerEqual, delegLowerEqual);

            Expression<Func<Dictionary<string, string>, string, long, bool>> fGreater = (d, i, j) => GreaterThan(d, i, j);
            Func<Dictionary<string, string>, string, long, bool> delegGreater = fGreater.Compile();
            dicCompareNumericOperators.Add(ECompareOperators.Greater, delegGreater);

            Expression<Func<Dictionary<string, string>, string, long, bool>> fGreaterEqual = (d, i, j) => GreaterOrEqualThan(d, i, j);
            Func<Dictionary<string, string>, string, long, bool> delegGreaterEqual = fGreaterEqual.Compile();
            dicCompareNumericOperators.Add(ECompareOperators.GreaterEqual, delegGreaterEqual);

            dicCompareDateTimeOperators = new Dictionary<ECompareOperators, Func<Dictionary<string, string>, string, DateTime, bool>>();

            Expression<Func<Dictionary<string, string>, string, DateTime, bool>> fLowerTime = (d, i, j) => LowerTimeThan(d, i, j);
            Func<Dictionary<string, string>, string, DateTime, bool> delegLowerTime = fLowerTime.Compile();
            dicCompareDateTimeOperators.Add(ECompareOperators.Lower, delegLowerTime);

            Expression<Func<Dictionary<string, string>, string, DateTime, bool>> fLowerEqualTime = (d, i, j) => LowerOrEqualTimeThan(d, i, j);
            Func<Dictionary<string, string>, string, DateTime, bool> delegLowerEqualTime = fLowerEqualTime.Compile();
            dicCompareDateTimeOperators.Add(ECompareOperators.LowerEqual, delegLowerEqualTime);

            Expression<Func<Dictionary<string, string>, string, DateTime, bool>> fGreaterTime = (d, i, j) => GreaterTimeThan(d, i, j);
            Func<Dictionary<string, string>, string, DateTime, bool> delegGreaterTime = fGreaterTime.Compile();
            dicCompareDateTimeOperators.Add(ECompareOperators.Greater, delegGreaterTime);

            Expression<Func<Dictionary<string, string>, string, DateTime, bool>> fGreaterEqualTime = (d, i, j) => GreaterOrEqualTimeThan(d, i, j);
            Func<Dictionary<string, string>, string, DateTime, bool> delegGreaterEqualTime = fGreaterEqualTime.Compile();
            dicCompareDateTimeOperators.Add(ECompareOperators.GreaterEqual, delegGreaterEqualTime);

            Expression<Func<Dictionary<string, string>, string, DateTime, bool>> fEqualTime = (d, i, j) => EqualTimeTo(d, i, j);
            Func<Dictionary<string, string>, string, DateTime, bool> delegEqualTime = fEqualTime.Compile();
            dicCompareDateTimeOperators.Add(ECompareOperators.Equal, delegEqualTime);

            Expression<Func<Dictionary<string, string>, string, DateTime, bool>> fNotEqualTime = (d, i, j) => NotEqualTimeTo(d, i, j);
            Func<Dictionary<string, string>, string, DateTime, bool> delegNotEqualTime = fNotEqualTime.Compile();
            dicCompareDateTimeOperators.Add(ECompareOperators.NotEqual, delegNotEqualTime);

        }

        private string GetSessionParamStringValue(Dictionary<string, string> dictionary, string param)
        {
            try
            {
                string paramValue = null;
                //dictionary = new Dictionary<string, string>(dictionary, StringComparer.OrdinalIgnoreCase);
                if (dictionary.ContainsKey(param))
                {
                    paramValue = dictionary[param];
                }
                return paramValue;
            }
            catch (Exception ex)
            {
                logger.ErrorFormat("GetSessionParamStringValue failed. Error is : {0} , param is : {1}", ex, param);
                throw ex;
            }

        }

        private long? GetSessionParamNumericValue(Dictionary<string, string> dictionary, string param)
        {
            long? result = null;
            long i;
            //dictionary = new Dictionary<string, string>(dictionary, StringComparer.OrdinalIgnoreCase);
            if (dictionary.ContainsKey(param))
            {
                if (Int64.TryParse(dictionary[param], out i))
                {
                    result = i;
                }
            }

            return result;
        }

        private DateTime? GetSessionParamDateTimeValue(Dictionary<string, string> dictionary, string param)
        {
            DateTime? result = null;
            DateTime dt;
            //dictionary = new Dictionary<string, string>(dictionary, StringComparer.OrdinalIgnoreCase);
            if (dictionary.ContainsKey(param))
            {
                if (DateTime.TryParse(dictionary[param].ToString(), out dt))
                {
                    result = dt;
                }
            }

            return result;
        }

        /// <summary>
        /// This function should be used before start execute
        /// to get all parameters from session and cookies as an input
        /// </summary>
        private void FillMasterParamsDictionary()
        {
            try
            {
                if (dicMasterParams == null)
                {
                    dicMasterParams = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                    /*if (HttpContextCurrent != null)
                    {
                        foreach (string sessionKey in HttpContextCurrent.Session.Keys)
                        {
                            object sessionValue = HttpContextCurrent.Session[sessionKey];
                            if (sessionValue != null)
                            {
                                try
                                {
                                    dicMasterParams.Add(sessionKey, sessionValue.ToString());
                                }
                                catch (Exception)
                                {
                                    logger.NormalFormat("Duplicate key on segmented Session item. Key is: {0}", sessionKey);
                                }
                            }
                        }
                    }
                    if (HttpContextCurrent.Request != null)
                    {
                        logger.Normal("HttpContextCurrent.Request is valid - ready to get cookies");
                        foreach (string cookieKey in HttpContextCurrent.Request.Cookies.AllKeys.Distinct<string>())
                        {
                            var cookieValue = HttpContextCurrent.Request.Cookies[cookieKey].Value;
                            if (cookieValue != null)
                            {
                                // _logger.NormalFormat("cookieKey is : {0} , value is: {1}", cookieKey, cookieValue.ToString());
                                try
                                {
                                    dicMasterParams.Add("COOKIE_" + cookieKey, cookieValue.ToString());
                                }
                                catch (Exception)
                                {
                                    logger.NormalFormat("Duplicate key on segmented cookie. Key is: {0}", cookieKey);
                                    //Do nothing
                                }
                            }
                        }
                    }*/
                }
            }
            catch (Exception ex)
            {
                logger.ErrorFormat("FillMasterParamsDictionary failed. Error is : {0}", ex);
            }


        }
        #endregion

        #region Actions functions
        private bool EqualTo(Dictionary<string, string> dictionary, string param, string valueToCompareTo)
        {
            bool result = false;
            string paramValue = GetSessionParamStringValue(dictionary, param);

            if (paramValue != null)
            {
                result = (paramValue == valueToCompareTo);
            }

            return result;
        }

        private bool NotEqualTo(Dictionary<string, string> dictionary, string param, string valueToCompareTo)
        {
            bool result = false;
            string paramValue = GetSessionParamStringValue(dictionary, param);
            if (paramValue != null)
            {
                result = (paramValue != valueToCompareTo);
            }

            return result;
        }
        private bool GreaterThan(Dictionary<string, string> dictionary, string param, long valueToCompareTo)
        {
            bool result = false;
            long? paramValue = GetSessionParamNumericValue(dictionary, param);
            if (paramValue.HasValue)
            {
                result = (paramValue.Value > valueToCompareTo);
            }

            return result;
        }
        private bool GreaterOrEqualThan(Dictionary<string, string> dictionary, string param, long valueToCompareTo)
        {
            bool result = false;
            long? paramValue = GetSessionParamNumericValue(dictionary, param);
            if (paramValue.HasValue)
            {
                result = (paramValue.Value >= valueToCompareTo);
            }

            return result;
        }

        private bool LowerThan(Dictionary<string, string> dictionary, string param, long valueToCompareTo)
        {
            bool result = false;
            long? paramValue = GetSessionParamNumericValue(dictionary, param);
            if (paramValue.HasValue)
            {
                result = (paramValue.Value < valueToCompareTo);
            }

            return result;
        }

        private bool GreaterTimeThan(Dictionary<string, string> dictionary, string param, DateTime valueToCompareTo)
        {
            bool result = false;
            DateTime? paramValue = GetSessionParamDateTimeValue(dictionary, param);
            if (paramValue.HasValue)
            {
                // Current Time < value from user
                int res = DateTime.Compare(paramValue.Value, valueToCompareTo);
                if (res > 0)
                    result = true;
            }

            return result;
        }

        private bool GreaterOrEqualTimeThan(Dictionary<string, string> dictionary, string param, DateTime valueToCompareTo)
        {
            bool result = false;
            DateTime? paramValue = GetSessionParamDateTimeValue(dictionary, param);
            if (paramValue.HasValue)
            {
                // Current Time < value from user
                int res = DateTime.Compare(paramValue.Value, valueToCompareTo);
                if (res >= 0)
                    result = true;
            }

            return result;
        }

        private bool EqualTimeTo(Dictionary<string, string> dictionary, string param, DateTime valueToCompareTo)
        {
            bool result = false;
            DateTime? paramValue = GetSessionParamDateTimeValue(dictionary, param);
            if (paramValue.HasValue)
            {
                // Current Time < value from user
                int res = DateTime.Compare(paramValue.Value, valueToCompareTo);
                if (res == 0)
                    result = true;
            }

            return result;
        }

        private bool NotEqualTimeTo(Dictionary<string, string> dictionary, string param, DateTime valueToCompareTo)
        {
            bool result = false;
            DateTime? paramValue = GetSessionParamDateTimeValue(dictionary, param);
            if (paramValue.HasValue)
            {
                // Current Time < value from user
                int res = DateTime.Compare(paramValue.Value, valueToCompareTo);
                if (res != 0)
                    result = true;
            }

            return result;
        }

        private bool LowerTimeThan(Dictionary<string, string> dictionary, string param, DateTime valueToCompareTo)
        {
            bool result = false;
            DateTime? paramValue = GetSessionParamDateTimeValue(dictionary, param);
            if (paramValue.HasValue)
            {
                // Current Time < value from user
                int res = DateTime.Compare(paramValue.Value, valueToCompareTo);
                if (res < 0)
                    result = true;
            }

            return result;
        }

        private bool LowerOrEqualTimeThan(Dictionary<string, string> dictionary, string param, DateTime valueToCompareTo)
        {
            bool result = false;
            DateTime? paramValue = GetSessionParamDateTimeValue(dictionary, param);
            if (paramValue.HasValue)
            {
                // Current Time < value from user
                int res = DateTime.Compare(paramValue.Value, valueToCompareTo);
                if (res <= 0)
                    result = true;
            }

            return result;
        }

        private bool LowerOrEqualThan(Dictionary<string, string> dictionary, string param, long valueToCompareTo)
        {
            bool result = false;
            long? paramValue = GetSessionParamNumericValue(dictionary, param);
            if (paramValue.HasValue)
            {
                result = (paramValue.Value <= valueToCompareTo);
            }

            return result;
        }

        private bool EqualToIgnoreCase(Dictionary<string, string> dictionary, string param, string valueToCompareTo)
        {
            bool result = false;
            string paramValue = GetSessionParamStringValue(dictionary, param);
            if (paramValue != null)
            {
                result = (paramValue.ToLower() == valueToCompareTo.ToLower());
            }

            return result;
        }

        private bool ContainsIgnoreCase(Dictionary<string, string> dictionary, string param, string valueToCompareTo)
        {
            bool result = false;
            string paramValue = GetSessionParamStringValue(dictionary, param);
            if (paramValue != null)
            {
                result = (paramValue.ToLower().Contains(valueToCompareTo.ToLower()));
            }

            return result;
        }

        private bool Contains(Dictionary<string, string> dictionary, string param, string valueToCompareTo)
        {
            bool result = false;
            string paramValue = GetSessionParamStringValue(dictionary, param);
            if (paramValue != null)
            {
                result = (paramValue.Contains(valueToCompareTo));
            }

            return result;
        }

        private bool RegexMatch(Dictionary<string, string> dictionary, string param, string valueToCompareTo)
        {
            bool result = false;
            string paramValue = GetSessionParamStringValue(dictionary, param);
            if (paramValue != null)
            {
                valueToCompareTo = valueToCompareTo.Replace("#@#", "(");
                valueToCompareTo = valueToCompareTo.Replace("#$#", ")");
                Regex regex = new Regex(valueToCompareTo, RegexOptions.Compiled | RegexOptions.IgnoreCase);
                result = regex.IsMatch(paramValue);
            }

            return result;
        }


        private bool Exist(Dictionary<string, string> dictionary, string param)
        {
            bool result = false;
            string paramValue = GetSessionParamStringValue(dictionary, param);
            if (paramValue != null)
            {
                result = true;
            }

            return result;
        }

        private int SegmentationResultsCacheExpirationInMinutes
        {
            get
            {
                if (!segmentationResultsCacheExpirationInMinutes.HasValue)
                {
                    segmentationResultsCacheExpirationInMinutes = 60;
                    object appConfigCache = ConfigurationManager.AppSettings["SegmentationResultsCacheExpirationInMinutes"];
                    if (appConfigCache != null)
                    {
                        int i;
                        if (Int32.TryParse(appConfigCache.ToString(), out i))
                        {
                            segmentationResultsCacheExpirationInMinutes = i;
                        }
                    }
                }

                //_logger.Normal("SegmentationResultsCacheExpirationInMinutes configured as " + segmentationResultsCacheExpirationInMinutes.Value + " minutes");
                return segmentationResultsCacheExpirationInMinutes.Value;
            }
        }
        #endregion

        #region private functions that can be utils
        private static T2 GetCustomAttributeValue<T1, T2>(T1 valueToGetCustomAttributeOf)
        {
            Type unaryOpType = typeof(T1);

            FieldInfo field = unaryOpType.GetField(valueToGetCustomAttributeOf.ToString());
            object[] attributes = field.GetCustomAttributes(typeof(T2), false);
            T2 t = (T2)attributes[0];
            return t;
        }
        #endregion
    }
}
