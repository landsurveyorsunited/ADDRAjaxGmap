
//カリー化関数
function curry( orig_func ) {
        var ap = Array.prototype,
        args = arguments;
        
        function fn() {
                ap.push.apply( fn.args, arguments );
                
                return fn.args.length < orig_func.length
                ? fn
                : orig_func.apply( this, fn.args );
        };
        
        return function() {
                fn.args = ap.slice.call( args, 1 );
                return fn.apply( this, arguments );
        };
};

//関数合成
function compose() {
    var args = arguments;
    return function (x) {
        for (var i = args.length - 1; i >= 0; i--) {
            x = args[i](x);
        }
        return x;
    };
}