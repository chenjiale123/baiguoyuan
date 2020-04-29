// baldetail index.js
var common = require('../../../source/js/common');
var commonObj = common.commonObj;
var bg_myaccount = require('../../../source/image-base64/bg_myaccount_top');
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        purchase: [],
        balance: 0,
        isReady: false,
        lastData: '',
        pageNo: 2,
        myaccountbg: bg_myaccount.bg
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        commonObj.checkLoginStatus();
    },
    onShow: function () {
        var token = wx.getStorageSync("token");
        var user = wx.getStorageSync("user");
        var that = this;
        if (!commonObj.checkLoginStatus('baldetail')) {
          commonObj.showModal('提示', '您还未登陆哦，请先登陆~', true, '立即登陆', '', function (res) {
            if (res.confirm) {
              wx.setStorageSync('urlInfo', 'userA/pages/baldetail'); //记录要跳转的页面
              app.globalData.activeFlag = false;
              app.getUserInfo(function () { commonObj.isBindCard() });
            } else if (res.cancel) {
              wx.switchTab({
                url: '/pages/index/index',
              })
            }
          })
        } else {
            wx.showLoading({
              title: '加载中',
              mask: true
            })
            let userId = user.userID;
            let userToken = user.userToken;
            that.getPurchase();
            that.getBalance(userId, userToken, token)
        }       
    },
    onReachBottom: function () {
      // 存在余额的时候才有下拉请求
      if (this.data.hasBalanceDetail) {
        var last = this.data.lastData;
        var pageNo = this.data.pageNo++;
        this.getPurchase(last, pageNo);
      }
    },

    /****************功能函数************************/
    // 获取余额明细
    getPurchase: function (lastdata, pageNo) {
        var that = this;
        var token = wx.getStorageSync("token");
        var user = wx.getStorageSync("user");
        if (user && token) {
            var userId = user.userID;
            var userToken = user.userToken;
        }
        let options = {
            encryptFlag: true,
            url: '/customerManager/detailAccount',
            data: {
                customerID: userId,
                userToken: userToken,
                pageSize: 10,
                pageNumber: pageNo || 1,
                erpLastUpdate: lastdata || '',
            }
        }
        commonObj.requestData(options, function (res) {
            wx.hideLoading();
            if (res.data.errorCode == -1002) {
                commonObj.loginExpired();
            } else if (res.data.errorCode == 0 && res.data.data) {
                var purchaseInfo = JSON.parse(commonObj.Decrypt(res.data.data, token));
                console.log(purchaseInfo);
                if (purchaseInfo.length <=0) {
                    that.setData({isReady: true})
                    return;
                }
                var hash = {};
                if (purchaseInfo.length <= 0) {
                    that.setData({ isReady: true })
                    return;
                }
                purchaseInfo = purchaseInfo.reduce(function (item, next) { //去重
                    hash[next.createTime] ? '' : hash[next.createTime] = true && item.push(next);
                    return item;
                }, []);
                var length = purchaseInfo.length;
                that.setData({ lastData: purchaseInfo[length - 1].createTime });
                var purchaseI = that.data.purchase;
                for (var item in purchaseInfo) {
                    var sym = purchaseInfo[item].operaAmount.slice(0, 1);    // 获得正负符号
                    if (sym === "+") {
                        purchaseInfo[item].symbol = true;
                        purchaseI.push(purchaseInfo[item]);
                    } else {
                        purchaseInfo[item].symbol = false;
                        purchaseI.push(purchaseInfo[item]);
                    }
                }
                that.setData({ hasBalanceDetail: true, isReady: true, purchase: purchaseI });
            }
        }, '', '')

    },

	//获得余额
    getBalance: function (userId, userToken, token) {       
        let params = { customerID: userId, userToken: userToken, "_appInfo": { "os": "wxApp" } };
        let that = this;
        let options = {
            encryptFlag: true,
            url: '/customerManager/getBalance',
            data: params
        };
        commonObj.requestData(options, function (res) {
            if (res.data.errorCode == -1002) {
                commonObj.loginExpired();
            } else if (res.data.errorCode == 0) {
                var balanceObj = JSON.parse(commonObj.Decrypt(res.data.data, token));
                console.log(balanceObj);
                that.setData({ balance: parseFloat(balanceObj.balance) / 100 });
            }
        }, '', function () {
            // wx.hideLoading();
        });
    }
   /****************End************************/
})