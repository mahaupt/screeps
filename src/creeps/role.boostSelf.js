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
        
        if (!creep.pos.inRangeTo(lab, 1)) {
            baseCreep.moveTo(creep, lab, {range: 1, visualizePathStyle: {stroke: '#0000ff'}});
            creep.say("🦾");
        } else {
            let ret = lab.boostCreep(creep);
            if (ret == ERR_NOT_ENOUGH_RESOURCES || ret == ERR_NOT_FOUND) {
                this.reset(creep);
            }
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