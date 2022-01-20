// Displays panel with a countdown timer and button click input for participant to attempt trial effort

// import our custom events centre for passsing info between scenes
import eventsCenter from '../eventsCenter.js'

export default class TimerPanel {
    constructor(scene, x, y, timeLimit, trialEffort) {
        this.scene = scene; 
        
        // initialize time left and press count variables (attach to scene to pass between elements)
        scene.pressCount = 0;
        scene.pressTimes = [];
        scene.timeLeft = timeLimit;

        // setup scene text
        var titleText = 'Power up!';
        var timeText = ('You need to press the POWER button\n'+
                        '[color=#e45404]'+trialEffort+' times[/color] in the next '+timeLimit/1000+' seconds!\n\n'+
                        'Time left: '+(scene.timeLeft/1000).toFixed(2)+' seconds');
        var buttonText = 'POWER';

        // initilize progress bar (full width)
        scene.fullWidth = 388;
        
        // create main panel (dialog box with text + countdown timer + interactive button + effort progress bar)
        var mainPanel = createMainPanel(scene, titleText, timeText, buttonText)
        .setPosition(x,y)
        .layout()
        .popUp(500); 
        
        // every 200ms call updateTimer function (to update 'time left' text in panel)
        var timedEvent = scene.time.addEvent({ delay: 200, callback: updateTimer, 
                                               args: [scene, trialEffort, timeText, timeLimit, mainPanel],
                                               callbackScope: this, repeat: 24 }); // repeat = (limit/delay)-1
        
        // and at end of time limit call endTimer function (to end timer panel scene)
        var timedEvent2 = scene.time.addEvent({ delay: timeLimit, callback: endTimer, 
                                                args: [scene, mainPanel],
                                                callbackScope: this });
    }
    
   update() { }
}

////////////////////functions to be called by timer elements////////////////////////
var updateTimer = function(scene, trialEffort, timeText, timeLimit, mainPanel) {
    // update timer text
    scene.timeLeft -= 200; 
    timeText = ('You need to press the POWER button\n'+
                '[color=#1ea7e1]'+trialEffort+' times[/color] in the next '+timeLimit/1000+' seconds!\n\n'+
                'Time left: '+(scene.timeLeft/1000).toFixed(2)+' seconds'); 
    mainPanel.children[0].children[1].setText(timeText);                 // = mainPanel.dialog.text (when dialog has no title)
    // update effort progress bar
    mainPanel.children[1].setValue(scene.pressCount/trialEffort);  // = mainPanel.progressBar
}

var endTimer = function(scene, mainPanel) {
    // log final press count
    console.log(scene.pressCount);    // useful for debugging
    scene.registry.set('pressCount', scene.pressCount); 
    scene.registry.set('pressTimes', scene.pressTimes); 
    // destroy timer panel elemnt
    eventsCenter.emit('timesup'); 
    mainPanel.scaleDownDestroy(100);
}

////////////////////functions for making in-scene graphics//////////////////////////
///////////main panel////////////
var createMainPanel = function (scene, titleText, timeText, buttonText, trialEffort) {
    // create individual components
    var dialog = createDialog(scene, titleText, timeText, buttonText);    // text + timer text + button
    var progressBar = createProgressBar(scene, trialEffort);              // effort progress bar
    // lay out together using a Sizer
    var mainPanel = scene.rexUI.add.fixWidthSizer({
        orientation: 'x' //'y' // x=vertical stacking, y=horizontal stacking
        }).add(
            dialog, // child
            0, // proportion
            'center', // align
            0, // paddingConfig
            false, // expand
        ).add(
            progressBar, // child
            0, // proportion
            'center', // align
            0, // paddingConfig
            false, // expand
        )
    .layout();
    
    // add button visual functionality
    dialog
        .on('button.over', function (button, groupName, index) {
            button.getElement('background').setStrokeStyle(2, 0xffffff); // when hover
        })
        .on('button.out', function (button, groupName, index) {
            button.getElement('background').setStrokeStyle();   // when un-hover
        });

    return mainPanel;
};

///////////popup dialog box/////////
var createDialog = function (scene, titleText, mainText, buttonText) {
    var textbox = scene.rexUI.add.dialog({
        background: scene.rexUI.add.roundRectangle(0, 0, 400, 400, 20, 0x2F4F4F), 
        content: scene.rexUI.add.BBCodeText(0, 0, mainText, {fontSize: '18px', align: 'center'}),
        space: {
            content: 30, 
            action: 20, 
            left: 10,
            right: 10,
            top: 15,
            bottom: 20,
        },
        actions: [
            createButton(scene, buttonText)
        ],    
        align: {
            actions: 'center',
        },
        expand: {
            content: false
        }
        })
    .layout();
    
    return textbox;
};

/////////interactive button///////////
var createButton = function (scene, text) {
    var btn = scene.rexUI.add.label({
        background: scene.rexUI.add.roundRectangle(0, 0, undefined, undefined, 40, 0xe45404),  // circle
        text: scene.add.text(0, 0, text, {
            fontSize: '20px'
        }),
        align: 'center',
        width: 40,
        space: {
            left: 10, right: 10, top: 10, bottom: 10
        }
    })
    .layout();
    
    // make interactive, record press count and press times
    btn.setInteractive({ useHandCursor: true })
       .on('pointerdown', () => { scene.pressCount +=1; 
                                  scene.pressTimes.push(Math.round(scene.time.now)); });
    
//    // tween (pulse in size)  [looks weird]
//    scene.tweens.add({
//            targets: btn.getElement('background'),
//            radius: '+=10', // 
//            ease: 'Linear', // 'Cubic', 'Elastic', 'Bounce', 'Back'
//            duration: 1000,
//            repeat: -1, // -1: infinity
//            yoyo: true
//        });
    
    return btn;
};

////////animated progress bar/////////
var createProgressBar = function(scene, trialEffort){
    var progressBar = scene.rexUI.add.numberBar({ 
        //height: 250,            // minimum height
        width: scene.fullWidth, 
        orientation: 'horizontal', //'vertical',  // minimum width
        //anchor: {bottom: 'top'},

        background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 20, 0x2F4F4F),
        icon: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0xe45404),

        slider: {
            track: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0x7b8185),
            indicator: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 10, 0xe45404),
            input: 'none',
        },

        space: {
            left: 10,
            right: 10,
            top: 0,
            bottom: 0,
            icon: 10,
            slider: 10,
        },
        
        text: scene.rexUI.add.BBCodeText(0, 0, '', {
            fontSize: '20px', fixedWidth: 50, fixedHeight: 45,
            valign: 'center', halign: 'center'
        }),
        
        valuechangeCallback: function (newValue, oldValue, progressBar, trialEffort) {
            progressBar.text = (Math.round(newValue*100))+'%';
        },
        
    })
    .setValue(0, 0, 1)  // initialize value at 0, on scale from 0 to 1
    .layout();
    
    return progressBar;
};

    

