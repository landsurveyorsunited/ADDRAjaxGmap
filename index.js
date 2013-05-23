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



//window onloadイベント設定
google.maps.event.addDomListener(window, "load", function(){
	addrajaxInit();
	Main();
});

//住所トグルダウン(addrajax)init
function addrajaxInit(){
	var dd = new ADDRAjax( 'pref', 'city', 'town' );
	dd.JSONDATA = '_resource/addrajax/data';
	dd.init();
}


function Main() {

    
	/*********************************************************
	*  入力フォーム関連
	*********************************************************/

	//i入力フォーム(緯度経度)の値を更新する
	var UpdateLatLongValue = function(latlong){
            var tmp = $('#latlong');
            tmp.find('input[name=lat]').val(latlong[0]);
            tmp.find('input[name=long]').val(latlong[1]);
	}
   
	//入力フォーム(住所)から値を取得する
	var GetAddressValue = function(){
		var address = "";
                var tmp = $('#address');
		address += tmp.find('select[name=pref]').val()
		address += tmp.find('select[name=city]').val()
		address += tmp.find('select[name=town]').val()
		address += tmp.find('input[name=address_number]').val();
		return address
	}

	
	
	
	/*********************************************************
	*  マーカー関連
	*********************************************************/
 

	//google Map 初期化
	var GmapInit = function(latlong) {
	var mapDiv = document.getElementById("map_canvas");
	mapObj = new google.maps.Map(mapDiv, {
			center : new google.maps.LatLng(latlong[0], latlong[1]),
			zoom : 15,
			mapTypeId : google.maps.MapTypeId.ROADMAP
		});
		return mapObj;
	}
	
	//地図移動
	var PanTo = function (mapObj, location) { 
		mapObj.panTo(location);
	}
	
    
	/*********************************************************
	*  マーカー関連
	*********************************************************/
        
	//マーカー生成
	CreateMarker= function(mapObj, latlong) {
		return new google.maps.Marker({
			position: new google.maps.LatLng(latlong[0], latlong[1]),
			map: mapObj,
			draggable:true
			//          icon:'_resource/icon/restaurant.png'
		});
	}
    
	//インフォウインドウ 生成
	var CreateInfowindow = function(content) {
		return new google.maps.InfoWindow({
		content: content,
		maxWidth: 300
		});
	}
    

	//マーカーの緯度経度を取得
	var GetMarkerLatlong = function(marker){
		return [marker.getPosition().lat(), marker.getPosition().lng()];
	}

    
	//マーカー管理オブジェクト
	var Markers = {
		member:[] ,
		infowindows:[],
		DragendEventFnction:function(){}, //マーカードラッグ終了後に実行されるfnction
		setMember:function(latlong, infoContent){ //マーカーを設置する
			var m = createMarker(latlong);
			var i  = CreateInfowindow(infoContent);
			Markers.bindInfoWindow(m, i, Markers.closeAllInfowindos);
			Markers.bindDragendEvent(m, Markers.DragendEventFnction);
			Markers.member.push(m);
			Markers.infowindows.push(i);                     
		},
		bindDragendEvent:function(marker, fn){//　マーカーにドラッグイベントをバインド
			console.log(fn);
			google.maps.event.addListener(marker, 'dragend', function(){
				fn(marker);
			}); 		
		},
		bindInfoWindow: function(marker, infowindow, closefn){ //マーカーにインフォウインドウをバインド
			if(infowindow) google.maps.event.addListener(marker, "click", function(){
				if(closefn) closefn();
				infowindow.open(marker.getMap(), marker);
			});		
		},
		deleteAllMarkers:function(){ //全てのマーカーを削除
			if (Markers.member.length > 0) $.map(Markers.member, function(m){
			m.setMap(null);
		});
		Markers.member = [];
		},
		closeAllInfowindos:function(){ //全てのインフォウィンドを閉じる
			if (Markers.infowindows.length > 0) $.map(Markers.infowindows, function(m){
				m.close();
			});
		}
	}
 	
    
	/*********************************************************
	*  geocode関連
	*********************************************************/

    
	//アドレス検索
	var  geocoder = new google.maps.Geocoder();　//geocoderオブジェクト生成
	var SearchAddress = function(fn, address){            
		geocoder.geocode({ 'address': address}, function(results, status){
			if(status == google.maps.GeocoderStatus.OK) {
				fn(results[0].geometry.location);            
			} else {
				alert('エラー: ' + status);
			}
		});
	}

 
	/*********************************************************
	*  メインルーチン
	*********************************************************/

    
	//デフォルト位置
	var latlong = [35.671989,139.76396499999998]; 
	//Google Map 初期化
	var mapObj = GmapInit(latlong);
	
	
	//mapObjをマーカー生成関数に束縛
	var createMarker = curry(CreateMarker, mapObj);
	//mapObjを地図移動関数に束縛
	var panTo = curry(PanTo, mapObj);
	//マーカーの緯度経度取得関数と入力フォーム(緯度経度)の値を更新関数を合成
	var updateLatLongValue = compose(UpdateLatLongValue, GetMarkerLatlong);
	
	//マーカードラッグ終了時に実行するfnctionの設定
	Markers.DragendEventFnction = updateLatLongValue;　//緯度経度項目を更新
		
	
	//住所検索(geocode)時のアクションを束縛
	var searchAddress = curry(SearchAddress, function(location){
		panTo(location); //地図移動
		Markers.deleteAllMarkers(); //マーカーをすべて消す
		Markers.setMember([location.lat(), location.lng()]); //新しいマーカーをセット
		updateLatLongValue(Markers.member[0]); //緯度経度項目を更新
	})

	//住所トグルダウン変更時のイベントを設定
	$('#address > select, input').change(function(){
		searchAddress(GetAddressValue());
	})

	//デフォルト位置にマーカーを設置
	Markers.setMember(latlong, 'test' );	  
}