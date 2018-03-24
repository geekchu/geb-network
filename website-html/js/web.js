function getParam(url, name,  defaultValue) {
    if (typeof (url) == 'undefined' || !url) {
        url = window.location.search.substr(1);
    }else{
        var k=url.indexOf("?");
        if(k!=-1){
            url=url.substring(k+1);
        }
    }
    var i=url.indexOf('#');
    if(i!=-1){
        url=url.substring(0,i);
    }
    url='&'+url+'&';
    var key='&'+name+'=';
    var i=url.indexOf(key);
    if(i!=-1){
        var j=url.indexOf('&',i+key.length);
        if(j!=-1){
            return url.substring(i+key.length,j);
        }
    }
    return defaultValue;
}

var Web={
    host:"http://127.0.0.1:8080",
    //host:"http://yugong.freecto.com",

    getData:function(){
        var data=this.getValue("data");
        // console.log("data", typeof(data), data);
        return data;
    },

    getUser: function (callback) {
        var that=this;
        var user = that.getValue("user");
        if (!user) {
            var data={
                "device": {
                    "client": "simulator",
                    "app_version": "1.0.0",
                    "d_brand": "Apple",
                    "d_model": "MacBook Pro",
                    "os_version": "OS X Ei Capitan",
                    "screen": "2560 x 1600",
                    "network_type": "wifi",
                    "uuid": "0000",
                    "token": "",
                    "lng": "103.645966",
                    "lat": "30.990998"
                },
                "data": {
                    "timetamp": "140000000",
                    "login_type": "wechat",
                    "third_party_id": "obBjwt-8PxAa2MK3DcZmntPpGjcU",
                    "weixin_id": "o-ad0t_Pr8otj0Y04Oh08heN4WSM",
                    "nikename": "qaq",
                    "img_top": "http://www.gomaster.cn/attms/uploadfile/2015/0529/20150529063815241_thumb.jpg",
                    "sex": "2",
                    "clientId":"3efk34jijvfd332dfsf"
                },
                "sign": "eb0206720f58491cf39bc0e46dddb6bb",
                "rest_version": "3.0"
            };
            that.post("http://kaifa.gomaster.cn/rest/index.php?c=iuser&a=login_third_party",data,function(res){
                if(res && res.code==200){
                    user=res.data;
                    data.device.token=user.token;
                    data.data={};
                    console.log("*** data1", data);
                    that.setValue("user", user);
                    that.setValue("data", data);
                    console.log("登录成功...")
                    if(callback){
                        callback();
                    }
                }else {
                    console(res.msg)
                }
            });
        }
        console.log("*** user",user);
        return user;
    },

    get:function(url,data,success){
        jQuery.ajax({
            type: 'GET',
            contentType: "application/json; charset=utf-8",
            url:url,
            data:data,
            dataType: "json",
            success: success
        });
    },

    post:function(url,data,success){
        jQuery.ajax({
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            url:url,
            data:JSON.stringify(data),
            dataType: "json",
            success: success
        });
    },

    getSrc:function(s){
        if(s && s.indexOf("http")==-1){
            if(s.indexOf("/f/")!=0){
                s="/f/"+s;
            }
            s=this.host+s;
        }
        return s;
    },

    setValue:function(key, value){
        store.set(key, value);
    },

    getValue:function (key) {
        return store.get(key);
    },

    getParam: function (url, name, defaultValue) {
        if (typeof (url) == 'undefined' || !url) {
            url = window.location.search.substr(1);
        }
        var i = url.indexOf('#');
        if (i != -1) {
            url = url.substring(0, i);
        }
        i = url.indexOf('?');
        if (i != -1) {
            url = url.substring(i + 1);
        }
        url = '&' + url + '&';
        var key = '&' + name + '=';
        var i = url.indexOf(key);
        if (i != -1) {
            var j = url.indexOf('&', i + key.length);
            if (j != -1) {
                return url.substring(i + key.length, j);
            }
        }
        return defaultValue;
    },

    showMessage: function(msg, duration) {
        duration = isNaN(duration) ? 3000 : duration;
        var m = document.createElement('div');
        m.innerHTML = msg;
        m.style.cssText = "width:50%; min-width:9.4rem; background:#000; opacity:0.5; height:2.5rem; color:#fff; line-height:2.5rem; text-align:center; border-radius:5px; position:fixed; top:40%; left:25%; z-index:999999; font-weight:bold;";
        document.body.appendChild(m);
        setTimeout(function () {
            var d = 0.5;
            m.style.webkitTransition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
            m.style.opacity = '0';
            setTimeout(function () {
                document.body.removeChild(m)
            }, d * 1000);
        }, duration);
    },

    reload:function(){
        var s=location.href;
        var i=s.lastIndexOf("#");
        if(i!=-1){
            s=s.substring(0,i);
        }
        i=s.lastIndexOf("&_=");
        if(i!=-1){
            s=s.substring(0,i)+"&_="+Math.random();
        }else{
            var j=s.indexOf("?");
            if(j!=-1){
                s=s+"&_="+Math.random();
            }else{
                s=s+"?&_="+Math.random();
            }
        }
        location.href=s;
    },

    goBack:function(){
        window.history.go(-1);
    },

    go:function (url) {
        location.href=url;
    },
    login: function (username,password,callback) {
        var that=this;
        var params = {
            username: username,
            password: password
        };
        that.post(that.host + "/_app/_login.do", params, function (res) {
            if (res.status == "true") {
                Web.setValue("userObj", res.obj[0]);
                if(callback){
                    alert("Sign Success");
                    callback();
                }
            }else{
                alert("Sign Fail");
            }
        })
    },
    headSearch: function(searchType,keywords){
        if(searchType == '1'){
            Web.go('26.html?keywords='+keywords);
        }else if(searchType == '2'){
            Web.go('25.html?keywords='+keywords);
        }else{
            Web.go('27.html?keywords='+keywords);
        }
    }

};

