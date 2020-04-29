// pages/user/PTorderDetail/index.js
var btnaddbg = require('../../../source/image-base64/btn_add');
var commonObj = require('../../../source/js/common').commonObj;
var bg_highTop = require('../../../source/image-base64/bg_PtorderDetailTop');

var picUrl = commonObj.PAGODA_PIC_DOMAIN;
var status = { 'WAIT_PAY': '待付款', 'GROUPBUY_PROCESS': '待成团', 'WAIT_PICKUP': '待提货', 'PICKED_UP': '已提货', 'CANCELED': '已取消', 'REFUNDED': '已退款' };
var statusNum = { 'WAIT_PAY': 0, 'GROUPBUY_PROCESS': 1, 'WAIT_PICKUP': 2, 'PICKED_UP': 3, 'CANCELED': 4, 'REFUNDED': 5, '': 0 };

var week = { 0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六' }
var wxbarcode = require('../../../source/js/codeImg/index.js');
var timeDown = null;
// 测试手机：13163303806

var app = getApp();
Page({
  data: {
    highTopbg: bg_highTop.bg,
    picHost: "https://oh6dt6vbt.qnssl.com/miResourceMgr/",
    picUrl: picUrl,
    btnAddBg: btnaddbg.bg,
    // 状态
    state: '',
    noEnoughPeople: false,                 // 是否成团，还差人就显示标志
    isShowTime: true,                  	   // 显示提货时间或是成团提示
    isTake: false,                          // 是否待提货状态
    isComposition: false,                   // 是否成团，显示成团时间
    isCancel: false,                       // 是否取消
    isRefund: false,						           // 能否退款
    iscomplaints: false,						       // 能否投诉
    isTake: false,								         // 是否已提货
    isMakeOrder: true,                    // 是否确认订单：false-》未确认，true-》在商品详情页
    isPay: false,                          // 是否支付成功
    clearTimeDown: false,                  // 倒计时
    isReady: false,                        // 是否加载完数据
    isDirect: false,
    disable: false,
    makeOrderLine: false,                    // 用来分享的时候判断是订单详情还是确认订单
    isMakeOrderFlag: true,
    layh: '00',
    laym: '00',
    lays: '00',
    payPrice: ''                            //实付款
  },
  onLoad: function (options) {
    let that = this;
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          viewHeight: res.windowHeight * 2
        })
      },
    })
    console.log(options)
    that.setData({ options: options });
  },

  onShow: function () {
    let that = this;
    var isIphoneX = wx.getSystemInfoSync().model.indexOf('iPhone X') != -1 ? true : false;
    that.setData({
      clearTimeDown: false,
      isIphoneX: isIphoneX
    })
    let store = wx.getStorageSync('selfLiftStore');
    let user = wx.getStorageSync('user')
    let city = wx.getStorageSync('city');
    let options = that.data.options;
    // isAllOrder=ture -> 团单 对象：goodsDetailObj        isAllOrder=flase  -> 商品详情  对象：myAllOrderObj
    // isJoin=true -> 参团                                  isJoin=false -> 参团开团
    that.setData({
      store: store
    })
    // bindCardObj进小程序是未登录的情况下。
    // reDirectObj是取消支付后，再进入订单详情页的情况。
    // fromTemplate   模板消息进来的情况
    // groupLeaderObj 是开团者(团长)，从分享出去的好友页链接进入的。直接跳到订单详情
    // reDirectObj  订单详情页面内状态产生变化，带参数重定向回当前页面

    if (options && options.reDirectObj) {
      var obj = JSON.parse(options.reDirectObj)
      console.log(obj);
      that.getOrderInfo(obj.goodsOrderID, obj.payOrderID, obj.payStatus)    // 订单详情流程
      that.setData({ isDirect: true })
    } else if (options && options.fromTemplate) {
      let goodsorderId = options.goodsOrderID || '';
      let payorderId = options.payOrderID || '';
      that.getOrderInfo(goodsorderId, payorderId, options.orderStatus)      // 订单详情流程
    } else if (options && options.groupLeaderObj) {
      var obj = JSON.parse(options.groupLeaderObj)
      let goodsorderId = obj.goodsOrderID || '';
      let payorderId = obj.payOrderID || '';
      that.getOrderInfo(goodsorderId, payorderId, obj.orderStatus)          // 订单详情流程
    } else {
      var obj = JSON.parse(options && (options.goodsDetailObj || options.myAllOrderObj || options.bindCardObj || options.inviteFriendsObj || options.paySuccessObj));
      console.log(obj);
      if (obj.isAllOrder) {
        that.getOrderInfo(obj.goodsOrderID, obj.payOrderID, obj.payStatus)   // 订单详情流程
        that.setData({ goodsOrderID: obj.goodsOrderID })
        console.log('团单')
      } else {
        if (obj.isJoin) {
          // 如果是参团，那么会有接收这三个参数 groupId openerId goodsId
          console.log('参团')
          that.setData({ groupID: obj.groupID, openerID: obj.openerID, goodsID: obj.goodsID, activityID: obj.activityID })
        } else {
          // 如果是开团，那么只接收一个参数 goodsId
          console.log('开团')
          that.setData({ groupID: -1, openerID: -1, goodsID: obj.goodsID, activityID: obj.activityID })
        }

        // 确认订单流程
        that.orderAndSettlement(user, city, store, obj.goodsID, obj.activityID, store.lon, store.lat);
      }
    }
  },
  onShareAppMessage: function (res) {
    let user = wx.getStorageSync('user');
    console.log(user);
    wx.reportAnalytics('groupinfo_invitefriendbtn');
    if (!this.data.makeOrderLine) {
      var obj = JSON.stringify({ goodsOrderID: this.data.goodsOrderID, userId: user.userID, userToken: user.userToken });
      return {
        title: this.data.groupShareTitle || '拼的是好吃，团的是实惠',
        path: '/fightGroups/pages/inviteFriends/index?paySuccessObj=' + obj,
        imageUrl: picUrl + this.data.groupSharePic || '/source/images/pintuanpeitu.png',
        success: function (res) {
          // 转发成功
          console.log('转发成功')
          wx.reportAnalytics('share_success')
        },
        fail: function (res) {
          // 转发失败
          console.log('转发失败')
          wx.reportAnalytics('share_fail')
        }
      }
    } else {
      var obj = JSON.stringify({ goodsID: this.data.goodsID, activityID: (this.data.activityID || this.data.obj.activityID) });
      return {
        title: '拼的是好吃，团的是实惠',
        path: '/fightGroups/pages/goodsDetail/index?PTorderDetailObj=' + obj,
        imageUrl: '/source/images/pintuanpeitu.png',
        success: function (res) {
          // 转发成功
          console.log('转发成功')
          wx.reportAnalytics('share_success')
        },
        fail: function (res) {
          // 转发失败
          console.log('转发失败')
          wx.reportAnalytics('share_fail')
        }
      }
    }

  },
  onHide: function () {
    this.setData({
      clearTimeDown: true
    })
  },
  onUnload: function () {
    this.setData({
      clearTimeDown: true
    })
  },

  //******************功能函数*******************/
  // 已确认订单的    商品订单详情    包括付款和未付款
  // goodsOrderID-订单号，payStatus-是否支付
  getOrderInfo: function (goodsOrderID, payOrderID, payStatus) {
    console.log('已确认订单的团单详情')
    wx.setNavigationBarTitle({
      title: '订单详情',
    })
    console.log(`订单详情`)
    var that = this;
    var user = wx.getStorageSync('user');
    // 根据订单是否付款来请求不同的接口
    // 未支付
    if (payStatus == 'SUCCESS') {//success为支付订单详情
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
          goodsOrderID: goodsOrderID       // 商品订单ID
        },
        // url: '/groupOrder/queryOrderDetail'      
        url: '/api/v1/groupBuy/goodsOrderDetail'                          // 查询商品订单详情(已支付)&投诉退款详情
      }
      that.setData({ isPay: true })
      console.log(options);
      wx.setStorageSync('orderInfo1', { payOrderID: payOrderID, payStatus: payStatus });
      that.payOrderRequest(options);
    } else {  //其他为商品订单详情
      // 未支付
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
          payOrderID: payOrderID         // 支付订单ID 
        },
        url: '/api/v1/groupBuy/order/queryPayOrderDetail'      // 查询支付订单详情（未支付）
      }
      console.log(options);
      that.setData({ isPay: false })
      wx.setStorageSync('orderInfo1', { payOrderID: payOrderID, payStatus: payStatus });
      that.noPayOrderRequest(options);
    }
  },
  // 未支付订单查询订单详情
  noPayOrderRequest: function (options) {
    let that = this;
    let obj;
    commonObj.requestData(options, function (res) {
      console.log(res);
      if (res.data && res.data.errorCode == 0) {
        let data = res.data.data;
        var goodsList = data.goodsOrderList[0].goodsList[0];;
        let store = data.goodsOrderList[0].store;                                                          // 提货门店信息      
        let lastTime = data.lastUpdate.substring(0, 10);                                 // 最后操作时间
        let groupInfo = data.groupInfo;
        switch (statusNum[data.orderFlowState]) {
          case 0: that.setData({ isComposition: false });                                // 订单状态待付款            
            that.countDown('', data.timeExpire, true);
            break;
          case 4: that.setData({ isCancel: true, isComposition: false });                                    // 订单状态已取消   Y
            var takeTime = data.goodsOrderList[0].deliverySection;  //that.dealWithTime(data.pickupTime, lastTime);          // 取货时间
            break;
        }
        let takeTime = data.goodsOrderList[0].deliverySection;
        // 支付总额
        let yuan = parseInt(goodsList.groupPrice / 100)
        let fen = ((goodsList.groupPrice / 100).toFixed(2) + '').slice(-2);

        obj = {
          orderStatus: status[data.orderFlowState] || '待付款',                // 订单状态
          goodsID: goodsList.goodsID,
          goodsName: goodsList.goodsName,
          spec: goodsList.spec,
          subTitle: goodsList.subTitle,
          pic: picUrl + goodsList.headPic,                         // 商品图片url
          groupPrice: data.payAmount,                              // 原价，以分为单位                                                  
          price: [yuan, fen],                                      // 处理后现价
          oriPrice: (goodsList.originalPrice / 100).toFixed(2),    // 处理后原价
          lastUpdate: data.lastUpdate,                             // 最后操作时间
          isRefund: data.isAllowRefund,                            // 是否能投诉退款   
          payOrderID: data.payOrderID,
          payOrderNum: data.payOrderNum,
          takeTime: takeTime || '',
          groupSize: goodsList.groupSize,
          activityID: goodsList.activityID,
          color: true                                              // 用于在template中来区别样式
        }

        console.log(obj);
        that.setData({
          store: store,           // 提货门店信息
          obj: obj,               // 商品信息
          createTime: data.createTime,
          lastUpdate: data.lastUpdate,
          groupShareTitle: goodsList.groupShareTitle,          // 分享标题
          groupSharePic: goodsList.groupSharePic,              // 分享图片
          isReady: true,
          isShow: true,
          topCountDown: status[data.orderFlowState] == "待付款" || data.orderFlowState == ""
        })
      }
    }, '', function () {
      wx.hideLoading();
    })
  },
  // 已支付订单查询订单详情
  payOrderRequest: function (options) {
    let that = this;
    commonObj.requestData(options, function (res) {
      console.log(res);
      if (res.data && res.data.errorCode == 0) {
        let data = res.data.data;
        let goodsList = data.goodsList[0];                                               // 商品信息
        let store = data.store;                                                          // 提货门店信息      
        let takeCode = data.takeCode;                                                    // 提货码
        var code = /\S{5}/.test(takeCode) && takeCode.replace(/\s/g, '').replace(/(.{4})/g, "$1 ");
        let lastTime = data.lastUpdate.substring(0, 10);                                 // 最后操作时间
        let groupInfo = data.groupInfo;
        // 处理一些数据格式，如价格，时间
        // 支付总额
        let yuan = parseInt(goodsList.groupPrice / 100)
        let fen = ((goodsList.groupPrice / 100).toFixed(2) + '').slice(-2);

        //判断是否是支付过的已取消订单
        if (data.isAllowCancel == "N"){
          that.setData({
            cancelRefund: true
          })
        }
          else{
          that.setData({
            cancelRefund: false
          })
        }
        // 已付款情况下，根据订单状态判断各个时间的显示       还没有完善
        switch (statusNum[data.orderFlowState]) {
          case 0:                                                                        // 0 订单状态待付款 
            that.setData({ isComposition: false });
            that.countDown('', groupInfo.expireTime, true);
            break;
          case 1:                                                                        // 1  订单状态待成团
            that.setData({ isComposition: false, topCountDown: status[data.orderFlowState] == "待成团" });
            that.countDown('', groupInfo.expireTime, true);
            break;
          case 2:                                                                        // 2  订单状态待提货 
            that.setData({ isTake: false, isComposition: true });
            var completeTime = groupInfo.completeTime;                                   // 成团时间
            break;
          case 3:                                                                        // 3 订单状态已提货         
            var completeTime = groupInfo.completeTime;                                   // 成团时间
            var isRefund = data.isAllowRefund == 'Y' ? true : false;                     // 是否能退款
            var iscomplaints = data.iscomplaints == 'Y' ? true : false;                  // 是否能申诉
            var confirmTime = data.confirmTime;                                          // 提货时间
            that.setData({ isTake: true, isComposition: true });
            break;
          case 4:                                                                        // 4 订单状态已取消
            var completeTime = groupInfo.completeTime;                                   // 成团时间
            var flag = groupInfo.status == 'SUCCESS'                                     // 判断式否是已成团取消订单还是未成团取消订单
            that.setData({ isCancel: true, isComposition: flag }); break;
          case 5:                                                                        // 5 订单状态已退款
            var isRefund = data.isAllowRefund == 'Y' ? true : false;
            var completeTime = groupInfo.completeTime;                                   // 成团时间
            var confirmTime = data.confirmTime;                                          // 提货时间
            that.setData({ isTake: true, isComposition: true }); break;
        }
        console.log(data)
        let obj = {
          orderStatus: status[data.orderFlowState],                // 订单状态
          takeCode: code,                                      // 提货码
          goodsID: goodsList.goodsID,                              // 商品ID
          goodsName: goodsList.goodsName,                          // 商品名
          spec: goodsList.spec,                                    // 商品规格
          subTitle: goodsList.subTitle,                            // 商品副标题
          pic: picUrl + goodsList.headPic,                         // 商品图片url
          payAmount: goodsList.groupPrice,                         // 原价，以分为单位
          price: [yuan, fen],                                      // 处理后现价
          oriPrice: (goodsList.originalPrice / 100).toFixed(2),    // 处理后原价
          lastUpdate: data.lastUpdate,                             // 最后操作时间 已取消的时候，是取消时间；已退款的时候，是退款时间
          completeTime: completeTime || '',                        // 成团时间
          confirmTime: confirmTime || '',                          // 收货时间，也就是实际提货时间                   
          takeTime: data.deliverySection || '',                                // 提货时间  
          groupSize: groupInfo.groupSize,
          currentNum: (groupInfo.groupSize - groupInfo.currentCount) || '',
          activityID: goodsList.activityID,                         // 已支付/未支付 的订单详情，路由没有option，所以activityID从接口返回
          show: false                                              // 用于在template中来区别样式
        }
        that.setData({
          store: store,           // 提货门店信息
          obj: obj,               // 商品信息
          createTime: data.createTime,
          groupSharePic: goodsList.groupSharePic,              // 分享图片
          groupShareTitle: goodsList.groupShareTitle,          // 分享标题
          isRefund: isRefund || '',                            // 是否能退款
          iscomplaints: iscomplaints || '',                    // 是否能投诉         
          isReady: true,
          isShow: true
        })
        wx.setStorageSync('orderInfo1', { payOrderID: data.payOrderID, payStatus: 'SUCCESS' });
        wx.setStorageSync('orderInfo2', { goodsOrderID: data.goodsOrderID, goodsOrderNum: data.goodsOrderNum, payOrderNum: data.payOrderNum });
        wxbarcode.barcode('barcode', takeCode, 600, 180);
        console.log(`data:${data}`)
      }
    }, '', function () {
      wx.hideLoading();
    })
  },

  /*******确认订单流程***********/
  /** 1.拼团订单结算接口   在这个函数里面才加入拼团信息，就是团id和开团人id
   *  2.点击付款按钮
   *  3.获取商品详情
   *  4.确认订单
   *  5.付款
   */

  /**拼团订单结算接口 */
  orderAndSettlement: function (user, city, store, goodsID, activityID, lon, lat) {
    let that = this;
    var page = getCurrentPages();
    for (let item in page) {
      if (page[item].route.indexOf('fightGroups/pages/goodsDetail/index') > -1) {
        page[item].data.showPayModal = true;
      }
    }
    wx.setNavigationBarTitle({
      title: '确认订单',
    })
    console.log("确认订单")
    that.setData({ isMakeOrder: false, makeOrderLine: true, isMakeOrderFlag: false });
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
        cityID: city.cityID,
        storeID: store.storeID,
        lon: lon,
        lat: lat,
        goodsID: goodsID,
        activityID: activityID
      },
      url: '/api/v1/groupBuy/order/settlement'
    }
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log(res);
      if (res.data && res.data.errorCode == 0) {
        console.log('加入购物车拼团订单结算')
        var data = res.data.data.inTimeGoosList[0];
        var store = res.data.data.store;
        if (data.isGoodsValid == 'Y') {
          var saleOut = false;
          that.setData({ disable: false })
        } else {
          var saleOut = true;
          that.setData({ disable: true })
        }
        let newPrice = [parseInt(data.groupPrice / 100), ((data.groupPrice / 100).toFixed(2) + '').slice(-2)]          // 拼团价       
        let originalP = (data.originalPrice / 100).toFixed(2);   // 原价
        console.log(data)
        let obj = {                                            // 团信息
          orderStatus: '待付款',
          goodsName: data.goodsName,
          subTitle: data.subTitle,
          price: newPrice,
          groupPrice: data.groupPrice,
          oriPrice: originalP,
          spec: data.spec,
          pic: picUrl + data.headPic,
          groupSize: data.groupSize,
          saleOut: saleOut,
          groupSize: data.groupSize,
          takeTime: res.data.data.pickupTime,
          show: true
        }

        // 时间
        console.log(obj);
        let createTime = new Date().Format('yyyy-MM-dd HH:mm:ss');         // 倒计时创建时间
        that.countDown(createTime, '', false);                					 // 此时没有过期时间
        that.setData({
          obj: obj,
          createTime: createTime,
          store: store,
          isComposition: false,
          isPay: false,
          isReady: true,
          payPrice: `${obj.price[0]}.${obj.price[1]}`
        })
        // that.makeOrderFuc()
      }
    }, '', function () {
      wx.hideLoading()
    })
  },
  // 付款按钮
  makeOrderBtn: function () {
    let that = this;
    console.log('确认订单-步骤2：付款按钮')
    console.log(that.data)
    wx.reportAnalytics('makeorder_paybtn');
    commonObj.showModal('仅可在选定门店取货哦!', '取货地址:' + this.data.store.address, true, '确认', '修改', function (res) {
      if (res.confirm == true) {
        wx.showLoading({
          title: '结算中...',
          mask: true
        })
        app.getUserInfo(function () { that.makeOrderFuc() });
      } else {
        wx.navigateTo({
          url: '/fightGroups/pages/selfExtractStore/index'
        })
      }
    })
    this.preventEvent();

  },
  /**确认订单 */
  makeOrderFuc: function () {
    if (!wx.getStorageSync('wxSnsInfo')) {
      commonObj.showModal('提示', '账号异常，请联系管理员4001811212', false);
      return;
    }
    let that = this;
    let wxInfo = wx.getStorageSync('userNameAndImg');
    let wxSnsInfo = wx.getStorageSync('wxSnsInfo');
    console.log(wxSnsInfo)
    let city = wx.getStorageSync('city');
    let store = wx.getStorageSync('selfLiftStore');
    let user = wx.getStorageSync('user');

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
        customerID: user.userID,                      // 参团人customerID                           
        cityID: city.cityID,
        storeID: store.storeID,
        payAmount: that.data.obj.groupPrice,          // 交易额，单位 分
        receiveAddrID: store.storeID,
        groupID: that.data.groupID,                   // 拼团ID   ，首次开团 -1
        openerID: that.data.openerID,                 // 开团人ID ，首次开团 -1
        wxProfileUrl: wxInfo.avatarUrl,               // 参团人头像url
        wxOpenID: wxSnsInfo.openid,                   // 参团人openID
        wxUnionID: wxSnsInfo.unionid,                   // 参团人openID
        wxNickName: wxInfo.nickName,                   // 参团人微信名
        activityID: that.data.activityID
      },
      // url: '/groupOrder/submit'
      url: '/api/v1/groupBuy/order/submit'
    }
    console.log('确认订单-步骤4：submit接口')
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log(res);
      if (res.data.errorCode == 0) {
        var data = res.data.data;
        that.payRequest(data.payOrderNo, data.payOrderID);
      } else if (res.data.errorCode == 30102) {
        wx.hideLoading();
        commonObj.showModal('提示', '已参加过该团', false, '确认', '', function () {
          wx.switchTab({
            url: '/pages/fightGroups/index'
          })
        })
      } else if (res.data.errorCode == 30101) {
        that.groupIsFull();
      } else if (res.data.errorCode == 30103) {
        wx.hideLoading();
        commonObj.showModal('提示', '未找到参团商品信息', false, '确认', '', function () {
          wx.switchTab({
            url: '/pages/fightGroups/index'
          })
        })
      } else if (res.data.errorCode == 30104) {
        wx.hideLoading();
        commonObj.showModal('提示', '所参团已失效', false, '确认', '', function () {
          wx.switchTab({
            url: '/pages/fightGroups/index'
          })
        })
      }
    }, '', )
  },

  // 付款按钮,订单确认按钮 最终生成订单号，然后传到payRequest函数，请求支付
  // 支付成功，则去paySuccess页
  // 支付取消，则重新刷新页面。然后带上 goodsOrderID,payOrderID,payStatus
  payrightNow: function () {
    this.payRequest();
    wx.reportAnalytics('groupinfo_paybtn');
  },
  /**支付请求 */
  payRequest: function (payOrderNum, payOrderID) {
    var that = this;
    let openid = wx.getStorageSync('wxSnsInfo').openid;
    var payID = that.data.obj.payOrderID || payOrderID;
    let user = wx.getStorageSync('user');
    let deadDate = new Date(new Date().getTime() + 30 * 60 * 1000);
    var timeExpire = new Date(deadDate).Format("yyyyMMddHHmmss");
    // let openid = app.globalData.openid;
    var params = {
      userToken: user.userToken,
      orderNo: that.data.obj.payOrderNum || payOrderNum,
      channel: 'wx_pub',
      totalFee: parseFloat(that.data.obj.groupPrice),
      clientIP: '127.0.0.1',
      subject: '拼团支付',
      body: '百果园拼团',
      timeExpire: timeExpire,
      openID: openid,
      newAccount: 'Y',
      requestTarget: 'wx_mini'
    };
    let options = {
      encryptFlag: false,
      url: '/miPayService/payRequest',
      data: params
    };
    console.log(options)
    commonObj.requestData(options, function (res) {
      console.log(res);
      wx.hideLoading();
      if (res.data.errorCode == 0) {
        var depositObj = res.data.data;
        wx.requestPayment({
          'timeStamp': depositObj.timeStamp,
          'nonceStr': depositObj.nonceStr,
          'package': depositObj.package,
          'signType': 'MD5',
          'paySign': depositObj.paySign,
          'success': function (res) {
            console.log('支付成功回调');
            // 事件统计，充值页面
            wx.reportAnalytics('deposit_success')
            that.isSuccessGroup(payID);
          },
          'fail': function (res) {
            console.log('支付失败回调');
            console.log(res);
            if (res.errMsg.indexOf('cancel') > -1) {
              wx.showToast({
                title: '支付取消',
                icon: 'loading',
                duration: 2000
              })
              if (that.data.isDirect) {
              } else {
                wx.redirectTo({
                  url: '/fightGroups/pages/PTorderDetail/index?reDirectObj=' + JSON.stringify({ goodsOrderID: '', payOrderID: payOrderID || that.data.obj.payOrderID, payStatus: 'PREPAY', isAllOrder: true }),
                })
              }
            } else if (res.data.errorCode == 30101) {
              that.groupIsFull()
            } else {
              wx.showToast({
                title: '支付失败',
                icon: 'loading',
                duration: 2000
              })
            }
          },
          'complete': function (res) {
            console.log('支付回调完成');
            // 取消商品详情的未付款弹窗
            var page = getCurrentPages();
            for (let item in page) {
              if (page[item].route.indexOf('fightGroups/pages/goodsDetail/index') > -1) {
                console.log(page[item])
                page[item].data.showPayModal = '';
                console.log('showPayModel:' + page[item].data.showPayModal)
              }
            }
          }
        })
      } else if (res.data.errorCode == 30101) {
        that.groupIsFull()
      } else {
        console.log('支付失败，。。。');
        wx.showToast({
          title: '支付失败，请重试',
          duration: 2000
        })
      }
    }, function (res) {
      wx.hideLoading();
    }, '');
  },
  // 该处调取paySuccess接口，来查询是否拼团成功，来判断接下来去哪一页
  isSuccessGroup: function (payID) {
    var user = wx.getStorageSync('user');
    var city = wx.getStorageSync('city');
    var options = {
      header: {
        "userToken": user.userToken
      },
      data: {
        customerID: user.userID,
        cityID: city.cityID,
        paymentOrderID: payID,       // 商品订单ID     
      },
      // url: '/groupOrder/paySuccess'
      url: '/api/v1/groupBuy/order/paySuccess'
    }
    commonObj.requestData(options, function (res) {
      console.log('查询是否拼团成功')
      console.log(res)
      if (res.data.errorCode == 0) {
        wx.redirectTo({
          url: '/fightGroups/pages/paySuccess/index?payOrderIDorGoodsOrderID=' + payID + '&fromPTorderDetail=' + true,
        })
      } else if (res.data.errorCode == 30104 || res.data.errorCode == 30109){
        that.groupIsFull()
      }else{
        commonObj.showModal('温馨提醒', '系统繁忙，您所参的团失败，您的退款将会延原路返回！', false, '我知道了', '', function () {
          wx.switchTab({
            url: '/pages/fightGroups/index'
          })
        })
      }
    }, '', '')
  },
  // 传进最后操作时间和提取时间，处理成最后的自提时间
  dealWithTime: function (takeTime, lastTime) {
    // v1.4 版本没有用到
    let weekDay = week[new Date(lastTime).getDay()];
    let time = lastTime + '（' + weekDay + '）' + takeTime;
    return time;
  },

  // 倒计时 已确认和未确认订单
  countDown: function (createTime, expireTime, flag) {        // 参数：过期时间，真假团单
    // console.log('倒计时')
    let that = this, eTime;
    let cTime = new Date(createTime.replace(/-/g, '/')).getTime();
    let nowTime = new Date().getTime();
    if (flag) {
      eTime = new Date(expireTime.replace(/-/g, '/')).getTime();
    } else {
      eTime = cTime + 900000;
    }
    let layTime = Math.round((eTime - nowTime) / 1000);         // 剩余时间秒数
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
        if (!that.data.isPay) {
          console.log('1')
          commonObj.showModal('提示', '支付超时,订单已取消', false, '确认', '', function () {
            if (that.data.isMakeOrder) {
              that.data.obj.orderStatus = '已取消';
              that.data.obj.lastUpdate = new Date().Format('yyyy-MM-dd hh:mm:ss');
              that.data.isCancel = true;
              that.setData({
                obj: that.data.obj,
                isCancel: that.data.isCancel
              })
            } else {
              wx.navigateBack({
                delta: 1
              })
            }
          })
        }
        if (that.data.isPay && !that.data.isComposition) {
          console.log('2')
          commonObj.showModal('提示', '组团超时,订单已取消', false, '确认', '', function () {
            that.data.obj.orderStatus = '已取消';
            that.data.obj.lastUpdate = new Date().Format('yyyy-MM-dd hh:mm:ss');
            that.data.isCancel = true;
            that.setData({
              obj: that.data.obj,
              isCancel: that.data.isCancel
            })
          })
        }
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
        that.countDown(createTime, expireTime, flag)
      }
    }, 1000)
  },

  // 取消订单
  chanelOrder: function () {
    // 取消订单，调取取消订单接口，然后返回首页，
    wx.reportAnalytics('groupinfo_cancelorderbtn');
    this.preventEvent();
    let user = wx.getStorageSync('user')
    let orderInfo1 = wx.getStorageSync('orderInfo1')
    let orderInfo2 = wx.getStorageSync('orderInfo2')
    let options, that = this;
    console.log(orderInfo1)
    console.log(orderInfo2)
    if (orderInfo1.payStatus !== 'SUCCESS') {
      // 未支付
      options = {
        data: {
          customerID: user.userID,
          phoneNumber: user.phoneNumber,
          userToken: user.userToken,
          payOrderID: orderInfo1.payOrderID
        },
        encryptFlag: true,
        url: '/orderManager/cancelOrder'
      }
    } else {
      // 已支付
      options = {
        data: {
          orderNo: orderInfo2.payOrderNum,               //商品订单编号                      // 商户订单号（备注：业务支付订单编号）
          refundNo: orderInfo2.goodsOrderID,             // 商户退款单号，即商户订单ID（备注：业务商品订单编号）
          IPAddr: '127.0.0.1',                           // 需要对业务请求方的IP地址做校验
          refundChannel: '2',                            // 退款渠道 1：退还虚拟货币  2：退还现金
          refundFee: that.data.obj.payAmount,            // 退款总金额, 单位为对应币种的最小货币单位，例如：人民 币为分（如订单总金额为 1 元，此处请填 100）。
          newAccount: 'wx',                              // 当渠道是wx或alipay有用，如果是新账号，后台使用新配置。 默认：Y[V2.2.1]
          payOrderID: orderInfo1.payOrderID,             // 支付订单ID
        },
        encryptFlag: false,
        url: '/miPayService/cancelRefund'
      }

    }
    console.log(options);
    commonObj.showModal('提示', '人家可甜的不要不要的的呢~真的要取消订单么？', true, '残忍取消', '考虑一下', function (res) {
      wx.showLoading({
        title: '取消中',
        mask: 'true'
      })
      if (res.confirm == true) {
        commonObj.requestData(options, function (res) {
          console.log(res);
          if (res.data.errorCode == 0) {
            // 取消订单成功
            wx.hideLoading();
            // commonObj.showModal('提示', '订单取消成功', false, '确认', '', function () {
            //   wx.redirectTo({
            //     url: '/fightGroups/pages/PTorderDetail/index?reDirectObj=' + JSON.stringify({ goodsOrderID: orderInfo2.goodsOrderID, payOrderID: orderInfo1.payOrderID, payStatus: orderInfo1.payStatus }),
            //   })
            // })
            wx.showToast({
              title: '订单取消成功',
              icon: 'success',
              duration: 2000,
              success: function () {
                setTimeout(function () {
                  wx.redirectTo({
                    url: '/fightGroups/pages/PTorderDetail/index?reDirectObj=' + JSON.stringify({ goodsOrderID: orderInfo2.goodsOrderID, payOrderID: orderInfo1.payOrderID, payStatus: orderInfo1.payStatus }),
                  })
                }, 2000)
              }
            })
          }
        }, '', '')
      } else if (res.cancel == true) {
        wx.hideLoading();
        return;
      }
    })
  },
  submitTapFun: function (e) {
    let formId = e.detail.formId;
    let that = this;
    app.getUserInfo(function () { that.submitTap(formId) });
  },
  // 提交表单
  submitTap: function (formId) {
    console.log('form发生了submit事件，携带数据为：')
    // let formId = e.detail.formId;
    if (!wx.getStorageSync('wxSnsInfo')) {
      commonObj.showModal('提示', '账号异常，请联系管理员4001811212', false);
      return;
    }
    let wxSnsInfo = wx.getStorageSync('wxSnsInfo');
    let user = wx.getStorageSync('user');
    let options = {
      data: {
        openId: wxSnsInfo.openid,
        unionId: wxSnsInfo.unionid,
        customerID: user.userID,
        formId: formId
      },
      url: '/form/addFormInfo'
    }
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log(res);
    })
  },
  // 申诉退款提示
  tuikuan: function () {
    wx.reportAnalytics('groupinfo_refunbtn');
    commonObj.showModal('退款须知', '百果园小程序暂未支持退款，您可以下载“百果园App”进行操作', false, '我知道了', '', '')
  },

  // 以下是跳转链接
  // 跳到附近自提门店 切换按钮
  navigateStoreList: function () {
    wx.reportAnalytics('makeorder_changestorebtn');
    wx.navigateTo({
      url: '/fightGroups/pages/selfExtractStore/index',
    })
    this.preventEvent();
  },

  // 跳转自提门店
  navigteSelfExtractStore: function () {
    let obj = JSON.stringify({ goodsID: this.data.goodsID })
    console.log(obj)
    wx.navigateTo({
      url: '/fightGroups/pages/selfExtractStore/index?PTorderDetailObj=' + obj,
    })
    wx.reportAnalytics('groupinfo_navstorebtn');

    this.preventEvent();
  },
  // 跳转导航
  navigateNav: function () {
    let store = wx.getStorageSync('selfLiftStore');
    wx.openLocation({
      latitude: parseFloat(store.lat),
      longitude: parseFloat(store.lon),
      name: store.storeName,
      address: store.address
    })
    this.preventEvent();
  },

  // 拨打客服电话
  callServicePhone: function () {
    let store = wx.getStorageSync('selfLiftStore')
    wx.makePhoneCall({
      phoneNumber: store.storePhone
    })
    wx.reportAnalytics('groupinfo_callservicestorebtn');
    this.preventEvent();
  },

  // 重新购买 or 再次购买
  buyAgain: function () {
    var page = getCurrentPages();
    for (let item in page) {
      if (page[item].route.indexOf('goodsDetail') > -1) {
        wx.navigateBack({
          delta: 1
        })
      }
    }
    wx.reportAnalytics('groupinfo_buyagainbtn');
    let store = wx.getStorageSync('selfLiftStore');
    console.log(store);
    if (store) {
      // 此时 this.data.activityID 是undefined
      let obj = JSON.stringify({ goodsID: this.data.obj.goodsID, activityID: (this.data.activityID || this.data.obj.activityID) })
      wx.redirectTo({
        url: '/fightGroups/pages/goodsDetail/index?PTorderDetailObj=' + obj,
      })
    } else {
      commonObj.showModal('提示', '您附近没有自提门店，无法参与拼团购买活动', false, '我知道了', '', '')
    }

    this.preventEvent();
  },
  // 点击商品，渠道商品详情
  navigateGoodsDetail: function () {
    let obj = JSON.stringify({ goodsID: (this.data.goodsID || this.data.obj.goodsID), activityID: (this.data.activityID || this.data.obj.activityID) })
    wx.navigateTo({
      url: '/fightGroups/pages/goodsDetail/index?inviteFriendsObj=' + obj,
    })
  },
  backHomeBtn: function () {
    wx.switchTab({
      url: '/pages/fightGroups/index',
    })
  },

  groupIsFull: function () {
    let that = this;
    wx.hideLoading();
    commonObj.showModal('温馨提醒', '此团已经满啦，下次早点来~已付的款项按原路返还', true, '开个新团', '我知道了', function (res) {
      if (res.confirm == true) {
        let obj = JSON.stringify({ goodsID: (that.data.goodsID || that.data.obj.goodsID), activityID: (that.data.activityID || that.data.obj.activityID) })
        wx.navigateTo({
          url: '/fightGroups/pages/goodsDetail/index?PTorderDetailObj=' + obj,
        })
      } else if(res.cancel == true){
        wx.switchTab({
          url: '/pages/fightGroups/index'
        })
      }
    })
  },
  // 蒙层
  preventEvent: function () {
    this.setData({ prevent: true });
    setTimeout(() => {
      this.setData({ prevent: false });
    }, 400)
  }
})