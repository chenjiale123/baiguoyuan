var common = require('../../source/js/common');
var commonObj = common.commonObj;
Page({
    data: {
        cityList: [],
        backUrl: ''
    },
    onLoad: function (options) {
        wx.setNavigationBarTitle({
            title: '选择城市'
        });
        var that = this;
        var options = {
            encryptFlag: false,
            url: '/api/v1/opened/city/list'
        }
        wx.showLoading({ title: '加载中' })
        commonObj.requestData(options, function (res) {
            wx.hideLoading();
            that.setData({
                cityList: res.data.data
            });
        })
    },
    bindCityTap: function (e) {
        var id = e.currentTarget.dataset.id,
            name = e.currentTarget.dataset.name,
            pages = getCurrentPages();
        if (pages.length > 1) {
            var prePage = pages[pages.length - 2];//上一个页面实例对象
            wx.setStorageSync('selCity', { cityID: id, cityName: name });
            if(prePage.route === 'fightGroups/pages/selfExtractStore/index'){
                prePage.chooseCity(name, id)
            }
            else{
                prePage.refreshCityInfo(name, id); //运行这个路由路径页面的方法
            }
            wx.navigateBack({
                delta: 1
            })
        }
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