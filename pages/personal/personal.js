// miniprogram/pages/personal/personal.js
const db = wx.cloud.database()
const app = getApp()
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl:'/images/我的.png',
    nickName:'',
    profile:"请加微信联系",
    wxNum:'请完善信息让别人能联系到您',
    phoneNum:'请完善信息让别人能联系到您',
    school:'',
    area:'',
    login:false,
    disabled:true,
    phoneOpen:false,
    wxOpen:true,
    myId:''
  },

  // 自定义事件
  // 获取用户信息，即登录
  getUserInfo(event){
    if (event.detail.userInfo) {
      const {avatarUrl,nickName} = event.detail.userInfo
      const {profile,wxNum,phoneNum,phoneOpen,wxOpen} = this.data
      // 存入数据库
      db.collection('users').add({
        // 会自动存入_id和_openid，openid将作为登录判断依据
        data:{
          avatarUrl,
          nickName,
          profile,
          wxNum,
          phoneNum,
          school:'',
          area:'',
          prodocts:[],
          phoneOpen,
          wxOpen
        },
        success:(res)=>{
          // 数据库再次查询，主要是为了得到_openid
          db.collection('users').doc(res._id).get({
            success:(res)=>{
              // 更新data，并将其存入app中，供其他组件使用
              app.userInfo = {...app.userInfo,...res.data}
              console.log(app.userInfo);
              
              this.setData({nickName,avatarUrl,login:true,myId:res.data._id})
            }
          })
        }
      })
    }
    
  },
  // 点击卡片去主页
  toPersonalIndex(){
    wx.navigateTo({
      url: '/pages/personalIndex/personalIndex?id=' + this.data.myId,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.cloud.callFunction({
      name:'login',
      success:(res)=>{
        const {openid} = res.result
        db.collection('users').where({
          _openid:openid
        }).get({
          success:(res)=>{
            if (!res.data.length) {
              this.setData({disabled:false})
            } else {
              const userInfo = res.data[0]
              this.setData({...userInfo,login:true,myId:userInfo._id})
              app.userInfo = {...app.userInfo,...userInfo}
            }
          }
        }) 
      },
      fail:()=>{
        Toast.fail('连接失败，请稍后再试')
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const {_id} = app.userInfo
    if (_id) {
      const {avatarUrl,nickName,phoneNum,wxNum,profile,school,area,phoneOpen,wxOpen} = app.userInfo
      this.setData({avatarUrl,nickName,phoneNum,wxNum,profile,school,area,phoneOpen,wxOpen,myId:_id})
    }
  },

 
})