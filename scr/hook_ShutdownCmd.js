Java.perform(function() {
    console.log("[*] Starting ShutdownCmd Hook...");
    
    // 定位ShutdownCmd类
    const ShutdownCmd = Java.use("com.zwo.seestar.socket.command.ShutdownCmd");
    const JSONObject = Java.use("org.json.JSONObject");
    const IO = Java.use("com.zwo.seestar.socket.base.IO");
    
    if (!ShutdownCmd) {
        console.error("[!] ShutdownCmd class not found!");
        return;
    }
    
    // 1. Hook encodeCommand方法（发送关机命令）
    ShutdownCmd.encodeCommand.implementation = function() {
        console.log("\n[=== SHUTDOWN COMMAND SEND ===]");
        console.log("[触发关机命令]");
        
        // 获取调用堆栈，了解谁触发了关机
        try {
            var stackTrace = Java.use("android.util.Log").getStackTraceString(
                Java.use("java.lang.Exception").$new("Stack trace")
            );
            console.log("[调用堆栈]:");
            var lines = stackTrace.split('\n');
            for (var i = 0; i < Math.min(lines.length, 10); i++) {
                console.log("  " + lines[i]);
            }
        } catch(e) {
            // 忽略堆栈跟踪异常
        }
        
        // 调用原方法获取JSON字符串
        var result = this.encodeCommand();
        
        // 输出发送的关机命令
        console.log("[原始命令]: " + result);
        
        // 解析JSON内容
        var jsonStr = result.replace(/\r\n/g, '');
        try {
            var json = JSON.parse(jsonStr);
            console.log("[解析关机命令]:");
            console.log("  - 事务ID: " + json.id);
            console.log("  - 方法名: " + json.method);
            console.log("  - 时间戳: " + Date.now());
            console.log("  - 本地时间: " + new Date().toLocaleString());
            
            // 记录关键信息
            console.log("[关机命令详情]:");
            console.log("  目标: Raspberry Pi (树莓派)");
            console.log("  操作: 关机");
            console.log("  协议: JSON over TCP/WebSocket");
        } catch(e) {
            console.log("[JSON解析异常]: " + e);
        }
        
        // 获取事务ID
        var transactionId = this.getTransactionId();
        console.log("[事务ID]: " + transactionId);
        
        // 获取当前响应码（发送前）
        var currentCode = this.getCode();
        console.log("[当前响应码]: " + currentCode + " (" + (currentCode === -1 ? "未响应" : "已响应") + ")");
        
        return result;
    };
    
    // 2. Hook decodeData方法（接收响应）
    ShutdownCmd.decodeData.overload('java.lang.String', 'org.json.JSONObject').implementation = function(b, parse) {
        console.log("\n[=== SHUTDOWN RESPONSE ===]");
        
        // 输出原始响应字符串
        console.log("[原始响应]: " + b);
        
        // 解析响应JSON
        console.log("[响应详情]:");
        try {
            // 获取所有键值对
            var keys = parse.keys();
            var keyCount = 0;
            var responseObj = {};
            
            while (keys.hasNext()) {
                var key = keys.next();
                var value = parse.get(key);
                responseObj[key] = value;
                console.log("  - " + key + ": " + value);
                keyCount++;
            }
            
            if (keyCount === 0) {
                console.log("  [空响应]");
            }
            
            // 特别关注code字段
            var code = parse.optInt("code", -999);
            console.log("[关机响应码]: " + code);
            
            // 解释常见的响应码
            var codeExplanation = {
                0: "成功 - 关机指令已接受",
                1: "失败 - 权限不足",
                2: "失败 - 设备忙",
                3: "失败 - 系统错误",
                100: "等待 - 关机进程已启动",
                200: "错误 - 无效命令",
                "-1": "默认值 - 未收到响应",
                "-999": "未找到code字段"
            };
            
            if (codeExplanation[code] !== undefined) {
                console.log("[响应解释]: " + codeExplanation[code]);
            } else if (code > 0) {
                console.log("[响应解释]: 失败 - 错误码 " + code);
            } else if (code === 0) {
                console.log("[响应解释]: 成功 - 设备将关机");
            }
            
            // 如果有消息字段，显示它
            var message = parse.optString("message", "");
            if (message) {
                console.log("[响应消息]: " + message);
            }
            
            // 记录响应时间
            console.log("[响应时间]: " + new Date().toLocaleString());
            
        } catch(e) {
            console.log("[响应解析异常]: " + e);
        }
        
        // 调用父类方法
        console.log("[调用父类decodeData]");
        this.decodeData(b, parse);
        
        // 获取设置后的响应码
        var newCode = this.getCode();
        console.log("[更新后响应码]: " + newCode);
        
        // 根据响应码进行不同处理
        if (newCode === 0) {
            console.log("[关机成功] 设备正在关闭...");
            // 可以在这里触发其他逻辑，比如更新UI状态
        } else if (newCode > 0) {
            console.warn("[关机失败] 错误码: " + newCode);
        }
    };
    
    // 3. Hook exec方法（命令执行）
    ShutdownCmd.exec.implementation = function(io) {
        console.log("\n[=== SHUTDOWN EXECUTION ===]");
        console.log("[执行关机命令]");
        
        // 获取IO对象信息
        if (io) {
            console.log("[IO对象]: " + io);
            console.log("[IO类名]: " + io.$className);
            
            // 尝试获取连接信息
            try {
                // 这里可以根据实际IO类的方法获取更多信息
                var ioStr = io.toString();
                if (ioStr.length < 200) {
                    console.log("[IO详细信息]: " + ioStr);
                }
            } catch(e) {
                // 忽略
            }
        }
        
        // 获取线程信息
        try {
            var thread = Java.use("java.lang.Thread").currentThread();
            console.log("[执行线程]: " + thread.getName());
            console.log("[线程ID]: " + thread.getId());
        } catch(e) {
            console.log("[线程信息获取失败]: " + e);
        }
        
        // 获取当前时间
        var startTime = Date.now();
        console.log("[开始时间]: " + startTime);
        
        try {
            // 调用原方法
            console.log("[调用原exec方法]");
            this.exec(io);
            var endTime = Date.now();
            console.log("[结束时间]: " + endTime);
            console.log("[执行耗时]: " + (endTime - startTime) + "ms");
            console.log("[关机命令已发送]");
        } catch(e) {
            console.error("[关机执行异常]: " + e);
            console.log("[异常堆栈]: " + e.stack);
        }
    };
    
    // 4. Hook getCode和setCode方法
    ShutdownCmd.getCode.implementation = function() {
        var code = this.getCode();
        console.log("\n[=== GET SHUTDOWN CODE ===]");
        console.log("[获取关机响应码]: " + code);
        return code;
    };
    
    ShutdownCmd.setCode.implementation = function(i) {
        console.log("\n[=== SET SHUTDOWN CODE ===]");
        console.log("[设置关机响应码]: " + i);
        console.log("[旧值]: " + this.getCode());
        console.log("[新值]: " + i);
        
        // 根据响应码显示状态
        if (i === 0) {
            console.log("[状态]: 关机成功");
        } else if (i === -1) {
            console.log("[状态]: 默认状态（未响应）");
        } else if (i > 0) {
            console.log("[状态]: 关机失败，错误码 " + i);
        }
        
        this.setCode(i);
    };
    
    // 5. Hook reset方法（虽然为空，但可以监控何时被调用）
    ShutdownCmd.reset.implementation = function() {
        console.log("\n[=== SHUTDOWN RESET ===]");
        console.log("[重置关机命令状态]");
        console.log("[时间]: " + new Date().toLocaleString());
        
        // 调用原方法（虽然为空）
        this.reset();
        
        // 可以在这里记录状态重置的情况
        console.log("[重置完成]");
    };
    
    // 6. 创建关机命令监控器
    console.log("[+] 安装关机命令监控器");
    
    // 监控ShutdownCmd实例的创建
    var shutdownInstances = [];
    
    // Hook构造函数（如果有的话）
    try {
        // 注意：这是一个无参构造函数
        ShutdownCmd.$init.overload().implementation = function() {
            console.log("\n[=== SHUTDOWN CMD CREATED ===]");
            console.log("[创建新的关机命令实例]");
            console.log("[实例地址]: " + this.hashCode());
            
            // 记录实例
            shutdownInstances.push({
                instance: this,
                created: Date.now()
            });
            
            // 保留最多10个实例
            if (shutdownInstances.length > 10) {
                shutdownInstances.shift();
            }
            
            console.log("[当前实例数]: " + shutdownInstances.length);
            
            // 调用原构造函数
            return this.$init();
        };
    } catch(e) {
        console.log("[构造函数Hook失败]: " + e);
    }
    
    // 7. 添加统计功能
    var shutdownStats = {
        totalSent: 0,
        totalSuccess: 0,
        totalFailed: 0,
        lastSentTime: 0,
        lastResponseTime: 0
    };
    
    // 在encodeCommand中添加统计
    var originalEncode = ShutdownCmd.encodeCommand;
    ShutdownCmd.encodeCommand.implementation = function() {
        shutdownStats.totalSent++;
        shutdownStats.lastSentTime = Date.now();
        console.log("\n[关机统计] 已发送命令数: " + shutdownStats.totalSent);
        return originalEncode.call(this);
    };
    
    // 在decodeData中添加统计
    var originalDecode = ShutdownCmd.decodeData;
    ShutdownCmd.decodeData.overload('java.lang.String', 'org.json.JSONObject').implementation = function(b, parse) {
        shutdownStats.lastResponseTime = Date.now();
        try {
            var code = parse.optInt("code", -1);
            if (code === 0) {
                shutdownStats.totalSuccess++;
            } else if (code > 0) {
                shutdownStats.totalFailed++;
            }
            console.log("\n[关机统计] 成功: " + shutdownStats.totalSuccess + 
                       ", 失败: " + shutdownStats.totalFailed);
        } catch(e) {
            // 忽略
        }
        return originalDecode.call(this, b, parse);
    };
    
    console.log("[+] ShutdownCmd Hook installed successfully!");
    console.log("[*] 监控器准备就绪，等待关机命令...");
});

// 辅助函数：格式化JSON显示
function formatShutdownInfo(jsonStr) {
    try {
        var obj = JSON.parse(jsonStr);
        var formatted = JSON.stringify(obj, null, 2);
        // 添加一些注释
        formatted = formatted.replace(/"method": "pi_shutdown"/, 
            '"method": "pi_shutdown"  // 树莓派关机指令');
        return formatted;
    } catch(e) {
        return jsonStr;
    }
}