/*
 *  CARRE Risk Evidence Condition Parser
 *
 *  Originally made by George Drosatos in Java
 *  Converted into Javascript by Nick Portokallidis
 *  Under MIT License
 */

var RiskEvidenceConditionParser = {
	
    operators: ["!=", "=", ">=", "<=", ">", "<", "OR", "AND"],

    parseAndEvaluateExpression: function(ex) {
        var arr = ex.split("");
        for (var i = 0; i < arr.length; i++) {

            if (arr[i] !== " ") return this.parseWithStrings(ex);
            console.error("ERROR: Expression cannot be empty!");
            return false;
        }
    },

    evaluate: function(condition, vars) {
        // sort by key length
        var sortedVals = Object.keys(vars).sort(function(a,b){return b.length>a.length;});
        
        sortedVals.forEach(function(val){
            condition=RiskEvidenceConditionParser.replaceAll(condition,val,vars[val]);
        });
        
		//error control
		if(condition.indexOf("OB_")>=0) {
// 			console.error("===ERROR in OB replacement===");
// 			console.error("--Condition:",condition);
// 			console.error("--Observable:",
// 			condition.substr(condition.indexOf("OB_"),5));
			return false;
		}
        return this.parseAndEvaluateExpression(condition);
    },

    parseWithStrings: function(s) {
        var op = this.determineOperatorPrecedenceAndLocation(s);
        var start = op[0];
        var left = s.substring(0, start).trim();
        var right = s.substring(op[1]).trim();
        var oper = s.substring(start, op[1]).trim();
        var logType = this.logicalOperatorType(oper);

        // console.log("PARSE: Left: \"" + left + "\" Right: \"" + right + "\" Operator: \"" + oper + "\"");

        if (logType === 0) // encounters OR- recurse
            return this.parseWithStrings(left) || this.parseWithStrings(right);
        else if (logType === 1) // encounters AND- recurse
            return this.parseWithStrings(left) && this.parseWithStrings(right);
        var leftSansParen = this.removeParens(left);
        var rightSansParen = this.removeParens(right);
        if (this.isNumeric(leftSansParen) && this.isNumeric(rightSansParen))
            return this.evaluateFloat(parseFloat(leftSansParen), oper, parseFloat(rightSansParen));
        else return this.evaluateStr(leftSansParen, oper, rightSansParen); // assume they are strings
    },

    determineOperatorPrecedenceAndLocation: function(s) {
        s = s.trim();
        var minParens = 999999999999;
        var currentMin = null;
        for (var sampSize = 1; sampSize <= 3; sampSize++) {
            for (var locInStr = 0; locInStr < (s.length + 1) - sampSize; locInStr++) {
                var endIndex = locInStr + sampSize;
                var sub;
                if ((endIndex < s.length && s[endIndex] === '='))
                    sub = s.substring(locInStr, 2+endIndex).trim();
                else
                    sub = s.substring(locInStr, endIndex).trim();
                if (this.isOperator(sub)) {
                    // Idea here is to weight logical operators so that they will still be selected over other operators
                    // when no parens are present
                    var parens = (this.logicalOperatorType(sub) > -1) ? this.parens(s, locInStr) - 1 : this.parens(s, locInStr);
                    if (parens <= minParens) {
                        minParens = parens;
                        currentMin = [locInStr, endIndex, parens];
                    }
                }
            }
        }
        return currentMin;
    },

    logicalOperatorType: function(op) {
        if (op.trim()==="OR") {
            return 0;
        }
        else if (op.trim()==="AND") {
            return 1;
        }
        else {
            return -1;
        }
    },

    parens: function(s, loc) {
        var parens = 0;
        for (var i = 0; i < s.length; i++) {
            if (s[i] === '(' && i < loc)
                parens++;
            if (s[i] === ')' && i >= loc)
                parens++;
        }
        return parens;
    },

    removeParens: function(s) {
        s = s.trim();
        var keep="";
        s.split("").forEach(function(c){
            if (!(c === '(') && !(c === ')'))
                keep+=c;
        });
        return keep.toString().trim();
    },
    
    replaceAll: function(target, search, replacement) {
    	return target.split(search).join(replacement);
	},

    isOperator: function(op) {
        return this.operators.indexOf(op.trim())>=0;
    },

    isNumeric: function(s) {
  		return !isNaN(parseFloat(s)) && isFinite(s);
    },

    evaluateFloat: function(left, op, right) {
        if (op==="=") {
            return left === right;
        }
        else if (op===">") {
            return left > right;
        }
        else if (op==="<") {
            return left < right;
        }
        else if (op==="<=") {
            return left <= right;
        }
        else if (op===">=") {
            return left >= right;
        }
        else if (op==="!=") {
            return left != right;
        }
        else {
            console.error("ERROR: Operator type not recognized.");
            return false;
        }
    },
    
    fixQuotes: function(str){
      return str.replace(/['"]+/g, '');
        
    },

    evaluateStr: function(left, op, right) {
        if (op==="=" || op==="!=" ) {
            return this.fixQuotes(left)===this.fixQuotes(right);
        } else {
            console.error("ERROR: Operator type not recognized.");
            return false;
        }
    }

};
