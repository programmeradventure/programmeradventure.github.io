var LevelEditor = function () {
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
            'document','gsm.',
            'self.', 'self[', 'top.', 'top[', 'frames',
            'parent', 'content',
            'validate', 'onExit', 'objective',
            'this['
    ];

    var warnings = [];

	var editor = CodeMirror.fromTextArea(document.getElementById('levelEditor'), {
					lineNumbers: true,
					matchBrackets: true,
					mode: 'javascript',
					theme: "vibrant-ink",
					indentUnit: 4,
					lineWrapping:true,
					dragDrop: false,
					smartIndent: false,
				});   
				editor.setSize(700, 600); 

		self.preprocess = function(code){
			 var lines = code.split("\n");
			 var resultCode = "";

			 for(var i = 0; i < lines.length; i++){ 

					/*if(lines[i].indexOf(Tags.writeTag) > -1){
						lines[i] = lines[i].replace("<editable>","");
						if(lines[i].trim().length === 0){
						   editStrings.push(i);
						}
					}*/

					editStrings.push(i);
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
				/*var lineArray = ccode.split("\n");
				for(var i = 0; i < lineArray.length; i++){
					if(isReadOnly(i)){
						editor.addLineClass(i, "wrap", "readOnly"); 
					}
				};*/
			//editor.on('beforeChange', process);
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

			return editor.getValue();
		};

		self.getWarnings = function(){return warnings};

		self.refresh = function(){
			editor.refresh();
		};

		self.focus = function(){
			editor.focus();
			editor.setValue("");
			editor.refresh();
		}

		editor.on("focus", function(instance) {
			var editorPane = document.getElementById('codePane');
			editorPane.style.border = '5px solid #ffaaaa';
        });

		editor.on("blur", function(instance) {
			var editorPane = document.getElementById('codePane');
			editorPane.style.border = '5px solid #ccc';
        });
}