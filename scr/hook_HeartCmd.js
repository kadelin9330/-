Java.perform(function() {
    console.log("[*] Starting HeartCmd Hook...");
    
    // 定位HeartCmd类
    const HeartCmd = Java.use("com.zwo.seestar.socket.command.HeartCmd");
    const JSONObject = Java.use("org.json.JSONObject");
    
    if (!HeartCmd) {
        console.error("[!] HeartCmd class not found!");
        return;
    }
    
    // 1. Hook encodeCommand方法（发送心跳）
    HeartCmd.encodeCommand.implementation = function() {
        console.log("\n[=== HEARTBEAT SEND ===]");
        
        // 调用原方法获取JSON字符串
        var result = this.encodeCommand();
        
        // 输出发送的心跳包
        console.log("[发送心跳包]: " + result);
        
        // 解析JSON内容（去除Windows换行符）
        var jsonStr = result.replace(/\r\n/g, '');
        try {
            var json = JSON.parse(jsonStr);
            console.log("[解析心跳包]:");
            console.log("  - 事务ID: " + json.id);
            console.log("  - 方法名: " + json.method);
            console.log("  - 时间戳: " + Date.now());
        } catch(e) {
            console.log("[解析异常]: " + e);
        }
        
        // 获取并输出事务ID
        var transactionId = this.getTransactionId();
        console.log("[事务ID]: " + transactionId);
        
        return result;
    };
    
    // 2. Hook decodeData方法（接收响应）
    HeartCmd.decodeData.overload('java.lang.String', 'org.json.JSONObject').implementation = function(b, parse) {
        console.log("\n[=== HEARTBEAT RESPONSE ===]");
        
        // 输出原始响应字符串
        console.log("[原始响应字符串]: " + b);
        
        // 输出解析后的JSON对象内容
        console.log("[响应JSON对象]:");
        
        try {
            // 获取code字段
            var code = parse.getInt("code");
            console.log("  - 响应码: " + code);
            
            // 尝试获取其他可能存在的字段
            var keys = parse.keys();
            while (keys.hasNext()) {
                var key = keys.next();
                var value = parse.get(key);
                if (key !== "code") {
                    console.log("  - " + key + ": " + value);
                }
            }
            
            // 如果是成功响应(code==0)，显示心跳时间
            if (code === 0) {
                console.log("[心跳成功] 更新时间: " + Date.now());
            } else {
                console.warn("[心跳异常] 响应码: " + code);
            }
        } catch(e) {
            console.log("[解析异常]: " + e);
        }
        
        // 调用原方法
        this.decodeData(b, parse);
    };
    
    // 3. Hook exec方法（命令执行）
    HeartCmd.exec.implementation = function(io) {
        console.log("\n[=== HEARTBEAT EXEC ===]");
        console.log("[执行心跳命令]");
        console.log("[IO对象]: " + io);
        
        // 获取线程信息
        var thread = Java.use("java.lang.Thread").currentThread();
        console.log("[线程]: " + thread.getName());
        
        try {
            // 调用原方法
            this.exec(io);
            console.log("[心跳执行完成]");
        } catch(e) {
            console.error("[心跳执行异常]: " + e);
        }
    };
    
    // 4. Hook Companion的lastHeartTime访问器
    const Companion = Java.use("com.zwo.seestar.socket.command.HeartCmd$Companion");
    
    if (Companion) {
        // Hook getLastHeartTime
        Companion.getLastHeartTime.implementation = function() {
            var time = this.getLastHeartTime();
            console.log("\n[=== GET LAST HEART TIME ===]");
            console.log("[获取最后心跳时间]: " + time);
            console.log("[转换时间]: " + new Date(time).toLocaleString());
            console.log("[当前时间]: " + Date.now());
            console.log("[时间差(ms)]: " + (Date.now() - time));
            
            // 计算时间差（秒）
            var diffSeconds = Math.floor((Date.now() - time) / 1000);
            console.log("[离线时间]: " + diffSeconds + "秒");
            
            return time;
        };
        
        // Hook setLastHeartTime
        Companion.setLastHeartTime.implementation = function(j) {
            console.log("\n[=== SET LAST HEART TIME ===]");
            console.log("[设置最后心跳时间]: " + j);
            console.log("[时间转换]: " + new Date(j).toLocaleString());
            
            this.setLastHeartTime(j);
        };
    }
    
    // 5. 监控心跳频率（通过定时器）
    var lastSendTime = 0;
    setInterval(function() {
        // 可以在这里添加统计逻辑
    }, 5000);
    
    console.log("[+] HeartCmd Hook installed successfully!");
});

// 附加的辅助函数，用于更好的JSON显示
function prettyPrintJSON(jsonStr) {
    try {
        return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch(e) {
        return jsonStr;
    }
}