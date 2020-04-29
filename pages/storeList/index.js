var QQMapWX = require('../../source/js/qqmap-wx-jssdk.min.js');
var coordtransform = require('../../utils/coordUtil');
var common = require('../../source/js/common');
var commonObj = common.commonObj;
Page({
  data:{
    hasStoreFlag:true,
    cityName:'',
    cityId:'',
    title:'请输入地址',
    address:'',
    location:{},
    storeData:[], //门店信息
    historyData:[] //保存历史记录
  },
  onLoad:function(options){
    var that = this;
    var cityObj = wx.getStorageSync('selCity');
    console.log(cityObj);
    let user = wx.getStorageSync('user');
    let userId = user.userID;
    wx.setNavigationBarTitle({
      title: '门店列表'
    });
    cityObj && this.setData({ //默认城市设置
      cityName: cityObj.cityName,
      cityId: cityObj.cityID
    });
    that.setData({
      historyData: wx.getStorageSync('historyData')[userId] ? wx.getStorageSync('historyData')[userId] : []
    });
    that.searchByOptions(options);//依据options的传值,来确定获取什么样的服务门店
  },
  searchByOptions:function(options){
    var that = this;
    if (options && options.title) {//搜索地址页携带的参数
      this.setData({
        cityName:options.cityName,
        cityId:options.cityId,
        title: options.title,
        location: { 'latitude': options.latitude, 'longitude': options.longitude }
      });
      wx.setStorageSync('selCity', { cityID: options.cityId, cityName: options.cityName });
      that.setHistoryData(options);//保存历史记录
      that.getNearbyStoreData();
    } else { //首页切换过来,获取当前城市5KM外的门店
      wx.getLocation({ //当前位置
        success: function (res) {
          var cityObj = wx.getStorageSync('city');
          that.setData({
            cityName:cityObj.cityName,
            cityId:cityObj.cityID,
            location: { 'latitude': res.latitude, 'longitude': res.longitude }
          });
          wx.setStorageSync('selCity', { cityID: cityObj.cityID, cityName: cityObj.cityName });
          that.getNearbyCityStoreData();
        }
      })
    }
  },
  setHistoryData: function (options) {//设置历史记录
    var that = this,
      title = options.title,
      address = options.address,
      latitude = options.latitude,
      longitude = options.longitude,
      cityName = options.cityName,
      cityId = options.cityId,
      historyData = [],
      currentData = { 'title': title, 'address': address, 'latitude': latitude, 'longitude': longitude, 
              'cityName': cityName, 'cityId': cityId};
    historyData = that.uniqueAndTopKey(currentData);
    var historyDataLen = historyData.length;
    that.setData({ //如果大于十条,截取前十条
      historyData: historyDataLen > 10 ? historyData.slice(0, historyDataLen - 1) : historyData
    });
    let user = wx.getStorageSync('user');
    let userId = user.userID;
    let obj = wx.getStorageSync('historyData') ? wx.getStorageSync('historyData'): new Object();
    obj[userId] = that.data.historyData;
    wx.setStorageSync('historyData', obj);
  },
  uniqueAndTopKey: function (key) { //去重,置顶所选地址
    var arr = this.data.historyData;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].title === key.title) {
        arr.splice(i, 1);
        break;
      }
    }
    arr.unshift(key);
    return arr;
  },
  getNearbyStoreData: function () { //获取附近服务门店
    var that = this;
    //当用户只切换城市，还未输入搜索地址时，展示那个城市距离用户最近的10条，有搜索详细地址时，展示这个地址附近5km以内的门店
    var distance = that.data.title == '请输入地址' ? '' : 5000;
    var x = coordtransform.gcj02tobd09(that.data.location.longitude, that.data.location.latitude)
    var options = {
      encryptFlag: false,
      url: '/storeManager/listServiceStore',
      data: {
        'cityID': that.data.cityId,
        'cityName': that.data.cityName,
        'lat': x[1],
        'lon': x[0],
        'distance': distance,
        '_appInfo': { "os": "wxApp" }
      }
    }
    console.log('接口 /storeManager/listServiceStore')
    console.log(options)
    wx.showLoading({title: '加载中'});
    commonObj.requestData(options, function (res) {
      console.log(res);
      wx.hideLoading();
      if(res.data.errorCode == 0){
        if (distance == '') { //没传距离,如果有超过十条的,截取前十条
          var storeData = res.data.data.length > 10 ? res.data.data.slice(0, 10) : res.data.data;
        } else {
          var storeData = res.data.data;
        }
        res.data.data.length > 0 ? that.setData({
          hasStoreFlag: true,
          storeData: storeData
        })
          : that.setData({
            hasStoreFlag: false
          })
      }else if (res.data.errorCode == 6103) {
        commonObj.showModal('提示', '当前城市未开通服务~', false, '返回', '', function (res) {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/index/index',
            })
          }
        })
      }
      
    })
  },
  getNearbyCityStoreData:function(){ //附近5km内没有门店,距离当前位置最近的十家门店
    var that = this;
    var x = coordtransform.gcj02tobd09(that.data.location.longitude, that.data.location.latitude)
    var options = {
      encryptFlag: false,
      url: '/storeManager/listCityStore',
      data: {
        'cityID': that.data.cityId,
        'cityName': that.data.cityName,
        'lat': x[1],
        'lon': x[0],
        '_appInfo': { "os": "wxApp" }
      }
    }
    console.log(options)
    wx.showLoading({title: '加载中'});
    commonObj.requestData(options,function(res){
      wx.hideLoading();
      console.log(res);
      if(res.data.errorCode == 0){
        var storeData = res.data.data;
        res.data.data && res.data.data.length > 0 ? that.setData({
          hasStoreFlag: true,
          storeData: storeData
        })
          : that.setData({
            hasStoreFlag: false
          })
      }else if (res.data.errorCode == 6103) {
        commonObj.showModal('提示', '当前城市未开通服务~', false, '返回', '', function (res) {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/index/index',
            })
          }
        })
      }
    });
  },
  bindLinkTap:function(){ //看看哪里有门店,展示当前城市最近的十家门店,没有传距离时,后台只能返回十条数据!!!
    var that = this;
    wx.getLocation({
      success: function(res) {
        that.setData({
          location:{'latitude':res.latitude,'longitude':res.longitude},
          title:'请输入地址'
        })
        that.getNearbyCityStoreData();
        // that.getNearbyStoreData();
      }
    })
  },
  refreshCityInfo: function (name, id) {//用于切换城市,刷新页面用
    var that = this;
    this.setData({
      cityName: name,
      cityId: id,
      title:'请输入地址'
    })
    var cityObj = wx.getStorageSync('city'),
      cityName = cityObj.cityName,
      qqmapsdk;
    if (this.data.cityName == cityName) { //切换为当前城市了,直接获取当前位置的信息
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
    } else {
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
         // that.getNearbyStoreData(location.latitude, location.longitude, 0);//location出来才能获取附近服务门店
          that.getNearbyCityStoreData();
        }
      })

    }
  },
  bindNavigatorTap:function(e){
    var latitude = e.currentTarget.dataset.latitude, //用target得到的值是undefined,不知道为啥!!
      longitude = e.currentTarget.dataset.longitude,
      pages = getCurrentPages(),
      delta = 0,prePage;
    for(var i=0;i<pages.length;i++){
      if(pages[i].__route__.indexOf('/storeMap/index')>0){
        delta = pages.length-1-i;//返回到地图页
        prePage = pages[i];
        prePage.searchByOptions({ 'latitude': latitude, 'longitude': longitude, 'title': this.data.title, 
        'cityName': this.data.cityName,
        'cityId': this.data.cityId });
        wx.navigateBack({
          delta: delta
        })
        return;
      }                                                           
    }
    wx.navigateTo({
      url: '/pages/storeMap/index?latitude='+latitude+"&longitude="+longitude+"&title="+this.data.title
    })
  },
  onShareAppMessage: function () {
    return {
      title: '拼的是好吃，团的是实惠',
      path: '/pages/fightGroups/index',
      success: function () {
          wx.reportAnalytics('share_success')
      },
      fail: function () {
          wx.reportAnalytics('share_fail')
      }
    }
  }
})