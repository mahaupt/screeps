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
        
        if (ret == ERR_NOT_IN_RANGE) {
            creep.moveTo(lab, {range: 1, visualizePathStyle: {stroke: '#0000ff'}});
        } else if (ret == OK) {
            let rem_amt = Labs.Boost.removeDemand(creep, res, LAB_BOOST_MINERAL);
            if (rem_amt <= 0) {
                this.reset(creep);
            }
        } else if (ret == ERR_NOT_ENOUGH_RESOURCES || ret == ERR_FULL) {
            this.reset(creep);
        }
        
    }, 
    
    
    reset: function(creep, mineralType) {
        delete creep.memory.boostLab;
        delete creep.memory.boostSelf;
    }
};