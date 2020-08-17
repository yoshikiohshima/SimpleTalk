let simpletalkGrammar =`
SimpleTalk {
 	Script
		= MessageHandler
		| FunctionHandler
		| comment
		| end

	// Function definition follows the HT convention
	// """
	// message messageName [parameterList]
	//     statementList
	// end messageName
	// """
	// Note: to distinguish from functions message handler parameters are not
	// parenthetical; moreover, message names are more restrictive
	MessageHandlerOpen
        	= "on" messageName ParameterList? lineTerminator

	MessageHandlerClose
		= "end" messageName

	MessageHandler
		= MessageHandlerOpen StatementList? MessageHandlerClose

	// TODO should we insist that authered messages start with a lower case letter?
	Message
		= systemMessage ParameterList? --system
		// TODO do we need to prevent keyword/built in message overload?
		| messageName ParameterList? --authoredMessage

    	// Any comma-separated string of tokens
    	// that can be used either as arguments to
    	// a called function, arguments in a function
    	// definition, or args in a message handler
    	// definition
	ParameterList (parameter list)
		// TODO do we need to prevent keyword overload?
		= NonemptyListOf<#(letter | digit)+, ", ">

        StatementList (a statement list, comments included)
		= StatementLine+

	StatementLine (a statement line)
		= Statement lineTerminator+

	// Note we explicitly exclude keywords, i.e. control
	Statement (a statement)
		= ~"end" (GlobalStatement | ControlStructure | Command)

	ControlStructure (a statement control structure)
		= "exit" ("to SimpleCard" | messageName | functionName) --exit
		| "pass" (messageName | functionName) --pass
		| "return" functionName --return //TODO we need to return expressions as well!

	GlobalStatement (a "global" statement)
		= "global" #space+ ParameterList

	Command (a command statement)
		= "go to" ("next" | "previous")? systemObject? objectId? --goTo
        | "answer" stringLiteral --answer
        | letter+ --arbitrary

	// Function definition follows the HT convention
	// """
	// function functionName(parameterList)
	//     statementList
	// end functionName
	// """

    // TODO: Consider using the "Open/Close" formulation
    // we have for MessageHandler. We could even use the
    // MessageHandlerClose for functions, since they are
    // identical
	FunctionHandlerSyntax<name, parameters, statements>
		= "function" name "(" ParameterList? ")" lineTerminator statements? "end" name

    FunctionHandlerOpen = "function" functionName "(" ParameterList? ")" lineTerminator

    FunctionHandlerClose = "end" functionName

	FunctionHandler = FunctionHandlerOpen StatementList? FunctionHandlerClose

        // For the moment we allow only the "function()" syntax to describe a function
	// (as opposed to "the function" or "function of" more general syntax found on HT)
	// TODO should we insist that authered functions start with a lower case letter?
	Function
		= builtInFunction "(" ParameterList? ")" --builtInFunction
		// TODO do we need to prevent keyword overload?
		| functionName "(" ParameterList? ")" --authoredFunction

        Expression (an expression)
		= Factor | "(" Expression ")" --parenthetical

	Factor (a factor type expression)
		= digit+ "." digit+ --float
		| digit+ --integer
		| "not" Expression --logicalNegation
		| letter alnum* --literal
		| "-" Expression --negation

	// TODO do we want to restrict function names (start with lowercase etc)?
	// Note: we prevent keyword overloading
	functionName (function name)
		= ~keyword (letter (letter | digit)*)

	builtInFunction (natively supported functions in SimpleTalk)
		= builtInMathFunction | "charToNum" | "date" | "length" | "menus"
		| "mouseClick" | "mouse"
		| modifierKeyName "key" -- modifierKeyBuiltInFunction

	// TODO should we insist on certain functions having no argument or single args
	// at the grammar level?
	builtInMathFunction (math function)
		= "average" | "min" | "max" | "sum" | "random" | "sqrt" | "trunc" | "sin"
		| "cos" | "tan" | "atan" | "exp" | "ln" | "abs"

        // TODO do we want to restrict message names (start with lowercase etc)?
	// should these be different from functionName?
	// Note: we prevent keyword overloading
	messageName (message name)
		= ~keyword letter+

	systemMessage (system message)
		= "systemEvent" | "arrowKey"
		| "close" systemObject? --closeObject
		| "commandKeyDown"| "controlKey"
		| "delete" systemObject --deleteObject
		| "doMenu" | "enterInField" | "enterKey" | "exitField" | "functionKey"
		| "help" | "hide menubar" | "idle" | "keyDown"
		| "mouse" ("DoubleClick" | "DownInPicture" | "Down" | "Enter" | "Leave" | "StillDown" | "UpInPicture" | "Up" | "Within") --mouseEvent
		| "moveWindow"
		| "new" systemObject --newObject
		| "open" systemObject --openObject
		| "quit" | "resumeStack" | "resume" | "returnInField" | "returnKey" | "show menubar"
		| "sizeWindow" | "startUp" | "suspendStack" | "suspend" | "tabKey"

	systemObject (system object such as card, stack etc)
		= ("b"| "B") "ackground" | ("b" | "B") "utton" | ("c" | "C") "ard" | ("f" | "F") "ield" | ("s" | "S") "tack"

	modifierKeyName (a modifier key name)
		= "command" | "option" | "control" | "shift"

	direction
		= "left" | "right" | "up" | "down"

	// We need to prevent keyword overload since these are core control flow indicators
	keyword (a keyword)
		= "do" | "next" | "else" | "on" | "end" | "pass" | "exit" | "repeat" | "function" | "return" | "global" | "send" | "if" | "then"

	objectId (an identifier of an object, string, numeric or mixed)
             = (letter | digit)*


        // Helper utilities
	// Accounts for singular and plural word (i.e. with and without 's')
	singPlu<x> = x "s"?


        // TODO
	comment
		= "--"letter+


    	// A string literal in SimpleTalk is any string
    	// without line terminators wrapped in open and
    	// closing quotes
    	stringLiteral
        	= quoteMark nonLineTerminator+ quoteMark

	quoteMark = "\""

	// Basic whitespace and line termination handling.
    	// Note that we override the default Ohm definition
    	// of "space" to only be spaces or tabs, and NOT
    	// any of the newline characters
	space := whitespace
		whitespace = "\t"
		     | "\x0B"    -- verticalTab
		     | "\x0C"    -- formFeed
		     | " "
		     | "\u00A0"  -- noBreakSpace
		     | "\uFEFF"  -- byteOrderMark
		     | unicodeSpaceSeparator

	unicodeSpaceSeparator = "\u2000".."\u200B" | "\u3000"
	lineTerminator = "\n" | "\r" | "\u2028" | "\u2029" | "\r\n"
	nonLineTerminator = ~lineTerminator (alnum | whitespace)
}
`

export {simpletalkGrammar, simpletalkGrammar as default};
