var moduleTerminal = {
    run: function(room) {
        var res_types = baseCreep.getStoredResourceTypes(room.terminal.store);
        
        //check emough energy
        if (room.terminal.store[RESOURCE_ENERGY] < 500) {
            var task = {
                p: 4,
                t: 't',
                s: room.storage.id,
                v: 500,
                a: 0,
                r: room.terminal.id,
                res: RESOURCE_ENERGY
            };
            moduleLogistics.insertOrUpdate(room, task);
            return;
        }
        
        for (var res of res_types) {
            if (room.terminal.store[res] < 1000 || res == RESOURCE_ENERGY) continue;
            
            var orders = Game.market.getAllOrders((order) => 
                order.resourceType == res &&
                order.type == ORDER_BUY &&
                Game.market.calcTransactionCost(1000, room.name, order.roomName) < 500
            );
            
            orders = _.sortBy(orders, (o) => -o.price);
            
            if (orders.length > 0)
            {
                var amount = Math.min(orders[0].remainingAmount, room.terminal.store[res]);
                var ret = Game.market.deal(orders[0].id, amount, room.name);
                return;
            }
        }
    }
};


module.exports = moduleTerminal;