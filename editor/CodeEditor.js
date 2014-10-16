var CodeEditor = function () {
	var self = this;
	var editStrings  = [];
	var LIMIT = 80;
	var Tags = {
		writeTag: "<editable>"
	}

	var dangerWords = [
            'eval', '.call', 'call(', 'apply', 'bind',
            'prototype',
            'setTimeout', 'setInterval',
            'requestAnimationFrame', 'mozRequestAnimationFrame',
            'webkitRequestAnimationFrame', 'setImmediate',
            'prompt', 'confirm',
            'debugger',
            'delete',
            'atob(','btoa(',
            'Function(',
            'constructor',
            'window',
            'document',
            'self.', 'self[', 'top.', 'top[', 'frames',
            'parent', 'content',
            'validate', 'onExit', 'objective',
            'this['
    ];

    var warnings = [];

	var editor = CodeMirror.fromTextArea(document.getElementById('code'), {
					lineNumbers: true,
					matchBrackets: true,
					mode: 'javascript',
					theme: "vibrant-ink",
					indentUnit: 4,
					lineWrapping:true,
					dragDrop: false,
					smartIndent: false,
				});   
				editor.setSize(700, 609); 

		self.preprocess = function(code){
			 var lines = code.split("\n");
			 var resultCode = "";
			 editStrings.length = 0;
			 warnings.length = 0;

			 for(var i = 0; i < lines.length; i++){ 

					if(lines[i].indexOf(Tags.writeTag) > -1){
						lines[i] = lines[i].replace("<editable>","");
						   editStrings.push(i);
					}

					resultCode += lines[i] + "\n";
			 }

			return resultCode;
		};

		var isReadOnly = function(num){
			if(editStrings.indexOf(num) === -1) return true;
			return false;
		};

		var shiftElements = function(arr,bound,n){
	       return arr.map(function(num) {
		        if (num > bound) {return num + n;} return num;
	        });
   		};

   		var getEndWritableBlock = function(begin){
   			var a = begin;
			while(editStrings.indexOf(a) !== -1)
				a++;
			return a;
   		}

   		var removeElement = function(arr, elem) {
   			for(var i = arr.length; i--;) {
		        if(arr[i] === elem) {
		            arr.splice(i, 1);
		        }
		    }
   		}

		var process = function(me, change){

			var newLines = change.text.length - (change.to.line - change.from.line + 1);
			var currentLine = change.to.line;

				if(isReadOnly(currentLine))
		        {
		        	change.cancel();
		        	return;
		        }

					//cut off 80 chars
		        var textlen = me.getLine(currentLine).length;
		        if (textlen + change.text[0].length > LIMIT) {
		             var allowedLength = Math.max(LIMIT - textlen, 0);
		                change.text[0] = change.text[0].substr(0, allowedLength);
		        }

				if(newLines > 0){
					//onNewLines
						var bound = getEndWritableBlock(currentLine);
						editStrings = shiftElements(editStrings, bound, newLines);
						for (var i = bound; i < bound + newLines; i++) {
		            			editStrings.push(i);
		        		}

		        		editStrings.sort();
				}
				else if(change.to.line < change.from.line || change.to.line - change.from.line + 1 > change.text.length){
					//onDeleteLines
						var count = change.to.line - change.from.line - change.text.length + 1;
						var bound = getEndWritableBlock(currentLine);

						var begin = bound - 1;
						var end   = bound - (count + 1);

						if(isReadOnly(begin-1))
						{
							change.cancel();
		        			return;
						}

						for (var i = begin; i > end; i--) {
	            			removeElement(editStrings,i);
	       				}

	       				editStrings = shiftElements(editStrings, bound, -count);
						editStrings.sort();
				}
		};

		self.loadLevelCode = function(code){	
			editor.off('beforeChange', process);
				var ccode = self.preprocess(code);
				editor.setValue(ccode);
				var lineArray = ccode.split("\n");
				for(var i = 0; i < lineArray.length; i++){
					if(isReadOnly(i)){
						editor.addLineClass(i, "wrap", "readOnly"); 
					}
				};
			editor.on('beforeChange', process);
		};

		self.loadState = function(code,css){	
			editor.off('beforeChange', process);
				var ccode = self.preprocess(code);

				css = css.split(',');
				for(var i = 0; i < css.length; i++)
					editStrings.push(parseInt(css[i]));

				editor.setValue(ccode);
				var lineArray = ccode.split("\n");
				for(var i = 0; i < lineArray.length; i++){
					if(isReadOnly(i)){
						editor.addLineClass(i, "wrap", "readOnly"); 
					}
				};
			editor.on('beforeChange', process);
		};

		self.setValue = function(value){
			editor.setValue(value);
			editor.refresh();
		};

		self.getStrings = function(){
			return editStrings;
		};

		self.getCode = function(){
			warnings.length = 0;
 			var lines = editor.getValue().split("\n");
 			var count1 = 0;
			var count2 = 0;
			for(var i = 0; i < lines.length; i++){
				for(var j = 0; j < dangerWords.length; j++){
	            	if(lines[i].indexOf(dangerWords[j]) > -1){
	            		if(dangerWords[j] === 'onExit'){
	            			count1++;
	            			if(count1 >= 2)
	            			warnings.push({num:i,word:dangerWords[j]});
	            		}
	            		else if(dangerWords[j] === 'validate'){
	            			count2++;
	            			if(count2 >= 2)
	            			warnings.push({num:i,word:dangerWords[j]});
	            		}
	            		else
	             			warnings.push({num:i,word:dangerWords[j]});
	            	}
             	}        	
          	}

          	var s = editor.getValue();
          	s = s.replace(/\)\s*{/g, ") {"); // converts Allman indentation -> K&R
       		s = s.replace(/\n\s*while\s*\((.*)\)/g, "\nfor (dummy=0;$1;)"); // while -> for
        	s = s.replace(/for\s*\((.*);(.*);(.*)\)\s*{/g,
	                "for ($1, startTime = Date.now();$2;$3){" +
	                    "if (Date.now() - startTime > " + 2000 + ") {" +
	                        "throw '[infinite loop]: " + Language.infiniteLoop + " 2000ms.';" +
	                    "}");
			return s;
		};

		self.getPlayerCode = function(){
			return editor.getValue();
        };

		self.getWarnings = function(){return warnings};

		self.refresh = function(){
			return editor.refresh();
		};
		self.focus = function(){
			editor.focus();
		};
		editor.on("focus", function(instance) {
			game.currentfocus = "editor";
			var editorPane = document.getElementById('codePane');
			editorPane.style.border = '5px solid #ffaaaa';
        });
		editor.on("blur", function(instance) {
			var editorPane = document.getElementById('codePane');
			editorPane.style.border = '5px solid #ccc';
        });
}