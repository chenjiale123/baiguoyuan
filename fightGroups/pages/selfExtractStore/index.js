var coordtransform = require('../../../utils/coordUtil')
var QQMapWX = require('../../../source/js/qqmap-wx-jssdk.min.js')
var common = require('../../../source/js/common')
var commonObj = common.commonObj
Page({
  data: {
    regionListBoxShowFlag: true, //地址联想列表
    storeListBoxShowFlag: false, //提货门店列表
    noResultBoxShowFlag: false, //搜索结果为空
    fromPTorderDetail: false, //记录是从确认订单页过来
    selfLiftStore: '', //记录下提货门店
    addrNow:'',           // 记录当前选择的地址
    storeList: [
      {
        name: '百果园深圳滨海之窗店0',
        address: '南山区文心五路路33号海岸城购物',
        openingTime: '8:00-22:00',
        distance: '0.3km'
      },
      {
        name: '百果园深圳滨海之窗店1',
        address: '南山区文心五路路33号海岸城购物',
        openingTime: '8:00-22:00',
        distance: '0.3km'
      }
    ]
  },
  onLoad: function (options) {
    console.log(options)
    var that = this
    wx.setNavigationBarTitle({
      title: '提货门店'
    })
    wx.showLoading({ title: '加载中' })
    wx.getLocation({
      //先定位
      success: function (res) {
        var lat = res.latitude
        var lon = res.longitude
        var x = coordtransform.gcj02tobd09(lon, lat)
        console.log('log(x) //x = coordtransform.gcj02tobd09(lon, lat)')
        console.log(x)
        let selfLiftStore = wx.getStorageSync('selfLiftStore')
        if (options && options.PTorderDetailObj) {
          var PTorderDetailObj = JSON.parse(options.PTorderDetailObj)
          that.setData({ fromPTorderDetail: true })
          if(selfLiftStore){
            that.getNearByStores(selfLiftStore.lat, selfLiftStore.lon, PTorderDetailObj.goodsID)
          }
          else {
            that.getNearByStores(x[1], x[0], PTorderDetailObj.goodsID)
          }
        }
        else {
          if(selfLiftStore) {
            that.getNearByStores(selfLiftStore.lat, selfLiftStore.lon, '')
          }
          else{
            that.getNearByStores(x[1], x[0], '')
          }
        }
      }
    })
    var cityObj = wx.getStorageSync('city')
    that.setData({
      cityName: cityObj.cityName,
      cityID: cityObj.cityID
    })
    that.routeFrom()

  },
  onShow: function() {
    // wx.showLoading({ title: '加载中' })
  },
  
  chooseCity: function (name, id) { //切换城市走这里
    let that = this;
    // var cityObj = wx.getStorageSync('city'),
    // cityName = cityObj.cityName,
    // var qqmapsdk;
    // qqmapsdk = new QQMapWX({
    //   key: commonObj.qqMapKey
    // });
    // qqmapsdk.geocoder({
    //   address: name,
    //   success: function (res) {
    //     let lat = res.result.location.lat,
    //       lon = res.result.location.lng,
    //       location = { 'lat': lat, 'lon': lon };
    //     that.setData({
    //       location: location
    //     })
    //     that.getNearByStores(location.lat, location.lon);//location出来才能获取附近服务门店
    //   }
    // })
    // wx.setStorageSync('city', { cityName: name, cityID: id })
    that.setData({
      cityName: name,
      cityID: id
    });
  },
  getNearByStores: function (lat, lon, goodsID) {
    var that = this
    var user = wx.getStorageSync('user')
    var options = {
      encryptFlag: false,
      url: '/groupStore/listGroupStore',
      data: {
        cityID: that.data.cityID,
        lon: lon,
        lat: lat,
        goodsID: goodsID,
        distanceAllow: 10000
      }
    }
    commonObj.requestData(options, function (res) {
      wx.hideLoading()
      if (res.data.errorCode == 0) {
        if (res.data.data && res.data.data.length > 0) {
          if (wx.getStorageSync('selfLiftStore')) {
            //有提货门店
            that.setLiftStorePos(res.data.data)
          } else {
            //没有的话，设置第一个为提货门店
            // if (that.data.fromPTorderDetail){ // 只有从确认订单页过来才需要设置第一个为默认门店
            //   wx.setStorageSync('selfLiftStore', res.data.data[0]);
            //   that.setData({selfLiftStore:res.data.data[0]})
            // }
            that.setData({
              storeList: res.data.data,
              noResultBoxShowFlag: false,
              storeListBoxShowFlag: true,
              regionListBoxShowFlag: false
            })
          }
        } else {
          that.setData({
            noResultBoxShowFlag: true,
            storeListBoxShowFlag: false,
            regionListBoxShowFlag: false
          })
        }
      }
    })
  },
  setLiftStorePos: function (arr) {
    //设置选中的提货门店在第一个位置
 
    console.log(arr)
    var that = this
    var liftStore = wx.getStorageSync('selfLiftStore')
    var key = liftStore.storeID
    var storeArr = arr
    for (var i = 0; i < storeArr.length; i++) {
      console.log(
        'storeArr[' + i + '].storeID =' + storeArr[i].storeID + ',key=' + key
      )
      if (parseInt(storeArr[i].storeID) === parseInt(key)) {
        var tempStore = storeArr[i]
        storeArr.splice(i, 1)
        storeArr.unshift(tempStore)
        break
      }
    }
    that.setData({
      storeList: storeArr,
      noResultBoxShowFlag: false,
      selfLiftStore: liftStore,
      storeListBoxShowFlag: true,
      regionListBoxShowFlag: false
    })
    if( that.data.addrNow == ''){
      that.setData({
      addrNow: liftStore.address,
      })
    }
  },
  bindInputTap: function (e) {
    var value = e.detail.value,
      that = this
    that.setData({
      inputValue: value
    })
    
    var qqmapsdk = new QQMapWX({
      key: commonObj.qqMapKey
    })
    
    qqmapsdk.getSuggestion({
      keyword: value,
      region: that.data.cityName,
      region_fix: 1, //限定在当前城市
      success: function (res) {
        that.setData({
          regionList: res.data
        })
        console.log(res.data)
        !value
          ? that.data.storeList.length > 0
            ? that.setData({
              storeListBoxShowFlag: true,
              regionListBoxShowFlag: false,
              noResultBoxShowFlag: false
            })
            : that.setData({
              storeListBoxShowFlag: false,
              regionListBoxShowFlag: false,
              noResultBoxShowFlag: true
            })
          : that.setData({
            storeListBoxShowFlag: false,
            regionListBoxShowFlag: true,
            noResultBoxShowFlag: false
          })
      }
    })
  },
  bindCloseTap: function () {
    //清空搜索地址
    var that = this
    this.setData({
      inputValue: '',
      regionListBoxShowFlag: false,
      storeListBoxShowFlag: that.data.storeList.length > 0 ? true : false,
      noResultBoxShowFlag: that.data.storeList.length > 0 ? false : true
    })
  },
  bindFocusHandler: function (e) {
    wx.reportAnalytics("searchstore")
    //聚焦显示叉叉
    this.setData({
      closeShowFlag: true
    })
  },
  bindBlurHandler: function (e) {
    //失焦隐藏叉叉
    this.setData({
      closeShowFlag: false
    })
  },
  bindRegionTap: function (e) {
    //根据地址搜索门店
    wx.reportAnalytics('searchresult_click')
    var that = this,
      lat = e.currentTarget.dataset.lat,
      lon = e.currentTarget.dataset.lon,
      x = coordtransform.gcj02tobd09(lon, lat)
    console.log('bindRegionTap lat =' + lat + ',lon =' + lon)
    that.setData({
      addrNow: e.currentTarget.dataset.title
    })
    that.getNearByStores(x[1], x[0], '')
  },
  toStoreMapPage: function (e) {
    wx.reportAnalytics('selfliftstorenavigator_click')
    // var that = this,
    //    lat = e.currentTarget.dataset.lat,
    //    lon = e.currentTarget.dataset.lon,
    //    selfExtractObj = {lat:lat,lon:lon};
    //   wx.navigateTo({
    //     url: '/pages/storeMap/index?selfExtractObj='+JSON.stringify(selfExtractObj)
    //   })
    var that = this,
      lat = e.currentTarget.dataset.lat,
      lon = e.currentTarget.dataset.lon,
      name = e.currentTarget.dataset.name,
      address = e.currentTarget.dataset.address,
      x = coordtransform.bd09togcj02(lon, lat)
    wx.openLocation({
      latitude: x[1],
      longitude: x[0],
      name: name,
      address: address
    })
  },

  //选择提货门店
  bindStoreTap: function (e) {
    wx.reportAnalytics('store_click')
    var that = this
    var arr = that.data.storeList
    //门店列表中门店的索引
    let key = e.currentTarget.dataset.key,
      lat = e.currentTarget.dataset.lat,
      lon = e.currentTarget.dataset.lon;
    //tempStore变量存储选择的门店，并且将其置顶。
    for (var i = 0; i < arr.length; i++) {
      if (i === key) {
        var tempStore = arr[key]
        arr.splice(i, 1)
        arr.unshift(tempStore)
        break
      }
    }
    if (tempStore) {
      wx.setStorageSync('selfLiftStore', tempStore)
      wx.setStorageSync('city', { cityName: that.data.cityName, cityID: that.data.cityID })
    } else {
      //列表内没有提货门店
      wx.setStorageSync('selfLiftStore', arr[key])
    }
    that.setData({
      storeList: arr,
      selfLiftStore: tempStore,
      addrNow: tempStore.address
    })
    let prepage = that.routeFrom()
    if (that.data.cityChangeable) {
      prepage.setData({
        storeObj: {
          "cityName": wx.getStorageSync('city').cityName,
          "lat": lat,
          "lon": lon
        }
      })
      
    }
    setTimeout(function () {
      wx.navigateBack({
        delta: 1
      })
    }, 500)
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
  },
  routeFrom: function () {
    //判断来源路由
    var pages = getCurrentPages()
    let len = pages.length - 2;
    if (pages[len]) {
      if (pages[len].route == "pages/fightGroups/index") {
        this.setData({ cityChangeable: true })
      }
      else if (pages[len].route == "fightGroups/pages/PTorderDetail/index") {
        this.setData({ cityChangeable: false })
      }
    }
    return pages[len]
  }
})
