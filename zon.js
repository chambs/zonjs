'use strict';

;var zon = (function(document, window, undefined) {

    //Object.create polyfill
    if (!Object.create) {
        Object.create = function (o) {
            if (arguments.length > 1) {
                throw new Error('Object.create implementation only accepts the first parameter.');
            }
            function F() {}
            F.prototype = o;
            return new F();
        };
    }

    //make it work on IE < 8
    if (!window.localStorage) {
      window.localStorage = {
        getItem: function (sKey) {
          if (!sKey || !this.hasOwnProperty(sKey)) { return null; }
          return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
        },
        key: function (nKeyId) {
          return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
        },
        setItem: function (sKey, sValue) {
          if(!sKey) { return; }
          document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
          this.length = document.cookie.match(/\=/g).length;
        },
        length: 0,
        removeItem: function (sKey) {
          if (!sKey || !this.hasOwnProperty(sKey)) { return; }
          document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          this.length--;
        },
        hasOwnProperty: function (sKey) {
          return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
        }
      };
      window.localStorage.length = (document.cookie.match(/\=/g) || window.localStorage).length;
      
      window.sessionStorage = Object.create(window.localStorage);
      window.sessionStorage.setItem = function (sKey, sValue) {
          if(!sKey) { return; }
          document.cookie = escape(sKey) + "=" + escape(sValue) + "; path=/";
          this.length = document.cookie.match(/\=/g).length;
      };
        
      window.sessionStorage.removeItem = function (sKey) {
          if (!sKey || !this.hasOwnProperty(sKey)) { return; }
          document.cookie = escape(sKey) + "=; path=/";
          this.length--;
      };
      
      window.sessionStorage.length = (document.cookie.match(/\=/g) || window.sessionStorage).length;
    }

    var local, session;

    function all() {
        var result = {}, obj, k, arrResult = [];

        for(var i=0; i < this.type.length; i++) {
            k = this.type.key(i);

            try {
                obj = JSON.parse(this.type.getItem(k));
            } catch(err) {
                obj = this.type.getItem(k);
            }
            arrResult.push(obj);
            result[k] = obj;
        }
        
        if(Object.defineProperty) {
            Object.defineProperty(result, 'toArray', {
                value: function() {
                    return arrResult.slice();
                }
            });
        }
        
        return result;
    }

    function toArray() {
        var obj, k, arrResult = [];

        for(var i=0; i < this.type.length; i++) {
            k = this.type.key(i);

            try {
                obj = JSON.parse(this.type.getItem(k));
            } catch(err) {
                obj = this.type.getItem(k);
            }
            arrResult.push(obj);
        }
        
        return arrResult.slice();
    }

    function get(k) {
        var obj;

        try {
            obj = JSON.parse(this.type.getItem(k));
        } catch(err) {
            obj = this.type.getItem(k);
        }
        return obj;
    }

    function insert(id, data) {
        if(typeof(data) === 'object') {
            data = JSON.stringify(data);
        }

        this.type.setItem(id, data);
        return id;
    }
    
    function remove(id) {
        this.type.removeItem(id);
    }
    
    function size() {
        return this.type.length;
    }

    var tmp = {
        all: all,
        get: get,
        set: insert,
        del: remove,
        size: size,
        list: toArray
    };
    
    local = Object.create(tmp);
    local.type = localStorage;
    
    session = Object.create(tmp);
    session.type = sessionStorage;
    
    function generateId() {
        return Date.now() + '' + Math.round(Math.random()*1e9);
    }
    
    var tmpTbl = {
        insert: function(row) {
            var id = generateId();
            local.set(this.tbname + '|' + id, row);
            return id;
        },
        
        findOne: function(id) {
            return local.get(this.tbname + '|' + id);
        },
        
        del: function(id) {
            local.del(this.tbname + '|' + id);
        },
        
        all: function() {
            var result = {};
            var all = local.all();
            var offset, keyLen;
            
            for(var k in all) {
                offset = k.indexOf(this.tbname + '|');
                keyLen = this.tbname.length+1;
                
                if(offset > -1) {
                    result[k.substr(keyLen)] = all[k];
                }
            }
            return result;
        }
        
    };
    
    //stores table objects already called
    var cachedTables = {};
    
    function tbls(tableName) {
    
        if(tableName in cachedTables) {
            return cachedTables[tableName];
        }
    
        var obj = Object.create(tmpTbl);
        obj.tbname = tableName;
        cachedTables[tableName] = obj;
        return obj;
    }
    
    return tbls;
})(document, window);
