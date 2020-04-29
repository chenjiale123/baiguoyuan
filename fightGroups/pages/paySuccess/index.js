// fightGroups/pages/paySuccess/index.js
var commonObj = require('../../../source/js/common').commonObj;
var pintuanuser = require('../../../source/image-base64/pintuanuser');
var wxbarcode = require('../../../source/js/codeImg/index.js');
var picUrl = commonObj.PAGODA_PIC_DOMAIN;
var timeDown = null;
Page({
	/**
	 * 页面的初始数据
	 */
  data: {
    bg_pintuan: pintuanuser.bg,
    picHost: "https://oh6dt6vbt.qnssl.com/miResourceMgr/",
    picUrl: picUrl,
    layh: '00',
    laym: '00',
    lays: '00',
    tipsShow: false,
    joinSuccess: true,
    picChange: '/source/images/icon_label_tick2.png',
    ct: 0, //countDown() 方法中递归次数计次，实现排除本地时间影响的倒计时
    count: 0
  },

	/**
	 * 生命周期函数--监听页面加载
	 */
  onLoad: function (options) {
    var that = this;
    wx.showLoading({
      title: '加载中...',
      mask: 'true'
    })
    console.log(options)
    if (options && options.payOrderIDorGoodsOrderID) {
      let user = wx.getStorageSync('user');
      var isPaySuccess;
      var page = getCurrentPages();
      console.log(page)
      for (let item in page) {
        if (options.fromPTorderDetail) {
          isPaySuccess = true;
        } else {
          isPaySuccess = false;
        }
      }
      that.setData({
        isPaySuccess: isPaySuccess,
        id: options.payOrderIDorGoodsOrderID
      })
      
      if (isPaySuccess){
        that.checkPayResultFunc(options.payOrderIDorGoodsOrderID, user)
      }else{
        that.getOrderDetailInfo(options.payOrderIDorGoodsOrderID, user, isPaySuccess);
      }
      
    }
    // let user = wx.getStorageSync('user'); 
    // this.getOrderDetailInfo(12195, user, true); //这两行注释模拟拼团成功页，改第一个参数为固定paymentOrderID
    that.getHomePageInfo();
  },

	/**
	 * 生命周期函数--监听页面显示
	 */
  onShow: function () {

  },
  // 用户点击右上角分享
  onShareAppMessage: function (res) {
    let user = wx.getStorageSync('user');
    console.log(user);
    let obj = JSON.stringify({ goodsOrderID: this.data.goodsOrderID, userId: user.userID, userToken: user.userToken, activityID: this.data.activityID });
    console.log(obj);
    return {
      title: this.data.groupShareTitle || '拼的是好吃，团的是实惠',
      path: '/fightGroups/pages/inviteFriends/index?paySuccessObj=' + obj,
      imageUrl: picUrl + this.data.groupSharePic || '/source/images/pintuanpeitu.png',
      success: function (res) {
        // 转发成功
        console.log('转发成功');
        wx.reportAnalytics('paysuc_invitefriendssuc');
      },
      fail: function (res) {
        // 转发失败
        console.log('转发失败');
        wx.reportAnalytics('paysuc_invitefriendsfail');
      }
    }

  },

  /***********************功能函数 **************************/
  // 查询订单是否支付回调完成
  checkPayResultFunc: function (id, user) {
    var that = this;
    var options = {
      header: {
        'X-DEFINED-appinfo': JSON.stringify({
          "channel": "miniprogram",   //渠道
          "model": "iPhone 6",
          "os": "iOS 10.1.1",
          "verName": "2.4.0.0",
          "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
        }),
        "userToken": user.userToken
      },
      data: {
        customerID: user.userID,
        payOrderID: id       // 商品订单ID
      },
      url: '/api/v1/groupBuy/order/checkPayResult'
    }
    commonObj.requestData(options, function (res) {
      console.log(res)
      if (res.data.errorCode == 0) {
        if (res.data.data.payResult == 'Y') {
          that.getOrderDetailInfo(that.data.id, user, that.data.isPaySuccess);
        } else {
          var countNum = that.data.count;
          console.log(countNum);
          if (countNum < 20) {
            countNum++;
            that.setData({
              count: countNum
            })
            setTimeout(function () {
              that.checkPayResultFunc(id, user)
            }, 500)

          } else {
            that.getOrderDetailInfo(that.data.id, user, that.data.isPaySuccess);
            console.log('回调不成功')
          }
        }
      }
    })
  },

  // 订单详情 orderId是订单id
  getOrderDetailInfo: function (id, user, isPaySuccess) {
    console.log('付款成功后商品信息')
    let that = this;
    let city = wx.getStorageSync('city');
    var options;
    if (isPaySuccess) {
      options = {
        header: {
          "userToken": user.userToken
        },
        data: {
          customerID: user.userID,
          cityID: city.cityID,
          paymentOrderID: id,       // 商品订单ID     
        },
        // url: '/groupOrder/paySuccess'
        url: '/api/v1/groupBuy/order/paySuccess'
      }
    }else {
      options = {
        header: {
          'X-DEFINED-appinfo': JSON.stringify({
            "channel": "miniprogram",   //渠道
            "model": "iPhone 6",
            "os": "iOS 10.1.1",
            "verName": "2.4.0.0",
            "deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
          }),
          "userToken": user.userToken
        },
        data: {
          customerID: user.userID,
          goodsOrderID: id       // 商品订单ID
        },
        url: '/api/v1/groupBuy/goodsOrderDetail'
      }
    }


    console.log('支付成功页面')
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log(res)
      if (res.data.errorCode == 0 && res.data.data) {
        wx.setNavigationBarTitle({
          title: '付款成功',
        })
        let data = res.data.data;
        that.setData({
          currTime: res.data.systemTime        // 服务器当前时间
        })
        let goodsInfo = data.groupGoodsInfo || data.goodsList[0];
        let groupInfo = data.groupInfo;
        let groupMemberList = groupInfo.groupMemberList;  // 参团用户的信息
        console.log("groupInfo.groupSize - groupInfo.currentCount")
        console.log(`=${groupInfo.groupSize} - ${groupInfo.currentCount}`)
        let numPer = groupInfo.groupSize - groupInfo.currentCount;
        let yuan = parseInt(goodsInfo.groupPrice / 100)
        let fen = ((goodsInfo.groupPrice / 100).toFixed(2) + '').slice(-2);
        goodsInfo.price = parseFloat(goodsInfo.price / 100).toFixed(2);

        that.countDown(groupInfo.expireTime);
        if (numPer == 0) {
          that.setData({ isComposition: true })
        } else {
          that.setData({ isComposition: false })
        }
        let obj = {
          goodsName: goodsInfo.name || goodsInfo.goodsNmae,
          subTitle: goodsInfo.subTitle,
          spec: goodsInfo.spec,
          price: [yuan, fen],
          oriPrice: goodsInfo.price,
          pic: picUrl + goodsInfo.headPic,                    // 商品图片url
          numPer: numPer,
          groupSize: groupInfo.groupSize,
          deliverySection: data.deliverySection || '',
          takeCode: data.takeCode || ''
        }
        wxbarcode.barcode('barcode', data.takeCode, 600, 180); // 生成一维码
        for (let item in groupMemberList) {
          if (user.userID == groupMemberList[item].customerID) {
            var goodsOrderID = groupMemberList[item].goodsOrderID
          }
        }
        var num = groupInfo.groupSize - groupInfo.currentCount;
        // console.log(num)
        for (var x = 0; x < num; x++) {
          groupMemberList.push({});
        }

        that.setData({
          obj: obj,
          groupSharePic: goodsInfo.groupSharePic,
          groupShareTitle: goodsInfo.groupShareTitle,
          goodsOrderID: goodsOrderID,
          groupMemberList: groupMemberList,
          activityID: goodsInfo.activityID,
          goodsID: goodsInfo.id || goodsInfo.goodsID,
          joinSuccess: true,
          isReady: true
        })

        var page = getCurrentPages();
        for (let item in page) {
          if (page[item].route.indexOf('fightGroups/pages/goodsDetail/index') > -1) {
            page[item].data.showPayModal = '';
            if (groupInfo.status == 'PROCESS') {
              page[item].data.goodsOrderID = goodsOrderID;
            }
            console.log(page);
          }
        }
      } else if (res.data.errorCode == 30104) {
        wx.setNavigationBarTitle({
          title: '拼团失败',
        })
        that.setData({
          joinSuccess: false
        })

        // commonObj.showModal('提示', '所参团已失效，退款金额将原路返回', false, '确认', '', function () {
        //   wx.switchTab({
        //     url: '/pages/fightGroups/index'
        //   })
        // })
      } else if (res.data.errorCode == 30101) {
        wx.setNavigationBarTitle({
          title: '拼团失败',
        })
        that.setData({
          joinSuccess: false
        })

        // commonObj.showModal('提示', '所参团现已满或已取消，退款金额将原路返回', false, '确认', '', function () {  
        //   wx.switchTab({
        //     url: '/pages/fightGroups/index'
        //   })
        // })
      } else {
        console.log(res)
      }
      wx.hideLoading()
    }, '', function () {
      that.setData({ isReady: true })
    })

  },
  // 倒计时 支付成功-未成团
  countDown: function (expireTime, duration) {        // 参数：过期时间，真假团单
    let that = this, eTime;

    let currTime = duration ? (that.data.currTime - (-duration)) : that.data.currTime
    let layTime = Math.round((new Date(expireTime.replace(/-/g, '/')).getTime() - currTime) / 1000);         // 剩余时间秒数
    timeDown = setTimeout(function () {
      // console.log('大于0' + layTime)
      if (layTime < 0) {
        console.log('小于0' + layTime)
        clearInterval(timeDown)
        timeDown = null;
        that.setData({
          layh: '00',
          laym: '00',
          lays: '00',
        })
        return;
      }
      let h = parseInt(layTime / 3600);
      let m = parseInt(layTime / 60 - h * 60);
      let s = parseInt(layTime % 60);

      s = s < 10 ? '0' + s : s;
      m = m < 10 ? '0' + m : m;
      h = h < 10 ? '0' + h : h;
      that.setData({
        layh: h,
        laym: m,
        lays: s,
      })
      if (that.data.clearTimeDown) {
        return;
      } else {
        that.data.ct++
        that.countDown(expireTime, that.data.ct * 1000)
      }
    }, 1000)
  },
  getHomePageInfo: function () {        //获取拼团列表
    var that = this;
    var userCurrLoc = wx.getStorageSync('userCurrLoca');
    var selfLiftStore = wx.getStorageSync('selfLiftStore');
    var city = wx.getStorageSync('city');
    var options = {
      encryptFlag: false,
      url: '/api/v1/groupBuy/homepage',
      data: {
        cityName: city.cityName || userCurrLoc.cityName,
        lon: selfLiftStore.lon || userCurrLoc.location.lng,
        lat: selfLiftStore.lat || userCurrLoc.location.lat,
        storeID: '' || (wx.getStorageSync('selfLiftStore') && wx.getStorageSync('selfLiftStore').storeID)
      }
    }
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log(res)
      if (res.data.errorCode == 0) {
        var goodsList = res.data.data.goodsList;
        that.formatGroupPrice(goodsList);
        that.setData({
          isReady: true,
          isRecommend: goodsList.length > 0 ? true : false
        })
      }
    })
  },
  formatGroupPrice: function (goodsList) { //格式化拼团价格
    var that = this;
    for (var item in goodsList) {
      goodsList[item].groupPrice = String((goodsList[item].groupPrice / 100).toFixed(2)).split('.');
      goodsList[item].price = (goodsList[item].price / 100).toFixed(2);
    }
    that.setData({ goodsList: goodsList })
  },
  showTips: function () { //显示模板
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(800).step()
    this.setData({
      animationData: animation.export(),
      tipsShow: true
    })
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 200)
  },
  hideTips: function () { //隐藏模板
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(800).step()
    this.setData({
      animationData: animation.export(),
    })
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export(),
        tipsShow: false
      })
    }.bind(this), 200)
  },
  /***********************End **************************/
  //  跳转链接
  navigatePTorderDetail: function () {
    var obj = JSON.stringify({
      goodsOrderID: this.data.goodsOrderID,
      isAllOrder: true,
      payStatus: 'SUCCESS'
    })
    wx.navigateTo({
      url: '/fightGroups/pages/PTorderDetail/index?paySuccessObj=' + obj,
    })
  },
  // 跳转商品详情  新增组件里的东西
  navigateGoodsDetail: function (e) {
    wx.reportAnalytics("paysuccessbrandclick")        //支付成功页品牌click v1.4
    console.log(e);
    var obj = JSON.stringify({
      goodsID: e.detail.goodsID || e.currentTarget.dataset.goodsid,
      activityID: e.detail.activityID || e.currentTarget.dataset.activityid
    })
    wx.navigateTo({
      url: '/fightGroups/pages/goodsDetail/index?paySuccessObj=' + obj,
    })
  },
  navigateFightGroupsIndex: function () {
    wx.switchTab({
      url: '/pages/fightGroups/index',
    })
  },
  backHomeBtn: function () {
    wx.switchTab({
      url: '/pages/fightGroups/index',
    })
  },
  // 蒙层
  preventEvent: function () {
    this.setData({ prevent: true });
    setTimeout(() => {
      this.setData({ prevent: false });
    }, 400)
  },

  recommandNavigate() {
    wx.reportAnalytics("pay_recommendgoodclick")   //支付页推荐商品click v1.4
  }
})