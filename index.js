/*
Environment Setup
*/
const shell = require("electron").shell;
const {dialog} = require('electron').remote;
const fs = require("fs-extra");
require.extensions['.txt'] = function (module, filename) { //making txt files require-able, thanks stackoverflow
    module.exports = fs.readFileSync(filename, 'utf8');
};
const trumpipsum = require("./res/trumpipsum.txt");
let settings,structure;
window.$ = window.jQuery = window.jquery = require("./node_modules/jquery/dist/jquery.min.js");

/*
Alertboxes - not quite done yet. Currently only supports one at a time, which sucks.
*/
const alertbox = function(text,title){
    if (title) {$("#alert_title").html(title);}else{$("#alert_title").html("Warning");}
    if (text) {$("#alert_container p").html(text);}else{$("#alert_container p").html(trumpipsum);}
    $("#alert").show();
    //maybe make level cause different behaviour
};
let alertcloselistener = $("#error_x").click(()=>$("#alert").hide());

/*
Check for existing/valid settings/structure files and create them from template if they don't.
*/
//settings
try {
    fs.accessSync("settings.json","fs.constants.W_OK"); //Write permission required
    settings = require("./settings.json");
    let requiredsettings = ["directory"];
    for (let i=0;i<requiredsettings.length;i++){
        if (!settings.hasOwnProperty(requiredsettings[i])){
            throw new Error(`settings.json incomplete or broken. Exception thrown at property ${requiredsettings[i]}`);
        }
    }
} catch (err) {
    fs.copySync("res/templates/settings.json","settings.json");
    settings = require("./settings.json");
    alertbox("Your settings were incomplete or missing and have been reset.");
}
if (settings.directory && !settings.directory.endsWith("\\") && !settings.directory.endsWith("/")){settings.directory = settings.directory.concat("\\");} 
//structure
try {
    fs.accessSync("structure.json","fs.constants.W_OK"); //Write permission required for UI changes
    structure = require("./structure.json");
} catch (err) {
    fs.copySync("res/templates/structure.json","structure.json");
    structure = require("./structure.json");
    alertbox("We could not find a structure to use for your UI. A default UI has been loaded for your reference.");
}


/*
Check if Directory is present (not null due to the template), and writable. If so, run chkmkdir() thrice to make required directories.
Target dir should have three directories at all times: current, editing, legacy
current will contain files accessible by view, Editing will have the versions that are being edited until confirmed good, Legacy has old versions thaat were overwritten through edits 
check if dirs exist, if they don't, create them
*/
const chkmkdir = function(dir){
    try {
        fs.accessSync(`${settings.directory}${dir}`);
        console.log(`Directory ${dir} present`);
    } catch (err) {
        console.log(`Couldn't find directory ${dir}, making one`);
        fs.mkdirSync(`${settings.directory}${dir}`);
    }
};
if (settings.directory !== null){
    try {
        fs.accessSync(settings.directory,"fs.constants.W_OK");
        console.log("Access to directory is OK");     
        chkmkdir("current");
        chkmkdir("editing");
        chkmkdir("legacy");
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
    } catch (err){
        alertbox("The program is unable to write to the directory specified in the settings, or the directory does not exist! Please double-check your settings.");
        throw Error("An error occured while setting up the environment in the specified directory. It is likely that you lack write permissions for this directory.",err);
    }
} else {
    alertbox("You haven't specified a directory yet. Please do so by opening the settings tab.","Directory missing");
}


/*
Switching UI modes
*/
const changeUI = function(type){
    $("main section").hide();
    $(`#ui_${type}`).show();
    //meme
    if (type=="help"){
        shell.openExternal("https://www.youtube.com/watch?v=oHg5SJYRHA0");
    }
};
changeUI("view"); //on program start, load view mode
//Aside Interaction and changing modes
$("aside ul li").click((event)=>{
    let $el = $(event.target);
    let target = $(event.target).data("target");
    $("aside ul").children().removeClass("active");
    $el.addClass("active");
    changeUI(target);
});

/*
View Mode
*/
const loadViewStructure = function(name){
    let $ui_view = $("#ui_view");
    $ui_view.empty();
    if (!structure.hasOwnProperty(name)){
        console.log("Error - Structure reference for "+name+" does not exist");
        return false;
    }
    let temp_data = structure[name];
    for (let i=0;i<temp_data.length;i++){
        $ui_view.append(`<div class="button" data-btntype="${temp_data[i].type}" data-target="${temp_data[i].target}">${temp_data[i].text}</div>`);
        if (temp_data[i].hasOwnProperty("color") && temp_data[i].color){$("#ui_view div:last-child").css("color",temp_data[i].color);}
        if (temp_data[i].hasOwnProperty("backgroundcolor") && temp_data[i].backgroundcolor){$("#ui_view div:last-child").css("background-color",temp_data[i].backgroundcolor);}
    }
    console.log("Loaded structure "+name);
    return true;
};
loadViewStructure("main");
//button interaction
$(document).on("click",".button",function(){
    let btntype = $(this).data("btntype");
    let target = $(this).data("target");
    //opening files
    if (btntype === "file"){ 
        console.log(`Attempting to open ${settings.directory}current/${target}`);
        shell.openItem(`${settings.directory}current/${target}`);
    }
    //changing the display ("subdirectories")
    else if (btntype === "sub"){
        console.log(`Attempting to load structure ${target}`);
        loadViewStructure(target);
    }
    
});

/*
Settings Mode
*/
const updateVisualSettings = function(){
    $("#directorypicker span").html(settings.directory);
};
updateVisualSettings();

$("#directorypicker").click(()=>{
    dialog.showOpenDialog({title:"Choose a directory...",properties:["openDirectory"]},(filePaths)=>{
        if (filePaths){
            settings.directory = filePaths[0];
            fs.writeFile("settings.json",JSON.stringify(settings),(err)=>{
                if (err) throw err;
                console.log("settings.json has been saved.");
                updateVisualSettings();
            });
        }
    });
});
/*
Window interaction (maximize, minimize, close)
*/
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

