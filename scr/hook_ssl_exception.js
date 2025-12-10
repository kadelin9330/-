// hook_ssl_exception.js
Java.perform(function () {
    console.log("[*] 开始监听SSL验证异常...");

    // Hook SSLPeerUnverifiedException 的构造函数
    var SSLPeerUnverifiedException = Java.use("javax.net.ssl.SSLPeerUnverifiedException");
    
    SSLPeerUnverifiedException.$init.overload('java.lang.String').implementation = function(message) {
        console.log("\n[!!!] SSLPeerUnverifiedException 被抛出！");
        console.log("[!!!] 异常信息: " + message);
        
        // 分析信息是否包含证书绑定失败特征
        if (message && message.indexOf("Certificate pinning failure") !== -1) {
            console.log("[!!!] ⚠️ 确认由证书绑定(Pinning)失败引起！");
        }
        
        // 打印堆栈轨迹，定位抛出异常的代码位置
        console.log("[!!!] 异常堆栈:");
        var stackTrace = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new());
        console.log(stackTrace);
        
        // 继续正常抛出异常（如果你想保持原样）
        return this.$init(message);
    };
    
    console.log("[*] 异常监听器已就绪。任何证书验证失败都将被捕获并分析。");
});