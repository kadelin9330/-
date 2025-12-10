// hook_okhttp_connection.js
Java.perform(function () {
    console.log("[*] 开始 Hook OkHttp RealConnectionPool...");

    // 定位到目标类
    var RealConnectionPool = Java.use("okhttp3.internal.connection.RealConnectionPool");

    // Hook callAcquirePooledConnection 方法
    RealConnectionPool.callAcquirePooledConnection.implementation = function (address, call, routes, requireMultiplexed) {
        // 1. 打印方法开始调用的日志
        console.log("\n=== RealConnectionPool.callAcquirePooledConnection() 被调用 ===");

        // 2. 输出参数：Address (通常包含URL、DNS、代理等信息)
        console.log("参数 address (类型: " + address + "):");
        try {
            // 尝试获取address中的url信息，这是最常用的标识
            var url = address.url();
            console.log("  -> URL: " + url.toString());
        } catch (e) {
            console.log("  -> 无法解析URL: " + e);
        }

        // 3. 输出参数：RealCall (代表一次具体的请求)
        console.log("参数 call (类型: " + call + "):");
        try {
            // 可以输出请求的一些基本信息，例如原始请求的URL
            var request = call.request();
            console.log("  -> Request URL: " + request.url().toString());
        } catch (e) {
            console.log("  -> 无法解析Request: " + e);
        }

        // 4. 输出参数：Routes (备选路由列表)
        console.log("参数 routes (类型: java.util.List, 大小: " + (routes ? routes.size() : 0) + "):");
        if (routes && routes.size() > 0) {
            for (var i = 0; i < routes.size(); i++) {
                try {
                    var route = routes.get(i);
                    var socketAddress = route.socketAddress();
                    console.log("  -> Route[" + i + "]: " + socketAddress.toString());
                } catch (e) {
                    console.log("  -> Route[" + i + "]: 解析出错");
                }
            }
        }

        // 5. 输出参数：requireMultiplexed (是否要求多路复用，通常是HTTP/2)
        console.log("参数 requireMultiplexed: " + requireMultiplexed);

        // 6. 调用原方法并获取结果
        var result = this.callAcquirePooledConnection(address, call, routes, requireMultiplexed);

        // 7. 输出返回值
        console.log("返回值 (是否成功获取到连接): " + result);
        console.log("=== 调用结束 ===\n");

        // 8. 返回原方法的执行结果
        return result;
    };

    console.log("[+] RealConnectionPool.callAcquirePooledConnection Hook 安装成功!");
});