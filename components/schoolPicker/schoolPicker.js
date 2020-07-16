// components/schoolPicker/schoolPiker.js
const app = getApp()
const db = wx.cloud.database()
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    productInfo:Object
  },

  /**
   * 组件的初始数据
   */
  data: {
    schoolShow:'',
    area:'',
    school:'',
    columns:[],
    schoolObj:{},
    flag:true
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleSchoolChange(event){
      const {picker,value} = event.detail
      picker.setColumnValues(1,this.data.schoolObj[value[0]])
    },
    showPopup(){
      this.setData({schoolShow:true})
    },
    closePopup() {
      this.setData({ schoolShow: false });
    },
    handleSchoolCancel() {
      this.setData({ schoolShow: false });
    },
    handleSchoolConfirm(e){
      const {value} = e.detail;
      const school = value[0]
      const area = value[1]
      this.setData({school, area , schoolShow: false})
      this.triggerEvent('school-pick',{school, area})
    },
  },

  // 组件生命周期
  pageLifetimes:{
    // 放在show中，是因为attach只一次，且第一次可能无法获取到userInfo，所以需要放在show中
    show(){
      // 放在show中，又需要在获取到数据后，只执行一次，那么就采用单例事件
      const {_id} = app.userInfo
      if (_id) {
        if (this.data.flag) {
          this.setData({flag:false})
          const {school,area} = app.userInfo
          this.setData({school,area})
           // 以后可根据省份，筛出相应的学校，这里就全部取出了(ps:记得权限)
          db.collection('schools').field({
            name:true,
            areas:true
          }).get().then((res)=>{
            const schoolObj = {}
            res.data.forEach(item => {
              schoolObj[item.name] = item.areas
            })
            const areaArr = schoolObj[school]
            const defaultIndex = areaArr && areaArr.indexOf(area)  || 0
            const schoolNameArr = Object.keys(schoolObj)
            this.setData({
              columns: [
                {values: schoolNameArr},  
                {values: areaArr || schoolObj[schoolNameArr[0]] , defaultIndex}
              ],
              schoolObj
            })
          })
        }
      }
    }
  }
})
