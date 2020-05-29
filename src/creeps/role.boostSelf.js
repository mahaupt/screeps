module.exports = {
    run: function(creep) 
    {
        var lab = Game.getObjectById(creep.memory.boostLab);
        if (!lab) {
            this.reset(creep);
            return;
        }
        
        creep.say("🦾");
        var ret = lab.boostCreep(creep);
        var res = lab.mineralType;
        if (ret == ERR_NOT_IN_RANGE) {
            creep.moveTo(lab, {range: 1, visualizePathStyle: {stroke: '#0000ff'}});
        } else if (ret == ERR_NOT_ENOUGH_RESOURCES || ret == ERR_NOT_FOUND) {
            this.reset(creep);
        }
        
    }, 
    
    
    reset: function(creep, mineralType) {
        delete creep.memory.boostLab;
        delete creep.memory.boostSelf;
    }
};