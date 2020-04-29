// pages/storeMap/index.js
var QQMapWX = require('../../source/js/qqmap-wx-jssdk.min.js');
var coordtransform = require('../../utils/coordUtil');
var common = require('../../source/js/common');
var commonObj = common.commonObj;
Page({
	data: {
		currLocation: {},//用户当前位置的经纬度
		location: {},//中心经纬度
		markers: [],//地图标记点
		controls: [],
		storeData: [],//门店数据
		storeInfo: {},//选中门店的具体信息
		mapCtx: wx.createMapContext('map'),
		cityName: '',
		cityId: '',
		address: '请输入地址',
		flag: false,
    searchBoxShowFlag:true //自提门店过来搜索框隐藏
	},
	onLoad: function (options) {
		wx.showLoading({ title: '加载中' });
		var that = this;
		this.mapCtx = wx.createMapContext('map');
		var cityObj = wx.getStorageSync('city');
		wx.setStorageSync('selCity', { cityID: cityObj.cityID, cityName: cityObj.cityName })
		this.setData({
			cityName: cityObj.cityName,
			cityId: cityObj.cityID
		});
		wx.setNavigationBarTitle({ title: '门店地图' });
		//options.name && this.setData({ cityName: options.name, cityId: options.cityId });// 切换城市
		that.setControlsPos();
		that.searchByOptions(options);
	},
	onShow: function () {
	},
	searchByOptions: function (options) {
		var that = this;
		if (options && options.title) { //门店列表
			var x = coordtransform.bd09togcj02(options.longitude, options.latitude);
			var location = { 'latitude': x[1], 'longitude': x[0] }
			that.setData({
				location: location,
				address: options.title,
				cityName: options.cityName || that.data.cityName,
				cityId: options.cityId || that.data.cityId
			});
			wx.getLocation({
				type: 'gcj02',
				success: function (res) {
					var latitude = res.latitude;
					var longitude = res.longitude;
					that.setData({
						currLocation: { 'latitude': latitude, 'longitude': longitude }
					})
					that.getNearbyStoreData(options.latitude, options.longitude, 0, true);
				},
			})

		}else if (options && options.indexObj) { //首页进来	
      // var x = coordtransform.bd09togcj02(options.longitude, options.latitude);
			// var location = { 'latitude': x[1], 'longitude': x[0] }

			wx.getLocation({
				type: 'gcj02',
				success: function (res) {
					that.setData({
						currLocation: { 'latitude': res.latitude, 'longitude': res.longitude },
            location: { 'latitude': res.latitude, 'longitude': res.longitude },
						cityName: that.data.cityName,
						cityId: that.data.cityId
						// storeName: options.storeName
					})
					that.getNearbyStoreData(that.data.currLocation.latitude, that.data.currLocation.longitude, 0);
				}
			})
		}else if(options && options.selfExtractObj){ //自提门店进来
      var selfExtractObj = JSON.parse(options.selfExtractObj);
      var x = coordtransform.bd09togcj02(selfExtractObj.lon,selfExtractObj.lat);
      var location = {'longitude':x[0],'latitude':x[1]};
      wx.getLocation({
        type:'gcj02',
        success: function(res) {
          that.setData({
            currLocation:{'latitude':res.latitude,'longitude':res.longitude},
            location:location,
            cityName:that.data.cityName,
            cityId:that.data.cityId,
            searchBoxShowFlag:false
          })
          that.getNearbyStoreData(that.data.location.latitude, that.data.location.longitude, 0);
        }
      })
    }

		else { //切换城市等走这里	
			var cityObj = wx.getStorageSync('city'),
				cityName = cityObj.cityName,
				qqmapsdk;
			if (this.data.cityName == cityObj.cityName) { // 切换为当前城市了,直接获取当前位置的信息
				wx.getLocation({
					type: 'gcj02',
					success: function (res) {
						var latitude = res.latitude,
							longitude = res.longitude,
							location = { 'latitude': latitude, 'longitude': longitude };
						that.setData({
							location: location
						});
						that.getNearbyStoreData(location.latitude, location.longitude);//location出来才能获取附近服务门店
					}
				});
			} else { //切换城市	
				qqmapsdk = new QQMapWX({
					key: commonObj.qqMapKey
				});
				qqmapsdk.geocoder({
					address: that.data.cityName,
					success: function (res) {
						var latitude = res.result.location.lat,
							longitude = res.result.location.lng,
							location = { 'latitude': latitude, 'longitude': longitude };
						that.setData({
							location: location
						})
						that.getNearbyStoreData(location.latitude, location.longitude);//location出来才能获取附近服务门店
					}
				})

			}
		}
	},
	setControlsPos: function () {
		var screenWidth, screenHeight, left, top;
		wx.getSystemInfo({
			success: function (res) {
				screenWidth = res.screenWidth;
				screenHeight = res.screenHeight;
				wx.setStorageSync('version', res.version);
				wx.setStorageSync('system', res.system);
			}
		});
		left = screenWidth - 60;
		top = screenHeight <= 480 ? 200 :
			screenHeight <= 568 ? 290 :
				screenHeight <= 640 ? 300 :
					screenHeight <= 667 ? 320 :
						screenHeight <= 736 ? 400 :
							screenHeight <= 830 ? 520 :
								screenHeight <= 960 ? 620 : 920;
		this.setData({
			controls: [{
				id: 0,
				iconPath: '/source/images/btn_navigationb@2x.png',
				position: {
					left: left,
					top: top,
					width: 50,
					height: 50
				},
				clickable: true
			}]
		})
	},
	getNearbyStoreData: function (latitude, longitude, id, flag) { //获取附近服务门店
		var that = this;
		if (flag) { //不需要转化坐标
			var options = {
				encryptFlag: false,
				url: '/storeManager/listServiceStore',
				data: {
					'cityID': that.data.cityId,
					'cityName': that.data.cityName,
					'lat': latitude,
					'lon': longitude,
					'distance': 5000,
					'_appInfo': { "os": "wxApp" }
				}
			}
		} else {
			var x = coordtransform.gcj02tobd09(longitude, latitude)
			var options = {
				encryptFlag: false,
				url: '/storeManager/listServiceStore',
				data: {
					'cityID': that.data.cityId,
					'cityName': that.data.cityName,
					'lat': x[1],
					'lon': x[0],
					'distance': 5000,
					'_appInfo': { "os": "wxApp" }
				}
			}
		}
		commonObj.requestData(options, function (res) {
      console.log('门店标注');
      console.log(res);
      if (res.data.errorCode == 0){
        setTimeout(function () { wx.hideLoading() }, 2000)
        that.setData({ flag: true });
        that.setData({
          storeData: res.data.data
        });
        console.log("getNearbyStoreData!!!!!!!!!!!");
        console.log(res.data.data);
        that.setStoreMarkers(id);//附近门店标注
      } else if (res.data.errorCode == 6103){
        commonObj.showModal('提示', '当前城市未开通服务~', false, '返回', '', function (res) {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/index/index',
            })
          }
        })
      }
		}, '', function () {
			wx.hideLoading();
		})
	},
	setStoreMarkers: function (id) { //门店标注生成
		var that = this, markers = [], iconPath, iWidth, iHeight;
    var length = (that.data.storeData && that.data.storeData.length)||0;
    console.log("storeData.length=" + that.data.storeData.length);
		for (var i = 0; i < length; i++) {
			var dataInfo = this.data.storeData[i];
			var x = coordtransform.bd09togcj02(dataInfo.lon, dataInfo.lat);
			if (i == id) { //第一个门店,也即距离用户最近的门店为选中状态,设置距离用户最近的门店的信息
				iconPath = '/source/images/icon_store_sel@2x.png', iWidth = 63, iHeight = 69;
				var lat1 = that.data.currLocation.latitude;
				var lng1 = that.data.currLocation.longitude;
				var lat2 = x[1];
				var lng2 = x[0];
				var distance = commonObj.getFlatternDistance(lat1, lng1, lat2, lng2);
				var storeInfo = {
					'cityId': this.data.cityId,
					'cityName': this.data.cityName,
					'storeName': dataInfo.name,
					'storeAddress': dataInfo.address,
					'distance': distance,
					'officeHours': dataInfo.openingTime,
					'phoneNum': dataInfo.phone,
					'location': { 'latitude': x[1], 'longitude': x[0] }
				}
				this.setData({
					storeInfo: storeInfo
				});
				wx.setStorageSync('storeInfo', storeInfo);//保存一下选中的门店信息
			} else { //没有默认的,如果有选中的门店在,也要保存信息
				iconPath = '/source/images/icon_store@2x.png', iWidth = 40, iHeight = 45;
				if (that.data.location.latitude == x[1] && that.data.location.longitude == x[0]) {
					var lat1 = that.data.currLocation.latitude;
					var lng1 = that.data.currLocation.longitude;
					var lat2 = x[1];
					var lng2 = x[0];
					var distance = commonObj.getFlatternDistance(lat1, lng1, lat2, lng2);
					var storeInfo = {
						'cityId': this.data.cityId,
						'cityName': this.data.cityName,
						'storeName': dataInfo.name,
						'storeAddress': dataInfo.address,
						'distance': distance,
						'officeHours': dataInfo.openingTime,
						'phoneNum': dataInfo.phone,
						'location': { 'latitude': x[1], 'longitude': x[0] }
					}
					this.setData({
						storeInfo: storeInfo
					});
					wx.setStorageSync('storeInfo', storeInfo);//保存一下选中的门店信息
				}

			}
			var marker = that.createMarker(that.data.storeData[i], i, iconPath, iWidth, iHeight);
			markers.push(marker);
		}
		this.setData({
			markers: markers
		});
		if (typeof (id) == 'undefined') { //regionChange或切换城市过来的时候,如果区域内还存在选中的门店,还得设置为选中状态
			that.setSelMarkerStyle()
		}

	},
	createMarker: function (point, id, iconPath, iWidth, iHeight) {
		var latitude = point.lat;
		var longitude = point.lon;
		var x = coordtransform.bd09togcj02(longitude, latitude);
		var marker = {
			callout: { display: 'BYCLICK' },
			iconPath: iconPath,
			id: id || 0,
			//title:point.name,
			latitude: x[1],
			longitude: x[0],
			width: iWidth,
			height: iHeight
		};
		return marker;
	},
	setSelMarkerStyle: function () { //设置选中的门店样式
		var storeInfo = wx.getStorageSync('storeInfo');
		if (!storeInfo) return;
		var markers = this.data.markers,
			storeName = storeInfo.storeName;
		var id;
		for (var i = 0; i < markers.length; i++) {
			markers[i].iconPath = '/source/images/icon_store@2x.png';
			markers[i].width = 40;
			markers[i].height = 45;
			if (markers[i].latitude == storeInfo.location.latitude && markers[i].longitude == storeInfo.location.longitude) {
				id = i;
				markers[id].iconPath = '/source/images/icon_store_sel@2x.png';
				markers[id].width = 63;
				markers[id].height = 69;
			}
		}
		this.setData({
			markers: markers
		})
	},
	markertap: function (e) { //点击门店标注
		wx.reportAnalytics('marker_click')
		console.log('点击点击点击')
		// this.setStoreMarkers(e.markerId);//设置选中marker样式
		var dataInfo = this.data.storeData[e.markerId];
		var x = coordtransform.bd09togcj02(dataInfo.lon, dataInfo.lat);
		var lat1 = this.data.currLocation.latitude;
		var lng1 = this.data.currLocation.longitude;
		var lat2 = x[1];
		var lng2 = x[0];
		var distance = commonObj.getFlatternDistance(lat1, lng1, lat2, lng2);
		var storeInfo = {
			'cityId': this.data.cityId,
			'cityName': this.data.cityName,
			'storeName': dataInfo.name,
			'storeAddress': dataInfo.address,
			'distance': distance,
			'officeHours': dataInfo.openingTime,
			'phoneNum': dataInfo.phone,
			'location': { 'latitude': x[1], 'longitude': x[0] }
		};
		this.setData({
			storeInfo: storeInfo,
			location: storeInfo.location
		});
		wx.setStorageSync('storeInfo', storeInfo);
		this.setSelMarkerStyle();
	},
	controltap: function (e) { //回到用户最后一次选中的门店位置
		var storeInfo = wx.getStorageSync('storeInfo');
		if (storeInfo) {
			let latitude = storeInfo.location.latitude;
			let longitude = storeInfo.location.longitude;

			this.setData({
				location: storeInfo.location,
				cityId: storeInfo.cityId,
				cityName: storeInfo.cityName
			});
			wx.setStorageSync('selCity', { cityID: storeInfo.cityId, cityName: storeInfo.cityName });
			this.getNearbyStoreData(latitude, longitude);
		}
	},
	regionchange: function (e) {
		var that = this;
		let flag = false;
		if (e.type == 'end') {
			if (this.data.flag) {
				this.setData({ flag: false });
				this.mapCtx.getCenterLocation({
					success: function (res) {
						that.setData({
							location: { 'latitude': res.latitude, 'longitude': res.longitude }
						});
						that.getNearbyStoreData(res.latitude, res.longitude); //移动地图,门店都为不选中状态,不传id就行
					}
				});
			}
		}
	},
	bindPhoneTap: function (e) {
		wx.reportAnalytics('phone_call_click')
		var phoneNum = e.target.dataset.phone;
		wx.makePhoneCall({
			phoneNumber: phoneNum
		})
	},
	bindNavTap: function (e) {
		wx.reportAnalytics('navigator_click')
		var location = e.currentTarget.dataset.location,
			name = e.currentTarget.dataset.name,
			address = e.currentTarget.dataset.address;
		wx.openLocation({
			latitude: location.latitude,
			longitude: location.longitude,
			name: name,
			address: address
		})
	},
	refreshCityInfo: function (name, id) {//用于切换城市,刷新页面用
		var system = wx.getStorageSync('system');
		if (system.includes('Android')) {
			var version = wx.getStorageSync('version').split('.');
      var flag = parseInt(version[0]) <= 6 && parseInt(version[1]) <= 5 && parseInt(version[2]) < 8 ? true : false;
			if (flag) {
				commonObj.showModal('提示', '当前微信版本过低，请升级到最新微信版本后重试。', false)
				return;
			}
		}
		wx.showLoading({ title: '加载中' });
		this.setData({
			cityName: name,
			cityId: id,
			address: '请输入地址'
		})
		this.searchByOptions();
	},
	onShareAppMessage: function () {
		return {
      title: '拼的是好吃，团的是实惠',
			path: '/pages/fightGroups/index',
      imageUrl:'/source/images/pintuanpeitu.png',
			success: function () {
				wx.reportAnalytics('share_success')
			},
			fail: function () {
				wx.reportAnalytics('share_fail')
			}
		}
	}
})