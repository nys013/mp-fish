// miniprogram/pages/personalEdit/personalEdit.js
const app = getApp()
const db = wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl:'',
    nickName:'',
    phoneNum:'',
    wxNum:'',
    profile:'',
    phoneOpen:true,
    wxOpen:true,
    phoneMsg:'',
    wxMsg:'',
    school:'',
    area:''
  },
  handelSchoolPick(e){
    const {school,area} = e.detail
    this.setData({school,area})
  },
  uploadPic(){
    wx.chooseImage({
      count:1,
      success:(res)=>{
        const avatarUrl = res.tempFilePaths[0]
        this.setData({avatarUrl})
      }
    })
  },
  handleNickNameChange(e){this.setData({nickName:e.detail})},
  handlePhoneNumChange(e){this.setData({phoneNum:e.detail})},
  handlePhoneOpenChange(e){
    if (!e.detail) {
      this.setData({phoneMsg:'关闭别人则无法看到'})
    }else{
      this.setData({phoneMsg:''})
    }
    this.setData({phoneOpen:e.detail})
    
  },
  handleWxeNumChange(e){this.setData({wxNum:e.detail})},
  handleWxOpenChange(e){
    if (!e.detail) {
      this.setData({wxMsg:'关闭别人则无法看到'})
    }else{
      this.setData({wxMsg:''})
    }
    this.setData({wxOpen:e.detail})
  },
  handleProfileChange(e){this.setData({profile:e.detail})},
  
  // 提交
  submit(){
    // 弹窗确认修改
    wx.showModal({
      title:'修改个人信息',
      content:'确认修改',
      confirmText:'确认',
      success:(res)=>{
        if (res.confirm) {
          // 1.表单验证
          const {avatarUrl,nickName,phoneNum,wxNum,profile,school,area,phoneOpen,wxOpen} = this.data
          const userInfo = {avatarUrl,nickName,phoneNum,wxNum,profile,school,area,phoneOpen,wxOpen}
          if (!nickName) {
            wx.showToast({title: '昵称不能为空',icon:"none"})
            return
          } else if(!profile){
            wx.showToast({title: '简介不能为空',icon:"none"})
            return
          }else if (!school || !area){
            wx.showToast({title: '请选择学校和校区',icon:"none"})
            return
          }
          if (avatarUrl.indexOf('https://wx.qlogo.cn') == -1 && avatarUrl.indexOf('cloud') == -1  ) {
            // 2.若图片是本地图片，则先上传
            wx.cloud.uploadFile({
              cloudPath:"avatar/" + app.userInfo._openid + Date.now() + '.jpg',
              filePath:this.data.avatarUrl,
              success:(res)=>{
                const avatarUrl = res.fileID
                // 3.更新userInfo,更新数据库
                db.collection('users').doc(app.userInfo._id).update({
                  data:{...userInfo,avatarUrl},
                  success:(res)=>{
                    app.userInfo = {...app.userInfo,...userInfo}
                    wx.showToast({title: '修改成功'})
                  }
                })
              }
            })
          }else{
            db.collection('users').doc(app.userInfo._id).update({
              data:userInfo,
              success:(res)=>{
                app.userInfo = {...app.userInfo,...userInfo}
                wx.showToast({title: '修改成功'})
              }
            })
          }
        }
      }
    })

  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const {avatarUrl,nickName,phoneNum,wxNum,profile,school,area,phoneOpen,wxOpen} = app.userInfo

    this.setData({avatarUrl,nickName,phoneNum,wxNum,profile,school,area,phoneOpen,wxOpen})
  },

})