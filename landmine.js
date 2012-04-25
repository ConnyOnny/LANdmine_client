gameWidth=0
gameHeight=0
mineCount=0
ownId=-1
ownNick=""
playerNames=0
playerScore=0
adminPlayer=-1

function LANdmine() {
	if (!window.WebSocket) {
		document.getElementById("boardSpace").innerHTML="<p>Sorry, dein Browser unterstützt die benötigte WebSocket-Technologie nicht. Bitte verwende mindestens Firefox 11, Chrome 16 oder Internet Explorer 10.</p>";
		return;
	}
	var srv = prompt("Bitte Adresse des Servers eingeben, Port mit Doppelpunkt dahinter.","127.0.0.1:4242");//"10.1.2.9:4242");
	ownNick = ""
	while (ownNick == "" || ownNick == null) {
		ownNick = prompt("Dein Nickname")
	}
	if (window.MozWebSocket) {
		window.WebSocket = window.MozWebSocket;
	}
	playerNames = new Object ();
	playerScore = new Object ();
	websocket = new WebSocket("ws://"+srv);
	websocket.onopen = onOpen
	websocket.onclose = onClose
	websocket.onmessage = onMessage
	websocket.onerror = onError
}

function onOpen (evt) {
	document.getElementById("boardSpace").innerHTML = "<p>connection established,<br/>no game running</p><br/><input type=\"button\" value=\"Start new Game\" onclick=\"newGame()\"/>"
	websocket.send("N"+ownNick);
}

function onClose (evt) {
	alert ("Connection interrupted. Reload the page and try again.")
}

function clickField (col, row) {
	websocket.send("C"+(col*1)+" "+(row*1))
}

function sendmsg () {
	websocket.send("M"+document.getElementById("chatmsg").value);
	document.getElementById("chatmsg").value="";
}

function updatePlist () {
	var content = "";
	for (var id in playerScore) {
		if (id == ownId)
			content += "<img src=\"you.png\" alt=\"->\" title=\"you\"/>";
		content += playerNames[id]+" "+playerScore[id]
		if (id == adminPlayer)
			content += "<img src=\"crown.png\" alt=\"ADMIN\" title=\"Admin\"/>"
		content += "<br/>";
	}
	document.getElementById("blist").innerHTML = content;
}

function onMessage (evt) {
	var what = evt.data+"";
	if (what.indexOf("NO") == 0) {
		alert (what);
		if (what.indexOf("NO: this nick was already taken") == 0) {
			ownNick = ""
			while (ownNick == "" || ownNick == null) {
				ownNick = prompt("Dein Nickname")
			}
			websocket.send("N"+ownNick);
		}
	} else if (what.indexOf("YOU") == 0) {
		ownId = what.substring(3) * 1;
		playerScore[ownId+""] = 0;
	} else if (what.indexOf("M") == 0) {
		document.getElementById("chat").innerHTML += strip(what.substring(1))+"<br/>";
	} else if (what.indexOf("G") == 0) {
		var board = what.substring(1).split(" ");
		gameWidth = board[0] * 1
		gameHeight = board[1] * 1
		mineCount = board[2] * 1
		document.getElementById("mineCountDisplay").innerHTML="There are "+mineCount+" mines in this game."
		html = "<table cellspacing=\"0\" cellpadding=\"0\" class=\"boardTable\">"
		for (var col = 0; col < gameHeight; col++) {
			html+="<tr>"
			for (var row = 0; row < gameWidth; row++) {
				html+="<td>"
				html += "<img "
				html += "id=\"gameField"+col+"_"+row+"\" "
				html += "type=\"button\" "
				html += "src=\""+board[col*gameWidth+row+3].charAt(0)+".png\" "
				html += "onclick=\"clickField("+col+","+row+")\" "
				html += "class=\"field"+board[col*gameWidth+row+3].charAt(0)+"\" "
				html += "/>"
				html+="</td>"
			}
			html+="</tr>"
		}
		html += "</table>"
		document.getElementById("boardSpace").innerHTML = html;
	} else if (what.indexOf("PN") == 0) {
		var info = what.substring(2).split(" ");
		var newnick = strip(info[1]);
		chatLog ("Player "+info[0]+" is now known as "+newnick+".");
		playerNames[info[0]] = newnick;
		updatePlist();
	} else if (what.indexOf("PL") == 0) {
		var info = what.substring(2).split(" ");
		playerScore[info[0]] = info[1]*1;
		playerNames[info[0]] = "player"+info[0];
		updatePlist();
		chatLog("Player "+info[0]+" joined.");
	} else if (what.indexOf("PO") == 0) {
		var toDel = what.substring(2)
		chatLog ("Player left: "+playerNames[toDel]);
		delete playerScore[toDel]
		delete playerNames[toDel]
		updatePlist();
	} else if (what.indexOf("F") == 0) {
		var info = what.substring(1).split(" ");
		/* col row score field */
		/* field = _ or XExplorer or NExplorer with N the number of mines around */
		document.getElementById("gameField"+info[0]+"_"+info[1]).src = info[3].charAt(0)+".png";
		document.getElementById("gameField"+info[0]+"_"+info[1]).setAttribute("class", "field"+info[3].charAt(0));
		var score = info[2] * 1
		var explId = info[3].substring(1)
		if (explId != "" && score != 0) {
			playerScore[explId] += score;
			updatePlist();
		}
	} else if (what.indexOf("A") == 0) { // admin
		adminPlayer = what.substring(1)
		updatePlist();
	} else {
		chatLog("unknown event: "+evt.data)
	}
}

function chatLog (message) {
	document.getElementById("chat").innerHTML += "<i>"+message+"</i><br/>"
}

function onError (evt) {
	alert ("Connection error. Reload the page and try again.")
}

function strip (html) {
	return html.replace(/</g,"&lt;").replace(/>/g,"&gt;")
}

function newGame () {
	var msg = prompt ("dimensions and mineCount seperated by spaces","16 16 20");
	websocket.send("G"+msg);
}
