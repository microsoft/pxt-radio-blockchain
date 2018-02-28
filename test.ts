// tests go here; this will not be compiled when this package is used as a library
// shaking is mining...
input.onGesture(Gesture.Shake, () => {
    led.stopAnimation()
    basic.clearScreen()
    basic.pause(200) // display a short pause
    if (Math.random(3) == 0) { // 30% chances to add a transaction
        // we found a coin!!!
        blockchain.addBlock(1);
        basic.showIcon(IconNames.Diamond);
    } else {
        // missed!
        basic.showIcon(IconNames.Asleep);
    }
})

// show my score
input.onButtonPressed(Button.A, () => {
    led.stopAnimation()
    let score = blockchain.valuesFrom(blockchain.id()).length;
    basic.showNumber(score);
})

// show the block chain size
input.onButtonPressed(Button.B, () => {
    led.stopAnimation()
    basic.showNumber(blockchain.length());
})

// ask neighbors for chains
basic.showString("A=SCORE B=CHAIN SHAKE=MINE", 100)
