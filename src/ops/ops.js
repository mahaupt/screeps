/*
Ops List
{type: 'scout', source: 'W3S16', target: 'W1S2', mem: {}}

*/

const opsAttack = require('ops_ops.attack');
const opsClaim = require('ops_ops.claim');
const opsDefend = require('ops_ops.defend');
const opsDrain = require('ops_ops.drain');
const opsScout = require('ops_ops.scout');

module.exports = {
    run: function() {
        if (!Memory.ops) {
            Memory.ops = [];
        }
        
        //run
        for(var i in Memory.ops) {
            
            if (Memory.ops[i].type == 'attack') {
                opsAttack.run(Memory.ops[i]);
            } else if (Memory.ops[i].type == 'claim') {
                opsClaim.run(Memory.ops[i]);
            } else if (Memory.ops[i].type == 'defend') {
                opsDefend.run(Memory.ops[i]);
            } else if (Memory.ops[i].type == 'drain') {
                opsDrain.run(Memory.ops[i]);
            } else if (Memory.ops[i].type == 'drain') {
                opsScout.run(Memory.ops[i]);
            }
        }
    }, 
    
    
    new: function(type, source, target, mem={}) 
    {
        Memory.ops.push({type: type, source: source, target: target, mem: mem});
    }
};