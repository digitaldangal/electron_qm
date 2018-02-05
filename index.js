//Setting up environment
const settings = require("./settings.json");
if (!settings.directory.endsWith("/")){settings.directory = settings.directory.concat("/");} 
const shell = require("electron").shell;
const fs = require("fs");
window.$ = window.jQuery = window.jquery = require("./node_modules/jquery/dist/jquery.min.js");

//let's do this properly - recursive directory scanning
const scandir = function(directory){
    let output = [];
    let files = fs.readdirSync(directory);
    for (let i=0;i<files.length;i++){
        let filestats = fs.statSync(directory+files[i]);
        if (filestats.isFile()){
            output.push();
            console.log(`file added - ${output}`);
        } else if (filestats.isDirectory()){
            output.push(scandir(`${directory}${files[i]}/`));
        }
    }
    console.log(output);
    return output;
};

let allfiles = scandir(settings.directory);

/* this doesn't work, I suck at async
const scandir = function(directory,callback){
    let output = [];
    fs.readdir(directory,(err,files)=>{
        if (err) console.log(err);
        console.log(`Found the following files in ${directory}: ${files}`);
        for (let i=0;i<files.length;i++){
            fs.stat(directory+files[i],(err,stats)=>{
                if (err) console.log(err);
                if (stats.isFile()){
                    console.log(`found ${directory}${files[i]}, pushing to output`);
                    output.push();
                }
                else if (stats.isDirectory()){
                    console.log(`found directory ${directory}${files[i]}, attempting to be recursive`);
                    output.push(scandir(`${directory}${files[i]}/`,callback));
                }
            });
        }
        callback(output);
    });
};

let allthefiles = scandir(settings.directory,callback=>{console.log(callback);return callback;});
*/
//Opening items
$(".external").click(function(){
    let target = $(this).data("target");
    console.log(settings.directory+"/"+target);
    shell.openItem(settings.directory+"/"+target);
});


//Watch directory for changes (use this to alert / check for modified files)
//Not completely implemented. Currently just a proof of concept.
let watcher = fs.watch(settings.directory,{recursive:true},(type,filename)=>{
    if (!filename){ //watch is inconsistent. Don't rely on it providing a filename
        console.log(`fs.watch has detected ${type}, but could not determine a filename.`);
    } else {
        console.log(`fs.watch has detected ${type} at ${filename}.`);
    }
});

//watcher.close();



//Window Interaction
const remote = require('electron').remote;
document.getElementById("button_min").addEventListener("click",(err)=>{
    remote.getCurrentWindow().minimize();
});
document.getElementById("button_max").addEventListener("click",(err)=>{
    let win = remote.getCurrentWindow();
    if (!win.isMaximized()){win.maximize();} else {win.minimize();}
});
document.getElementById("button_exit").addEventListener("click",(err)=>{
    remote.getCurrentWindow().close();
});
