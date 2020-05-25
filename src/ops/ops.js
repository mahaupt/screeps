/*
Ops List
{type: 'scout', source: 'W3S16', target: 'W1S2', mem: {}}

*/

module.exports = {
    run: function() {
        if (!Memory.ops) {
            Memory.ops = [];
        }
    }, 
    
    
    new: function(type, source, target, mem={}) 
    {
        Memory.ops.push({type: type, source: source, target: target, mem: mem});
    }
};