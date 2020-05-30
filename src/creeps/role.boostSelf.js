module.exports = {
    run: function(creep) 
    {
        if (!creep.memory.boostLabs) {
            this.reset(creep);
            return;
        }
        
        
        var lab = Game.getObjectById(creep.memory.boostLabs[0]);
        if (!lab) {
            this.reset(creep);
            return;
        }
        
        creep.say("🦾");
        var ret = lab.boostCreep(creep);
        if (ret == ERR_NOT_IN_RANGE) {
            creep.moveTo(lab, {range: 1, visualizePathStyle: {stroke: '#0000ff'}});
        } else if (ret == ERR_NOT_ENOUGH_RESOURCES || ret == ERR_NOT_FOUND) {
            creep.say(null);
            this.reset(creep);
        }
        
    }, 
    
    
    reset: function(creep) {
        if (creep.memory.boostLabs) {
            creep.memory.boostLabs.shift();
            
            if (creep.memory.boostLabs.length > 0) {
                this.run(creep); // go to next lab
                return;
            }
        }

        delete creep.memory.boostLab;
        delete creep.memory.boostSelf;
    }
};