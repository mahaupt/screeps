// todo: remove old tasks

var moduleLogistics = {
    run: function(room) {
        if (!room.memory.ltasks) {
            room.memory.ltasks = [];
        }
        
        //ltasks = {p, t:, s:, v:, a: }
        //prio, type, source, volume, accepted volume
        //moduleLogistics.updateTaskList(room);
    }, 
    
    updateTaskList: function(room)
    {
        moduleLogistics.genLootTasks(room);
        moduleLogistics.genContainerTasks(room);
        moduleLogistics.genLinkTask(room);
        moduleLogistics.sortTaskList(room);
    }, 
    
    genLootTasks: function(room)
    {
        //get loot sources
        var res = room.find(FIND_DROPPED_RESOURCES);
        var ts = room.find(FIND_TOMBSTONES);
        var ru = room.find(FIND_RUINS);
        
        var targets = res.concat(ts).concat(ru);
        
        for (var i=0; i < targets.length; i++)
        {
            var amount = targets[i].amount || targets[i].store.getUsedCapacity();
            
            if (amount > 0)
            {
                var task = {};
                task.p = 6;
                task.t = "loot";
                task.s = targets[i].id;
                task.v = amount;
                task.a = 0;
                
                moduleLogistics.insertOrUpdate(room, task);
            }
        }
    }, 
    
    genContainerTasks: function(room)
    {
        //find mining containers without links
        var mcontainers = room.find(FIND_STRUCTURES, {filter: (s) => {
            return s.structureType == STRUCTURE_CONTAINER && 
                s.pos.findInRange(FIND_SOURCES, 2).length>0 && 
                s.store.getUsedCapacity() >= s.store.getCapacity()*0.1 && 
                s.pos.findInRange(FIND_STRUCTURES, 2, {filter: (t) => t.structureType == STRUCTURE_LINK}).length == 0;
        }});
        
        for (var i=0; i < mcontainers.length; i++)
        {
            var task = {};
            task.p = 5;
            task.t = "mc";
            task.s = mcontainers[i].id;
            task.v = mcontainers[i].store.getUsedCapacity();
            task.a = 0;
            
            moduleLogistics.insertOrUpdate(room, task);
        }
        
    },
    
    genLinkTask: function(room)
    {
        //find base links
        var links = room.find(FIND_STRUCTURES, {filter: (s) => {
            return s.structureType == STRUCTURE_LINK &&
            s.pos.findInRange(FIND_SOURCES, 2).length == 0 && 
            s.store.getUsedCapacity() > 0;
        }});
        
        for (var i=0; i<links.length; i++)
        {
            var task = {};
            task.p = 7;
            task.t = "l";
            task.s = links[i].id;
            task.v = links[i].store.getUsedCapacity();
            task.a = 0;
            
            moduleLogistics.insertOrUpdate(room, task);
        }
    }, 
    
    
    insertOrUpdate: function(room, task)
    {
        var index = _.findIndex(room.memory.ltasks, (s) => { return s.s == task.s && s.t == task.t; });
        
        if (index >= 0)
        {
            //update
            var accepted = room.memory.ltasks[index].a;
            room.memory.ltasks[index] = task;
            room.memory.ltasks[index].a = accepted;
        } else {
            //insert
            room.memory.ltasks.push(task);
        }
    }, 
    
    
    sortTaskList: function(room)
    {
        room.memory.ltasks = _.sortBy(room.memory.ltasks, (s) => -(s.p*1000000+s.v-s.a));
    }
    
    
};


module.exports = moduleLogistics;