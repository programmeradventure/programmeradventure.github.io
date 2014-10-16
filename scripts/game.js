//Programmer Adventure - roguelike style javascript game for js-frogrammers
//Version   : 0.88b;
//Programmer: Igor "Shaks" Botov
//DataBegin : 1.09.2014
//DataEnd   : 1.11.2014

var Game = function()
{
	var _game    = this;
	var window_innerHeight = window.innerHeight ? window.innerHeight : document.body.clientHeight
	var window_innerWidth  = window.innerWidth  ? window.innerWidth  : document.body.clientWidth
	var audioPath = "";
	var audioType = "";
	var ext 	  = "";
	var theEnd    = false;

	//document scroll-off
	document.body.onkeydown = function(e){
		e = e || window.event;
		var c = e.keyCode;
		if(c > 36 && c < 41 || c > 32 && c < 37) return false;
	}
	//return mouse position in canvas
	var getMousePos = function(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
    };
    //set music type ogg or mp3
	var checkAudioCompat = function() {
		var myAudio = document.getElementById('ambientPlayer');
		if (myAudio.canPlayType) {
			var playMsg = myAudio.canPlayType('audio/ogg; codecs="vorbis"'); 
			if ( "" != playMsg){
				audioPath = "music/ogg/";   
				audioType = "audio/ogg";
				ext       = ".ogg";
				return;               
			}
			playMsg = myAudio.canPlayType('audio/mpeg');
			if ( "" != playMsg) {
				audioPath = "music/mp3/";
				audioType = "audio/mpeg";
				ext       = ".mp3";
				return;
			}
		}
	}();

	_game.currentfocus = 'screen';
	_game.started = true;
//##################DOM elements######################################
	var canvas            = document.getElementById('lay1');
	var editor            = document.getElementById('editorPane');
	var codePane          = document.getElementById('codePane');
	var screenPane        = document.getElementById('screenPane');
	var soundIcon         = document.getElementById('soundIcon'); 
	var note              = document.getElementById('note'); 
	var notepadHTML       = document.getElementById('notepad'); 
	var apibookHTML       = document.getElementById('api_book'); 
	var menuHTML          = document.getElementById('menu'); 
	var menuTitleHTML     = document.getElementById('menu_title'); 
	var levelFooterHTML   = document.getElementById('levelFooter');
	var apibookTitleHTML  = document.getElementById('api_book_title'); 
	var notepadTitleHTML  = document.getElementById('notepad_title'); 
	var levelTitleHTML    = document.getElementById('levelTitle');
	var musicTitleHTML    = document.getElementById('soundName');
	var turnsCounterHTML  = document.getElementById('turnsCounter');
	var turnsOnLevelHTML  = document.getElementById('turnsOnLevel');
	var levelPassword 	  = document.getElementById('levelPassword');
	var passwordField 	  = document.getElementById('password');
	var btnSetLevel 	  = document.getElementById('btnSetLevel');
	var btnClearSaves     = document.getElementById('btnClearSaves');
	var soundPlayerHTML   = document.getElementById('soundPlayer');
	var ambientPlayerHTML = document.getElementById('ambientPlayer');
	var prevLevelsolutionURL = document.getElementById('prevLevelsolutionURL');
//####################################################################
	var codeEditor  = new CodeEditor();
	var levelEditor = new LevelEditor();
	var notepad     = CodeMirror.fromTextArea(note, {
							lineNumbers: true,
							matchBrackets: true,
							mode: 'javascript',
							theme: "elegant",
							indentUnit: 4,
							lineWrapping:true,
							dragDrop: false,
							smartIndent: false,
					  });   
					  notepad.setSize(497, 540); 
	var val          = 0;
	var currentLevel = 1;
	var maxLevel     = 30;
	var bonusCount   = 0;
	var bonuses      = [0,1,1,4,2,1,2,2
						 ,2,4,4,3,3,3,5
						 ,1,2,2,2,2,2,4
						 ,5,3,3,5,2,3,5,3,5];

	var levels       = [];
	var passwords    = [];
	var music        = [];
	var events       = [];
	var messages     = [];
	var gameValid    = true;
	var phonefunc    = null;
	var muted        = false;
	var global_error = false;
	var background   = null;
	var levelBegin   = false;
	var GameOver     = false;
	var projectileUpdater = null;
	var noiseTimer   = -1;
	var killMessage  = "";
	var currentMessage = "";
	var firstLaunch  = true;
	var turns        = 0;
	var turnsOnLevel = 0;
	var deads 		 = 0;
	var sysFrequency = 75;
	var timersList   = 0;
	var fromPassword = false;
	var isMessageQueueWork = false;
	var clearmessageTimer = null;

	prevLevelsolutionURL.style.marginLeft = window_innerWidth/2+'px';
	levelFooterHTML.style.display = 'none';
	passwordField.value = '********';

	//bullet-system frequency
	var setSysFrequency = function(value){
		sysFrequency = value;
	};

	var clock = 
	{
		event : function (){},
		time: 100,
		isInterval : false,
		id_timerInterval: -999,
		id_timer: -1000,
		start:function(){
			if(clock.time > 100)
			{
				if(clock.isInterval)
				   clock.id_timerInterval = setInterval(clock.event, clock.time);
				else
				   clock.id_timer = setTimeout(clock.event, clock.time);
			}
			else
				throw 'Минимальное значение таймера = 100ms';
		}
	}

	var container = {
		exec : function(){}
	}

	var showEditor = function ()
	{
		  editor.style.display = 'block';
		  if(isNaN(val)){ val = 0;}
		  editor.style.opacity='0.' + val;
		  editor.style.filter='alpha(opacity=' + val + '0)';
		  if(val < 9){
			val++;
			setTimeout(showEditor ,90);
		  }
		  else{
			 codeEditor.refresh();
			 levelEditor.refresh();
			 return;
		  }
	};

	var hideEditor = function (){
		editor.style.display = 'none';
	};

	canvas.onfocus = function() {	 
	  screenPane.style.border = '2px solid #ffaaaa';
	  _game.currentfocus = 'screen';
	};

	canvas.onblur = function() {
	  screenPane.style.border = '2px solid gray';
	};

	var drawCursorPos = function(evt) {
      var mousePos = getMousePos(canvas, evt);
      var message = 'pos: [ ' + parseInt(mousePos.x / 20) + ' : ' + parseInt((mousePos.y - 20) / 20) + ' ]';
      var x = 5;
	  var y = canvas.height - 150;
	  	if(!theEnd)
	  	{
	      context.clearRect(x, y, 110, 25);
	      context.font = '14pt Console';
	      context.fillStyle = '#ff0';
	      context.fillText(message, x, y + 20);
  		}
    };

	canvas.onfocus();

	var context  = canvas.getContext('2d');
	var mainFont = '14pt Consolas';
	var state = 'menu';
	var keys = [37,38,39,40,65,68,83,87];

	_game.play = function(){
		if(state === 'menu') menuState.play();
		if(state === 'play') playState.play();
	};

	var createGist = function (level) {
		var result = "";
        var filename = 'Programmer_adventure_level-' + level + '-solution.js';
        var description = 'Solution to level ' + level + ' in Programmer adventure: http://programmerquest.github.io/';
        var data = {
            'files': {},
            'description': description,
            'public': true
        };
        data['files'][filename] = {
            'content': codeEditor.getPlayerCode().replace(/\t/g, '    ')
        };

        var XHR = function createRequestObject() 
		{
		   if (typeof XMLHttpRequest === 'undefined') { XMLHttpRequest = function() {
		      try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
		      catch(e) {}
		      try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
		      catch(e) {}
		      try { return new ActiveXObject("Msxml2.XMLHTTP"); }
		      catch(e) {}
		      try { return new ActiveXObject("Microsoft.XMLHTTP"); }
		      catch(e) {}
		      throw new Error("This browser does not support XMLHttpRequest.");
		    };
		 }
		 	return new XMLHttpRequest();
		}();

		if(XHR)
		{
			try
			{
				var datalen = JSON.stringify(data).length;
				XHR.open("POST", "https://api.github.com/gists", true);
				XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
				XHR.onreadystatechange = function() 
				{
					if(XHR.readyState === 4)
					{
						if (XHR.status === 200 || XHR.status === 201) 
						{
							var s = JSON.parse(XHR.response);
							prevLevelsolutionURL.innerHTML = 'Level-' +  level + ' solution saved at: <a href = '+s.html_url+'> '+s.html_url+' </a>';
						}
					}
				};				
				XHR.send(JSON.stringify(data));
			}
			catch(e)
			{
				alert("createGist()");
			}
		}
    }

//#############################-menuScreen-############################################
	var menuScreen = function () {
		var _menuScreen  = this;
		var anyKeyPos 	 = {x:canvas.width / 2 - 120, y:610};
		var pos 		 = canvas.height / 2  + 150;
		var stop 		 = false;
		var show 		 = false;
		var x =  5 ,y    = canvas.height/2;
		var x1 = -50 ,y1 = canvas.height/2;
		var x2 = -70 ,y2 = canvas.height/2;
		var timer 		 = null;
		var maintimer    = null;

		musicTitleHTML.innerHTML = Language.originalIdea;
		soundIcon.style.display = "none";

		var update = function(){
			if(!stop){
				if(anyKeyPos.y > pos)
				   anyKeyPos.y -= 2;
				else{
				   stop = true;
				   timer = setInterval(function(){show = !show;}, 1000);
				}
			}
		};

		var draw = function(){
			xcanvas.clearCanvas('black');
			xcanvas.drawText('36px Lucida Console','#afa', Language.menu_s2, canvas.width/2 - 230, 80);
			xcanvas.drawText('24px Lucida Console','#aff', Language.menu_s3, canvas.width   - 230, 160);
			xcanvas.drawText('12px Lucida Console','#aff', Language.menu_ver, canvas.width  - 75, canvas.height - 25);
			if(!stop)
				xcanvas.drawText('18px Lucida Console', 'white', Language.menu_s1 , anyKeyPos.x, anyKeyPos.y);
			else{
			   if(show)
				  xcanvas.drawText('18px Lucida Console', 'green', Language.menu_s1 , anyKeyPos.x, anyKeyPos.y);
			}
		};

		var animation = function(speed){
			for(var i = 0; i < 40; i++){
				xcanvas.drawText('12px Console', '#aff', '#', i * 20, y - 40);
				xcanvas.drawText('12px Console', '#aff', '#', i * 20, y + 40);
			}

			xcanvas.drawText('12px Console', '#aff', '#', 25 * 20, y - 20);
			xcanvas.drawText('12px Console', '#aff', '#', 25 * 20, y + 20);

			if(x < 560)
				xcanvas.drawText('12px Console', '#0f0', '@', x, y);
			else
				xcanvas.drawText('12px Console', '#f00', '!', 24 * 20, y);

			xcanvas.drawText('12px Console', '#f00', '@', x1, y);
			xcanvas.drawText('12px Console', '#ff0', 'G', x2, y);
			xcanvas.drawText('12px Console', '#ff0', 'G', x2, y - 20);
			xcanvas.drawText('12px Console', '#ff0', 'G', x2, y + 20);
			xcanvas.drawText('16px Console', '#ccf', String.fromCharCode(0x25A1), 28 * 20, y);
			x+=speed;

			if(x < 520){
				x1+=speed;
				x2+=speed;
			}
			else
				xcanvas.drawText('12px Console', '#f0f', '#', 25 * 20, y);
		};

		var loadLevel = function(){
			var pwd = password.value; 
			for(var i = 0; i < passwords.length; i++){
				if(passwords[i] === pwd){
					currentLevel = i;
					break;
				}
			}
			fromPassword = true;
			changeState();
		};

		var changeState = function()
		{
			xcanvas.clearCanvas('#000');
			window.clearInterval(timer);
			window.clearInterval(maintimer);
			canvas.removeEventListener('keydown', changeState , false);
			state = "play";
			//_game.play();
			creditsScreen.play();
		};

		_menuScreen.play   = function(){
			update();
			draw();
			animation(4);
		};

		btnSetLevel.onclick = loadLevel;
		maintimer = setInterval(_menuScreen.play, 50);
		canvas.addEventListener('keydown', changeState, false);
	};
//#############################-ENDmenuScreen-############################################

//#############################-CreditsScreen-############################################
	var CreditsScreen = function () {
		var _creditsScreen  = this;
		var anyKeyPos 	 = {x:canvas.width / 2 - 120, y:610};
		var pos 		 = canvas.height / 2  + 150;

		var _getBonusCount = function(){
			var sum = 0;
			for(var i = 1; i < maxLevel + 1 ; i++){
				var b = localStorage.getItem("quest_level" + i + "_bonusCount");
				if(b !== null){
					b = parseInt(b);
					sum += b;
				}
			};
			return sum;
		};

		var _getTurnsCount = function(){
			var sum = 0;
			for(var i = 1; i < maxLevel + 1 ; i++){
				var b = localStorage.getItem("quest_level" + i + "_turns");
				if(b !== null){
					b = parseInt(b);
					sum += b;
				}
			};
			return sum;
		};

		var _getDeadsCount = function(){
			var sum = 0;
			for(var i = 1; i < maxLevel + 1 ; i++){
				var b = localStorage.getItem("quest_level" + i + "_deads");
				if(b !== null){
					b = parseInt(b);
					sum += b;
				}
			};
			return sum;
		};

		var _deads = _getDeadsCount();
		var _turns = _getTurnsCount();
		var _bonus = _getBonusCount();

		var GetRank = function(){
			var deads_rank = 0;
			var bonus_rank = 0;
			var turns_rank = 0;

			if(_deads < 10)
			   deads_rank = 1;
			else if(_deads > 10 && _deads <= 20)
			   deads_rank = 2;
			else if(_deads > 20 && _deads <= 50)
			   deads_rank = 3;
			else if(_deads > 50)
			   deads_rank = 4;
		
			if(_bonus <= 50)
			   bonus_rank = 4;
			else if(_bonus > 50 && _bonus <= 60)
			   bonus_rank = 3;
			else if(_bonus > 60 && _bonus <= 75)
			   bonus_rank = 2;
			else if(_bonus > 75)
			   bonus_rank = 1;

			if(_turns < 3500)
			   turns_rank = 1;
			else if(_turns > 3500 && _turns <= 3700)
			   turns_rank = 2;
			else if(_turns > 3700 && _turns <= 3900)
			   turns_rank = 3;
			else if(_turns > 3900)
			   turns_rank = 4;

			var rank = parseInt((deads_rank + bonus_rank + turns_rank) / 3);

			switch(rank){
				case 1: rank = "A" 
				break;
				case 2: rank = "B" 
				break;
				case 3: rank = "C"
				break;
				case 4: rank = "D"
				break;
			}
			 return rank;
		};

		var _rank = GetRank();

		var draw = function(){
			xcanvas.clearCanvas('#000');
			xcanvas.drawText('36px Lucida Console','#afa', "CONGRATULATIONS!", canvas.width/2 - 150, 80);
			xcanvas.drawText('36px Lucida Console','#aff', "Rank:", canvas.width/2 - 230, 160);
			xcanvas.drawText('36px Lucida Console','#0f0',  _rank, canvas.width - 200, 160);

			xcanvas.drawText('36px Lucida Console','#aff', "Levels:", canvas.width/2 - 230, 200);
			xcanvas.drawText('36px Lucida Console','#0ff',  maxLevel, canvas.width - 200, 200);

			xcanvas.drawText('36px Lucida Console','#aff', "Stars:", canvas.width/2 - 230, 240);
			xcanvas.drawText('36px Lucida Console','#0ff',  _bonus, canvas.width - 200, 240);

			xcanvas.drawText('36px Lucida Console','#aff', "Deads:" , canvas.width/2 - 230, 280);
			xcanvas.drawText('36px Lucida Console','#faa',  _deads, canvas.width - 200, 280);

			xcanvas.drawText('36px Lucida Console','#aff', "Total turns:" , canvas.width/2 - 230, 320);
			xcanvas.drawText('36px Lucida Console','#faa',  _turns, canvas.width - 200, 320);

			xcanvas.drawText('14px Lucida Console','#aff', "Press any key..." , canvas.width/2 - 70, canvas.height - 50);

			xcanvas.drawText('36px Lucida Console','#afa', "Thank you for playing" , canvas.width/2 - 230, canvas.height - 150);
		};

		var timer = null;

		var showRank = function(){
			draw();
			//maintimer = setTimeout(showEnd, 5000);	
			canvas.addEventListener('keydown', showEnd, false);
			clearInterval(timer);	
		};

		_creditsScreen.play   = function(){
			theEnd = true;
			musicTitleHTML.style.display   = 'none';
		 	levelFooterHTML.style.display  = 'none';
		 	levelTitleHTML.style.display   = 'none';
		 	turnsOnLevelHTML.style.display = 'none';
		 	levelPassword.style.display    = 'none';
		 	hideEditor();
			timer = setInterval(map.fillMapHexCode, 33);
			setTimeout(showRank, 3500);
		};

		var showEnd = function(){
			xcanvas.clearCanvas('#000');
			var map = new Map();
			map.defineObject({name:'tree',symbol:'&',color: '#0f0'});
			map.defineObject({name:'master',symbol:'@',color: '#f00'});
			map.defineObject({name:'grass',symbol:String.fromCharCode(0x0027),color: '#0f0',type:'ground'});
			map.defineObject({name:'water',symbol:'~',color: '#0ff',type:'ground',
				onPlayerCollision:function(player,me){
					if(!player.hasItem('vessel')){
					    dir = '';
					    player.setSymbol('~');
					    xcanvas.drawText('44px Lucida Console','#fff', "THE END" , canvas.width/2 - 80, 280);
					    xcanvas.drawText('24px Lucida Console','#f00', "bad end" , canvas.width/2 - 40, 300);
					}
				}
			});
			map.defineObject({name:'wall',symbol:'#',color: '#ccc'});
			map.defineObject({name:'vessel',
				symbol:String.fromCharCode(0x23C5),
				color: '#603606',
				type:'item',
				onTake:function(){			
					player.setSymbol(String.fromCharCode(0x23C5));
					dir = "right";
					return true;
				}
			});

			map.defineObject({name: 'wood',color:'#ff0',symbol:'-',type:'ground'});
			var arr = [
				 '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
				,'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
				,'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
				,'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
				,'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
				,'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
				,'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
				,'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
				,'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
				,'~-------~~~~~~~~~~~~~~~~~~~~~~'
				,'~-------~~~~~~~~~~~~~~~~~~~~~~'
				,'~-------~~~~~~~~~~~~~~~~~~~~~~'
				,'~-------~~~~~~~~~~~~~~~~~~~~~~'
				,'~-------~~~~~~~~~~~~~~~~~~~~~~'
				,'~-------~~~~~~~~~~~~~~~~~~~~~~'
				,'**&***&**********&************'
				,'**&***&*###################***'
				,'**&***&*#*****************#*&*'
				,'**&***&*#**#############**#***'
				,'**&***&*#**####*****####**#*&*'
				,'**&***&*#**####*****####**#***'
				,'**&***&*#**######*######**#*&*'
				,'**&***&*#*****************#***'
				,'**&***&*#*****************#*&*'
				,'**&***&*#########*#########***'
				,'**&*@*&****&&&*******&&&******'
				,'******************************'
			];

			var legend = { '#':'block'
				,'@':'player'
				,'*':'grass'
				,'~':'water'
				,'&':'tree'
				,'#':'wall'
				,'v':'vessel'
				,'-':'wood'
			};
			
			map.createFromGrid(arr,legend);
			(_rank === 'A') ? map.placeObject('vessel',4,8) : map.placeObject('water',4,8)
			var player = map.getPlayer();
			var dir = 'up';
			var m = function(){
				player.move(dir); 
				if(player.getX() === 28)
				{
				   player.setSymbol('~');
				   xcanvas.drawText('44px Lucida Console','#fff', "THE END?" , canvas.width/2 - 80, 280);
				   xcanvas.drawText('24px Lucida Console','#0f0', "good end" , canvas.width/2 - 40, 300);
				   map.placeObject('master',15,19);
				}
			};
			setInterval(m,200);
		};
	};
//########################################################################################

//#############################-playScreen-############################################
	var playScreen = function(){
		var _playScreen = this;
		var initialized = false;

		_playScreen.play = function(){
			if(!initialized){
				initialized = true;
				_game.execute();
			}
		};
	}
//#############################-ENDplayScreen-############################################
//#############################-Xcanvas-############################################
	var Xcanvas = function(){
		var _xcanvas = this;
		var part = null;

	   _xcanvas.drawSymbol = function(x,y,o){
		  context.font       = mainFont;
		  context.fillStyle  = o.color;
		  if(o.name === 'virus' || o.name === 'trojan')
		  	 context.fillText(o.symbol, x, y-5);
		  else if (o.symbol === String.fromCharCode(0x23C5))
		  {
		  	 context.font = '12pt Consolas';
		  	 context.fillText(o.symbol, x, y-5);
		  }
		  else	
		     context.fillText(o.symbol, x+3, y-5);
	   };

	   _xcanvas.drawSimpleSymbol = function(x,y,symbol,color){
		  context.font       = '12pt Serif';
		  context.fillStyle  = color;
		  context.fillText(symbol, x+3, y-5);
	   };

	   _xcanvas.drawText = function(font, color, text, x, y){
		  context.font      = font;
		  context.fillStyle = color;
		  context.fillText(text, x, y);
	   };

	   _xcanvas.drawOneLineString = function(color,text,time){
		  var x = 5;
		  var y = canvas.height - 60;
		  part = context.getImageData(0, canvas.height - 111, canvas.width, 80); 
		  xcanvas.clearRect(0, canvas.height - 111, canvas.width, 80,"#0707ff");
		  xcanvas.drawText('12pt Consolas' ,color , text, x, y);
		  currentMessage = text;
		  clearmessageTimer = setTimeout(xcanvas.clearMessage, time);
	   };

	   _xcanvas.messageWorker = function(){
		  var message = messages.pop();
		  xcanvas.drawOneLineString(message.clr, message.msg, message.time);
	   };

	   _xcanvas.clearMessage = function(){
		  //xcanvas.clearRect(0, canvas.height - 111, canvas.width, 80,"#000");
		  context.putImageData(part,0, canvas.height - 111);
		  currentMessage = ""; 
		  if(messages.length > 0)
		  	_xcanvas.messageWorker();
		  else
		  	 isMessageQueueWork = false;
	   };

	   _xcanvas.clearCanvas = function(color,data){
		  context.fillStyle = color;

		  if(data !== undefined && data !== null)
			 context.putImageData(data,0,0);
		  else{
			 context.clearRect(0, 0, canvas.width, canvas.height);
			 context.fillRect(0, 0, canvas.width, canvas.height);
		  }
	   };

	   _xcanvas.clearRect = function(x,y,w,h,color){
		  context.fillStyle = color;
		  context.fillRect(x, y, w, h);
	   };

	   _xcanvas.drawStrokedRect = function(x,y,w,h,color,scolor,swidth){
		  context.beginPath();
		  context.rect(x,y,w,h);
		  context.fillStyle   = color;
		  context.fill();
		  context.lineWidth   = swidth;
		  context.strokeStyle = scolor;
		  context.stroke();
	   };

	   _xcanvas.drawLine = function(x1,y1,x2,y2,width,color){    
		  context.beginPath();
		  context.moveTo(x1,y1);
		  context.lineTo(x2,y2);
		  context.lineWidth = width;
		  context.strokeStyle = color;
		  context.stroke();
	   };

	   _xcanvas.drawCapLine = function(x1,y1,x2,y2,width,color){
		  context.beginPath();
		  context.moveTo(x1,y1);
		  context.lineTo(x2,y2);
		  context.lineWidth   = width;
		  context.strokeStyle = color;
		  context.lineCap     = 'round';
		  context.stroke();
	   };
	}
//#############################-ENDXcanvas-########################################
//#############################-MAP-###############################################
	var Map = function(w, h)
	{
		var _map      = this;
		var tileSize  = 20;
		var grid      = null;
		var grid_W    = w;
		var grid_H    = h;
		var maxWidth  = parseInt(canvas.width / tileSize);
		var maxHeight = parseInt(canvas.height / tileSize);
		var objects        = [];
		var dynamicObjects = [];
		var teleports 	   = [];
		var loots          = [];
		var buttons        = [];
		var movedObjects   = [];
		var projectiles    = [];
		var player 		   = null;
		var types          = ['static','dynamic','moved','item','impassable','button','ground','projectile','teleport'];
		var offsetX    	   = 0;
		var offsetY        = 50;
		var pixMap         = null;
		var scroll_x       = 0;
		var scroll_y       = 0;
		var timers         = 0;

		if(parseInt(currentLevel) === 9)
			setSysFrequency(1000);
		else
			setSysFrequency(75);

		if(projectiles.length > 0)
			projectileUpdater = setInterval(updateProjectiles, sysFrequency);
	//#############################-PREDEFINEDOBJECTS-###############################################
		objects["empty"] ={
							name:'empty',
							symbol:'',
							color: '#000',
							type:'ground', 
							onCollision:function(object) {
								if(object.name === 'terraformer')
									return; 
								_map.showMessage(object.name + Language.fall,'#fff');	                        
								object.kill(Language.fall);
							} 
						  };

		objects["block"] ={
							name:'block',
							symbol:'#',
							color: '#fff',
							type:'static'   
						  };

		objects["ground"]={
							name:'ground',
							symbol:'.',
							color: '#fff',
							type:'ground'   
						  };

		objects["button"]={
							name:'button',
							symbol:'*',
							color: '#f0f',
							type:'button',
							onPress:function(object,me){
								if(inMapArea(me.target_x, me.target_y) && isStatic(me.target_x, me.target_y))
								   setItem(me.target_x, me.target_y,'ground');
							},  
							onRelease:function(me){
								if(getItem(me.target_x, me.target_y) === 'ground')
								   setItem(me.target_x, me.target_y, me.target);
								setItem(me.posX,me.posY,me.name);
							} 
						  };

		objects["player"]={
							name:'player',
							symbol:'@',
							color: '#0f0', 
							type:'dynamic' 
						  };

		objects["teleport"]= {
								name:'teleport',
								symbol:String.fromCharCode(0x2299),
								color: '#fcf', 
								type:'ground'
							 };

		objects["mine"] = {
							name:'mine',
							symbol:String.fromCharCode(0x2297),
							color: '#f00',    
							type:'item',
							type:'ground',
							onCollision:function(object){
								object.kill(Language.explosion);
							}   
						  };

		objects["bonus"] ={
							name:'bonus',
							symbol:String.fromCharCode(0x272E),
							color: '#aff',
							type:'item',
							font:'16pt Arial',
							onTake:function(){
								_map.showMessage(Language.takeBonus,'#aaffaa');
								_map.simplePlayer.play('sounds/beep.mp3'); 
								return false;
							}       
						  }; 

		objects["door"] ={
							 name:'door',
							 symbol:'+',
							 color: '#cccccc',
							 type:'impassable',      
							 onPass: function(object){
								if(object.hasItem('key')){
								   object.dropItem('key');
								   return true;
								}
								_map.showMessage(Language.noKey, '#0ff');
								return false;
							 },
						 };

		objects["key"] ={
							 name:'key',
							 symbol:'k',
							 color: '#0ff',
							 type:'item',      
							 onTake:function(){
								return true;
							 }   
						};

		objects["phone"] ={
							 name:'phone',
							 symbol:String.fromCharCode(0x260E),
							 color: '#fff',
							 type:'item',      
							 onTake:function(){
								return true;
							 }   
						  }; 

		objects["notepad"] ={
							 name:'notepad',
							 symbol:String.fromCharCode(0x25A6),
							 color: '#fff',
							 type:'item',      
							 onTake:function(){
								return true;
							 }   
							 }; 
						 

		objects["clock"] ={
							 name:'clock',
							 symbol:String.fromCharCode(0x231A),
							 color: '#fff',
							 type:'item',      
							 onTake:function(){
								return true;
							 }   
						 }; 

		objects["virus"] ={
							 name:'virus',
							 symbol:String.fromCharCode(0x2620),
							 color: '#0f0',
							 type:'item',      
							 onTake:function(){
								return true;
							 }   
						 };

		 objects["trojan"] ={
							 name:'trojan',
							 symbol:String.fromCharCode(0x2620),
							 color: '#f00',
							 type:'item',      
							 onTake:function(){
								return true;
							 }   
						 }; 	 				
		 

		 objects["movedBlock"] ={
							 name:'movedBlock',
							 symbol:'#',
							 color: '#0ff',
							 type:'moved',      
							 onPush:function(object,me,id){
									me.move(object.getDirection());
									movedObjects[id].posX = me.getX();
									movedObjects[id].posY = me.getY();
								}   
							};

		objects["loot"] ={
							name:'loot',
							symbol:'%',
							color: '#afa',
							type:'item',
							font:'16pt Arial',
							onTake:function(){
								return true;
							}       
						 }; 

		objects["flashlight"] ={
							name:'flashlight',
							symbol:'F',
							color: '#ff0',
							type:'item',
							font:'16pt Arial',
							onTake:function(){
								return true;
							}       
						 }; 

		objects["boat"] ={
							 name:'boat',
							 symbol:String.fromCharCode(0x23C5),
							 color: '#603606',
							 type:'item',      
							 onTake:function(){
								return true;
							 }   
						 }; 	 	


		objects["computer"] ={
							   name:'computer',
							   symbol:String.fromCharCode(0x2318),
							   color: '#aaffaa',
							   type:'item',
							   onTake:function(){
								  return true;
							   }       
							 }; 

		objects["exit"] = {
							 name:'exit',
							 symbol:String.fromCharCode(0x25A1),
							 color: '#ccf',
							 type:'static',  
						  }; 

		 objects["null"] = {
							 symbol:'',
							 color: '#000',
							 type:'ground', 
							 onCollision:function(object) {                 
								object.kill();
							 } 
						  }; 
	//#############################-ENDPREDEFINEDOBJECTS-###############################################

		if(w === undefined || h === undefined){
			grid_W = maxWidth;
			grid_H = maxHeight;
		}

		var createArray = function(w,h,init){
			var arr = [];
			for (var i = 0; i < w;  i++) {arr[i] = []; 
				for (var j = 0; j < h; j++) {arr[i][j] = init;}} 
			return arr;
		};

		grid = createArray(grid_W, grid_H, 'null');

		var getScreenCoords = function(local_x,local_y){
			var screenX = offsetX + local_x * tileSize;
			var screenY = offsetY + local_y * tileSize;
			return {x:screenX, y:screenY};
		};

		var redrawSymbol = function(x,y){
			var coords = getScreenCoords(x,y);
			xcanvas.clearRect(coords.x,coords.y - 20,tileSize,tileSize,'#000');
			xcanvas.drawSymbol(coords.x,coords.y,objects[grid[x][y]]);
		};

		var cloneObject = function(o){
		   var key, obj = {};
			for(key in o) 
			  obj[key] = o[key];
				return obj;
		};

		var cloneObjectTOObject = function(o,clone){
		   var key = {};
			for(key in o) 
			  clone[key] = o[key];
				return clone;
		};

		var getItem = function(x,y){
			return grid[x][y];
		};

		var setItem = function(x,y,item){
		   grid[x][y] = item;
		   redrawSymbol(x,y);
		};

		var placeStatic = function(name,x,y){
			setItem(x,y,name);
		};

		var placeDynamic = function(name,x,y){
			var object  = new dynamicObject(name,x,y);
			dynamicObjects.push(object);
			setItem(x,y,name);
		};

		var placeMoved = function(name,x,y){
			if(!('onPush' in objects[name])){
				objects[name].onPush = function(object,me,id){
					me.move(object.getDirection());
					movedObjects[id].posX = me.getX();
					movedObjects[id].posY = me.getY();
				};
			}

			var object   = cloneObject(objects[name]);		
			object.body  = new movedObject(name,x,y);
			object.move = function(direction){object.body.move(direction)};
			object.kill = function(){object.body.kill()};
			object.getX = function(){return object.body.getX()};
			object.getY = function(){return object.body.getY()};
			object.isDead = function(){return object.body.isDead()};
			movedObjects.push({posX:x,posY:y,obj:object});
			setItem(x,y,name);
		};

		var placeProjectile = function(name,x,y){
			var object  = new projectile(name,x,y);
			projectiles.push(object);
			setItem(x,y,name);
			if(projectileUpdater === null)
			   projectileUpdater = setInterval(updateProjectiles, sysFrequency);
		};

		_map.placeTeleport = function(x,y,tx,ty){
			if(currentLevel < 26){
				_map.showMessage(Language.teleportError,'#fff');
				return;
			}
			isGroundOnGround(x,y);
			var object  = cloneObject(objects['teleport']);		
			object.target_x = tx;
			object.target_y = ty;
			object.posX 	= x;
			object.posY     = y;
			object.teleportation = function(object, me){
				var name = object.name;
				if(name === 'player')
				   player.teleportation(me.target_x, me.target_y);
				else if(objects[name].type === 'dynamic' || objects[name].type ==='moved')
				   object.teleportation(me.target_x, me.target_y);
			};
			teleports.push(object);
			setItem(x,y,'teleport');
		};

		_map.placeButton = function(x,y,target_x,target_y,color){
			if(!isPlaceable(x,y))
				throw Language.error4 + x + ":" + y + Language.error4_1;

			var object      = cloneObject(objects['button']);
			object.target   = grid[target_x][target_y]; 
			if(object.target === "null") 
			   object.target = 'block';
			object.target_x = target_x;
			object.target_y = target_y;
			object.posX = x;
			object.posY = y;
			setItem(x,y,'button');
			buttons.push({posX:x,posY:y,button:object});  
		};

		_map.placeColorButton = function(name,x,y,target_x,target_y,color){
			if(!isPlaceable(x,y))
				throw Language.error4 + x + ":" + y + Language.error4_1;

			var object       = cloneObject(objects['button']);
			object.name  = name;
			object.color = color;
			object.target   = grid[target_x][target_y]; 

			if(object.target === "null") 
			   object.target = 'block';

			object.target_x = target_x;
			object.target_y = target_y;
			object.posX = x;
			object.posY = y;

			object.onPress = function(object,me){
				if(inMapArea(me.target_x, me.target_y) && isStatic(me.target_x, me.target_y)){
					if(object.color === me.color)
					   setItem(me.target_x, me.target_y,'ground');
					else
					   map.showMessage(Language.invalidColor + object.name,'#fff');
				}
			}; 

			if(_map.defineObject(object)){
				setItem(x,y,name);
				buttons.push({posX:x,posY:y,button:object}); 
			}
			else
				_map.showMessage(Language.defineObjectError + name);
		};

		var updateProjectiles = function()
		{
			try
			{
				if(!GameOver && levelBegin)
				{
					if(projectiles.length === 0){
						clearInterval(projectileUpdater);
						projectileUpdater = null;
					}

					var killedProjectiles = [];
					var validator = null;

					for(var i = events.length; --i >= 0;){
						if(events[i].event === 'validate'){
							validator = events[i];
						}
					}

					for(var i = projectiles.length; --i >= 0;){
						var p = projectiles[i];                 
						p.behavior(p);
						validator.func(map);
						if(p.isDead())
							killedProjectiles.push(p);
					}

					for(var i = killedProjectiles.length; --i >= 0;){
						setItem(killedProjectiles[i].getX(), killedProjectiles[i].getY(), killedProjectiles[i].getMem());
						var idx = projectiles.indexOf(killedProjectiles[i]);
						projectiles.splice(idx, 1);
					}
				}
				else if(GameOver){
					clearInterval(projectileUpdater);
					projectileUpdater = null;
					projectiles.length = 0;
				}
			}
			catch(e)
			{
				global_error = true;
				_map.errorHandler(e);
				clearInterval(projectileUpdater);
				projectileUpdater = null;
				properties = [];
				//throw e.toString();
			}
		};

		var inBounds = function(x,y){
			return (x > -1 && y > -1 && x < grid_W && y < grid_H);
		};

		var inMapArea = function(x,y){
			return (x > 0 && y > 0 && x < grid_W - 1 && y < grid_H - 1);
		};

		var isStatic = function(x,y){
			return (objects[grid[x][y]].type === 'static');
		};

		var isDynamic = function(x,y){
			return (objects[grid[x][y]].type === 'dynamic');
		};

		var isItem = function(x,y){
			return (objects[grid[x][y]].type === "item");
		};

		var isImpassable = function(x,y){
			return (objects[grid[x][y]].type === "impassable");
		};

		var isButton = function(x,y){
			return (objects[grid[x][y]].type === "button");
		};

		var isEmpty = function(x,y){
			return (objects[grid[x][y]].name === 'empty');
		};

		var isGroundOnGround = function(x,y){
			var obj = objects[grid[x][y]];
			if('placeGround' in obj){
				if(obj.placeGround === false){
					throw  Language.gogError + " [" + x + ":" + y + "].";
				}
			}
		};

		var isItemOnGround = function(x,y){
			var obj = objects[grid[x][y]];
			if('placeItem' in obj){
				if(obj.placeItem === false){
					throw  Language.iogError + " [" + x + ":" + y + "].";
				}
			}
		};

		var isMovedOnGround = function(x,y){
			var obj = objects[grid[x][y]];
			if('placeMoved' in obj){
				if(obj.placeMoved === false){
					throw  Language.mogError + " [" + x + ":" + y + "].";
				}
			}
		};

		var isPlaceable = function(x,y){
			var obj = objects[grid[x][y]];
			return (obj.type === 'ground' && obj.name !== 'mine');
		};

		var isCollidedEvent = function(x,y){
			return ('onCollision' in objects[grid[x][y]]);
		};

		var isPushedEvent = function(x,y){
			return ('onPush' in objects[grid[x][y]]);
		};

		var existObject = function(name){
			return (name in objects);
		};

		var isValidType = function(type){
			return (types.indexOf(type) > -1);
		};

		var refresh = function(){          
		   xcanvas.clearCanvas("#000",background);
		   _map.draw();
		   player.update();
		   levelBegin = true;
		};

		var scrollMap = function(){
		   canvas.removeEventListener('mousemove', drawCursorPos, false);
		   xcanvas.clearCanvas("#000");
		   context.putImageData(pixelMap,scroll_x,scroll_y);
		   scroll_y -= 15;	 
		   xcanvas.clearRect(0,canvas.height/2-50,canvas.width,100,"#f00");
		   xcanvas.drawText('14pt Lucida Console' ,'#000', Language.gameOver + ' (' + killMessage  + ")", 50 , canvas.height/2);
		   if(scroll_y < -canvas.height - 20){
			   window.clearInterval(scrollFuncID);
			   noiseTimer = window.setInterval(noise,50);
			   GameOver   = false;
		   }
		};

		var getPixelMap = function(){
		  return context.getImageData(0,0,canvas.width,canvas.height);
		};

		var nextLevel = function(){
			_game.saveGoodState();
			_game.saveBonusCount();
			_game.saveTurnsCount();
			_game.saveDeadsCount();
			 createGist(currentLevel);

			 if(parseInt(currentLevel) + 1 > parseInt(maxLevel))
			 	creditsScreen.play();
			 else
			 {
			 	 currentLevel++;
			 	 codeEditor.loadLevelCode(levels[currentLevel]);
				_game.saveLevel();
				_game.execute();
			}
		};

		var getRandomInt = function (min, max){
		  return Math.floor(Math.random() * (max - min + 1)) + min;
		};

		var pixels = context.getImageData(0,0,canvas.width,canvas.height);
		var noise = function(){   
			for(var i=0;i < pixels.data.length;i+=4)
			{
				pixels.data[i] = 255;
				pixels.data[i + 1] = 255;
				pixels.data[i + 2] = 255;
				pixels.data[i + 3] = Math.floor((254-155)*Math.random()) + 156;
			}
			context.putImageData(pixels,0,0,0,0,canvas.width,canvas.height);
			xcanvas.drawText('14pt Lucida Console' ,'#000', Language.tryAgain, 50 , canvas.height/2);
		};

		var letters = Array(256).join(1).split(''); 

		_map.fillMapBinaryCode = function(){
			  var ctx = context;
			  var x_pos = 0;
			  ctx.fillStyle='rgba(0,0,0,.05)';
			  ctx.fillRect(0,0,canvas.width,canvas.height);
			  ctx.fillStyle='#cfc';
			  ctx.font = "12pt Lucida Console";
			  letters.map(function(y_pos, index)
			  {
				  var n = getRandomInt(1,100);
				  (n > 50) ? text = '1' : text = '0';
				  x_pos = index * 12;
				  ctx.fillText(text, x_pos, y_pos);
				  letters[index] = (y_pos > canvas.height + Math.random() * 1e4) ? 0 : y_pos + 15;
			  });
		};

		_map.fillMapHexCode = function(){
			  var ctx = context;
			  ctx.fillStyle='rgba(0,0,0,.05)';
			  ctx.fillRect(0,0,canvas.width,canvas.height);
			  ctx.fillStyle='#fff';
			  ctx.font = "12pt Lucida Console";
			  letters.map(function(y_pos, index)
			  {
				  var n = getRandomInt(1,100);
				  (n > 50) ? text = String.fromCharCode(getRandomInt(65,70)) : text = String.fromCharCode(getRandomInt(48,57));
				  x_pos = index * 12;
				  if(index % 5 === 0)
					text = '';
				  ctx.fillText(text, x_pos, y_pos);
				  letters[index] = (y_pos > canvas.height + Math.random() * 1e4) ? 0 : y_pos + 15;
			  });
		};

		_map.fillMapHexCodeRed = function(){
			  var ctx = context;
			  ctx.fillStyle='rgba(0,0,0,.05)';
			  ctx.fillRect(0,0,canvas.width,canvas.height);
			  ctx.fillStyle='#f00';
			  ctx.font = "12pt Lucida Console";
			  letters.map(function(y_pos, index)
			  {
				  var n = getRandomInt(1,100);
				  (n > 50) ? text = String.fromCharCode(getRandomInt(65,70)) : text = String.fromCharCode(getRandomInt(48,57));
				  x_pos = index * 12;
				  if(index % 5 === 0)
					text = '';
				  ctx.fillText(text, x_pos, y_pos);
				  letters[index] = (y_pos > canvas.height + Math.random() * 1e4) ? 0 : y_pos + 15;
			  });
		};

		_map.createFromGrid = function(array, legend){
			grid_H = array.length;
			grid_W = 0;
			for (var y = 0; y < array.length; y++) {
				var line = array[y];
				if(line.length > grid_W)
					grid_W = line.length;

				for (var x = 0; x < line.length; x++) {
					var symbol = line[x];
					if(symbol === '')
						continue;

					var name = legend[symbol];
					if(typeof(name) === "function")
					   name();
					else{
						if (name === 'player') 
							_map.placePlayer(x, y);
						else if (name) 
							this.placeObject(name, x, y);
					}
				}
			}
		};

		_map.placeObject= function(name,x,y){

			if(name === 'bonus')
			{
				if(_map.getObjectCount(name) === bonuses[currentLevel]){
					_map.showMessage(Language.cheaterDetected,'#fff');
					return;
				}
			}
		
			if(!existObject(name)){
				throw Language.error8 + name + Language.error8_1;
				return;
			}

			if(!inBounds(x,y)){
				throw Language.error9 + "[" + x + ":" + y + "]" + Language.error9_1;
				return;
			}

			if(!isPlaceable(x,y)){
				if(getItem(x,y) === 'player') {return};
				if(objects[name].type !== 'projectile')
				   map.errorHandler(Language.error4 + x + ":" + y + Language.error4_1);
				return;
			}

			var type = objects[name].type;

			if(type === 'ground')
			   isGroundOnGround(x,y);
			else if(type === 'item')
			   isItemOnGround(x,y);
			else if(type === 'moved')
			   isMovedOnGround(x,y);

			if(type === 'static' || type === 'item' || type === 'impassable' || type === 'ground')
			   placeStatic(name,x,y);
			else if (type === 'dynamic')
			   placeDynamic(name,x,y);
			else if (type === 'moved')
			   placeMoved(name,x,y);
			else if (type === 'projectile')
			   placeProjectile(name,x,y);
			else if(type === 'button'){
				if(!('onPress'   in objects[name])) object.onPress   = function(){};
				if(!('onRelease' in objects[name])) object.onRelease = function(){};
				placeStatic(name,x,y);
				buttons.push({posX:x,posY:y,button:objects[name]}); 
			}
		};

		_map.placeObjects = function(name, coords){
			for(var i = coords.length; --i >= 0;){
				var x = coords[i].x;
				var y = coords[i].y;
				_map.placeObject(name,x,y);
			}
		};

		_map.placePlayer = function(x,y){
			if(player != null){return;}
			player = new Player(x,y);
			codeProtector.saveCodePlayer();
			placeStatic('player',x,y);
		};

		_map.defineObject= function(properties){
			var name = properties.name;
			if(existObject(name)){
			   throw Language.error7 + name + Language.error7_1;
			   return false;
			}			
			properties.type = properties.type || 'static';
			if(!isValidType(properties.type))    throw Language.typeNotFound + ": " + properties.type;
			if(properties.symbol === undefined){    
			   properties.symbol = 'X';
			   properties.color  = '#fff';
			}
			objects[name] = properties;
			return true;
		};

		_map.showMessage = function(text,color,time){
			if(theEnd){
				messages = [];
				return;
			}
			var t = time || 2000;
			var contains = false;

			for(var i = 0; i < messages.length ; i++){
				if(messages[i].msg === text){
					contains = true;
					break;
				}
			}

			if(!contains)	
			   messages.push({msg:text,clr:color,time:t});

			if(!isMessageQueueWork){
			   isMessageQueueWork = true;
			   setTimeout(xcanvas.messageWorker, 100);
			}
		};

		_map.drawLevelTitle = function(text){
		   xcanvas.clearRect(1,canvas.height/2 - 25,canvas.width - 1,50,'#aaffaa');
		   xcanvas.drawText('12pt Lucida Console' ,"#000", text, 100, canvas.height/2 + 5);
		   setTimeout(refresh, 2000);
		};

		_map.getPlayer = function(){
			return player;
		};

		_map.whoIs = function(x,y){
			return grid[x][y];
		};

		_map.getObjectCount = function(name){
			var count = 0;
			for(var i = 0; i < grid_W; i++){
				for(var j = 0; j < grid_H; j++){
					if(grid[i][j] === name){
						count++;
					}
				}
			}
			return count;
		};

		_map.flash = function(name){
			if(!player.hasItem('flashlight')){
				_map.showMessage(Language.noFlashLight,'#fff');
				return;
			}

			var tiles = _map.getObjectsCoords(name);
			objects[name].color = '#ff0';
			for(var i = 0; i < tiles.length; i++){
				redrawSymbol(tiles[i].x, tiles[i].y);
			}
		};

		_map.getObjectsCoords = function(name)
		{
			var cells = [];
			for(var i = 0; i < grid_W; i++){
				for(var j = 0; j < grid_H; j++){
					if(grid[i][j] === name){
						cells.push({x:i,y:j});
					}
				}
			}
			return  cells;
		};

		_map.update = function(){
			if(!GameOver){
				var killedObjects = [];
				var killedMovedObjects  = [];
				var validator = null;
				for(var i = events.length; --i >= 0;){
					if(events[i].event === 'validate'){
					   validator = events[i];
					}
				}

				for(var i = dynamicObjects.length; --i >= 0;){
					if(!dynamicObjects[i].isDead())
					{
					   dynamicObjects[i].behavior(dynamicObjects[i]);
					   validator.func(map);

					   if(dynamicObjects[i].isDead())
						  killedObjects.push(dynamicObjects[i]);
					}
					else 
					   killedObjects.push(dynamicObjects[i]);
				}

				for(var i = movedObjects.length; --i >= 0;){
					if(movedObjects[i].obj.isDead())
					   killedMovedObjects.push(movedObjects[i]);
				}

				for(var i = killedMovedObjects.length; --i >= 0;){
					var idx = movedObjects.indexOf(killedMovedObjects[i]);
					movedObjects.splice(idx,1);
				}

				for(var i = killedObjects.length; --i >= 0;){
					var idx = dynamicObjects.indexOf(killedObjects[i]);
					dynamicObjects.splice(idx, 1);
				}

				for(var i = buttons.length; --i >= 0;){
					var x    = buttons[i].posX;
					var y    = buttons[i].posY;
					var btn  = buttons[i].button;
					var type = objects[grid[x][y]].type;
					if(type !== 'dynamic' && type !== 'moved') btn.onRelease(btn);
				}				
			}
		};

		_map.draw = function(){
			for (var i = grid_W; --i >= 0;){
				for (var j = grid_H; --j >= 0;){
					if(grid[i][j] !== 'null'){
						var screenCoords = getScreenCoords(i,j);
						var tile = objects[grid[i][j]];
						xcanvas.clearRect(screenCoords.x, screenCoords.y - tileSize,tileSize,tileSize,'#000');
						xcanvas.drawSymbol(screenCoords.x, screenCoords.y, tile);
					}
				}
			}
			player.update();
		};

		_map.errorHandler = function (e){
			global_error = true;
			var exceptionText = e.toString();
			var title = "";
			if(exceptionText.indexOf("[") === -1)
				title = "[ERROR]";

			 _map.showMessage(title + exceptionText,"#fff",5000);
		};

		_map.checkCountTimers = function(count){
			if (timers > count)
				throw Language.timersError;
		};

		_map.equalsObject = function(name,count){
			var result = 0;
			 for (var i = grid_W; --i >= 0;) {
			   for (var j = grid_H; --j >= 0;) {
				  if(grid[i][j] === name) result++;
			  }}

			 if(result !== count){
			   gameValid = false;
			   throw Language.error11 + " " + name + ".";
			 }
		};

		_map.checkLevelOnCountObject = function(name, count){
			 var result = 0;
			 for (var i = grid_W; --i >= 0;) {
			   for (var j = grid_H; --j >= 0;) {
				  if(grid[i][j] === name) result++;
			  }}

			 if(result > count){
			   gameValid = false;
			   throw Language.error1 + " " + name + ".";
			 }
		};

		_map.checkLevelOnCountObjectType = function(type, count){
			 var result = 0;
			 for (var i = grid_W; --i >= 0;) {
			   for (var j = grid_H; --j >= 0;) {
				  if(objects[grid[i][j]].type === type && grid[i][j] !== 'empty' && grid[i][j] !== 'null') 
					result++;
			  }}

			if(result > count){
			   gameValid = false;
			   throw Language.error1 + " " + type + ".";
			}
		};

		_map.checkLevelOnInventory = function(name){
			if(player != null && !player.hasItem(name)){
			  _map.showMessage(Language.error2 + " " + name + ".","#fff");
			   gameValid = false;
			} 
		};

		_map.setEvent = function(e, f){
		  events.push({event:e,func:f});
		};

		_map.setTimer = function(func, time){
			if(time < 100){
				throw Language.timerMaxValueError;
				return;
			}

			if(timers + 1 > 5){
				throw Language.timerMaxCountError;
				return;
			}

			timers++;
			var timerID = setInterval(func, time);
			timersList.push(timerID);
			return timerID;
		};

		_map.removeTimer = function(id){		
			for(var i = 0; i < timers.length; i++){
				if(id === timers[i]){
					clearInterval(id);
					timers.splice(i,1);
				}
			}
		};

		var callEvent = function(name)
		{
		  for(var i = 0; i < events.length; i++){
			if(events[i].event === name){
			   return events[i].func(_map);
			   break;
			}
		  }
		};

		//###########################dynamicObject###########################################
			var dynamicObject = function(name,x,y){
				var _dynamicObject = this;              
				_dynamicObject  = cloneObjectTOObject(objects[name], _dynamicObject);

				delete _dynamicObject.color;
				delete _dynamicObject.type;
				delete _dynamicObject.symbol;

				if(!('behavior' in objects[name]))_dynamicObject.behavior = function(){};

				var body    = new liveObject(name,x,y);
				_dynamicObject.getX = function(){return body.getX()};
				_dynamicObject.getY = function(){return body.getY()};
				_dynamicObject.setColor = function(color){return body.setColor(color)};
				_dynamicObject.getColor = function(){return body.getColor()};
				_dynamicObject.move = function(direction){body.move(direction)};
				_dynamicObject.kill = function(){body.kill()};
				_dynamicObject.findNearestToPoint = function(name){return body.findNearestToPoint(name)};
				_dynamicObject.canMove = function (direction){return body.canMoveDirection(direction)}
				_dynamicObject.isDead = function(){return body.isDead()};
				_dynamicObject.giveItems = function(object){body.giveItems(object)};
				_dynamicObject.giveItem  = function(item,object){body.giveItem(item,object)};
				_dynamicObject.getDirection = function(){return body.getDirection()};
				_dynamicObject.getInventory=function(){return body.getInventory()};
				_dynamicObject.onTakeEvent = function(item){body.onTakeEvent(item)};
				_dynamicObject.getMem = function(){return body.getMem()};
				_dynamicObject.hasItem = function(item){return body.hasItem(item)};
				return _dynamicObject;
			}
		//###########################ENDDynamicObject########################################

		//###########################projectile##############################################
			var projectile = function(name,x,y){
				var _projectile    = this; 
				var body   		   = new projectileObject(name,x,y);
				_projectile  	   = cloneObjectTOObject(objects[name], _projectile); 
				delete _projectile.color;
				delete _projectile.type;
				delete _projectile.symbol;
				_projectile.move   = function(direction){body.move(direction)};
				_projectile.isDead = function(){return body.isDead()};
				_projectile.getX   = function(){return body.getX()};
				_projectile.getY   = function(){return body.getY()};
				_projectile.kill   = function(){return body.kill()};
				_projectile.getMem = function(){return body.getMem()};
				_projectile.findNearestToPoint = function(name){return body.findNearestToPoint(name)};
				if(!('behavior' in objects[name]))
				   _projectile.behavior = function(){};
				return _projectile;
			}
		//###########################ENDprojectile###########################################

		   var getNextStepCoords = function(direction, pos){
				var new_x = pos.x;
				var new_y = pos.y;

				if(direction === 'up')
				  new_y--;
				else if(direction === 'down')
				  new_y++;
				else if(direction === 'left')
				  new_x--;
				else if(direction === 'right')
				  new_x++;

				return {x:new_x, y:new_y};
		   };

		   var getObjectIndex = function(x,y){
				var idx = null;
				for(var i = dynamicObjects.length; --i >= 0;){
					if(dynamicObjects[i].getX() === x && dynamicObjects[i].getY() === y){
						idx = i;
						break;
					}
				}
				return idx;
		   };

		   var findObject = function(x,y){
				var object = null;
				for(var i = dynamicObjects.length; --i >= 0;){
					if(dynamicObjects[i].getX() === x && dynamicObjects[i].getY() === y){
						object = dynamicObjects[i];
						break;
					}
				}
				return object;
		   };

		   var findMovedObject = function(x,y){
				var object = {block:null,id:-1};
				for(var i = movedObjects.length; --i >= 0;){
					if(movedObjects[i].posX === x && movedObjects[i].posY === y){
						object.block = movedObjects[i];
						object.id = i;
						break;
					}
				}
				return object;
		   };

		   var findButton = function(x,y){
				var object = null;
				for(var i = buttons.length; --i >= 0;){
					if(buttons[i].posX === x && buttons[i].posY === y){
						object = buttons[i];
						break;
					}
				}
				return object;
		   };

			var findTeleport = function(x,y){
				var object = null;
				for(var i = teleports.length; --i >= 0;){
					if(teleports[i].posX === x && teleports[i].posY === y){
						object = teleports[i];
						break;
					}
				}
				return object;
		   };
		//#############################-liveObject-##########################################
		   var liveObject = function(name, px,py){
			   var _liveObject = this;
			   var inventory = [];
			   var pos = {x:px,y:py};
			   var dead  = false;
			   var direct = null;
			   var memory = getItem(px,py);
			   if(memory === 'null') memory = 'ground';
			   var undead = false;
			   var turn = false;

			   _liveObject.name = name;
			   if(objects[name].undead === true) undead = true;

			   var getLoot = function(x,y){
					var index = 0;
					for(var i = loots.length; --i >= 0;){
						if(loots[i].pos.x === x && loots[i].pos.y === y){
							index = i;
							break;
						}
					}

					var items = loots[index].items.slice(0);
					loots.splice(index,1);
					return items;
			   };

			   var takeItem = function(x,y){
				   var name = grid[x][y];
				   if(name != 'key')
				      if(_liveObject.hasItem(name)) return false;

				   if('onTake' in objects[name]){
					   if(objects[name].onTake(_liveObject)){
						  if(name === 'loot')
						  {
							 var s = "";
							 var loot = getLoot();
							 for(var i = loot.length - 1; i >= 0; i--){
								inventory.push(loot[i]);
								s += loot[i] + ',';
							 }

							 if(_liveObject.name === 'player')
								_map.showMessage(Language.youTake + ': ' + s + "!" ,'#fff');
							 else
								_map.showMessage(_liveObject.name + ' ' + Language.takeItem + ': ' + s,'#fff');
						  }
						  else
						  {
							 inventory.push(name);
							 if(_liveObject.name === 'player'){
							 	_map.simplePlayer.play('sounds/take.mp3');
								_map.showMessage(Language.youTake + ': ' + name + "!" ,'#fff');
							 }
							 else
								_map.showMessage(_liveObject.name + ' ' + Language.takeItem + ': ' + name,'#fff');
						  }

						  grid[x][y] = 'ground';
					 }
					 else
					 {
						if(name === 'bonus' && _liveObject.name !== 'player'){
							if(bonusCount + 1 <= bonuses[currentLevel])
								bonusCount++;
							else
								_map.showMessage(Language.cheaterDetected,"#fff");
							 player.update();
						}
					 }
					 _liveObject.onTakeEvent(name);
				  }
			   };

			   _liveObject.canMoveDirection = function(direction){
					var nс = getNextStepCoords(direction,pos);
					if(isPlaceable(nс.x, nс.y) || isItem(nс.x, nс.y) || isButton(nс.x, nс.y)) return true;
					return false;
			   };

			   _liveObject.canMoveCoords = function(x,y){
					if(!inBounds(x,y))
						return false;

					if(isCollidedEvent(x,y)){
						try{
							if(isDynamic(x,y)){
								var object = findObject(x,y);
								objects[grid[x][y]].onCollision(_liveObject, object);
							}
							else
							    objects[grid[x][y]].onCollision(_liveObject);
						}
						catch(e){
							_map.errorHandler(e);
						}
					}

					if(isPushedEvent(x,y))
					{
						var mvdblk = findMovedObject(x,y);
						if(object !== null){
							try{
								mvdblk.block.obj.onPush(_liveObject,mvdblk.block.obj,mvdblk.id);
							}
							catch(e){
								_map.errorHandler(e);
							}
						}
					}

					if(_liveObject.name === 'player')
					{
						if('onPlayerCollision' in objects[grid[x][y]])
						{
							try{
								var object = findObject(x,y);   
								if(object === null){object = objects[grid[x][y]];}
								object.onPlayerCollision(player, object);
							}
							catch(e){
								_map.errorHandler(e);
							}
						}

						if('transport' in objects[grid[x][y]]){
							takeItem(x,y);	
							var tr = findObject(x,y);
							tr.kill();
						}

						if(grid[x][y] === 'exit')
						{
						   gameValid = true;

						   var result = callEvent('onExit');

						   if(gameValid)
						   {
							  if(result === true || result === undefined)
								 nextLevel();
						   }
						}
					}
					else{
						if(grid[x][y] === 'player'){
							if('onPlayerCollision' in objects[_liveObject.name])
							{
								try{
									var object = findObject(pos.x,pos.y);   
									if(object === null){object = objects[grid[x][y]];}
									objects[_liveObject.name].onPlayerCollision(player, object); 
								}
								catch(e){
									_map.errorHandler(e);
								}
							}
						}
					 }

					if(isPlaceable(x,y)){
						return true;
					}
					else if(isItem(x,y)){
						takeItem(x, y);
						return true;
					}
					else if(isImpassable(x,y)){
						//if(_liveObject.name === 'player'){
						   if('onPass' in  objects[grid[x][y]]){
							  if(objects[grid[x][y]].onPass(_liveObject,objects[grid[x][y]])){
								 grid[x][y] = 'ground';
								 return true;
							  }
						   }
						//}
					}
					else if(isButton(x,y)){
						if('onPress' in  objects[grid[x][y]]){
							var btn = findButton(x,y);
							if(btn !== null){
								try{
									btn.button.onPress(objects[_liveObject.name], btn.button);
								}
								catch(e){
									_map.errorHandler(e);
								}
							}
						}
						return true;
					}
			   };

			   _liveObject.move = function(direction) {	
					if(turn != turns)
					{
						turn = turns;
						direct = direction;
						var newCoords = getNextStepCoords(direction,pos);
						if(_liveObject.canMoveCoords(newCoords.x,newCoords.y))
						{   
							if(!dead){
								var teleportate = false;
								if(getItem(newCoords.x,newCoords.y) === 'teleport')
									teleportate = true;
		
								if(_liveObject.name === 'terraformer')
									setItem(_liveObject.getX(), _liveObject.getY(), 'ground');
								else
									setItem(_liveObject.getX(), _liveObject.getY(), memory);

								if(!isItem(newCoords.x,newCoords.y))
								   memory = getItem(newCoords.x, newCoords.y);
								else
								   memory = 'ground';

								setItem(newCoords.x, newCoords.y, name);
								pos.x = newCoords.x;
								pos.y = newCoords.y;

								if(teleportate){
									var teleport = findTeleport(pos.x,pos.y);
									setItem(pos.x, pos.y, 'teleport');
									memory = getItem(teleport.target_x,teleport.target_y);
									teleport.teleportation(_liveObject,teleport);
								}
							}
						}
					}
					else
						map.showMessage(Language.error10 + "[" +_liveObject.name + "]",'#fff');
			   };

			   _liveObject.kill = function(killer) {
					if(!dead)
					{
						if(objects[name].undead === false) undead = false;
						if(!undead){
						   dead = true;
						   try
						   {
						   	  _liveObject.onDead(killer)
						   }
						   catch(e)
						   {
						   	  _map.errorHandler(e)
						   }
						}
					}
			   };

			   _liveObject.isDead = function() {
				   return dead;
			   };

				_liveObject.getX = function(){return pos.x;};
				_liveObject.getY = function(){return pos.y;};
				_liveObject.setColor = function(color){objects[_liveObject.name].color = color; redrawSymbol(pos.x,pos.y)};
				_liveObject.getColor = function(){return objects[_liveObject.name].color};
				_liveObject.getDirection = function(){return direct;};
				_liveObject.getInventory = function(){return inventory};

			   _liveObject.giveItems = function(object){
					for (var i = inventory.length; --i >= 0;) {
						var item = inventory[i];
						_liveObject.giveItem(item,object);
					}    
					inventory = [];
			   };

			   _liveObject.giveItem = function(item, object){
					var o_inventory = object.getInventory();
					if(item === 'key'){
						o_inventory.push(item);
						object.onTakeEvent(item);
					}
					else if(!object.hasItem(item)){
						if(item !== 'bonus')
					       o_inventory.push(item);

					   object.onTakeEvent(item); 

					   if(inventory.length === 1)
					      inventory = [];
					}	
			   };

			   _liveObject.hasItem  = function(item){
					for (var i = inventory.length; --i >= 0;) {
						if(inventory[i] === item) return true;
					}     
					return false;
			   };

			   _liveObject.dropItem = function(name){
				  var index = inventory.indexOf(name);
					if(index > -1)
					{
					   inventory.splice(index, 1);
					   _liveObject.onDropEvent();
					}
			   };

			   _liveObject.findNearestToPoint = function (name){
					var foundObjects = [];
					if (name === 'player') {
						foundObjects.push({x: player.getX(), y: player.getY()});
					}
					else
					{
						for (var x = grid_W; --x >= 0;) {
							for (var y = grid_H; --y >= 0;) {
								if (objects[grid[x][y]].name === name) {
									foundObjects.push({x: x, y: y});
								}
							}
						}
					}

					if(foundObjects.length === 0)
					   return {x: _liveObject.getX(), y: _liveObject.getY()}

					var dists = [];
					for (var i = foundObjects.length; --i >= 0;) {
						var obj = foundObjects[i];
						dists[i] = Math.sqrt(Math.pow(this.getX() - obj.x, 2) + Math.pow(this.getY() - obj.y, 2));

						if (dists[i] === 0) {
							dists[i] = 999;
						}
					}

					var minDist = Math.min.apply(Math, dists);
					var closestTarget = foundObjects[dists.indexOf(minDist)];

					return closestTarget;
				}; 

			   _liveObject.getInventory = function(){return inventory};
			   _liveObject.getMem = function(){return memory;};
			   _liveObject.onTakeEvent = function(name){};
			   _liveObject.onDropEvent = function(){};
			   _liveObject.onImpassable = function(){};
			   _liveObject.onDead = function(){ 
					if(inventory.length > 1)
					{
					   var loot = {
									pos:{x:_liveObject.getX(), y:_liveObject.getY()},
									items: inventory.slice(0)
								  }

					   loots.push(loot);
					   setItem(_liveObject.getX(), _liveObject.getY(), 'loot');
					}
					else if (inventory.length === 1)
					  setItem(_liveObject.getX(), _liveObject.getY(), inventory.pop());
					else
					  setItem(_liveObject.getX(), _liveObject.getY(), memory);

					if(_liveObject.name != 'player' && objects[name].transport !== true)
						_map.showMessage(_liveObject.name + Language.killMessage2, '#0ff');

					var obj = objects[_liveObject.name];
						if('onDead' in obj)
							obj.onDead(_liveObject);
	
			   };

			   _liveObject.teleportation = function(x,y){
					if(findTeleport(pos.x,pos.y) !== null){
						map.simplePlayer.play('sounds/teleport' + ext); 
						pos.x = x;
						pos.y = y;		
						setItem(pos.x, pos.y, _liveObject.name);	   		
					}
					else
						_map.showMessage(Language.noTeleport,'#fff');
			   };

			   var clevel = parseInt(currentLevel);

			   if(name === 'player'){
			   		if(theEnd)
			   			return;

					if(clevel > 1){
					  if(!_liveObject.hasItem('computer')){
						 inventory.push('computer');
						 showEditor();
					  }
					}

					if(clevel > 2){
					  if(!_liveObject.hasItem('notepad')){
						 inventory.push('notepad');
					  }
					}

					if(clevel > 7){
					  if(!_liveObject.hasItem('phone')){
						 inventory.push('phone');
					  }
					}

					if(clevel === 19 || clevel === 20 || clevel === 21)
						inventory.push('boat');	
			   }
		   }
		//#############################-ENDliveObject-########################################

		//#####################################-ProjectileObject-#############################
			var projectileObject = function(name,px,py){
				var _projectileObject = this;
				var pos = {x:px,y:py};
				var dead  = false;
				var memory = getItem(px,py);
				if(memory === 'null') memory = 'ground';
				_projectileObject.name = name;

				var canMove = function(x,y){
					if(!inBounds(x,y) || grid[x][y] === 'null')
						return false;

					if(isPlaceable(x,y) || isItem(x,y))
						return true;

					return false;
				};

				var kill = function() {
					if(!dead){
					   dead = true;
					}
				};

				_projectileObject.move = function(direction) {
					var newCoords = getNextStepCoords(direction,pos);
					if(canMove(newCoords.x,newCoords.y))
					{
						if(!dead){
							setItem(pos.x,  pos.y, memory);

							if(!isItem(newCoords.x,newCoords.y))
							   memory = getItem(newCoords.x, newCoords.y);
							else
							   memory = 'ground';

							setItem(newCoords.x, newCoords.y, name);
							pos.x = newCoords.x;
							pos.y = newCoords.y;
						}
					}
					else
					{
						if(!inBounds(newCoords.x,newCoords.y) || grid[newCoords.x][newCoords.y] === 'null'){
							kill();
							return;
						}

						var type = objects[grid[newCoords.x][newCoords.y]].type;
						if(type === 'dynamic'){
							if(grid[newCoords.x][newCoords.y] === 'player'){
							   player.kill(_projectileObject);
							}
							else{
								for(var i = dynamicObjects.length; --i >= 0;){
									if(dynamicObjects[i].getX() === newCoords.x && dynamicObjects[i].getY() === newCoords.y)
										dynamicObjects[i].kill();
								}
							}
						}

						if(type === 'projectile'){
							for(var i = projectiles.length; --i >= 0;){
								if(projectiles[i].getX() === newCoords.x && projectiles[i].getY() === newCoords.y)
								   projectiles[i].kill();
							}
						}
						kill();
					}
			   };

			   _projectileObject.findNearestToPoint = function (name){
					var foundObjects = [];
					if (name === 'player') {
						foundObjects.push({x: player.getX(), y: player.getY()});
					}
					else
					{
						for (var x = grid_W; --x >= 0;) {
							for (var y = grid_H; --y >= 0;) {
								if (objects[grid[x][y]].name === name) {
									foundObjects.push({x: x, y: y});
								}
							}
						}
					}

					if(foundObjects.length === 0)
					   return {x: _projectileObject.getX(), y: _projectileObject.getY()}

					var dists = [];
					for (var i = foundObjects.length; --i >= 0;) {
						var obj = foundObjects[i];
						dists[i] = Math.sqrt(Math.pow(this.getX() - obj.x, 2) + Math.pow(this.getY() - obj.y, 2));

						if (dists[i] === 0) {
							dists[i] = 999;
						}
					}

					var minDist = Math.min.apply(Math, dists);
					var closestTarget = foundObjects[dists.indexOf(minDist)];

					return closestTarget;
			   }; 

			   _projectileObject.isDead = function() {
				   return dead;
			   };
			   _projectileObject.getX = function() {
				   return pos.x;
			   };
			   _projectileObject.getY = function() {
				   return pos.y;
			   };
			   _projectileObject.getMem = function(){
				   return memory;
			   };
			   _projectileObject.kill = function(){
				   kill();
			   };
			}
		//#####################################-ENDProjectileObject-##########################

		//#####################################-MovedObject-##################################
			var movedObject = function(name,px,py){
			   var _movedObject = this;
			   var pos = {x:px,y:py};
			   var dead  = false;
			   var memory = getItem(px,py);
				_movedObject.name = name;

				if('onCollision' in objects[memory] || 'onPlayerCollision' in objects[memory] || memory === 'null')
					memory = 'ground';

			   var canMove = function(x,y)
			   {
					if(!inBounds(x,y))
						return false;

					if(isCollidedEvent(x,y)){
						try{
							objects[grid[x][y]].onCollision(_movedObject);
						}
						catch(e){
							_map.errorHandler(e);
						}
					}

					if(grid[x][y] === 'mine'){
					   setItem(x, y,'ground');
					   _map.showMessage(Language.boom,'#ccffcc');
					}

					if(isPlaceable(x,y))
						return true;
					else if(isButton(x,y)){
						if('onPress' in  objects[grid[x][y]]){
							var btn = findButton(x,y);
							if(btn !== null){
								try{
									btn.button.onPress(objects[_movedObject.name], btn.button);
								}
								catch(e){
									_map.errorHandler(e);
								}
							}
						}
						return true;
					}
			   };

				_movedObject.getX = function(){return pos.x;};
				_movedObject.getY = function(){return pos.y;};
				_movedObject.move = function(direction) {
					var newCoords = getNextStepCoords(direction,pos);
					if(canMove(newCoords.x,newCoords.y)){
						if(!dead){
							var teleportate = false;
								if(getItem(newCoords.x,newCoords.y) === 'teleport')
									teleportate = true;

							setItem(_movedObject.getX(), _movedObject.getY(), memory);
							if(!isItem(newCoords.x,newCoords.y))
							   memory = getItem(newCoords.x, newCoords.y);
							else
							   memory = 'ground';
							setItem(newCoords.x, newCoords.y, name);
							pos.x = newCoords.x;
							pos.y = newCoords.y;

							if(teleportate){
								var teleport = findTeleport(pos.x,pos.y);
								setItem(pos.x, pos.y, 'teleport');
								memory = getItem(teleport.target_x,teleport.target_y);
								teleport.teleportation(_movedObject,teleport);
							}
						}
					}
				};
			   _movedObject.kill = function() {
					if(!dead){
					   dead = true;
					   try{
					   _movedObject.onDead();
					   }
					   catch(e){
						  map.errorHandler(e);
					   }
					}
			   };
			   _movedObject.isDead = function() {
				   return dead;
			   };
			   _movedObject.onDead = function(){
					setItem(_movedObject.getX(), _movedObject.getY(), memory);
			   };
			   _movedObject.teleportation = function(x,y){
					if(findTeleport(pos.x,pos.y) !== null){
						map.simplePlayer.play('sounds/teleport' + ext); 
						pos.x = x;
						pos.y = y;		
						setItem(pos.x, pos.y,  _movedObject.name);	   		
					}
					else
						_map.showMessage(Language.noTeleport,'#fff');
			   };
		   }
		//#####################################-ENDMovedObject################################

		//#############################-PLAYER-###############################################  
			var Player = function(px,py){
			   var _player = this;
			   _player.name = 'player';
			   var  body   = new liveObject('player',px,py);
			   var phoneCallback = function(){};

			   var drawInventory = function(item){
			   	 	if(theEnd) return;

					xcanvas.drawCapLine(0,canvas.height - 30,canvas.width,canvas.height - 30, 1 ,'#f00');
					if(item === 'computer'){
						showEditor();
					}
					if(item === 'bonus'){
						if(bonusCount + 1 <= bonuses[currentLevel])
						   bonusCount++;
						else
						   _map.showMessage(Language.cheaterDetected,'#fff');
					}
					var inventory = body.getInventory();
					
					xcanvas.clearRect(0, canvas.height - 30 ,canvas.width,50,'#000');

					xcanvas.drawText('12pt Lucida Console','#fff', Language.text1 + ":",1,canvas.height - 9);
					for (var i = inventory.length - 1; i >= 0; i--) {
						 xcanvas.drawSymbol(80 + i * tileSize, canvas.height - 2, objects[inventory[i]]);
					};
					xcanvas.drawStrokedRect(canvas.width - 201, 1, 200, 25, '#000','#f00',1);
					for (var i = bonusCount; i >= 0; i--) {
						 xcanvas.drawSymbol((canvas.width - i * tileSize)-3, 25, objects['bonus']);
					};
			   };

				var dead = function(killer){
					GameOver = true;
					pixelMap = getPixelMap();

					if(killer != undefined){
						if(killer.name != undefined)
						   killMessage = "вас убил " + killer.name;
						else 
						   killMessage = killer;	
					}
					else
						killMessage = "";

					_map.ambientPlayer.pause();
					_map.ambientPlayer.setMute(false);
					_map.simplePlayer.play('sounds/gameover' + ext); 

					scrollFuncID = window.setInterval(scrollMap, 50);
				};

				body.onTakeEvent = drawInventory;
				body.onDropEvent = drawInventory;
				body.onDead      = dead;

			   _player.getColor = function(){return objects['player'].color;};
			   _player.setColor = function(color){objects['player'].color = color; setItem(_player.getX(),_player.getY(),'player')};
			   _player.getX     = function(){return body.getX()};
			   _player.getY     = function(){return body.getY()};
			   _player.move     = function(direction){turns++; turnsOnLevel++; body.move(direction);};
			   _player.kill     = function(killer){deads++; body.kill(killer)};
			   _player.hasItem  = function(item){return body.hasItem(item)};
			   _player.dropItem = function(item){body.dropItem(item)};
			   _player.getDirection 	= function(){return body.getDirection()};
			   _player.update   	    = function(){drawInventory()};
			   _player.setPhoneCallback = function(func){phonefunc = func};
			   _player.setClock 	 	= function(func, time, isInterval){clock.event = func, clock.time = time, clock.isInterval = isInterval};
			   _player.getInventory     = function(){return body.getInventory()};
			   _player.onTakeEvent      = function(item){body.onTakeEvent(item)};
			   _player.getBonusCount 	= function(){
				  var sum = 0;
					for(var i = 1; i < maxLevel + 1 ; i++){
						var b = localStorage.getItem("quest_level" + i + "_bonusCount");
						if(b !== null){
							b = parseInt(b);
							sum += b;
						}
					};
					return sum;
			   };
			   _player.teleportation = function(x,y){body.teleportation(x,y);};
			   _player.setSymbol = function(sym){objects['player'].symbol = sym};
			};
		//#############################-ENDPLAYER-############################################

		//#############################-TROJAN-###############################################
			var trojan = function(){
				var _trojan = this;
				var activated = false;
				var target = "";
				var objs = null;
				_trojan.setTarget = function(name){
					if(name === 'secretary'){
						_map.showMessage(Language.nonInfected2 + 'secretary]',"#fff");
						return;
					}

					if(activated){
						_map.showMessage(Language.trojanActivated,"#fff");
						return;
					}
					activated = true;
					target = name;
					objs = _map.getObjectsCoords(target);					
				};
				_trojan.changeColor = function(value){	
					if(target !== ""){
					   objects[target].color = value;
						for(var i = 0; i < objs.length; i++)
						   redrawSymbol(objs[i].x,objs[i].y);
					}
					else
					   _map.showMessage(Language.trojanNotTarget,"#fff");
				};
				_trojan.changeSymbol = function(value){	
					if(target !== ""){	
					   objects[target].symbol = value;
					   for(var i = 0; i < objs.length; i++)
						   redrawSymbol(objs[i].x,objs[i].y);
					}
					else
					   _map.showMessage(Language.trojanNotTarget,"#fff");
				};
				_trojan.setMortal = function(){	
					if(target !== "")
						if(objects[target].undead === true){
						   objects[target].undead = false;
						   _map.showMessage(Language.objectIsMortal + target + Language.objectIsMortal2,"#fff");
						}
					else
					   _map.showMessage(Language.trojanNotTarget,"#fff");
				};
			};

			_map.createTrojan = function(){
				if(!player.hasItem('trojan')){
					_map.showMessage(Language.notTrojanItem,"#fff");
					return null;
				}
				player.dropItem('trojan');
				return new trojan();
			};
		//#############################-ENDTROJAN-############################################

		//#############################-VIRUS-###############################################
			var virus = function(){
				var _virus = this;
				var activated = false;
				var target = null;

				_virus.infect = function(x,y){	
					if(getItem(x,y) === 'secretary'){
						_map.showMessage(Language.nonInfected + 'secretary]',"#fff");
						return;
					}

					if(!isDynamic(x,y)){
						_map.showMessage(Language.nonDynamicType + '[' + x + ':' + y + ']',"#fff");
						return;
					}

					if(activated){
						_map.showMessage(Language.virusActivated,"#fff");
						return;
					}
					activated = true;
					target = getObjectIndex(x,y);
					_map.showMessage(Language.infectSuccess,"#fff");
				};
				_virus.crackBehavior = function(newBehavior){
					if(target !== null){
					   dynamicObjects[target].behavior = newBehavior;
					  _map.showMessage(Language.objectCracked,"#fff");
					}
				}
			};

			_map.createVirus = function(){
				if(!player.hasItem('virus')){
					_map.showMessage(Language.notVirusItem,"#fff");
					return null;
				}
				player.dropItem('virus');
				return new virus();
			};
		//#############################-ENDVIRUS-############################################

		//#############################-SoundPlayer###########################################
			var SoundPlayer = function (element){
				var _soundplayer = this;
				var soundPlayerHTML = element;
				var mute = false;
				_soundplayer.play = function(sound){
					if(!mute){
					  soundPlayerHTML.src = sound;
					  soundPlayerHTML.type = audioType;
					  soundPlayerHTML.play();
					} 
				};
				_soundplayer.setSound = function(sound){
					soundPlayerHTML.src = sound;
					soundPlayerHTML.type = audioType;
				};
				_soundplayer.continue = function(){
					if(!mute){
					  soundPlayerHTML.play();
					} 
				};
				_soundplayer.pause = function(){
					soundPlayerHTML.pause();
				};
				_soundplayer.isMute = function(){
					return mute;
				};
				_soundplayer.setMute = function(value){
					mute = value;
					if(value === true)
						soundPlayerHTML.pause();
				};
			};
		//####################################################################################
		//#############################-CodeProtector-########################################
			var CodeProtector = function(){
				var _codeProtector  = this;
				var idealCodeLevel  = {};
				var idealCodePlayer = {};
				var idealToString  = Function.toString;

				var _mapProtectedMethods = 
				[
					 "placeTeleport"
					,"placeButton"
					,"placeColorButton"
					,"fillMapBinaryCode"
					,"fillMapHexCode"
					,"createFromGrid"
					,"placeObject"
					,"placeObjects"
					,"placePlayer"
					,"defineObject"
					,"showMessage"
					,"drawLevelTitle"
					,"getPlayer"
					,"whoIs"
					,"getObjectCount"
					,"flash"
					,"getObjectsCoords"
					,"update"
					,"draw"
					,"errorHandler"
					,"checkCountTimers"
					,"equalsObject"
					,"checkLevelOnCountObject"
					,"checkLevelOnCountObjectType"
					,"checkLevelOnInventory"
					,"setEvent"
					,"setTimer"
					,"removeTimer"
					,"createTrojan"
					,"createVirus"
					,"checkCode"
				]; 

				var _playerProtectedMethods = 
				[
					 "name"
					,"getColor"
					,"setColor"
					,"getX"
					,"getY"
					,"move"
					,"kill"
					,"hasItem"
					,"dropItem"
					,"getDirection"
					,"update"
					,"setPhoneCallback"
					,"setClock"
					,"getInventory"
					,"onTakeEvent"
					,"getBonusCount"
					,"teleportation"
				]

				_codeProtector.saveCodeLevel  = function(){
					for(var i = _mapProtectedMethods.length; --i >= 0;)
					{
					   var propName = _mapProtectedMethods[i];
					   if(_map.hasOwnProperty(propName)){
					   	 _map[propName].toString = idealToString;
						 idealCodeLevel[propName] = _map[propName].toString();
					   }
					}
				};

				_codeProtector.saveCodePlayer = function(){
					for(var i = _playerProtectedMethods.length; --i >= 0;)
					{
					   var propName = _playerProtectedMethods[i];
					   if(player.hasOwnProperty(propName))
						 idealCodePlayer[propName] = player[propName].toString();
					}
				};

				_codeProtector.checkCode = function(warnings,callback){
					for(var i = _mapProtectedMethods.length; --i >= 0;)
					{
					   var propName = _mapProtectedMethods[i];
					   if(_map.hasOwnProperty(propName))
					   	 _map[propName].toString = idealToString;
					}

					for(var i = _playerProtectedMethods.length; --i >= 0;){
					   var propName = _playerProtectedMethods[i];
					   if(player.hasOwnProperty(propName)){
						  player[propName].toString = idealToString;
					   }
					}

					callEvent("validate");

					for(var i = _mapProtectedMethods.length; --i >= 0;){
					   var propName = _mapProtectedMethods[i];
					   if(_map.hasOwnProperty(propName)){
						  if(idealCodeLevel[propName] !== _map[propName].toString()){
							 throw Language.error5 + " " + propName + "!";
						  }
					   }
					}

					for(var i = _playerProtectedMethods.length; --i >= 0;){
					   var propName = _playerProtectedMethods[i];
					   if(player.hasOwnProperty(propName)){
						  if(idealCodePlayer[propName] !== player[propName].toString()){
							 throw Language.error5 + " " + propName + "!";
						  }
					   }
					}

					for(var i = warnings.length; --i >= 0;){
					   throw Language.error6 + " [line " + (warnings[i].num + 1) + ": " + warnings[i].word + "]";
					}

					callback();
				};
				_codeProtector.error = function(error){};
		   };

		   var codeProtector = new CodeProtector();
		   _map.checkCode = function(warnings,callback){return codeProtector.checkCode(warnings,callback)};
		   codeProtector.saveCodeLevel();

		  _map.simplePlayer  = new SoundPlayer(soundPlayerHTML);
		  _map.ambientPlayer = new SoundPlayer(ambientPlayerHTML);

		  document.addEventListener('visibilitychange', function(e) {
			if(document.hidden){
				_map.ambientPlayer.pause();
				_map.simplePlayer.pause();
			}
			else if(muted === false){
				_map.ambientPlayer.continue();
				_map.simplePlayer.setMute(false);			
			}
		  }, false);
		//#############################-ENDCodeProtector######################################
	}
//#############################-ENDMAP-###############################################

	var xcanvas       = new Xcanvas();
	var menuState     = new menuScreen();
	var playState     = new playScreen();
	var creditsScreen = new CreditsScreen();
	var map = new Map(1,1);
	var userExecute = false;
	
	var mute = function(){
		var silent = !map.ambientPlayer.isMute();
		map.ambientPlayer.setMute(silent);
		map.simplePlayer.setMute(silent);
		muted = silent;
		
		if(silent){
			soundIcon.src = "images/off.png";
		}
		else{			
			map.ambientPlayer.continue();
			soundIcon.src = "images/on.png";
		}           
	};

	var removeAllChild = function (element){
		var elem = document.getElementById(element);
		while(elem.firstChild) {
			elem.removeChild(elem.firstChild);
		}
		return elem;
	}

	soundIcon.addEventListener('click', mute, false);

	_game.focus = function(){
		if(_game.currentfocus === 'screen'){
			_game.currentfocus = 'editor';
			codePane.style.border = '5px solid #ffaaaa';
			codeEditor.focus();
		}
		else{
			_game.currentfocus = 'screen';
			codePane.style.border = '5px solid #ccc';
			canvas.focus();
		}
	};

	_game.reset = function(){
		playState = new playScreen();
		codeEditor.loadLevelCode(levels[currentLevel]);
		GameOver = false;
		userExecute = false;
		state = 'play';
		_game.play();
	};

	_game.phone = function(){
		var callback = function(){
			if(map.getPlayer().hasItem('phone'))
			{
				map.simplePlayer.play('sounds/phone' + ext); 
				phonefunc();
				turns++;
				turnsOnLevel++;
				map.update();
				for(var i = events.length; --i >= 0;){
					if(events[i].event === 'validate'){
					   return events[i].func(map);
					}
				}
			}
			else
			   xcanvas.drawOneLineString('#fff',Language.phoneItemNotFound,3000);
		}();
	};

	_game.clock = function(){
		var callback = function(){
			if(map.getPlayer().hasItem('clock'))
			{
				clock.start();
				for(var i = events.length; --i >= 0;){
					if(events[i].event === 'validate'){
					   return events[i].func(map);
					}
				}
			}
			else
			   xcanvas.drawOneLineString('#fff',Language.clockItemNotFound,3000);
		}();
	};

	var notepadInit = false;
	_game.notepad = function(){
		if(!map.getPlayer().hasItem('notepad')){
			map.showMessage(Language.notepadNotFound,'#fff');
			return;
		}

		notepadHTML.style.display = 'block';
		if(!notepadInit)
		{
			notepadHTML.style.left = (window_innerWidth /2 - 250).toString() + 'px';
			notepadHTML.style.top    = '20px';
			notepadHTML.style.width  = '500px';
			notepadHTML.style.height = '600px';
			notepad.refresh(); 
			notepadInit = true;
		}         
	};

	var _categories = [];

	var selectCat = function(cat)
	{
		for(var i = 0; i < _categories.length; i++)
		{
			if(_categories[i].id === cat)
			   _categories[i].className = 'api_book_item_selected';
			else
			   _categories[i].className = 'api_book_item';
		}
	};

	var isLevelWalk = function(level){
		var isGood = localStorage.getItem('quest_level'+level+'_goodSolution');
		if(isGood === null)
		   return  false;
		return true;
	};

	var isAllBonusTaked = function(level){
		var count = localStorage.getItem('quest_level'+level+'_bonusCount');
		if(parseInt(count) === bonuses[level])
		   return  true;
		return false;
	};

	_game.changeLevel = function(level){
		level = parseInt(level.replace('level-',''));
		currentLevel = level;
		userExecute = false;
		var all = localStorage.getItem('quest_level' + level + '_goodSolution');
		var state = JSON.parse(all);
		if(state !== null)
		   codeEditor.loadState(state.code,state.css);
		else
		   codeEditor.loadLevelCode(levels[level]);
		_game.execute();
	};

	_game.showAPI = function(){
		apibookHTML.style.display = 'block';
		
		if(_categories.length === 0)
		{
			apibookHTML.style.left   = (window_innerWidth /2 - 350).toString() + 'px';
			apibookHTML.style.top    = '20px';   
			apibookHTML.style.width  = '700px';
			apibookHTML.style.height = '600px';

			var title = removeAllChild("api_title");
			for(var i = 0; i < Language.api.categories.length; i++)
			{
				var category = document.createElement('div');
				category.innerHTML =  Language.api.categories[i];
				category.className = "api_book_item";
				category.id = Language.api.categories[i];
				category.setAttribute('onclick', 'game.showFuncFromCategory(this.id)');
				_categories.push(category);
				title.appendChild(category);
			}
		}
	};

	_game.showFuncFromCategory = function(id){
		var note = removeAllChild("api_note");
		selectCat(id);
		for(var i = 0; i < Language.api.api_func.length; i++){
			if(Language.api.api_func[i].category === id){
				var funcName = document.createElement('div');
				var funcDesc = document.createElement('div');
				var separator = document.createElement('br');
				funcName.className = "api_function_name";
				funcName.innerHTML = Language.api.api_func[i].name;
				funcDesc.innerHTML = Language.api.api_func[i].desc;
				note.appendChild(funcName);
				note.appendChild(funcDesc);
				note.appendChild(separator);
			}
		}
	}

	_game.closeNotepad = function(){
		notepadHTML.style.display = 'none';
	};
	_game.closeApiBook = function(){
		apibookHTML.style.display = 'none';
	};
	_game.saveNote = function(){
	  localStorage.setItem('notepad', notepad.getValue());
	};
	_game.saveGoodState = function(){
		var state = {
		  code: codeEditor.getPlayerCode(),
		  css:  codeEditor.getStrings().join(',')
		};
	  localStorage.setItem('quest_level' + currentLevel + "_goodSolution", JSON.stringify(state));
	};
	_game.saveLevel = function(){
		userExecute = false;
		var quest_level = localStorage.getItem("quest_level");
		if(quest_level !== null){
		   var c = parseInt(quest_level);
		   if(currentLevel > c)
			  localStorage.setItem("quest_level", currentLevel);
		}
		else
			localStorage.setItem("quest_level", currentLevel);
	};
	_game.saveBonusCount = function(){
	  localStorage.setItem("quest_level" + currentLevel + "_bonusCount", bonusCount);
	};
	_game.saveTurnsCount = function(){
	  localStorage.setItem("quest_level" + currentLevel + "_turns", turnsOnLevel);
	};
	_game.saveDeadsCount = function(){
	  localStorage.setItem("quest_level" + currentLevel + "_deads", deads);
	};
	_game.userExecute = function() {
		userExecute = true;
		_game.execute();
	};
	_game.load = function(){
		codeEditor.loadLevelCode(levelEditor.getCode());
		_game.execute2();
	};

	var getStars = function(level){
		var s = "";
		var all = bonuses[level];
		
			if(isAllBonusTaked(level))
				s = "<span>&#9734 "+ all + "/" + all +"</span>";
			else{
				var takedBonus = localStorage.getItem('quest_level'+level+'_bonusCount');
				if(takedBonus === null) takedBonus = 0;
				s = "<span class='redStar'>&#9734 "+ takedBonus + "/" + bonuses[level] +"</span>";
			}
		
		return s;
	};

	_game.showMenu = function(){
		menuHTML.style.display = 'block';
		menuHTML.style.left   = (window_innerWidth /2 - 290).toString() + 'px';
		menuHTML.style.top    = (window_innerHeight /2 - 133).toString() + 'px';  
		menuHTML.style.width  = '528px';
		menuHTML.style.height = '347px';

		var menuBody = removeAllChild('menu_body');
		
		for(var i = 0; i < maxLevel; i++)
		{
			var memu_item   = document.createElement('div');
			var level_item  = document.createElement('div');
			var stars_item  = document.createElement('div');
			stars_item.className = 'menu_item_stars_container';
			var levNum = (i + 1);
			var maxLvl = parseInt(localStorage.getItem('quest_level'));	   
			level_item.id = 'level-' + levNum;
			level_item.innerHTML = 'Level-' + levNum;
			if(isLevelWalk(levNum) || levNum === maxLvl){
				stars_item.innerHTML = getStars((i+1));
				level_item.innerHTML = 'Level-' + levNum;
				(isAllBonusTaked(levNum)) ? level_item.className = 'menu_item_green' : level_item.className = 'menu_item_pink';
				level_item.setAttribute('onclick', 'game.changeLevel(this.id);game.closeMenu();');   
			}
			else{
				level_item.className = 'menu_item';
				level_item.innerHTML = '???';
			}
			memu_item.className = 'menu_item_container';
			memu_item.appendChild(level_item);
			memu_item.appendChild(stars_item);
			menuBody.appendChild(memu_item);
		}

		var item = document.createElement('div');
		item.className = "totalBonus";
		item.innerHTML = "&#9734 - " + map.getPlayer().getBonusCount();
		menuBody.appendChild(item);
	};

	_game.closeMenu = function(){
		menuHTML.style.display = 'none';
	};
	_game.execute = function()
	{
		var theEnd    = false;
		if(GameOver)
			return;

		btnSetLevel.style.display   = 'none';
		btnClearSaves.style.display = 'none';
		levelPassword.readOnly      =  true;
		
		levelFooterHTML.innerHTML = Language.moveKeysNote;
		global_error = false;
		messages  = [];
		isMessageQueueWork = false;
		events.length = 0;
		phonefunc = function(){};
		clock.event = function(){};
		window.clearInterval(clock.id_timerInterval);
		window.clearTimeout(clock.id_timer);
		window.clearTimeout(clearmessageTimer);
		window.clearInterval(projectileUpdater);
		window.clearInterval(noiseTimer);
		projectileUpdater = null;
		turnsOnLevel = 0;
		bonusCount   = 0;

		var timer = -999;

		for (var i = 0; i < timersList.length; i++)
			clearInterval(timersList[i]);

		timersList = [];

		try
		{
			canvas.onkeydown = null;
			var s = localStorage.getItem("quest_level");
			var n = localStorage.getItem("notepad");
			turns = localStorage.getItem("turns");
			(turns === null) ? turns = 0 : turns = parseInt(turns);

			if(s != null && s != undefined && firstLaunch){
				if(!fromPassword)
				  currentLevel = localStorage.getItem("quest_level");
				firstLaunch = false;
				fromPassword = false;
			}

			if(n != null && n != undefined)
			   notepad.setValue(localStorage.getItem("notepad"))

			map = new Map();
			map.ambientPlayer.setMute(muted);
			map.simplePlayer.setMute(muted);

			if(codeEditor.getCode() === "")
			   codeEditor.loadLevelCode(levels[currentLevel]);

			eval(codeEditor.getCode());
			container.exec = startLevel;
			map.setEvent('onExit',onExit);
			map.setEvent('validate',validate); 
			
			var begin = function()
			{
				if(timer != -999)
				{
				   background = context.getImageData(0,0,canvas.width,canvas.height); 
				   clearInterval(timer);
				}

				container.exec();
				levelTitleHTML.innerHTML   = "Level - " + currentLevel;
				turnsOnLevelHTML.innerHTML = " turns = " + turnsOnLevel + " ";
				canvas.addEventListener('mousemove', drawCursorPos, false);

				if(!userExecute){
					deads = 0;
					soundIcon.style.display = "inline";
					levelBegin = false;
					map.drawLevelTitle("Level " + currentLevel + " Password:" + passwords[parseInt(currentLevel)]);
					passwordField.value = passwords[parseInt(currentLevel)];
					if(!muted)
					   map.ambientPlayer.play(music[currentLevel].sound);
					else
					   map.ambientPlayer.setSound(music[currentLevel].sound);
				}
				else{
					if(!global_error){
						xcanvas.clearCanvas('#000',background);
						map.draw();
						if(!muted){
						   map.simplePlayer.pause();
						   map.ambientPlayer.play(music[currentLevel].sound);
						}
					}
				}

				musicTitleHTML.innerHTML = music[currentLevel].title;
				map.ambientPlayer.volume = 0.2;

				if(map.getPlayer() === null)
					map.showMessage(Language.playerNotFound,'#fff');

				var isKeyPress = function(event){
					if(!global_error && levelBegin) 
					{
						turnsOnLevelHTML.innerHTML = " turns = " + turnsOnLevel + " ";

						if(event.keyCode === 37 || event.keyCode === 65)
							map.getPlayer().move('left');
						else if(event.keyCode === 38 || event.keyCode === 87)
							map.getPlayer().move('up');
						else if(event.keyCode === 39 || event.keyCode === 68)
							map.getPlayer().move('right');
						else if(event.keyCode === 40 || event.keyCode === 83)
							map.getPlayer().move('down');
						else if(event.keyCode === 81){
							try{
									if(map.getPlayer().hasItem('phone'))
									{
										map.simplePlayer.play('sounds/phone' + ext); 
										phonefunc();
										turns++;
										turnsOnLevel++;
										map.update();
										for(var i = events.length; --i >= 0;){
											if(events[i].event === 'validate'){
											   return events[i].func(map);
											}
										}
									}
									else
									   xcanvas.drawOneLineString('#fff',Language.phoneItemNotFound,3000);
							}
							catch(e){
								map.errorHandler(e)
							}
						}
						else if(event.keyCode === 67){
							_game.clock();
						}
						if(keys.indexOf(event.keyCode) > -1){
							try{
								map.update();
							}
							catch(e){
								map.errorHandler(e)
							}
						}
					}
				};

				var globalKeyPress = function(event)
				{
					if(event.keyCode === 27){//Esc
						(menuHTML.style.display !== 'block') ? _game.showMenu() : _game.closeMenu();
						return false;
					}
					else if((event.ctrlKey && event.keyCode === 49)){ //ctrl + 1
						(apibookHTML.style.display !== 'block') ? _game.showAPI() : _game.closeApiBook();
						return false;
					}
					else if((event.ctrlKey && event.keyCode === 50)){//ctrl + 2
						_game.focus();
						return false;
					}
					else if((event.ctrlKey && event.keyCode === 51)){ //ctrl + 3
						(notepadHTML.style.display !== 'block') ? _game.notepad() : _game.closeNotepad();
						return false;
					}
					else if((event.ctrlKey && event.keyCode === 52)){  //ctrl + 4
						_game.userExecute();
						 return false;
					}
					else if((event.ctrlKey && event.keyCode === 53)){  //ctrl + 5
						_game.reset();	
						return false;
					}
				}

				var isValid = function(){
				   canvas.onkeydown   = isKeyPress; 
				   document.onkeydown = globalKeyPress;
				}

				map.checkCode(codeEditor.getWarnings(),isValid);
			}

			var levNum = parseInt(currentLevel);
			var maxNum = parseInt(maxLevel);
			if(!userExecute){
				xcanvas.clearCanvas('#000');
				if(levNum  < maxNum/2)
				  timer = setInterval(map.fillMapBinaryCode, 33);
				else if(levNum  >= maxNum / 2 && levNum  < maxNum - 5)
				  timer = setInterval(map.fillMapHexCode, 33);
				else
				  timer = setInterval(map.fillMapHexCodeRed , 33);
				  setTimeout(begin, 3500);
			}
			else{
				begin();
			}
		}
		catch(e){
			map.errorHandler(e);
		}
	};  

	_game.execute2 = function()
	{
		try{
			codeEditor.loadLevelCode(levelEditor.getCode());
			_game.execute();
		}
		catch(e){
			map.errorHandler(e);
		}
	};  

	var initDraggedDivs = function(){
		var mydragg = function(){
				return {
					move : function(divid,xpos,ypos){
						divid.style.left = xpos + 'px';
						divid.style.top = ypos + 'px';
					},
					startMoving : function(divid,container,evt){
						evt = evt || window.event;
						var containerHTML = document.getElementById(container);
						var posX = evt.clientX,   posY = evt.clientY,
						divTop = divid.style.top, divLeft = divid.style.left;
						var eWi = parseInt(divid.style.width);
						var eHe = parseInt(divid.style.height);
						var cWi = parseInt(containerHTML.clientWidth);
						var cHe = parseInt(containerHTML.clientHeight);
						containerHTML.style.cursor='move';
						divTop  = divTop.replace('px','');
						divLeft = divLeft.replace('px','');
						var diffX = posX - divLeft, diffY = posY - divTop;
						document.onmousemove = function(evt){
							evt = evt || window.event;
							var posX = evt.clientX,
								posY = evt.clientY,
								aX   = posX - diffX,
								aY   = posY - diffY;
								if (aX < 0) aX = 0;
								if (aY < 0) aY = 0;
								if (aX + eWi > cWi - 10) aX = cWi - eWi - 10;
								if (aY + eHe > cHe - 10) aY = cHe - eHe - 10;
							mydragg.move(divid,aX,aY);
						}
					},
					stopMoving : function(container){
						document.getElementById(container).style.cursor='default';
						document.onmousemove = function(){}
					},
				}
			}();

		  apibookTitleHTML.onmousedown = function(e) {mydragg.startMoving(apibookHTML,"container",e);}
		  apibookTitleHTML.onmouseup   = function(){mydragg.stopMoving("container");}
		  apibookHTML.onmouseup		   = function(){mydragg.stopMoving("container");}

		  notepadTitleHTML.onmousedown = function(e) {mydragg.startMoving(notepadHTML,"container",e);}
		  notepadTitleHTML.onmouseup   = function(){mydragg.stopMoving("container");}
		  notepadHTML.onmouseup   	   = function(){mydragg.stopMoving("container");}

		  menuTitleHTML.onmousedown    = function(e) {mydragg.startMoving(menuHTML,"container",e);}
		  menuTitleHTML.onmouseup      = function(){mydragg.stopMoving("container");}
		  menuHTML.onmouseup   		   = function(){mydragg.stopMoving("container");}
	  }();

	music[1]  = {sound:audioPath + "DST-2ndBallad" + ext,title:'"2ndBallad" by <a href = http://www.nosoapradio.us> DST</a>'};
	music[2]  = {sound:audioPath + "DST-3rdBallad" + ext,title:'"3ndBallad" by <a href = http://www.nosoapradio.us> DST</a>'};
	music[3]  = {sound:audioPath + "DST-BreakIt"+ ext,  title:'"BreakIt" by <a href = http://www.nosoapradio.us> DST</a>'};
	music[4]  = {sound:audioPath + "DST-2ndBallad"+ ext,title:'"2ndBallad" by <a href = http://www.nosoapradio.us> DST</a>'};
	music[5]  = {sound:audioPath + "Electric Rain"+ ext,title:'"Electric Rain" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[6]  = {sound:audioPath + "Infoscape"+ ext,title:'"Infoscape" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[7]  = {sound:audioPath + "Network"+ ext,title:'"Network" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[8]  = {sound:audioPath + "CorporateLadder"+ ext,title:'"Corporate-Ladder_Longer" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[9]  = {sound:audioPath + "DST-2ndBallad"+ ext,title:''};	
	music[10] = {sound:audioPath + "Orbital Colossus"+ ext,title:'"Orbital Colossus" by <a href = http://www.matthewpablo.com> Matthew Pablo</a>'};

	music[11] = {sound:audioPath + "DST-2ndBallad"+ ext,title:''};
	music[12] = {sound:audioPath + "DST-2ndBallad"+ ext,title:''};
	music[13] = {sound:audioPath + "DST-2ndBallad"+ ext,title:''};
	music[14] = {sound:audioPath + "Electric Rain"+ ext,title:'"Electric Rain" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[15] = {sound:audioPath + "dog waltz"+ ext,title:'dog waltz'};
	music[16] = {sound:audioPath + "Space Sprinkles"+ ext,title:'"Space Sprinkles" by <a href = http://www.matthewpablo.com> Matthew Pablo</a>'};
	music[17] = music[16];
	music[18] = {sound:audioPath + "Ghoulish Fun"   + ext,title:'"Ghoulish Fun" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[19] = {sound:audioPath + "Space Sprinkles"+ ext,title:'"Space Sprinkles" by <a href = http://www.matthewpablo.com> Matthew Pablo</a>'};
	music[20] = {sound:audioPath + "Space Sprinkles"+ ext,title:'"Space Sprinkles" by <a href = http://www.matthewpablo.com> Matthew Pablo</a>'};

	music[21] = music[18];
	music[22] = {sound:audioPath + "Mayhem"+ ext,title:'"Mayhem" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[23] = {sound:audioPath + "Mayhem"+ ext,title:'"Mayhem" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[24] = music[10];
	music[25] = {sound:audioPath + "Snake-Trance"+ ext,title:'"Snake-Trance" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[26] = music[25];
	music[27] = {sound:audioPath + "Mayhem"+ ext,title:'"Mayhem" by <a href = http://soundimage.org> Eric Matyas</a>'};
	music[28] = music[10];
	music[29] = music[18];
	music[30] = music[10];

	passwords[1]  = "BNITLDDR";
	passwords[2]  = "PDJZEMEY";
	passwords[3]  = "HSAJMIPX";
	passwords[4]  = "QELBYOWK";
	passwords[5]  = "AETDEKIM";
	passwords[6]  = "EHNFWSQI";
	passwords[7]  = "DCEMGZIN";
	passwords[8]  = "MXDCTNSY";
	passwords[9]  = "AWYPXXLN";
	passwords[10] = "XBIGBOSS";
	passwords[11] = "EGOETIJN";
	passwords[12] = "GTBQUKHI";
	passwords[13] = "ESGWONDH";
	passwords[14] = "DTUBZGVQ";
	passwords[15] = "PFHFUPRN";
	passwords[16] = "ZIQGDCKX";
	passwords[17] = "AQXPVVWH";
	passwords[18] = "YJJKEBFM";
	passwords[19] = "TGGZHILA";
	passwords[20] = "BXIYCCRG";
	passwords[21] = "JOGYCHUA";
	passwords[22] = "LEMKDKNK";
	passwords[23] = "LUDDADET";
	passwords[24] = "IMCOOL][";
	passwords[25] = "JAVACUPS";
	passwords[26] = "ZEREBZVR";
	passwords[27] = "XTXWFXPA";
	passwords[28] = "MRXDEADX";
	passwords[29] = "BOSSHALL";
	passwords[30] = "MEGABOSS";

	levels[1]  = "//[mr-X] Привет счастливчик! \n//[mr-X] Если ты попал в это место - ты как раз тот, кто мне нужен.\n//[mr-X] Я давно ищу программера, способного вытащить меня отсюда.\n//[mr-X] Я помогу тебе, если ты поможешь мне.\n//[mr-X] Всегда есть выбор - идти дальше или умереть. Выбирай.\n\nvar startLevel = function(){\n\tvar room_size = 6;\n\t//room\n\tfor(var i = 0; i < room_size * 3 ; i++){\n\t\tfor(var j = 0; j < room_size; j++){\n\t\t\tif(i === 0 || \n\t\t\t\tj === 0 || i === room_size * 3-1 || j === room_size - 1){\n\t\t\t\tmap.placeObject('block', i, j);\n\t\t\t}\n\t\t\telse{\n\t\t\t\tmap.placeObject('ground', i, j);\n\t\t\t}\n\t\t}\n\t};\n\tmap.placeObject('mine', 1, 4);\n\t//walls\n\tmap.placeObject('block', room_size, 1);\n\tmap.placeObject('movedBlock', room_size, 2);\n\tmap.placeObject('block', room_size, 3);\n\tmap.placeObject('block', room_size, 4);\n\tmap.placeObject('block', room_size*2, 1);\n\tmap.placeObject('block', room_size*2, 2);\n\tmap.placeObject('block', room_size*2, 3);\n\tmap.placeObject('block', room_size*2, 4);\n\t//objects\n\tmap.placeButton(11,4,room_size*2,2);\n\tmap.placeObject('exit', 16, 10);\n\tmap.placeObject('computer', 16, 1);\n\tmap.placeObject('bonus', 16, 4);\n\tmap.placePlayer(2,2);\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('computer', 1);\n\tmap.checkLevelOnCountObject('bonus', 1);\n}\nvar onExit = function(map) {\n\tmap.checkLevelOnInventory('computer');\n};";
	levels[2]  = "//[mr-X] О! Я вижу ты сделал правильный выбор.\n//[mr-X] Продолжай в том же духе и мы сбежим отсюда.\n//[mr-X] P.S. Эти синие блоки здорово взрывают мины. Попробуй.\n\nvar startLevel = function(){\n\tvar room_size = 6;\n\t//room\n\tfor(var i = 0; i < room_size * 2 ; i++){\n\t\tfor(var j = 0; j < room_size; j++){\n\t\t\tif(i === 0 || \n\t\t\t\tj === 0 || i === room_size * 2-1 || j === room_size - 1){\n\t\t\t\tmap.placeObject('block', i, j);\n\t\t\t}\n\t\t\telse{\n\t\t\t\tmap.placeObject('ground', i, j);\n\t\t\t}\n\t\t}\n\t};\n\t<editable>\n\t//mines\n\tfor(var i = 1; i < 5 ; i++){\n\t\tmap.placeObject('mine', 5, i);\n\t\tmap.placeObject('mine', 8, i);\n\t}\n\t<editable>\n\t//wall\n\tfor(var i = 1; i < 5 ; i++)\n\t\tmap.placeObject('block', 9, i);\n\t\n\tmap.placePlayer(2,2);\n\tmap.placeButton(7,4,9,1);\n\tmap.placeObject('bonus', 10, 1);\n\tmap.placeObject('movedBlock',3 , 2);\n\tmap.placeObject('exit', 10, 3);\n\tmap.placeObject('notepad', 6, 3);\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus',1);\n\tmap.checkLevelOnCountObject('exit',1);\n\tmap.checkLevelOnCountObjectType('moved',1);\n}\nvar onExit = function(map) {\n\tmap.checkLevelOnInventory('notepad');\n\tmap.checkLevelOnInventory('computer');\n};";
	levels[3]  = "//[mr-X] Хорошо, теперь посмотрим, как ты справишься с более сложной задачей.\n//[mr-X] P.S. Собирай звезды, они тебе пригодятся.\n\nvar startLevel = function(){\n\tvar arr = [\n\t\t '###############'\n\t\t,'#*m.........m*#'\n\t\t,'#mm.........mm#'\n\t\t,'#.............#'\n\t\t,'#.............#'\n\t\t,'#.............#'\n\t\t,'#.............#'\n\t\t,'#......@.....e#'\n\t\t,'#.............#'\n\t\t,'#.............#'\n\t\t,'#.............#'\n\t\t,'#.............#'\n\t\t,'#mm.........mm#'\n\t\t,'#*m.........m*#'\n\t\t,'###############'\n\t];\n\tvar legend = {'#':'block','@':'player','.':'ground','*':'bonus','m':'mine','e':'exit'};\n\tmap.createFromGrid(arr,legend);    \n\t<editable>\n\tfor(var i = 5; i < 10 ; i++){\n\t\tfor(var j = 5; j < 10; j++){\n\t\t\tif(i === 5 || j === 5 || i === 9 || j === 9){\n\t\t\t\tmap.placeObject('mine', i, j);\n\t\t\t}\n\t\t}\n\t}\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 4);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[4]  = "//[mr-X] Отлично! Теперь самое время заглянуть в API.\n//[mr-X] Для начала изучи раздел 'Map'.\n//[mr-X] P.S. Обрати внимание на функцию 'defineObject'.\n\nvar startLevel = function(){\n\t//room\n\tfor(var i = 0; i < 15 ; i++){\n\t\tfor(var j = 0; j < 15; j++){\n\t\t\tif(i === 0 || j === 0 || i === 14 || j === 14){\n\t\t\t\tmap.placeObject('block', i, j);\n\t\t\t}\n\t\t\telse{\n\t\t\t\tmap.placeObject('ground', i, j);\n\t\t\t}\n\t\t}\n\t};\t\n\tvar drawDeadArea = function(){\n\t\tfor(var i = 3; i < 13 ; i++){\n\t\t\tfor(var j = 1; j < 14; j++){\n\t\t\t\tmap.placeObject('empty', i, j);\n\t\t\t}\n\t\t};\n\t}();\n\tmap.placeObject('bonus',7, 1);\n\tmap.placeObject('bonus',7, 13);\n\tmap.placePlayer(1, 7);\n\tmap.placeObject('exit', 13, 7);\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('ground', 37);\n\tmap.checkLevelOnCountObject('bonus', 2);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {\n\tmap.checkLevelOnInventory('computer');\n};";
	levels[5]  = "//[mr-X] Вижу схватываешь на лету!\n//[mr-X] Посмотрим, как ты выполнишь задачу без моей помощи ;).\n//[mr-X] P.S. Читай таблички [!] они иногда здорово помогают.\n\nvar startLevel = function(){\n\tvar color = '#000';\n\t\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t}\n\t<editable>\n\t<editable>\n\n\t//floor\n\tmap.defineObject({\n\t\tname:'floor',\n\t\tsymbol:'.',\n\t\tcolor: color,\n\t\ttype:'ground'\n\t});\n\n\t//note\n\tmap.defineObject({\n\t\tname:'note',\n\t\tsymbol:'!',\n\t\tcolor:'#f0f',\n\t\ttype:'ground',\n\t\tonPlayerCollision: function(player, me){\n\t\t\tmap.showMessage(\n\t\t\t'[надпись] Только верующий сможет пройти дальше.','#0f0');\n\t\t}\n\t});\n\t\n\t//room\n\tfor(var i = 0; i < 15 ; i++){\n\t\tfor(var j = 0; j < 15; j++){\n\t\t\tif(i === 0 || j === 0 || i === 14 || j === 14){\n\t\t\t\tmap.placeObject('block', i, j);\n\t\t\t}\n\t\t\telse{\n\t\t\t\tmap.placeObject('ground', i, j);\n\t\t\t}\n\t\t} \n\t}; \n\t\n\tvar drawDeadArea = function(){\n\t\tfor(var i = 3; i < 12 ; i++){\n\t\t\tfor(var j = 1; j < 14; j++){\n\t\t\t\tmap.placeObject('empty', i, j);\n\t\t\t} \n\t\t};\n\t}(); \n\t\n\tvar trust = function(){\n\t\tvar n = getRandomInt(1, 12);\n\t\tfor(var i = 3; i < 12 ; i++){\n\t\t\tmap.placeObject('floor', i, n);\n\t\t};\n\t}();\n\t\n\tmap.placeObject('note',2, 7); \n\tmap.placeObject('bonus',13, 8);  \n\tmap.placePlayer(1, 7);\n\tmap.placeObject('exit', 13, 7);\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 1);\n\tmap.checkLevelOnCountObject('exit', 1);\n\tmap.checkLevelOnCountObjectType('ground',60);\n}\nvar onExit = function(map) {\n\tmap.checkLevelOnInventory('computer');\n};";
	levels[6]  = "//[mr-X] Посмотри на этих охранников, это же отъявленные убийцы.\n//[mr-X] Тебе срочно нужно что-то придумать, иначе они тебя убьют.\n//[mr-X] P.S. удачи ;)\n\nvar startLevel = function(){\n\t//AI :)\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0)\n\t\t\treturn;\n\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse\n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t}\n\n\tmap.defineObject({\n\t\tname:'guard',\n\t\tsymbol:'G',\n\t\tcolor: '#f00', \n\t\ttype:'dynamic',\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t\tbehavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t} \n\t}); \n\n\tvar arr = [\n\t\t '############'\n\t\t,'#....*.....#'\n\t\t,'#..........#'\n\t\t,'#..........#'\n\t\t,'#..........#'\n\t\t,'#.......G..#'\n\t\t,'#.@.....G.e#'\n\t\t,'#.......G..#'\n\t\t,'#..........#'\n\t\t,'#..........#'\n\t\t,'#.......*..#'\n\t\t,'############'\n\t]; \n\t   \n\tvar legend = {\t'#':'block'\n\t\t\t\t  ,'@':'player'\n\t\t\t\t  ,'.':'ground'\n\t\t\t\t  ,'*':'bonus'\n\t\t\t\t  ,'G':'guard'\n\t\t\t\t  ,'e':'exit'\n\t\t\t\t };\n\tmap.createFromGrid(arr,legend);\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('exit' , 1);\n\tmap.checkLevelOnCountObject('bonus', 2);\n}\nvar onExit = function(map) {\n\treturn map.checkLevelOnInventory('computer');\n};";
	levels[7]  = "//[mr-X] Видишь комнату охраны? Просто так туда не попасть.\n//[mr-X] Нужно стащить телефон, пока там никого нет.\n//[mr-X] P.S. загляни в API.\n\nvar startLevel = function(){\n\t//AI :)\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0)\n\t\t\treturn;\n\t\t\t\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse\n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t}\n\t//guard\n\tmap.defineObject({\n\t\tname:'guard',\n\t\tsymbol:'G',\n\t\tcolor: '#ff0', \n\t\ttype:'dynamic',\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t\tbehavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t}\n\t});\n\t//scroll\n\tmap.defineObject({\n\t\tname:'note',\n\t\tsymbol:'!',\n\t\tcolor: '#0ff', \n\t\ttype:'ground',\n\t\tonPlayerCollision:function(player, me){\n\t\t\tmap.showMessage(Language.scroll2Text, '#ff0', 5000);\n\t\t}\n\t});\n\t\n\tvar arr = [\n\t\t '############'\n\t\t,'#...G......#'\n\t\t,'#..#G......#'\n\t\t,'#..######..#'\n\t\t,'#..#...*#..#'\n\t\t,'#..#....#.e#'\n\t\t,'#!@#....#..#'\n\t\t,'#..#T..*#..#'\n\t\t,'#..######..#'\n\t\t,'#...G......#'\n\t\t,'#..#G......#'\n\t\t,'############'\n\t]; \n\t   \n\tvar legend = { '#':'block'\n\t\t\t\t  ,'@':'player'\n\t\t\t\t  ,'.':'ground'\n\t\t\t\t  ,'*':'bonus'\n\t\t\t\t  ,'G':'guard'\n\t\t\t\t  ,'e':'exit'\n\t\t\t\t  ,'T':'phone'\n\t\t\t\t  ,'!':'note'\n\t\t\t\t };\n\tmap.createFromGrid(arr,legend);   \n\t<editable>\n\t<editable>\n}\n\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 2);\n\tmap.checkLevelOnCountObject('phone', 1);\n\tmap.checkLevelOnCountObject('mine',  0);\n\tmap.checkLevelOnCountObject('exit',  1);\n\tmap.checkLevelOnCountObjectType('button', 2);\n}\nvar onExit = function(map) {\n\treturn map.checkLevelOnInventory('phone');\n};";
	levels[8]  = "//[mr-X] Осторожно! Пол защищен сигнализацией.\n//[mr-X] Один неверный шаг и ты убит.\n//[mr-X] P.S. используй добытый телефон, клавиша Q, либо кнопка 'Phone' меню.\n\nvar startLevel = function(){\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t}\n\t\n\tmap.defineObject({\n\t\t\t\t\tname:'red',\n\t\t\t\t\tsymbol:'.',\n\t\t\t\t\tcolor: '#f00',\n\t\t\t\t\ttype:'ground', \n\t\t\t\t\tplaceItem:false,\n\t\t\t\t\tplaceGround:false,\n\t\t\t\t\tonPlayerCollision:function(player, me){\n\t\t\t\t\t\tif(player.getColor() !== me.color)\n\t\t\t\t\t\t\tplayer.kill();\n\t\t\t\t\t}\n\t\t\t\t});\n\n\tmap.defineObject({\n\t\t\t\t\tname:'green',\n\t\t\t\t\tsymbol:'.',\n\t\t\t\t\tcolor: '#0f0',\n\t\t\t\t\ttype:'ground',\n\t\t\t\t\tplaceItem:false,\n\t\t\t\t\tplaceGround:false,\n\t\t\t\t\tonPlayerCollision:function(player, me){\n\t\t\t\t\t\tif(player.getColor() !== me.color)\n\t\t\t\t\t\t\tplayer.kill();\n\t\t\t\t\t}\n\t\t\t\t });\n\n\tmap.defineObject({\n\t\t\t\t\tname:'blue',\n\t\t\t\t\tsymbol:'.',\n\t\t\t\t\tcolor: '#00f',\n\t\t\t\t\ttype:'ground',\n\t\t\t\t\tplaceItem:false,\n\t\t\t\t\tplaceGround:false,\n\t\t\t\t\tonPlayerCollision:function(player, me){\n\t\t\t\t\t\tif(player.getColor() !== me.color)\n\t\t\t\t\t\t\tplayer.kill();\n\t\t\t\t\t}\n\t\t\t\t});\n\n\t//mines\n\tfor(var i = 1; i < 4 ; i++){\n\t\tmap.placeObject('mine', 16, i);\n\t\tmap.placeObject('mine', 3, 19 - i);\n\t}\n\tfor(var i = 17; i < 19 ; i++){\n\t\tmap.placeObject('mine', i, 3);\n\t\tmap.placeObject('mine', i-16, 16);\n\t}\n\t//objects\n\tmap.placeObject('bonus', 18, 1);\n\tmap.placeObject('bonus', 1, 18);\n\tmap.placeObject('exit', 18, 18);\n\tmap.placePlayer(1, 1); \n\n\t//room\n\tfor(var i = 0; i < 20 ; i++){\n\t\tfor(var j = 0; j < 20; j++){\n\t\t\tif(map.whoIs(i,j) === 'null')\n\t\t\t{\n\t\t\t\tif(i === 0 || j === 0 || i === 19 || j === 19)\n\t\t\t\t\tmap.placeObject('block', i, j);\n\t\t\t\telse\n\t\t\t\t{\n\t\t\t\t\tvar n = getRandomInt(1,100);\n\t\t\t\t\tif(n<=33)\n\t\t\t\t\t\tmap.placeObject('red', i, j);\n\t\t\t\t\telse if(n>33 && n<=66)\n\t\t\t\t\t\tmap.placeObject('green', i, j);\n\t\t\t\t\telse if(n>66)\n\t\t\t\t\t\tmap.placeObject('blue', i, j);\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t};\n\n\tvar player = map.getPlayer();\n\tplayer.setPhoneCallback(function(){ //use Q or Phone button\n\t\t<editable>player.setColor('#0ff'); \n\t\t<editable>\n\t});\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 2);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[9]  = "//[mr-X] z-z-z ;)\n\nvar startLevel = function(){\n\t//room\n\tfor(var i = 0; i < 15 ; i++){\n\t\tfor(var j = 0; j < 15; j++){\n\t\t\tif(i === 0 || j === 0 || i === 14 || j === 14)\n\t\t\t\tmap.placeObject('block', i, j);\n\t\t\telse\n\t\t\t\tmap.placeObject('ground', i, j);\n\t\t} \n\t};\n\t//fireball\n\tmap.defineObject(\n\t{\n\t\tname:'fireball',\n\t\tcolor:'#fa0',\n\t\tsymbol:'*',\n\t\ttype:'projectile',\n\t\tbehavior:function(me){\n\t\t\tme.move('down'); \n\t\t}\n\t});\n\t//iceball\n\tmap.defineObject(\n\t{\n\t\tname:'iceball',\n\t\tcolor:'#aaf',\n\t\tsymbol:'*',\n\t\ttype:'projectile',\n\t\tbehavior:function(me){\n\t\t\tme.move('up'); \n\t\t}\n\t});\n\tmap.placeObject('bonus', 1, 1);\n\tmap.placeObject('bonus', 13, 1);\n\tmap.placeObject('bonus', 1, 13);\n\tmap.placeObject('bonus', 7, 13);\n\tmap.placeObject('exit', 13, 13);\n\tmap.placePlayer(7, 7);\n\n\tfor(var i = 1; i < 14 ; i++){\n\t\tmap.placeObject('fireball', i, 2);\n\t\tmap.placeObject('iceball', i, 12);\n\t}\n\t<editable>\n\t<editable>\n\t<editable>\n}\n\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 4);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[10] = "//[mr-X] Это первое настоящее испытание.\n//[mr-X] Далеко не все смогли преодолеть его.\n//[mr-X] Используй знания и опыт, полученный на предыдущих заданиях.\n//[mr-X] Убей начальника охраны и его помощников.\n//[mr-X] P.S. Обрати внимание на robo-Z и robo-V.\n\nvar startLevel = function(){\n\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0) return;\n\t\t\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse\n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t};\n\t//bullet\n\tmap.defineObject({\n\t\tname:'bullet',\n\t\tsymbol:'*',\n\t\tcolor: '#f0f', \n\t\ttype:'projectile',\n\t\tbehavior:function(me){\n\t\t   me.move('left');\n\t\t} \n\t});\n\t//boss  \n\tmap.defineObject({\n\t\tname:'boss',\n\t\tsymbol:'B',\n\t\tcolor: '#ff0', \n\t\ttype:'dynamic',\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t\tbehavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t\tif(map.whoIs(me.getX() - 1, me.getY()) === 'ground')\n\t\t\t\tmap.placeObject('bullet',me.getX() - 1, me.getY());\n\t\t},\n\t\tonDead:function(me){\n\t\t\tmap.placeObject('exit',me.getX(), me.getY());\n\t\t\tvar grd = map.getObjectsCoords('ground');\n\t\t\tfor(var i = 0; i < 4; i++)\n\t\t\t\tmap.placeObject('bonus',grd[i].x,grd[i].y);\n\t\t}\n\t});\n\t//robo-T\n\tmap.defineObject({\n\t\tname:'robo-T',\n\t\tsymbol:'G',\n\t\tcolor: '#f00', \n\t\ttype:'dynamic',\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t\tbehavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t},\n\t\tonDead:function(me){\n\t\t\tmap.placeObject('block', me.getX(), me.getY());\n\t\t}\n\t});\n\t//robo-V\n\tmap.defineObject({\n\t\tname:'robo-V',\n\t\tsymbol:'G',\n\t\tcolor: '#f0f', \n\t\ttype:'dynamic',\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t\tbehavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t},\n\t\tonDead:function(me){\n\t\t\tmap.placeObject('movedBlock', 12, 1);\n\t\t}\n\t});\n\t//robo-Z\n\tmap.defineObject({\n\t\tname:'robo-Z',\n\t\tsymbol:'G',\n\t\tcolor: '#ff0', \n\t\ttype:'dynamic',\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t\tbehavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t},\n\t\tonDead:function(me){\n\t\t\tmap.placeObject('movedBlock', 12, 13);\n\t\t}\n\t});\n\t\n\tvar arr = [\n\t\t '###############'\n\t\t,'#@...........q#'\n\t\t,'#.............#'\n\t\t,'#.............#'\n\t\t,'#.....GGG.....#'\n\t\t,'#....#####....#'\n\t\t,'#...G#####G...#'\n\t\t,'#...G##B##Z...#'\n\t\t,'#...G#####G...#'\n\t\t,'#....#####....#'\n\t\t,'#.....GVG.....#'\n\t\t,'#.............#'\n\t\t,'#.............#'\n\t\t,'#............w#'\n\t\t,'###############'\n\t];\n\t\n\tvar legend = {\n\t\t '#':'block'\n\t\t,'@':'player'\n\t\t,'.':'ground'\n\t\t,'G':'robo-T'\n\t\t,'V':'robo-V'\n\t\t,'Z':'robo-Z'\n\t\t,'B':'boss'\n\t\t,'q':function(){map.placeButton(13,1,5,7)}\n\t\t,'w':function(){map.placeButton(13,13,6,7)}\n\t};\n\tmap.createFromGrid(arr,legend);\t \n\t<editable>\n\t<editable>\n\t<editable>\n};\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('empty', 1);\n\tmap.checkLevelOnCountObject('mine',  3);\n\tmap.checkLevelOnCountObject('bonus', 4);\n\tmap.checkLevelOnCountObject('exit',  1);\n\tmap.checkLevelOnCountObjectType('moved',  2);\n\tmap.checkLevelOnCountObjectType('button', 2);\n\tmap.checkLevelOnCountObjectType('dynamic',16);\n};\nvar onExit = function(map) {\n\tif(map.getObjectCount('boss') === 0)\n\t\treturn true;\n\telse\n\t\tmap.showMessage('boss не убит.','#fff');\n\n\treturn false;\n};";
	levels[11] = "//[mr-X] Поздравляю! Теперь ты не новичок, а солдат армии mr-X ;) \n//[mr-X] Дальше задания будут еще сложнее, так что расслабляться рано.\n//[mr-X] P.S. не забывай поcматривать в API.\n\nvar startLevel = function(){\n\n\t//robo-T\n\tmap.defineObject(\n\t{\n\t\tname:'robo-T',\n\t\tcolor:'#ff0',\n\t\tsymbol:'R',\n\t\ttype:'dynamic',\n\t\tbehavior:function(me)\n\t\t{\n\t\t\t//use canMove(dir), move(dir) functions and MapScanner API\n\t\t\t<editable>if(me.canMove('left'))\n\t\t\t<editable>\tme.move('left');\n\t\t}\n\t});\n\t\n\tmap.defineObject(\n\t{\n\t\tname:'note',\n\t\tcolor:'#ccf',\n\t\tsymbol:'!',\n\t\ttype:'ground',\n\t\tonPlayerCollision:function(){\n\t\t  map.showMessage('Доведите робота до кнопки.','#fff');\n\t\t}\n\t});\n\t\n\tvar arr = [\n\t\t\t '###############'\n\t\t\t,'#...*....#b..e#'\n\t\t\t,'#........#....#'\n\t\t\t,'#........#....#'\n\t\t\t,'#........#....#'\n\t\t\t,'#........#....#'\n\t\t\t,'#........#....#'\n\t\t\t,'#........#....#'\n\t\t\t,'#........######'\n\t\t\t,'#........#....#'\n\t\t\t,'#........#....#'\n\t\t\t,'#...b....#....#'\n\t\t\t,'#........#....#'\n\t\t\t,'#........#.n..#'\n\t\t\t,'#........#....#'\n\t\t\t,'#........#.@..#'\n\t\t\t,'#........#....#'\n\t\t\t,'#...R...b#....#'\n\t\t\t,'###############'\n\t\t]\n\t\t\n\tvar legend = {\t\n\t\t'@':'player'\n\t\t,'.':'ground'\n\t\t,'#':'block'\n\t\t,'e':'exit'\n\t\t,'*':function(){map.placeButton(4,1,12,8)}\n\t\t,'b':'bonus'\n\t\t,'R':'robo-T'\n\t\t,'n':'note'\n\t};\n\n\tmap.createFromGrid(arr,legend);\n}\n\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 3);\n\tmap.checkLevelOnCountObjectType('button', 1);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[12] = "//[mr-X] sleep mode set on; no comments set on;\n\nvar startLevel = function(){\n\t//robo-T\n\tmap.defineObject(\n\t{\n\t\tname:'robo-T',\n\t\tcolor:'#ff0',\n\t\tsymbol:'R',\n\t\ttype:'dynamic',\n\t\tbehavior:function(me)\n\t\t{\n\t\t\t//use canMove(dir), move(dir) functions and MapScanner API\n\t\t\t<editable>if(me.canMove('left'))\n\t\t\t<editable>\tme.move('left');\n\t\t}\n\t});\n\t\n\tvar arr = [\n\t\t\t '###############'\n\t\t\t,'#.....*...#b.e#'\n\t\t\t,'#.#########...#'\n\t\t\t,'#.........#...#'\n\t\t\t,'#########.#...#'\n\t\t\t,'#.........#...#'\n\t\t\t,'#.#########...#'\n\t\t\t,'#....q....#####'\n\t\t\t,'#########.#...#'\n\t\t\t,'#....b....#...#'\n\t\t\t,'#.#########...#'\n\t\t\t,'#.........#...#'\n\t\t\t,'#########.#...#'\n\t\t\t,'#.........#...#'\n\t\t\t,'#.#########...#'\n\t\t\t,'#.........#...#'\n\t\t\t,'#########.#.###'\n\t\t\t,'#R........#.#@#'\n\t\t\t,'###############'\n\t\t]\n\t\t\n\tvar legend = {\t\n\t\t'@':'player'\n\t\t,'.':'ground'\n\t\t,'#':'block'\n\t\t,'e':'exit'\n\t\t,'*':function(){map.placeButton(6,1,12,7)}\n\t\t,'q':function(){map.placeButton(5,7,12,17)}\n\t\t,'b':'bonus'\n\t\t,'R':'robo-T'\n\t};\n\n\tmap.createFromGrid(arr,legend);\n}\n\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 3);\n\tmap.checkLevelOnCountObjectType('button', 2);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[13] = "//[mr-X] Кнопки стали не такими простыми как раньше.\n//[mr-X] Чтобы сработало нажатие нужно соответствовать цвету кнопки.\n//[mr-X] P.S. cмотри API.\n\nvar startLevel = function(){\n\t//robo-T\n\tmap.defineObject(\n\t{\n\t\tname:'robo-T',\n\t\tcolor:'#ff0',\n\t\tsymbol:'R',\n\t\ttype:'dynamic',\n\t\tbehavior:function(me)\n\t\t{\n\t\t\t//use canMove(dir), move(dir), setColor(color) functions \n\t\t\t//and MapScanner API\n\t\t\t<editable>\n\t\t\t<editable>\n\t\t\t<editable>\n\t\t}\n\t});\n\t\n\tvar arr = [\n\t\t\t '#########################'\n\t\t\t,'#R#...#...#...#...#b...e#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#b#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#######'\n\t\t\t,'#.#.#q#.#.#.#b#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#.....#'\n\t\t\t,'#.#.#.#.#.#.#.#.#.#..####'\n\t\t\t,'#...#...#...#...#*#..#.@#'\n\t\t\t,'#########################'\n\t\t]\n\t\t\n\tvar legend = {\t\n\t\t'@':'player'\n\t\t,'.':'ground'\n\t\t,'#':'block'\n\t\t,'e':'exit'\n\t\t,'*':function(){map.placeColorButton('btn1',17,16,21,9,'#0f0')}\n\t\t,'q':function(){map.placeColorButton('btn2',5,10,21,16,'#f00')}\n\t\t,'b':'bonus'\n\t\t,'R':'robo-T'\n\t};\n\n\tmap.createFromGrid(arr,legend);\n}\n\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 3);\n\tmap.checkLevelOnCountObjectType('button', 2);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[14] = "//[mr-X] Вижу управлять одним роботом для тебя не такая сложная задача. \n//[mr-X] А если их будет больше ;)\n//[mr-X] Тебе необходимо проявить таланты по програмированию AI.\n//[mr-X] Только слаженная работа роботов поможет тебе выполнить это задание.\n//[mr-X] P.S. не забывай про звезды, они тебе очень скоро пригодятся.\n\nvar startLevel = function(){\n\t//robo-T1\n\tmap.defineObject({\n\t\tname:'robo-T1',\n\t\tsymbol:'R',\n\t\tcolor:'red',\n\t\ttype:'dynamic',\n\t\tbehavior: function(me){\n\t\t\t<editable>if(me.canMove('right'))\n\t\t\t<editable>  me.move('right');\n\t\t\t<editable>\n\t\t}\n\t});\n\t//robo-T2\n\tmap.defineObject({\n\t\tname:'robo-T2',\n\t\tsymbol:'R',\n\t\tcolor:'yellow',\n\t\ttype:'dynamic',\n\t\tbehavior: function(me){\n\t\t\t<editable>if(me.canMove('left'))\n\t\t\t<editable>  me.move('left');\n\t\t\t<editable>\n\t\t}\n\t});  \n\t//note\n\tmap.defineObject({\n\t\tname:'note',\n\t\tsymbol:'!',\n\t\tcolor:'#f0f',\n\t\ttype:'ground',\n\t\tonPlayerCollision: function(player, me){\n\t\t\tmap.showMessage(\n\t\t\t'[надпись] Помогите роботам открыть вам двери...','#0f0');\n\t\t}\n\t});\n\t\n\tvar arr = [\n\t\t '#################'\n\t\t,'#..b.#....#.*..e#'\n\t\t,'#....#....#.....#'\n\t\t,'#....#....#.....#'\n\t\t,'#....#...*#.....#'\n\t\t,'#....#....#.....#'\n\t\t,'#....#....#.....#'\n\t\t,'#..*.#.c..#.....#'\n\t\t,'#################'\n\t\t,'#....#....#.....#'\n\t\t,'#....#..*.#.....#'\n\t\t,'#....#....#.....#'\n\t\t,'#..*.#....#.....#'\n\t\t,'#....#....#.....#'\n\t\t,'#....#....#.....#'\n\t\t,'#a..R#...V#.@..!#'\n\t\t,'#################'\n\t];\n\t\n\tvar legend = {\n\t\t '#':'block'\n\t\t,'@':'player'\n\t\t,'.':'ground'\n\t\t,'*':'bonus'\n\t\t,'R':'robo-T1'\n\t\t,'V':'robo-T2'\n\t\t,'e':'exit'\n\t\t,'a':function(){map.placeButton(1,15,6,8)}\n\t\t,'b':function(){map.placeButton(3,1,13,8)}\n\t\t,'c':function(){map.placeButton(7,7,2,8)}\n\t\t,'!':'note'\n\t}\n\n\tmap.createFromGrid(arr,legend);\n}\n\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObjectType('dynamic', 3);\n\tmap.checkLevelOnCountObjectType('button', 3);\n\tmap.checkLevelOnCountObject('bonus', 5);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[15] = "//[mr-X] Ну что сказать - собака она и есть собака.\n//[mr-X] С ней не договоришься.\n//[mr-X] P.S. а я напоминал про бонусы ;)\n\nvar startLevel = function(){\n\nmap.defineObject({\n\tname:'dog',\n\tsymbol:'d',\n\ttype:'dynamic',\n\tcolor:'#ff0',\n\tonPlayerCollision:function(player,me){\n\t\tif(player.getBonusCount() >= 20){\n\t\t\tme.move('up');\n\t\t\tmap.showMessage('[собака] Проходите!!!','#fff');\n\t\t}\n\t\telse\n\t\t\tmap.showMessage('[собака] Нужно не менее 20 бонусов!!!','#fff');\n\t}\n});\n\nvar arr = [\n\t\t\t '#########      '\n\t\t\t,'#.......#      '\n\t\t\t,'#..###..#      '\n\t\t\t,'#.##b##.#      '\n\t\t\t,'#.##d##.#  ####'\n\t\t\t,'#.......###..*#'\n\t\t\t,'#.......#...e.#'\n\t\t\t,'#...@...###...#'\n\t\t\t,'#.......#  ####'\n\t\t\t,'#########      '\n\t\t  ]\n\t\t\n\t\tvar legend = {\n\t\t\t'@':'player'\n\t\t\t,'.':'ground'\n\t\t\t,'#':'block'\n\t\t\t,'e':'exit'\n\t\t\t,'':'block'\n\t\t\t,'*':'bonus'\n\t\t\t,'b':function(){map.placeButton(4,3,8,6)},'d':'dog'\n\t\t};\n\t\t\n\t\tmap.createFromGrid(arr,legend);\n}\n//validator\nvar validate = function(map) {};\nvar onExit   = function(map) {};";
	levels[16] = "//[mr-X] Ну вот и солнечный свет.\n//[mr-X] Пройди через лес и не заблудись.\n//[mr-X] P.S. деревья двигаются.\n\nvar startLevel = function(){\n\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\n\tmap.defineObject({\n\t\tname:'grass',\n\t\tsymbol:String.fromCharCode(0x0027),\n\t\tcolor: '#0f0',\n\t\ttype:'ground',\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'tree',\n\t\tsymbol:'&',\n\t\tcolor: '#0f0',\n\t\ttype:'moved',\n\t});\n\n\tvar generateForest = function(){\n\t\tvar arr  = map.getObjectsCoords('grass');\n\t\tvar arr2 = map.getObjectsCoords('tree');\n\t\t\n\t\tfor(var i = 0; i < arr.length; i++){\n\t\t\t if(Math.random() > 0.5)\n\t\t\t\tmap.placeObject('tree',arr[i].x,arr[i].y);\n\t\t}\n\t\t\n\t\tarr = map.getObjectsCoords('grass');\n\t\tvar a = getRandomInt(0,arr.length-1);\n\t\tarr.splice(a,1);\n\t\tvar b = getRandomInt(0,arr.length-1);\n\t\tmap.placeObject('bonus', arr[a].x, arr[a].y);\n\t\tmap.placeObject('bonus', arr[b].x, arr[b].y);\n\t}\n\t\t\n\tfor(var i = 0; i < 25; i++){\n\t\tfor(var j = 0; j < 20; j++){\n\t\t\tmap.placeObject('grass',i,j);\n\t\t}\n\t}\n\t\n\tfor(var i = 10; i < 16; i++){\n\t\tfor(var j = 10; j < 16; j++){\n\t\t\tif(i!== 10 || j !== 10 || i !== 15 || j !== 15)\n\t\t\t\tmap.placeObject('ground',i,j);\n\t\t}\n\t}\n\n\tmap.placePlayer(12,12);\n\tmap.placeObject('exit',1,1);\n\t\t\n\tgenerateForest();\n\tvar player = map.getPlayer();\n\tplayer.setColor('#0ff');\n\t<editable>\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 2);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[17] = "//[mr-X] О нет! Охранники ищут тебя!\n//[mr-X] Не попадайся им на глаза.\n//[mr-X] P.S. я верю в тебя.\n\nvar startLevel = function(){\n\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\t\t\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0) return;\n\t\t\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse \n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t}\n\t\n\tmap.defineObject({\n\t\tname:'note',\n\t\tsymbol:'!',\n\t\tcolor:'#f0f',\n\t\ttype:'ground',\n\t\tonPlayerCollision: function(player, me){\n\t\t\tmap.showMessage('[Эхо] Он где-то рядом!','#0f0');\n\t\t}\n\t});\n\n\tmap.defineObject({\n\t\tname:'grass',\n\t\tsymbol:String.fromCharCode(0x0027),\n\t\tcolor: '#0f0', type:'ground'\n\t});\n\t\n\tmap.defineObject({name:'tree',symbol:'&',color: '#0f0',type:'moved'});\n\t\n\tmap.defineObject({\n\t\tname:'guard',\n\t\tsymbol:'G',\n\t\tcolor: '#f00',\n\t\ttype:'dynamic',\n\t\tbehavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t},\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t});\n\t\n\tvar generateForest = function(){\n\t\tfor(var i = 0; i < 25; i++){\n\t\t\tfor(var j = 0; j < 20; j++){\n\t\t\t\tif(map.whoIs(i,j)==='null')\n\t\t\t\t{\n\t\t\t\t\tif(Math.random() > 0.5)\n\t\t\t\t\t\tmap.placeObject('tree',i,j) \n\t\t\t\t\telse\n\t\t\t\t\t\tmap.placeObject('grass',i,j)\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\tarr = map.getObjectsCoords('grass');\n\t\tfor(var i = 0; i < 2; i++){\n\t\t\tvar a = getRandomInt(0,arr.length-1);\n\t\t\tmap.placeObject('bonus', arr[a].x, arr[a].y);\n\t\t\tarr.splice(a,1);\n\t\t}\n\t\t\n\t\tfor(var i = 0; i < 5; i++){\n\t\t\tvar a = getRandomInt(0,arr.length-1);\n\t\t\tmap.placeObject('guard', arr[a].x, arr[a].y);\n\t\t\tarr.splice(a,1);\n\t\t}\n\t}\n\n\tmap.placePlayer(12,10);\n\tmap.placeObject('note',11,10);\n\tmap.placeObject('exit',1,1);\n\tgenerateForest();\n\tvar player = map.getPlayer();\n\tplayer.setColor('#0ff');\n\t//use mapScanner API that search guards\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 2);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[18] = "//[mr-X] Вот незадача, перед вами река, а плавать вы не умеете ;)\n//[mr-X] Но, не беда - в реке плавает лодка.\n//[mr-X] Возьмите лодку и бегом на другой берег.\n\nvar startLevel = function(){\n\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\t\n\tmap.defineObject({\n\t\tname:'vessel',\n\t\tsymbol:String.fromCharCode(0x23C5),\n\t\tcolor: '#603606', \n\t\ttype:'dynamic',\n\t\ttransport:true,\n\t\tbehavior:function(me){\n\t\t\t<editable>\n\t\t},\n\t\tonTake:function(){\n\t\t\treturn true;\n\t\t}\n\t});\n\n\tmap.defineObject({\n\t\tname:'grass',\n\t\tsymbol:String.fromCharCode(0x0027),\n\t\tcolor: '#0f0', type:'ground'\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'water',\n\t\tplaceOnMe:false,\n\t\tsymbol:'~',\n\t\tcolor: '#0ff',\n\t\ttype:'ground',\n\t\tonCollision:function(object){\n\t\t\tif(object.name === 'vessel')\n\t\t\t\treturn;\n\t\t\n\t\t\tif(object.type !== 'dynamic' && object.name != 'player'){\n\t\t\t\tobject.kill();\n\t\t\t\treturn;\n\t\t\t}\n\t\t\t\n\t\t\tif(!object.hasItem('vessel'))\n\t\t\t\tobject.kill('утонул в воде');\n\t\t}\n\t});\n\n\tmap.defineObject({name:'tree',symbol:'&',color: '#0f0',type:'moved'});\n\n\tvar generateForest = function(){\n\t\tfor(var i = 0; i < 25; i++){\n\t\t\tfor(var j = 0; j < 20; j++){\n\t\t\t\tif(map.whoIs(i,j)==='grass')\n\t\t\t\t\tif(Math.random() > 0.4)\n\t\t\t\t\t\tmap.placeObject('tree',i,j) \n\t\t\t}\n\t\t}\n\n\t\tarr = map.getObjectsCoords('grass');\n\t\tfor(var i = 0; i < 2; i++){\n\t\t\tvar a = getRandomInt(0,arr.length-1);\n\t\t\tmap.placeObject('bonus', arr[a].x, arr[a].y);\n\t\t\tarr.splice(a,1);\n\t\t}\n\t};\n\t\n\tvar placeRandom = function(name,count,arr){\n\t\tfor(var i = 0; i < count; i++){\n\t\t\tvar z = getRandomInt(0,a.length - 1);\n\t\t\tmap.placeObject(name, arr[z].x, arr[z].y);\n\t\t\tarr.splice(z,1);\n\t\t}\n\t};\n\t\n\tvar a = [];\n\t\n\tfor(var i = 0; i < 25; i++)\n\t\tfor(var j = 8; j < 13; j++) \n\t\t\ta.push({x:i,y:j});\n\n\tplaceRandom('mine',5,a);\n\tplaceRandom('vessel',1,a);\n\t\n\tfor(var i = 0; i < 25; i++){\n\t\tfor(var j = 0; j < 20; j++){\n\t\t\tif(map.whoIs(i,j) === 'null')\n\t\t\t   map.placeObject('grass', i, j);\n\t\t}\n\t}\n\t\n\tfor(var i = 0; i < 25; i++){\n\t\tfor(var j = 8; j < 13; j++){\n\t\t\tif(map.whoIs(i,j) === 'grass')\n\t\t\tmap.placeObject('water', i, j);\n\t\t}\n\t}\n\t\n\tmap.placePlayer(12,15);\n\tmap.placeObject('exit',1,1);\n\tgenerateForest();\n\tvar player = map.getPlayer();\n\tplayer.setColor('#0ff');\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus',  2);\n\tmap.checkLevelOnCountObject('exit',   1);\n\tmap.checkLevelOnCountObject('vessel', 1);\n}\nvar onExit = function(map) {};";
	levels[19] = "//[mr-X] Дойти до 19-го уровня и быть съеденным крокодилом это просто мечта ;)\n//[mr-X] Переплыви реку, я буду ждать тебя на другом берeгу.\n//[mr-X] P.S. крокодилов лучше избегать ;)\n\nvar startLevel = function(){\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\t\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0) return;\n\t\t\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse \n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t}\n\t\n\tmap.defineObject({\n\t\tname:'grass',\n\t\tsymbol:String.fromCharCode(0x0027),\n\t\tcolor: '#0f0', type:'ground'\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'crocodyle',\n\t\tsymbol:'K',\n\t\tcolor: '#0f0',\n\t\ttype:'dynamic',\n\t\tbehavior:function(me){\n\t\t\tvar player = map.getPlayer();\n\t\t\tif(player.getY() < 15)\n\t\t\t\tmoveToward(me,'player');\n\t\t},\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t\tonDead: function(){\n\t\t\tvar waters = map.getObjectsCoords('water');\n\t\t\tfor(var i = 0; i < 2; i++){\n\t\t\t\tvar a = getRandomInt(0,waters.length-1);\n\t\t\t\tmap.placeObject('crocodyle', waters[a].x, waters[a].y);\n\t\t\t\twaters.splice(a,1);\n\t\t\t}\n\t\t}\n\t});\n\n\tmap.defineObject({\n\t\tname:'water',\n\t\tplaceOnMe:false,\n\t\tsymbol:'~',\n\t\tcolor: '#0ff',\n\t\ttype:'ground',\n\t\tonCollision:function(object){\n\t\t\tif(object.name === 'crocodyle')\n\t\t\treturn;\n\t\t\tif(object.type !== 'dynamic' && object.name !== 'player'){\n\t\t\t\tobject.kill();\n\t\t\t\treturn;\n\t\t\t}\n\t\t\tif(!object.hasItem('boat'))\n\t\t\t\tobject.kill('утонул в воде');\n\t\t}\n\t});\n\t\n\tmap.defineObject({name:'tree',symbol:'&',color: '#0f0',type:'moved'});\n\n\tvar generateForest = function(){\n\t\tfor(var i = 0; i < 25; i++){\n\t\t\tfor(var j = 15; j < 20; j++){\n\t\t\t\tif(map.whoIs(i,j)==='null')\n\t\t\t\t{\n\t\t\t\t   map.placeObject('grass',i,j);\n\t\t\t\t\t if(Math.random() > 0.5)\n\t\t\t\t\t\tmap.placeObject('tree',i,j) \n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\t\n\tmap.placeObject('bonus',5, 5);\n\tmap.placeObject('bonus',10, 10);\n\tmap.placeObject('crocodyle', 0, 2);\n\tmap.placeObject('crocodyle', 2, 1); \n\tmap.placeObject('grass',12,15);\n\tmap.placePlayer(12,15); \n\tmap.placeObject('exit',1,1);\n\t\n\tvar wtrs = [];\n\tfor(var i = 0; i < 25; i++){\n\t\tfor(var j = 0; j < 15; j++){\n\t\t\tif(map.whoIs(i,j) === 'null'){\n\t\t\t\tmap.placeObject('water', i, j);\n\t\t\t\twtrs.push({x:i,y:j});\n\t\t\t}\n\t\t}\n\t}\n\n\tfor(var i = 0; i < 2; i++){\n\t\tvar a = getRandomInt(0, wtrs.length-1);\n\t\tmap.placeObject('crocodyle', wtrs[a].x, wtrs[a].y);\n\t\twtrs.splice(a,1);\n\t}\n\t\t\n\tgenerateForest();\n\tvar player = map.getPlayer();\n\tplayer.setColor('#0ff');    \n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 2);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[20] = "//[mr-X] Ого! А речка-то оказалась шире чем я думал :)\nvar startLevel = function(){\n\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\t\n\t//AI ;)\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0) return;\n\t\t\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse \n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t}\n\n//crocodyle\n\tmap.defineObject({\n\t\tname:'crocodyle',\n\t\tsymbol:'K',\n\t\tcolor: '#0f0',\n\t\ttype:'dynamic',\n\t\tbehavior:function(me){\n\t\t\tvar player = map.getPlayer();\n\t\t\tif(player.getY() < 15)\n\t\t\t\tmoveToward(me,'player');\n\t\t},\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t}\n\t});\n//water\n\tmap.defineObject({\n\t\tname:'water',\n\t\tplaceOnMe:false,\n\t\tsymbol:'~',\n\t\tcolor: '#0ff',\n\t\ttype:'ground',\n\t\tonCollision:function(object){\n\t\t\tif(object.name === 'crocodyle')\n\t\t\treturn;\n\t\t\t\t\t\n\t\t\tif(object.type !== 'dynamic' && object.name !== 'player'){\n\t\t\t\tobject.kill();\n\t\t\t\treturn;\n\t\t\t}\n\t\t\t\n\t\t\tif(!object.hasItem('boat'))\n\t\t\t\tobject.kill('утонул в воде');\n\t\t}\n\t});\n\t\n\tmap.placeObject('bonus',11, 1);\n\tmap.placeObject('bonus',13, 1);\n\n\tfor(var i = 0; i < 25; i++){\n\t\tif(Math.random() > 0.5){\n\t\t\tmap.placeObject('mine',i,15);\n\t\t\tmap.placeObject('mine',i,4);\n\t\t}\n\t}\n\tvar wtr  = [];\t\n\t//fill water\n\tfor(var i = 0; i < 25; i++){\n\t\tfor(var j = 0; j < 20; j++){\n\t\t\tif(map.whoIs(i,j) === 'null'){\n\t\t\t\tmap.placeObject('water', i, j);\n\t\t\t\tif(j > 4 && j < 15)\n\t\t\t\t\twtr.push({x:i,y:j});\n\t\t\t}\n\t\t}\n\t}\n\t//crocodyles\n\tfor(var i = 0; i < 7; i++){\n\t\tvar a = getRandomInt(0, wtr.length-1);\n\t\tmap.placeObject('crocodyle', wtr[a].x, wtr[a].y);\n\t\twtr.splice(a,1);\n\t}\t\n\tmap.placeObject('exit',12,1);\n\tmap.placePlayer(12,19);  \n\tvar player = map.getPlayer();\n\tplayer.setColor('#0ff');\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 2);\n\tmap.checkLevelOnCountObject('exit', 1);\n}\nvar onExit = function(map) {};";
	levels[21] = "//[mr-X] Да! Да! Да! Ты уже близок к разгадке всей этой истории.\n//[mr-X] Они меня держат в этом здании. Хозяин жуткий тип и психопат.\n//[mr-X] Это он придумал этот мир и забирает таких как мы для своих экспериментов.\n//[mr-X] Дрон - охранник огромный и тупой, он всегда выполняет приказы своего хозяина.\n//[mr-X] Найди вирус [☠] и покажи им всем кто здесь главный!\n//[mr-X] P.S. загляни в API, в раздел MapHackerVirus.\n\nvar startLevel = function(){\n\n\tmap.defineObject({\n\t\tname:'grass',  symbol:'*',\n\t\tcolor: '#0f0', type:'ground'\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'bullet',  symbol:'*',\n\t\tcolor: '#f0f', type:'projectile',\n\t\tbehavior:function(me){\n\t\t\tme.move('down');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\tname:'controller',\n\tsymbol:'F',\n\ttype:'dynamic',\n\tcolor:'#f00',\n\tundead:true,\n\tonPlayerCollision:function(player,me){\n\t\tif(player.getBonusCount() >= 40){\n\t\t\tme.move('up');\n\t\t\tmap.showMessage('[Контролер] проходите!','#fff');      \n\t\t}\n\t\telse\n\t\t\tmap.showMessage('[Контролер] 40 бонусов пожалуйста.','#fff');\n\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'drone', symbol:'G',\n\t\tcolor: '#ff0',type:'dynamic',\n\t\tundead:true,\n\t\tbehavior:function(me){\n\t\t\t//nothing\n\t\t},\n\t\tonPlayerCollision:function(player, me){\n\t\t   map.showMessage('Уходите! Хозяин никого не хочет видеть.', '#fff');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'turret', symbol:'T',\n\t\tcolor: '#0ff',type:'dynamic',\n\t\tbehavior:function(me){\n\t\t\tmap.placeObject('bullet',me.getX(),me.getY() + 1);\n\t\t\tmap.placeObject('bullet',me.getX() + 1,me.getY() + 1);\n\t\t\tmap.placeObject('bullet',me.getX() - 1,me.getY() + 1);\n\t\t},\n\t\tonPlayerCollision:function(player, me){\n\t\t\tplayer.kill(me);\n\t\t}\n\t});\n\n\tmap.defineObject({\n\t\tname:'water', placeOnMe:false,\n\t\tsymbol:'~',   color: '#0ff', type:'ground',\n\t\tonCollision:function(object){\n\t\t\tif(object.type !== 'dynamic' && object.name !== 'player'){\n\t\t\t\tobject.kill();\n\t\t\t\treturn;\n\t\t\t}\n\t\t\t\n\t\t\tif(!object.hasItem('boat'))\n\t\t\t\tobject.kill('утонул в воде');\n\t\t}\n\t});\n\t\n\tmap.defineObject({name:'tree',symbol:'&',color: '#0f0',type:'moved'});\n\n\tvar arr = [\n\t\t '************V************'\n\t\t,'***###################***'\n\t\t,'*b*#*****************#*b*'\n\t\t,'*&*#**#############**#***'\n\t\t,'***#**####e***b####**#**&'\n\t\t,'*T*#**####****b####**#*T*'\n\t\t,'***#**######F######**#***'\n\t\t,'***#*****************#&*&'\n\t\t,'***#*****************#***'\n\t\t,'***#########G#########***'\n\t\t,'*&**V*&&&*******&&&****&*'\n\t\t,'*************************'\n\t\t,'~~~~~~~~~~~~~~~~~~~~~~~~~'\n\t\t,'~~~~~~~~~~~~~~~~~~~~~~~~~'\n\t\t,'~~~~~~~~~~~~~~~~~~~~~~~~~'\n\t\t,'~~~~~~~~~~~~~~~~~~~~~~~~~'\n\t\t,'~~~~~~~~~~~~~~~~~~~~~~~~~'\n\t\t,'~~~~~~~~~~~~~~~~~~~~~~~~~'\n\t\t,'~~~~~~~~~~~~~@~~~~~~~~~~~'\n\t\t,'~~~~~~~~~~~~~~~~~~~~~~~~~'\n\t];\n\n\tvar legend = { '#':'block'\n\t\t\t\t,'@':'player'\n\t\t\t\t,'*':'ground'\n\t\t\t\t,'*':'grass'\n\t\t\t\t,'G':'drone'\n\t\t\t\t,'T':'turret'\n\t\t\t\t,'e':'exit'\n\t\t\t\t,'V':'virus'\n\t\t\t\t,'F':'controller'\n\t\t\t\t,'~':'water'\n\t\t\t\t,'&':'tree'\n\t\t\t\t,'b':'bonus'\n\t\t\t\t};\n\tmap.createFromGrid(arr,legend);\n\t//use virus example\n\t//virus = map.createVirus();\n\t//virus.infect(x,y);\n\t//virus.crackBehavior(function(me){});  \n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 4);\n\tmap.checkLevelOnCountObject('exit',  1);\n\tmap.checkLevelOnCountObject('virus', 3);\n\tmap.checkLevelOnCountObjectType('button', 0);\n\tmap.checkLevelOnCountObjectType('dynamic',5);\n}\nvar onExit = function(map) {};";
	levels[22] = "//[master] Ты нашел мое убежище.\n//[master] P.S. Я жду тебя.\n\nvar startLevel = function(){\n\n\tmap.defineObject({\n\t\tname:'air',  symbol:'-',\n\t\tcolor: '#000', type:'ground'\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'trap',  symbol:'^',\n\t\tcolor: '#0f0', type:'static',\n\t\tonPlayerCollision:function(player,me){\n\t\t\tplayer.kill('Упал на шипы.');\n\t\t}\n\t});\n\n\tvar arr = [\n\t\t '-------------------------'\n\t\t,'------*-----------*------'\n\t\t,'-------------------------'\n\t\t,'-------------------------'\n\t\t,'------------*------------'\n\t\t,'-------------------------'\n\t\t,'-@----------------------e'\n\t\t,'########*-------*########'\n\t\t,'########---------########'\n\t\t,'########---------########'\n\t\t,'########---------########'\n\t\t,'########---------########'\n\t\t,'########---------########'\n\t\t,'########---------########'\n\t\t,'########---------########'\n\t\t,'########---------########'\n\t\t,'########---------########'\n\t\t,'########---------########'\n\t\t,'########^^^^^^^^^########'\n\t\t,'#########################'\n\t];\n\n\tvar legend = { '#':'block'\n\t\t\t\t  ,'@':'player'\n\t\t\t\t  ,'-':'air'\n\t\t\t\t  ,'^':'trap'\n\t\t\t\t  ,'*':'bonus'\n\t\t\t\t  ,'e':'exit'\n\t\t\t\t};\n\tmap.createFromGrid(arr,legend);\n\t\n\t<editable>\n\t<editable>\n\t\n\tvar gravity = function(){\n\t\tplayer.move('down');\n\t}\n\n\tvar player = map.getPlayer();\n\tmap.setTimer(gravity, 150);\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 5);\n\tmap.checkLevelOnCountObject('exit',  1);\n}\nvar onExit = function(map) {};";
	levels[23] = "//[mr-X] no comments mode on;\n\nvar startLevel = function(){\n\n\tmap.defineObject({\n\t\tname:'air',  symbol:'-',\n\t\tcolor: '#000', type:'ground'\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'bulletUp', symbol:'*',\n\t\tcolor: '#f00', type:'projectile',\n\t\tbehavior: function(me){\n\t\t\tme.move('up');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'bulletDown', symbol:'*',\n\t\tcolor: '#f00', type:'projectile',\n\t\tbehavior: function(me){\n\t\t\tme.move('down');\n\t\t}\n\t});\n\t\n\tvar shot = function(){\n\t\tmap.placeObject('bulletUp',10,17);\n\t\tmap.placeObject('bulletDown',15,2);\n\t};\n\t\n\tmap.defineObject({\n\t\tname:'trap',  symbol:'^',\n\t\tcolor: '#0f0', type:'static',\n\t\tonPlayerCollision:function(player,me){\n\t\t\tplayer.kill('Упал на шипы.');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'trap2',  symbol:'v',\n\t\tcolor: '#0f0', type:'static',\n\t\tonPlayerCollision:function(player,me){\n\t\t\tplayer.kill('Упал на шипы.');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'trap3',  symbol:'>',\n\t\tcolor: '#0f0', type:'static',\n\t\tonPlayerCollision:function(player,me){\n\t\t\tplayer.kill('Упал на шипы.');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'trap4',  symbol:'<',\n\t\tcolor: '#0f0', type:'static',\n\t\tonPlayerCollision:function(player,me){\n\t\t\tplayer.kill('Упал на шипы.');\n\t\t}\n\t});\n\t\n\tvar arr = [\n\t\t '#########################'\n\t\t,'vvvvvvvvvvvvvvvvvvvvvvvvv'\n\t\t,'-------------------------'\n\t\t,'------------*------------'\n\t\t,'---------------------####'\n\t\t,'---------------------#---'\n\t\t,'-@-------------------+--e'\n\t\t,'########>-------<########'\n\t\t,'########>-------<########'\n\t\t,'########>-------<########'\n\t\t,'########>-------<########'\n\t\t,'########>*----*-<########'\n\t\t,'########>-------<########'\n\t\t,'########>-------<########'\n\t\t,'########>---k---<########'\n\t\t,'########>-------<########'\n\t\t,'########>-------<########'\n\t\t,'########---------########'\n\t\t,'########^^^^^^^^^########'\n\t\t,'#########################'\n\t];\n\n\tvar legend = { '#':'block'\n\t\t\t\t  ,'@':'player'\n\t\t\t\t  ,'-':'air'\n\t\t\t\t  ,'^':'trap'\n\t\t\t\t  ,'v':'trap2'\n\t\t\t\t  ,'>':'trap3'\n\t\t\t\t  ,'<':'trap4'\n\t\t\t\t  ,'*':'bonus'\n\t\t\t\t  ,'e':'exit'\n\t\t\t\t  ,'k':'key'\n\t\t\t\t  ,'+':'door'\n\t\t\t\t};\n\tmap.createFromGrid(arr,legend);\n\n\t<editable>\n\t<editable>\n\t\n\tvar gravity = function(){\n\t\tplayer.move('down');\n\t}\n\t\n\tvar player = map.getPlayer();\n\tmap.setTimer(gravity, 150);  \n\tmap.setTimer(shot, 1000);\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('key',   1);\n\tmap.checkLevelOnCountObject('bonus', 3);\n\tmap.checkLevelOnCountObject('exit',  1);\n\tmap.checkLevelOnCountObjectType('static',  310);\n\tmap.checkLevelOnCountObjectType('dynamic', 1);\n}\nvar onExit = function(map) {};";
	levels[24] = "//[master] А это мой любимчик - программист с ником cool-][! \n//[master] Он единственный программер, который прошел эту игру почти до конца.\n//[master] Я его клонировал и подарил ему бессмертие.\n//[master] Он убьет любого, кто посмеет претендовать на его место.\n//[master] А-ха-ха-ха!!!.\n//[mr-X] П-с-с. Это я. Мастер убьет меня, если узнает, что я тебе помогаю.\n//[mr-X] У этого cool-][ есть одна слабость - trojan.\n//[mr-X] P.S. используй trojan, API тебе в помощь.\n\nvar startLevel = function(){\n\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0) return;\n\t\t\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse\n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t};\n\n\tmap.defineObject({\n\t\tname:'bulletDown', symbol:'*',\n\t\tcolor: '#f00', type:'projectile',\n\t\tbehavior: function(me){\n\t\t\tme.move('down');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\t'name':'cool-][',\n\t\t'symbol':'@',\n\t\t'color':'#ccc',\n\t\t'type':'dynamic',\n\t\t undead: true,\n\t\t behavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t\tmap.placeObject('bulletDown',8,3);\n\t\t\tmap.placeObject('bulletDown',11,3);\n\t\t\tmap.placeObject('bulletDown',14,3);\n\t\t\tmap.placeObject('bulletDown',17,3);\n\t\t }, \n\t\t onPlayerCollision:function(player,me){\n\t\t\tplayer.kill(me);\n\t\t },\n\t\t onDead:function(){\n\t\t\tif(map.getObjectCount('cool-][') === 0)\n\t\t\t   map.placeObject('exit',5,2);\n\t\t }\n\t});\n\n\tvar arr = [\n\t\t '#########################'\n\t\t,'#########################'\n\t\t,'#####a......a......a#####'\n\t\t,'#####...............#####'\n\t\t,'#####...............#####'\n\t\t,'#####...............#####'\n\t\t,'#####.......@.......#####'\n\t\t,'#####a.............a#####'\n\t\t,'#####...............#####'\n\t\t,'#####........*......#####'\n\t\t,'#####...............#####'\n\t\t,'#####...............#####'\n\t\t,'#####a......a......a#####'\n\t\t,'#########################'\n\t\t,'#########################'\n\t];\n\n\tvar legend = { '#':'block'\n\t\t\t\t  ,'@':'player'\n\t\t\t\t  ,'.':'ground'\n\t\t\t\t  ,'a':'cool-]['\n\t\t\t\t  ,'*':'trojan'\n\t\t\t\t };\n\t\t\t\t \n\tmap.createFromGrid(arr,legend);\n\t//trojan use example:\n\t//var trojan = map.createTrojan();\n\t//trojan.setTarget(<nameObject>);\n\t//trojan.change?????() read more in API\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 3);\n\tmap.checkLevelOnCountObject('exit',  1);\n\tmap.checkLevelOnCountObjectType('dynamic', 9);\n}\nvar onExit = function(map) {\n\tif(map.getObjectCount('cool-][') === 0)\n\t\treturn true;\n\telse\n\t\tmap.showMessage('cool-][ не убит.','#fff');\n\n\treturn false;\n};";
	levels[25] = "//[master] cool-][ убит! Нее-е-е-е-т!!!! \n//[master] Ну ничего, в этой темной комнате мои монстры быстро тебя найдут!\n//[mr-X] Псс-с-с. Это снова я.\n//[mr-X] В прошлый раз ,когда я кормил монстров, я забыл там фонарик.\n//[mr-X] Он поможет тебе. Загляни в API.\n//[master] Ах ты мерзавец, иди сюда!!\n//[mr-X] Все, не могу говорить. Дальше сам.\n\nvar startLevel = function(){\n\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\t\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0) return;\n\t\t\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse\n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t};\n\t\n\tvar generate = function(){\n\t\tvar tiles = map.getObjectsCoords('black');\n\t\tvar filter = [];\n\t\t\n\t\tfor(var i = 0; i < tiles.length; i++)\n\t\t{\n\t\t\tif(tiles[i].x > 12)\n\t\t\t\tfilter.push(tiles[i]);\n\t\t}\n\t\t\n\t\tfor(var i = 0; i < 10; i++)\n\t\t{\n\t\t\tvar coords = getRandomInt(0,filter.length - 1);\n\t\t\t\n\t\t\tif(i % 2 === 0)\n\t\t\t  map.placeObject('empty',filter[coords].x,filter[coords].y);\n\t\t\telse\n\t\t\t  map.placeObject('shadow',filter[coords].x,filter[coords].y);\n\t\t\t  \n\t\t\tfilter.splice(coords,1);\n\t\t}\n\t\ttiles  = null;\n\t\tfilter = null;\n\t};\n\n\tmap.defineObject({\n\t\t'name':'black',\n\t\t'symbol':'.',\n\t\t'color':'#000',\n\t\t'type':'ground'\n\t});\n\n\tmap.defineObject({\n\t\t'name':'shadow',\n\t\t'symbol':'@',\n\t\t'color':'#000',\n\t\t'type':'dynamic',\n\t\t undead: true,\n\t\t behavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t }, \n\t\t onPlayerCollision:function(player,me){\n\t\t\tplayer.kill(me);\n\t\t },\n\t\t onDead:function(me){\n\t\t\tmap.placeObject('bonus',me.getX(),me.getY());\n\t\t }\n\t});\n\n\tvar arr = [\n\t\t '#########################'\n\t\t,'#########################'\n\t\t,'#####..............e#####'\n\t\t,'#####...............#####'\n\t\t,'#.*.................#####'\n\t\t,'#.###...............#####'\n\t\t,'#.###...............#####'\n\t\t,'#.F.................#####'\n\t\t,'#####...............#####'\n\t\t,'#####...............#####'\n\t\t,'#####...............#####'\n\t\t,'#####...............#####'\n\t\t,'#####...............#####'\n\t\t,'#########################'\n\t\t,'#########################'\n\t];\n\n\tvar legend = { '#':'block'\n\t\t\t\t  ,'.':'black'\n\t\t\t\t  ,'*':'trojan'\n\t\t\t\t  ,'e':'exit'\n\t\t\t\t  ,'F':'flashlight'\n\t\t\t\t };\n\n\tmap.createFromGrid(arr,legend);\n\tmap.placePlayer(1,6);\n\tgenerate();\n\t//use map.flash() function that make visible blocks\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 5);\n\tmap.checkLevelOnCountObject('exit',  1);\n\tmap.checkLevelOnCountObjectType('dynamic', 6);\n}\nvar onExit = function(map) {};";
	levels[26] = "//[master] Скоро встретимся !!!.\n\nvar startLevel = function(){\n\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\t\n\t//scroll\n\tmap.defineObject({\n\t\tname:'note',\n\t\tsymbol:'!',\n\t\tcolor: '#0ff', \n\t\ttype:'ground',\n\t\tonPlayerCollision:function(player, me){\n\t\t\tmap.showMessage('10010100 map.placeTeleport 100101', '#ff0', 5000);\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'lava',\n\t\tsymbol:'~',\n\t\tcolor: '#BD4900',\n\t\ttype:'ground',\n\t\tplaceItem:   false,\n\t\tplaceGround: false,\n\t\tplaceMoved:  false,\n\t\tonCollision:function(object){\n\t\t\tobject.kill(' Утонул в лаве.');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'ice',\n\t\tsymbol:'#',\n\t\tcolor: '#0049BD',\n\t\ttype:'ground',\n\t\tplaceItem:   false,\n\t\tplaceGround: false,\n\t\tplaceMoved:  false\n\t});\n\n\tvar arr = [\n\t\t '#########################'\n\t\t,'#########################'\n\t\t,'#####....~~~~~~----*#####'\n\t\t,'#####....~~~~~~-----#####'\n\t\t,'#####....~~~~~~-#########'\n\t\t,'#####....~~~~~~-##+e#####'\n\t\t,'#####..o.~~~~~~-#########'\n\t\t,'#####....~~~~~~-----#####'\n\t\t,'#####....~~~~~~-----#####'\n\t\t,'#####.@..~~~~~~--a--#####'\n\t\t,'#####....~~~~~~-----#####'\n\t\t,'#####!...~~~~~~-----#####'\n\t\t,'#####....~~~~~~--b--#####'\n\t\t,'#####....~~~~~~-----#####'\n\t\t,'#####....~~~~~~~~~~~#####'\n\t\t,'#####....~~~~~~.....#####'\n\t\t,'#####....~~~~~~.*..k#####'\n\t\t,'#########################'\n\t\t,'#########################'\n\t];\n\n\tvar legend = { '#':'block'\n\t\t\t\t  ,'.':'ground'\n\t\t\t\t  ,'*':'trojan'\n\t\t\t\t  ,'e':'exit'\n\t\t\t\t  ,'~':'lava'\n\t\t\t\t  ,'k':'key'\n\t\t\t\t  ,'@':'player'\n\t\t\t\t  ,'+':'door'\n\t\t\t\t  ,'a':function(){map.placeButton(17,9,17,5)}\n\t\t\t\t  ,'b':function(){map.placeButton(17,12,16,5)}\n\t\t\t\t  ,'*':'bonus'\n\t\t\t\t  ,'-':'ice'\n\t\t\t\t  ,'!':'note'\n\t\t\t\t  ,'o':function(){map.placeTeleport(7,6,15,3)}\n\t\t\t\t };\n\t\t\t\t \n\tmap.createFromGrid(arr,legend);\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus', 2);\n\tmap.checkLevelOnCountObject('exit',  1);\n\tmap.checkLevelOnCountObjectType('dynamic', 1);\n}\nvar onExit = function(map) {};";
	levels[27] = "var startLevel = function(){\n\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\t\n\tmap.defineObject({\n\t\tname:'bulletUp', symbol:'*',\n\t\tcolor: '#f00', type:'projectile',\n\t\tbehavior: function(me){\n\t\t\tme.move('up');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'bulletDown', symbol:'*',\n\t\tcolor: '#f00', type:'projectile',\n\t\tbehavior: function(me){\n\t\t\tme.move('down');\n\t\t}\n\t});\n\t\n\tvar shot = function(){\n\t\tmap.placeObject('bulletUp',5,11);\n\t\tmap.placeObject('bulletUp',10,11);\n\t\tmap.placeObject('bulletUp',15,11);\n\t\tmap.placeObject('bulletUp',20,11);\n\t\t\n\t\tmap.placeObject('bulletDown',3,0);\n\t\tmap.placeObject('bulletDown',8,0);\n\t\tmap.placeObject('bulletDown',13,0);\n\t\tmap.placeObject('bulletDown',18,0);\n\t};\n\n\tmap.defineObject({\n\t\tname:'lava',\n\t\tsymbol:'~',\n\t\tcolor: '#BD4900',\n\t\ttype:'ground',\n\t\tplaceItem:   false,\n\t\tplaceGround: false,\n\t\tplaceMoved:  false,\n\t\tonCollision:function(object){\n\t\t\tobject.kill(' Утонул в лаве.');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'air',  symbol:'-',\n\t\tcolor: '#000', type:'ground'\n\t});\n\n\tvar arr = [\n\t\t '----------------------#####' \n\t\t,'----------------------#-km#' \n\t\t,'----------------------#m--#' \n\t\t,'----------------------#####' \n\t\t,'------k----k----k----------'\n\t\t,'---#####################---' \n\t\t,'---------*----*----*-------' \n\t\t,'---------------------------' \n\t\t,'---------------------------' \n\t\t,'---------------------------' \n\t\t,'---------------------------' \n\t\t,'@-~~~~~~~~~~~~~~~~~~~~~~---'  \n\t\t,'##~~~~~~~~~~~~~~~~~~~~~~#+#'\n\t\t,'##~~~~~~~~~~~~~~~~~~~~~~#+#'\n\t\t,'##~~~~~~~~~~~~~~~~~~k~~~#+#'\n\t\t,'##~~~~~~~~~~~~~~~~~~~~~~#+#'\n\t\t,'##~~~~~~~~~~~~~~~~~~~~~~#+#'\n\t\t,'##~~~~~~k~~~~~~~~~~~~~~~#+#'\n\t\t,'##~~~~~~~~~~~~~~~~k~~~~~#+#'\n\t\t,'##~~~~~~~~~~~~~~~~~~~~~~#e#'\n\t\t,'###########################'\n\t];\n\n\tvar legend = { '#':'block'\n\t\t\t\t  ,'*':'bonus'\n\t\t\t\t  ,'e':'exit'\n\t\t\t\t  ,'~':'lava'\n\t\t\t\t  ,'k':'key'\n\t\t\t\t  ,'@':'player'\n\t\t\t\t  ,'+':'door' \n\t\t\t\t  ,'-':'air'\n\t\t\t\t  ,'m':'mine'\n\t\t\t\t };\n\t\t\t\t \n\tmap.createFromGrid(arr,legend);\n\tvar player = map.getPlayer();\n\tvar gravity = function(){\n\t\tplayer.move('down');\n\t}\n\tmap.setTimer(gravity, 150);  \n\tmap.setTimer(shot, 1000);\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus',   3);\n\tmap.checkLevelOnCountObject('key',     7);\n\tmap.checkLevelOnCountObject('exit',    1);\n\tmap.checkLevelOnCountObject('trojan',  0);\n\tmap.checkLevelOnCountObject('virus',   0);\n\tmap.checkLevelOnCountObjectType('dynamic', 2);\n\tmap.checkLevelOnCountObjectType('static',  105);\n\tmap.checkLevelOnCountObjectType('button',  0);\n\n}\nvar onExit = function(map) {};";
	levels[28] = "//[mr-X] Вот мы и встретились.\n//[mr-X] Если бы ты пришел немного раньше, мы смогли бы сбежать отсюда.\n//[mr-X] Но теперь поздно, хозяин промыл мне мозги и я должен тебя остановить.\n//[master] Хватит разговоров, убей его!\n//[mr-X] Извини, но ничего личного. Умри!!!\n\nvar startLevel = function(){\n\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\t\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0) return;\n\t\t\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse \n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t};\n\n\tmap.defineObject({\n\t\tname:'neutral',  symbol:'.',\n\t\tcolor: '#0f0', type:'ground',\n\t\tplaceItem:   false,\n\t\tplaceGround: false,\n\t\tplaceMoved:  false,\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'floor',  symbol:'.',\n\t\tcolor: '#0ff', type:'ground',\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'floor2',  symbol:'.',\n\t\tcolor: '#f0f', type:'ground',\n\t});\n\t\n\tmap.defineObject({\n\t\tname:'bullet',  symbol:'*',\n\t\tcolor: '#f0f', type:'projectile',\n\t\tbehavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\t'name':'mr-X',\n\t\t'symbol':'@',\n\t\t'color':'#ff0',\n\t\t'type':'dynamic',\n\t\t undead: true,\n\t\t behavior:function(me){\n\t\t\tvar player = map.getPlayer();\n\t\t\tif(player.hasItem('trojan') || player.hasItem('virus'))\n\t\t\t{\n\t\t\t\tif(me.lock === undefined)\n\t\t\t\t\tme.lock = true;\n\n\t\t\t\tvar x = me.getX();\n\t\t\t\tvar y = me.getY();\n\t\t\t\tif(map.whoIs(x + 1, y) === 'floor' || \n\t\t\t\t\tmap.whoIs(x + 1, y) === 'ground')\n\t\t\t\t\t{map.placeObject('door', x + 1, y)};\n\n\t\t\t\tif(map.whoIs(x - 1, y) === 'floor' || \n\t\t\t\t\tmap.whoIs(x + 1, y) === 'ground')\n\t\t\t\t\t{map.placeObject('door', x - 1, y)};\n\n\t\t\t\tif(map.whoIs(x, y + 1) === 'floor' ||\n\t\t\t\t\tmap.whoIs(x + 1, y) === 'ground')\n\t\t\t\t\t{map.placeObject('door', x, y + 1)};\n\n\t\t\t\tif(map.whoIs(x, y - 1) === 'floor' || \n\t\t\t\t\tmap.whoIs(x + 1, y) === 'ground')\n\t\t\t\t\t{map.placeObject('door', x, y - 1)};\n\t\t\t}\n\t\t\tif(me.lock !== true)\n\t\t\t\tmoveToward(me,'player');\n\n\t\t\tvar grd = map.getObjectsCoords('floor');\n\t\t\t\tvar a = getRandomInt(0,grd.length - 1);\n\t\t\tgrd.splice(a,1);\n\t\t\t\tvar b = getRandomInt(0,grd.length - 1);\n\n\t\t\tif(grd[a] !== undefined)\n\t\t\t\tmap.placeObject('bullet', grd[a].x, grd[a].y);  \n\n\t\t\tif(grd[b] !== undefined) \n\t\t\t\tmap.placeObject('bullet', grd[b].x, grd[b].y);\n\t\t},\n\t\tonPlayerCollision:function(player,me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t\tonDead:function(me){\n\t\t\tvar grd = map.getObjectsCoords('floor');\n\n\t\t\tfor(var i = 0; i < 5 ; i++)\n\t\t\t\tmap.placeObject('bonus', grd[i].x, grd[i].y);\n\n\t\t\tmap.placeObject('exit',me.getX(),me.getY());\n\t\t}\n\t});\n\t\n\tvar arr = [\n\t\t '           ###########        '\n\t\t,'           #=========#        '\n\t\t,'           #====T====#        '\n\t\t,'           #=========#        '\n\t\t,'           #=========#        '\n\t\t,'##############################' \n\t\t,'#............................#'  \n\t\t,'#............................#'  \n\t\t,'#............................#'  \n\t\t,'#...@....................X...#'  \n\t\t,'#............................#'   \n\t\t,'#............................#' \n\t\t,'#............................#' \n\t\t,'#............................#' \n\t\t,'#............................#' \n\t\t,'##############################'\n\t\t,'           #---------#        '\n\t\t,'           #---------#        '\n\t\t,'           #----V----#        '\n\t\t,'           #---------#        '\n\t\t,'           ###########        '\n\t];\n\n\tvar legend = { '#':'block'\n\t\t\t\t  ,'.':'floor'\n\t\t\t\t  ,'@':'player'\n\t\t\t\t  ,'V':'virus'\n\t\t\t\t  ,'T':'trojan'\n\t\t\t\t  ,'X':'mr-X'\n\t\t\t\t  ,'-':'neutral'\n\t\t\t\t  ,'=':'floor2'\n\t\t\t\t  ,'m':'movedBlock'\n\t\t\t\t };\n\t\t\t\t \n\tmap.createFromGrid(arr,legend);\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus',         5);\n\tmap.checkLevelOnCountObject('exit',          1);\n\tmap.checkLevelOnCountObjectType('dynamic',   2);\n\tmap.checkLevelOnCountObjectType('moved',     6);\n\tmap.checkLevelOnCountObjectType('static',    116);\n}\nvar onExit = function(map) {\n\tif(map.getObjectCount('mr-X') === 0)\n\t\treturn true;\n\telse\n\t\tmap.showMessage('mr-X не убит.','#fff');\n\n\treturn false;\n};";
	levels[29] = "var startLevel = function(){\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t}\n\n\tvar handler = function(player, me){\n\t\tif(player.getColor() !== me.color)\n\t\t\tplayer.kill();\n\t}\n\n\tmap.defineObject({name: 'wood',color:'#ff0',symbol:'|',type:'ground'});\n\n\tmap.defineObject({name:'red',symbol:'.',color: '#f00',type:'ground', \n\t\tplaceItem:false, placeGround:false, onPlayerCollision:handler\n\t});\n\n\tmap.defineObject({name:'green',symbol:'.',color: '#0f0',type:'ground',\n\t\tplaceItem:false, placeGround:false, onPlayerCollision:handler\n\t});\n\n\tmap.defineObject({name:'blue',symbol:'.',color: '#00f',type:'ground',\n\t\tplaceItem:false, placeGround:false, onPlayerCollision:handler\n\t});\n\t\t\t\t \n\tmap.defineObject({name:'fire',color:'#fa0',symbol:'*',type:'projectile',\n\t\tbehavior:function(me){me.move('right');}\n\t});\n\t\n\tmap.defineObject({name:'ice',color:'#ccf',symbol:'*',type:'projectile',\n\t\tbehavior:function(me){me.move('left'); }\n\t});\n\n\tmap.defineObject({\n\t\tname:'secretary',\n\t\tsymbol:'s',\n\t\ttype:'dynamic',\n\t\tcolor:'#f00',\n\t\tundead:true,\n\t\tonPlayerCollision:function(player,me){\n\t\t\tif(player.hasItem('pass')){\n\t\t\t\tme.move('right');\n\t\t\t\tmap.showMessage(\n\t\t\t\t'[секретарь] Проходите... хозяин ждет Вас.','#fff');\n\t\t\t}\n\t\t\telse\n\t\t\t\tmap.showMessage('[секретарь] Пропуск пожалуйста.','#fff');\n\t\t}\n\t});\n\n\tmap.defineObject({name:'corpse',symbol:'@',type:'dynamic',color:'#ccc',\n\t\tundead:true,\n\t\tonPlayerCollision:function(player,me){\n\t\t\tif(player.hasItem('pass')){\n\t\t\t\tmap.showMessage('труп...','#fff');\n\t\t\t\treturn;\n\t\t\t}\n\t\t\tif(me.passDefined === undefined)\n\t\t\t\tme.passDefined = false;\n\n\t\t\tif(!me.passDefined){\n\t\t\t\tme.passDefined = true;\n\t\t\t\tmap.defineObject({name: 'pass',color:'#ff0',\n\t\t\t\t\t\t\t\t  symbol:'P',type:'item'});         \n\t\t\t\tme.giveItem('pass', player);\n\t\t\t\tme.giveItem('bonus', player);\n\t\t\t\tme.giveItem('bonus', player);\n\t\t\t\tme.giveItem('bonus', player);\n\t\t\t\tmap.showMessage('Вы взяли у трупа пропуск!','#fff');\n\t\t\t}\n\t\t\telse\n\t\t\t\tmap.showMessage('труп...','#fff');\n\t}});\n\t\n\tmap.defineObject({name:'ncorpse',symbol:'@',type:'dynamic',color:'#ccc',\n\t\tundead:true,\n\t\tonPlayerCollision:function(player,me){\n\t\t\tmap.showMessage('труп...','#fff');\n\t}});\n\t\n\tvar arr = [\n\t\t '#####################'\n\t\t,'#................#.k#'\n\t\t,'#@...............|s*#'\n\t\t,'#................#..#'\n\t\t,'#................####'\n\t\t,'#.................#.#'\n\t\t,'#.................#.#'\n\t\t,'#.................#.#'\n\t\t,'#.................#.#'\n\t\t,'#.................#.#'\n\t\t,'#.................#+#'\n\t\t,'#.................#.#'\n\t\t,'#.................#.#'\n\t\t,'#.................#.#'\n\t\t,'#.................#.#'\n\t\t,'#.................#e#'\n\t\t,'#####################'\n\t];\n\n\tvar legend = {   '#':'block'\n\t\t\t\t\t,'@':'player'\n\t\t\t\t\t,'.':'ground'\n\t\t\t\t\t,'|':'wood'\n\t\t\t\t\t,'+':'door'\n\t\t\t\t\t,'k':'key'\n\t\t\t\t\t,'s':'secretary'\n\t\t\t\t\t,'b':'bonus'\n\t\t\t\t\t,'f':'fire'\n\t\t\t\t\t,'i':'ice'\n\t\t\t\t\t,'*':function(){map.placeButton(19,2,19,4)}\n\t\t\t\t\t,'e':'exit'}\n\tmap.createFromGrid(arr,legend);\n\tmap.setTimer(function(){\n\t\tfor(var i = 6; i < 16 ; i++){\n\t\t\tmap.placeObject('fire',1,i);\n\t\t\tmap.placeObject('ice',17,i);\n\t\t}\n\t},1000);\n\n\tvar gnd = map.getObjectsCoords('ground');\n\tvar filter = [];\n\tfor(var i = 0; i < gnd.length; i++){\n\t\tif(gnd[i].x < 18 && gnd[i].y > 5){\n\t\t\tfilter.push(gnd[i]);\n\t\t}\n\t}\n\n\tfor(var i = 0; i < 5; i++){\n\t\tvar n = getRandomInt(0, filter.length - 1);\n\t\tmap.placeObject('ncorpse',   filter[n].x, filter[n].y);\n\t\tfilter.splice(n,1);\n\t}\n\n\tvar n = getRandomInt(0, filter.length - 1);\n\tmap.placeObject('corpse', filter[n].x, filter[n].y);\n\tfilter.splice(n,1);\n\n\tfor(var i = 0; i < filter.length; i++){\n\t\tvar n = getRandomInt(1,100);\n\t\tif(n<=33)\n\t\t\tmap.placeObject('red',   filter[i].x, filter[i].y);\n\t\telse if(n>33 && n<=66)\n\t\t\tmap.placeObject('green', filter[i].x, filter[i].y);\n\t\telse if(n>66)\n\t\t\tmap.placeObject('blue',  filter[i].x, filter[i].y);\n\t}\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus',    0);\n\tmap.checkLevelOnCountObject('pass',     0);\n\tmap.checkLevelOnCountObject('exit',     1);\n\tmap.checkLevelOnCountObject('key',      1);\n\tmap.checkLevelOnCountObject('teleport', 0);\n\tmap.checkLevelOnCountObjectType('button', 1);\n}\nvar onExit = function(map) {};";
	levels[30] = "//[Master] Ну вот мы и встретились!\n//[Master] Сначала я тебя убью, затем сделаю роботом,а затем...затем\n//[Master] еще не придумал, но в любом случае это принесет тебе страдания!\n//[Master] И ты будешь подчиняться мне вечно!\n//[Master] А-ха-ха-ха!\n//[Master] УМРИ ЖЕ !\n\n var startLevel = function(){\n\tvar getRandomInt = function (min, max){\n\t\treturn Math.floor(Math.random() * (max - min + 1)) + min;\n\t};\n\t\n\tvar moveToward = function(obj,trg) {\n\t\tvar target   = obj.findNearestToPoint(trg);\n\t\tvar leftDist = obj.getX() - target.x;\n\t\tvar upDist   = obj.getY() - target.y;\n\t\tvar direction;\n\t\t\n\t\tif (upDist == 0 && leftDist == 0) return;\n\t\t\n\t\tif (upDist > 0 && upDist >= leftDist)\n\t\t\tdirection = 'up';\n\t\telse if (upDist < 0 && upDist < leftDist)\n\t\t\tdirection = 'down';\n\t\telse if (leftDist > 0 && leftDist >= upDist)\n\t\t\tdirection = 'left';\n\t\telse \n\t\t\tdirection = 'right';\n\n\t\tobj.move(direction);\n\t};\n\t\n\tmap.defineObject({'name':'grblk','color':'#0f0','symbol':'#','type':'moved'});\n\t//bullet\n\tmap.defineObject({\n\t\tname:'bullet',  symbol:'*',\n\t\tcolor: '#f0f', type:'projectile',\n\t\tbehavior:function(me){\n\t\t\tmoveToward(me,'player');\n\t\t}\n\t});\n\t//red-laser \n\tmap.defineObject({\n\t\t'name':'laser',\n\t\t'symbol':'-',\n\t\t'color':'#f00',\n\t\t'type':'static',\n\t\tonPlayerCollision:function(player,me){\n\t\t\tplayer.kill(me);\n\t\t}\n\t});\n\t//blue-laser\n\tmap.defineObject({\n\t\t'name':'laser2',\n\t\t'symbol':'|',\n\t\t'color':'#00f',\n\t\t'type':'static',\n\t\tonPlayerCollision:function(player,me){\n\t\t\tplayer.kill(me);\n\t\t}\n\t});\n\t//neutral zone\n\tmap.defineObject({\n\t\tname:'neutral',  symbol:'*',\n\t\tcolor: '#f0f', type:'ground',\n\t\tplaceItem:   false,\n\t\tplaceGround: false,\n\t\tplaceMoved:  false,\n\t});\n\t//MASTER\n\tmap.defineObject({\n\t\t'name':'MASTER',\n\t\t'symbol':'@',\n\t\t'color':'#f00',\n\t\t'type':'dynamic',\n\t\t undead: true,\n\t\t behavior:function(me){\n\t\t\tvar grd = map.getObjectsCoords('ground');\n\t\t\tvar a = getRandomInt(0,grd.length - 1);\n\t\t\tgrd.splice(a,1);\n\t\t\tvar b = getRandomInt(0,grd.length - 1);\n\n\t\t\tif(grd[a] !== undefined)\n\t\t\t\tmap.placeObject('bullet', grd[a].x, grd[a].y);  \n\t\t\tif(grd[b] !== undefined) \n\t\t\t\tmap.placeObject('bullet', grd[b].x, grd[b].y);\n\t\t},\n\t\tonPlayerCollision:function(player,me){\n\t\t\tplayer.kill(me);\n\t\t},\n\t\tonDead:function(me){\n\t\t\tvar grd = map.getObjectsCoords('ground');\n\t\t\tfor(var i = 0; i < 5 ; i++)\n\t\t\t\tmap.placeObject('bonus', grd[i].x, grd[i].y);\n\t\t\tmap.placeObject('exit', me.getX(), me.getY());\n\t\t}\n\t});\n\t//prisoner with trojan\n\tmap.defineObject({\n\t\t'name':'prisoner1',\n\t\t'symbol':'@',\n\t\t'color':'#ff0',\n\t\t'type':'dynamic',\n\t\tonCollision:function(object, me){\n\t\t\tif(me.gived === undefined)\n\t\t\t\tme.gived = false;\t\t\n\t\t\tif(!me.gived){\n\t\t\t\tme.gived = true;\n\t\t\t\tme.giveItem('trojan', object);\n\t\t\t\tme.giveItem('bonus', object);\n\t\t\t\tmap.showMessage('[prisoner] я дам тебе trojan!','#fff');\n\t\t\t}\n\t\t\telse\n\t\t\t\tmap.showMessage(\n\t\t\t\t'[prisoner] у меня ничего больше нет...','#fff');\n\t\t},\n\t\tonDead:function(me){\n\t\t\tmap.placeObject('bonus',me.getX(),me.getY());\n\t\t}\n\t});\n\t//prisoner with virus\n\tmap.defineObject({\n\t\t'name':'prisoner2',\n\t\t'symbol':'@',\n\t\t'color':'#0ff',\n\t\t'type':'dynamic',\n\t\t onCollision:function(object, me){\n\t\t\tif(!me.gived){  \n\t\t\t\tme.gived = true;\n\t\t\t\tme.giveItem('virus', object);\n\t\t\t\tme.giveItem('bonus', object);\n\t\t\t\tmap.showMessage('[prisoner] я дам тебе virus!','#fff');\n\t\t\t}\n\t\t\telse\n\t\t\t\tmap.showMessage(\n\t\t\t\t'[prisoner] у меня ничего больше нет...','#fff');\n\t\t},\n\t\tonDead:function(me){\n\t\t\tmap.placeObject('bonus',me.getX(),me.getY());\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\t'name':'guard-1',\n\t\t'symbol':'R',\n\t\t'color':'#0f0',\n\t\t'type':'dynamic',\n\t\tbehavior:function(me){\n\t\t\t<editable>\n\t\t\t<editable>\n\t\t},\n\t\tonPlayerCollision:function(player,me){\n\t\t\tme.giveItems(player);\n\t\t}\n\t});\n\t\n\tmap.defineObject({\n\t\t'name':'guard-2',\n\t\t'symbol':'R',\n\t\t'color':'#ff0',\n\t\t'type':'dynamic',\n\t\tbehavior:function(me){\n\t\t\t<editable>\n\t\t\t<editable>\n\t\t},\n\t\t\tonPlayerCollision:function(player,me){\n\t\t\t\tme.giveItems(player);\n\t\t}\n\t});\n\t\n\tvar arr = [\n\t\t '##########      ##########'  \n\t\t,'#********#      #,*******#'\n\t\t,'#mmm***g*#      #,*,*,,,*#'\n\t\t,'#mbm*****#      #,*,*,K,*#'\n\t\t,'#mmm*****#      #,*,*,*,*#'\n\t\t,'#****j*N*#      #,*,,,*,*#'\n\t\t,'#********#      #,*****,*#'\n\t\t,'##########################'\n\t\t,'#...............|........#'\n\t\t,'#...............|........#'\n\t\t,'#...............|........#'\n\t\t,'#.@.............|......M.#'\n\t\t,'#...............|........#'\n\t\t,'#...............|........#'\n\t\t,'#...............|........#'\n\t\t,'#--------########--------#'\n\t\t,'#Y*******#      #*******R#'\n\t\t,'#********#      #********#'\n\t\t,'#***A****#      #****B***#'\n\t\t,'#*****T**#      #**S*****#'\n\t\t,'##########      ##########'\n\t];\n\tvar legend =\n\t{\n\t\t'#':'block','@':'player','.':'ground','-':'laser'\n\t\t,'m':'mine','j':'movedBlock','|':'laser2','*':'bonus'\n\t\t,'e':'exit','M':'MASTER','g':'grblk','*':'neutral'\n\t\t,'A':'prisoner2','B':'prisoner1','R':'guard-1','Y':'guard-2'\n\t\t,'b':function(){map.placeColorButton('btn',2,3,16,11,'#0f0')}\n\t\t,'T':function(){map.placeTeleport(6,19,24,6)}\n\t\t,'S':function(){map.placeTeleport(19,19,8,6)}\n\t\t,'N':function(){map.placeTeleport(7,5,5,13)}\n\t\t,'K':function(){map.placeTeleport(22,3,5,12)}\t\t\n\t};\n\tmap.createFromGrid(arr,legend);\n\t<editable>\n\t<editable>\n}\n//validator\nvar validate = function(map) {\n\tmap.checkLevelOnCountObject('bonus',  5);\n\tmap.checkLevelOnCountObject('exit',   1);\n\tmap.checkLevelOnCountObject('virus',  0);\n\tmap.checkLevelOnCountObject('trojan', 0);\n\tmap.checkLevelOnCountObjectType('moved',   6);\n\tmap.checkLevelOnCountObjectType('dynamic', 6);\n\tmap.checkLevelOnCountObjectType('static', 160);\n\tmap.checkLevelOnCountObject('teleport', 4);\n}\nvar onExit = function(map) {\n\tif(map.getObjectCount('MASTER') === 0)\n\t\treturn true;\n\telse\n\t\tmap.showMessage('MASTER не убит.','#fff');\n\treturn false;\n};";
}