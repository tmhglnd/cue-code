// A simple syntax highlighting for the mercury language
CodeMirror.defineSimpleMode("mercury", {
	meta: {
		lineComment: '//'
	},
	start: [
		// comment
		{ regex: /\/\/.*$/, token: "comment" },
		// parenthesis and brackets
		{ regex: /[(){}]/, token: "meta" },
		// strings
		{ regex: /\"[^"]*\"/, token: 'string' },
		{ regex: /\'[^']*\'/, token: 'string' },
		{ regex: /\`[^`]*\`/, token: 'string' },
		// functions
		{ regex: /([^0-9\s][^\s\(\)\[\]]*)(\s*)(\()/,
			token: [ "def", null, "meta" ] },
		// osc-addresses
		{ regex: /(\/[^0-9/\s)][^/)\s]*){1,}/, token: "string-2" },
		// operators
		{ regex: /[[\]+\-*:/=><!?&^%$#@;,]+/, token: 'operator' },
		// numbers
		{ regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
			token: "number" },
		// keywords
		{ regex: /(new|list|set)(\s+)([^0-9\s][^\s\(\)\[\]]*)\b/,
			token: [ "keyword", null, "tag" ] },
		// global
		{ regex: /(?:print|display|silence|default)\b/, token: "keyword" },
		// any other word
		{ regex: /[^0-9\s][^\s\(\)\[\]]*/, token: "variable-1" }
	]
});