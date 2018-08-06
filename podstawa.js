process.on("uncaughtException", function(s){
	console.log(s); //anty crash
});

var settings = {
	"dateFormat": "dddd, MMMM dS, yyyy", //format daty do komendy date
	"sayFont": "Doom", //czcionka do say
	"botToken": "NDM0NDA2MTQ2NTE4OTQxNzA2.DbKkYw.aN87MNXEnqLltpRQmu00fnLMwwg", //wklej tutaj token do bota
	"streamingText": "Lepszy od dynobota", //tekst na statusie
};

var Discord = require('discord.js');
var bot = new Discord.Client({autoReconnect:true});
var prefix = "."; //zmien prefix jak chcesz
var datejs = require('datejs');
var fs = require('fs');
var ascii = require('ascii-art');
var color = require('chalk');

function logOK(s){
	console.log("[" +color.green('OK') + "] "+s);
}
function logInfo(s){
	console.log("[" +color.yellow('INFO') + "] "+s);
}
function logWarn(s){
	console.log("[" +color.red('WARN') + "] "+s);
}

bot.on("ready", function(){
	process.stdout.write('\033c');
	logOK("Bot started and ready.");
	bot.user.setPresence({ game: { name: settings.streamingText, url: "https://www.twitch.tv/streamerhouse" , type: "STREAMING" }}); //status, streamuje
});
var users = {
	"263008481999585281":{
		permissions: ["*", "commands.executeCommand.js"]
	},
	"179859380630454272":{
		permissions: ["commands.executeCommand.js"]
	},
	"236423871291457537":{
		permissions: ["*", "commands.executeCommand.js"]
	}
};

var aEmoji = {
	channelID: null,
	frame: 0,
	messageID: null,
	frames: [],
};


var oneLinerJoke = require('one-liner-joke');

function hasPerm(user, perm){
	if(!users[user]){
		users[user] = {
			permissions: []
		};
	}
	if(users[user].permissions){
		return users[user].permissions.indexOf(perm)!=-1;
	} else {
		return false;
	}
}

function findUserByName(username){
	var a = bot.users.array();
	for(var b in a){
		var usr = a[b];
		var n = usr.username;
		if(n.toLowerCase().indexOf(username.toLowerCase())!=-1){
			return usr;
		}
	}
	return false;
}
bot.on("message", function(message){
	var msg = message;
	var args = msg.content.split(' ');
	var cmd = args[0].toLowerCase();
	var input = msg.content.substring(args[0].length+1);
	var params = input.split(' ');
	var c = function(text){
		return cmd==prefix+text;
	};
	if(c("test")){
		msg.react("✅");
	}

	if(c("js")){
		if(hasPerm(msg.author.id, "commands.executeCommand.js")){
			try{
				msg.channel.send("JavaScript: "+eval(input));
			} catch(e) {
				msg.channel.send("JavaScript: "+e);
			}
		} else {
			msg.channel.send(msg.author+", you are missing the following permission: commands.executeCommand.js");
		}
	}
	
	if(c("date")){
		if(input){
			try{
				msg.channel.send(Date.parse(input).toString(settings.dateFormat));
			}catch(e){
				msg.channel.send("Unable to parse that.");
			}
		}else{
			msg.channel.send(Date.parse("now").toString(settings.dateFormat));
		}
	}
	
	if(c("joke")){
		if(input){
			msg.channel.send((oneLinerJoke.getRandomJokeWithTag(input).body ? oneLinerJoke.getRandomJokeWithTag(input).body : "No joke with that tag found."));
		}else{
			msg.channel.send(oneLinerJoke.getRandomJoke().body);
		}
	}
	
	if(c("avatar")){
		if(input){
			var a = findUserByName(input);
			if(a){
				try{
					msg.channel.send(a.avatarURL);
				}catch(e){
					msg.channel.send(a.defaultAvatarURL);
				}
			} else {
				msg.channel.send("User not found.");
			}
		} else {
			msg.channel.send(msg.author.avatarURL);
		}
	}

	
	if(c("blocks")){
		if(input){
			var output = "";
			for(var letter in input){
				var a = input[letter];
				switch(a){
					case "!":
						output += ":grey_exclamation: ";
						break;
					 case "?":
						output += ":grey_question: ";
						break;
					case "♥":
						output += ":heart: ";
						break;
					case " ":
						output += "   ";
						break;
					default:
						if(!isNaN(a)){
							var numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
							var number = numbers[parseInt(a)];
							output += ":"+number+": ";
							break;
						}
						output += ":regional_indicator_"+a.toLowerCase()+": ";
						break;
				}
				continue;
			}
			msg.channel.send(output);
		}else{
			msg.channel.send("Usage: "+prefix+"blocks <text>");
		}
	}
	
	if(c("ping")){
		var dateStartPing = Date.now();
		msg.channel.send("Pong!").then(function(s){
			var dateEndPing = Date.now();
			msg.channel.send("Ping: "+parseInt(dateEndPing-dateStartPing)+"ms");
		});
	}
	
	if(c("say")){
		    if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
				return false;
			if(input){
				ascii.font(input, settings.sayFont, function(say){
					msg.channel.send("```fix\n"+say+"\n```");
				});
			} else {
				msg.channel.send("Usage: "+prefix+"say <text>");
			}
	}
	
	if(c("animate")){
		aEmoji.channelID = msg.channel.id;
		aEmoji.frames = msg.content.substring(args[0].length+1).split(' ');
		for(var i in aEmoji.frames){
			aEmoji.frames[i] = aEmoji.frames[i].split("_").join(' ');
			if(i>0){
				aEmoji.frames[i] = aEmoji.frames[i].split("%%").join(aEmoji.frames[i-1]);
			}
		}
		clearInterval(aEmoji.interval);
		aEmoji.frame=0;
		setTimeout(function(){
		msg.channel.send("Initializing animation...").then(function(aem){
			aEmoji.messageID = aem.id;
			aEmoji.interval = setInterval(function(){
				var messageA = bot.channels.get(aEmoji.channelID).fetchMessage(aEmoji.messageID).then(function(messageA){
					var frame = aEmoji.frame;
					messageA.edit(aEmoji.frames[frame]);
					//msg.member.setNickname(aEmoji.frames[frame]);
					aEmoji.frame++;
					if(aEmoji.frame>aEmoji.frames.length-1){
						aEmoji.frame=0;
					}
				});
			},1500);
		});
		},1000);
	}
	
	
});

bot.login(process.env.BOT_TOKEN);
