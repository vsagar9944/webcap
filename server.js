var express = require("express");
var bodyParser = require("body-parser");
var webshot = require('./lib/webshot');
var createPdf = require('./lib/createpdf');
var app = express();
var http = require('http');
var url = require("url");
var fs = require('fs');
/* setting for  request entity too large error */

var config = require('./config/production.app.config.js');

app.use(bodyParser.json({
	limit: '50mb'
}));
app.use(bodyParser.urlencoded({
	limit: '50mb',
	extended: true
}));

/* header used in POST call {application/x-www-form-urlencoded} */
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use("/snapshot/assets", express.static(__dirname + '/assets'));
app.use("/snapshot/login", express.static(__dirname + '/login'));
var imageBaseDir = config.imageBaseDir || "/usr/jcp/report/NodeServerImages/";
app.use("/snapshot/application", express.static(imageBaseDir + '/application'));
app.use("/snapshot/assets2.0", express.static(__dirname + '/assets2.0'));
app.use("/snapshot/gulp", express.static(__dirname + '/gulp'));
app.use("/snapshot/app", express.static(__dirname + '/app'));
// Add headers
app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);
	// Pass to next layer of middleware
	next();
});

var options = {
	siteType: 'html',
	defaultWhiteBackground: true,
	phantomConfig: {
    	'disk-cache': 'true',
    	'max-disk-cache-size': '1024000'
  	},
	screenSize: {
		width: 1024,
		height: 768
	}
};

function processIncommingJSON(req,res){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	var body = req.body;
	var data = JSON.stringify(body, null, 2);
	var obj = JSON.parse(data);
	var data_content = obj.content;
	var data_width = obj.width;
	var data_height = obj.height;
	var fileName = obj.imageName;
	var referral = obj.referral;
	var isReturnImage = obj.returnImage;
	var level = obj.level;
	var filepath = obj.filepath;
	var datalayerList = obj.datalayerList;
	data_content = data_content.replace(/encodedInnoeyeAmpercent/g, '&');
	if (referral != undefined) {
	
	}
	if (data_width != undefined && data_height != undefined) {
		options.screenSize.width = parseInt(data_width);
		options.screenSize.height = parseInt(data_height);
	} else {
		options.screenSize.width = 1024;
		options.screenSize.height = 664;
	}
	if((fileName == undefined||fileName=="") && level != "SMARTPDF"){
		console.log("Snapshot image generation request received at " +new Date());
		fileName = imageBaseDir + '/application/GeneratedImages/snapshotImages/snap';
		fileName = fileName + "_" + new Date().toString().replace(/ /g,'_').replace(/T/, '_').replace(/\..+/, '').replace(/\:+/, '_').replace(/\:+/, '_').replace("_GM_+0530_(IST)","") + ".jpeg"
	}else if((fileName == undefined||fileName=="") && level == "SMARTPDF"){
		console.log("Smart pdf generation request received at " +new Date());

	}else{
		console.log("Feedback image generation request received at " +new Date());
		fileName = fileName.replace("png","jpeg");
		fileName = imageBaseDir + '/application/GeneratedImages/FeedbackImages/'+fileName;
	}
	if(isReturnImage == undefined||isReturnImage==""){
		isReturnImage = "true";
	}
	return {content:data_content,fileName:fileName,isReturnImage:isReturnImage,filepath:filepath,datalayerList:datalayerList};
}

/* for  post request consume application/x-www-form-urlencoded param name content*/
app.post('/snapshot', function (req, res) {
	var dataContent = processIncommingJSON(req,res);
	if (dataContent.content != undefined) {
		webshot(dataContent.content, dataContent.fileName, options, function (err) {
			if (err) return console.log(err);
			console.log(dataContent.fileName);
			fs.readFile(dataContent.fileName, {
				encoding: 'base64'
			}, function (error, data) {
				if(dataContent.isReturnImage=="true"){
					res.end('data:image/jpeg;base64,' + data);
				}else{
					console.log("Feedback image created .......");
					res.end('Feddback image created successfully.');
				}
				res.end();
			});
		});
	}else{
		console.log("Sanpshot image not created because no content passed from ui  at " + new Date());
	}
});

app.listen(3030, function () {
	console.log("Screenshot app server started on port no 3030");
});
