Java.perform(function () {
    console.log("[*] Starting Hook for ScopeSpeedMoveCmd (望远镜速度移动命令)...");

    try {
        // 1. Hook 主类
        var ScopeSpeedMoveCmd = Java.use("com.zwo.seestar.socket.command.ScopeSpeedMoveCmd");
        var Companion = Java.use("com.zwo.seestar.socket.command.ScopeSpeedMoveCmd$Companion");

        // 2. Hook encodeCommand() - 捕获发送的命令
        ScopeSpeedMoveCmd.encodeCommand.implementation = function () {
            console.log("\n" + "═".repeat(60));
            console.log("🚀 [ScopeSpeedMoveCmd] encodeCommand() - 发送速度移动命令");
            console.log("═".repeat(60));

            // 获取当前实例的状态值
            var angle = this.getAngle();
            var percent = this.getPercent();
            var level = this.getLevel();
            
            console.log("实例状态值:");
            console.log("  angle: " + angle + "°");
            console.log("  percent: " + percent + "%");
            console.log("  level: " + level);

            // 获取静态的当前状态值（实际发送的值）
            var currentAngle = Companion.INSTANCE.value.getCurrentAngle();
            var currentPercent = Companion.INSTANCE.value.getCurrentPercent();
            var currentLevel = Companion.INSTANCE.value.getCurrentLevel();
            
            console.log("\n静态当前状态值 (将发送):");
            console.log("  currentAngle: " + currentAngle + "°");
            console.log("  currentPercent: " + currentPercent + "%");
            console.log("  currentLevel: " + currentLevel);

            // 调用原方法
            var originalResult = this.encodeCommand();
            var jsonStr = originalResult.trim();

            console.log("\n生成的JSON命令:");
            console.log(jsonStr);

            try {
                var jsonObj = JSON.parse(jsonStr);
                console.log("\n解析后的命令结构:");
                console.log(JSON.stringify(jsonObj, null, 2));
                
                // 提取关键信息
                var method = jsonObj.method;
                var params = jsonObj.params;
                console.log("\n命令摘要:");
                console.log("  方法: " + method);
                console.log("  事务ID: " + jsonObj.id);
                console.log("  角度: " + params.angle + "°");
                console.log("  百分比: " + params.percent + "%");
                console.log("  等级: " + params.level);
                console.log("  持续时间: " + params.dur_sec + "秒");
            } catch (e) {
                console.log("[!] JSON解析错误: " + e.message);
            }

            console.log("═".repeat(60));
            return originalResult;
        };

        // 3. Hook decodeData() - 捕获响应解析
        ScopeSpeedMoveCmd.decodeData.overload('java.lang.String', 'org.json.JSONObject').implementation = function (b, parse) {
            console.log("\n" + "═".repeat(60));
            console.log("📥 [ScopeSpeedMoveCmd] decodeData() - 解析响应数据");
            console.log("═".repeat(60));

            // 记录响应时间
            var responseTime = Date.now();
            console.log("响应时间: " + new Date(responseTime).toISOString());

            // 显示原始响应字符串
            console.log("\n原始响应字符串 (b):");
            if (b.length > 1000) {
                console.log(b.substring(0, 500) + "...\n... (共" + b.length + "字符) ...\n" + b.substring(b.length - 500));
            } else {
                console.log(b);
            }

            // 显示解析后的JSONObject内容
            console.log("\n解析后的JSONObject (parse):");
            try {
                var code = parse.optInt("code");
                var method = parse.optString("method");
                var message = parse.optString("msg");
                
                console.log("  返回码 (code): " + code);
                console.log("  方法 (method): " + (method || "N/A"));
                console.log("  消息 (msg): " + (message || "N/A"));
                
                // 获取所有键值对
                var keys = parse.keys();
                while (keys.hasNext()) {
                    var key = keys.next();
                    if (!["code", "method", "msg"].includes(key)) {
                        console.log("  " + key + ": " + parse.opt(key));
                    }
                }
            } catch (e) {
                console.log("[!] 解析JSONObject失败: " + e);
            }

            // 调用原始方法前获取静态变量的旧值
            var oldLastAngle = Companion.INSTANCE.value.getLastAngle();
            var oldLastPercent = Companion.INSTANCE.value.getLastPercent();
            var oldLastLevel = Companion.INSTANCE.value.getLastLevel();
            
            console.log("\n调用前静态变量:");
            console.log("  lastAngle: " + oldLastAngle);
            console.log("  lastPercent: " + oldLastPercent);
            console.log("  lastLevel: " + oldLastLevel);

            // 调用原始decodeData方法
            this.decodeData(b, parse);

            // 获取调用后的静态变量值
            var newLastAngle = Companion.INSTANCE.value.getLastAngle();
            var newLastPercent = Companion.INSTANCE.value.getLastPercent();
            var newLastLevel = Companion.INSTANCE.value.getLastLevel();
            var lastHeartTime = Companion.INSTANCE.value.getLastHeartTime();
            
            console.log("\n调用后静态变量:");
            console.log("  lastAngle: " + newLastAngle + (newLastAngle !== oldLastAngle ? " (已更新)" : ""));
            console.log("  lastPercent: " + newLastPercent + (newLastPercent !== oldLastPercent ? " (已更新)" : ""));
            console.log("  lastLevel: " + newLastLevel + (newLastLevel !== oldLastLevel ? " (已更新)" : ""));
            console.log("  lastHeartTime: " + new Date(lastHeartTime).toISOString());

            // 获取实例的code值
            var instanceCode = this.getCode();
            console.log("\n实例返回码 (this.code): " + instanceCode);

            console.log("═".repeat(60));
        };

        // 4. Hook exec() - 监控命令执行条件
        ScopeSpeedMoveCmd.exec.implementation = function (io) {
            console.log("\n" + "═".repeat(60));
            console.log("⚡ [ScopeSpeedMoveCmd] exec() - 执行命令检查");
            console.log("═".repeat(60));

            try {
                // 获取静态变量状态
                var lastPercent = Companion.INSTANCE.value.getLastPercent();
                var currentPercent = Companion.INSTANCE.value.getCurrentPercent();
                var touch = Companion.INSTANCE.value.getTouch();
                
                console.log("执行条件检查:");
                console.log("  lastPercent: " + lastPercent);
                console.log("  currentPercent: " + currentPercent);
                console.log("  touch状态: " + touch);
                
                // 判断是否满足执行条件
                var shouldExecute = !(lastPercent === currentPercent && currentPercent === 0);
                console.log("  执行条件: " + (shouldExecute ? "满足，将执行命令" : "不满足，跳过执行"));
                
                if (shouldExecute) {
                    console.log("  调用io.handleCommand(this)...");
                }
            } catch (e) {
                console.log("[!] 获取状态失败: " + e);
            }

            // 调用原始方法
            this.exec(io);
            
            console.log("═".repeat(60));
        };

        // 5. Hook 静态变量的设置方法（可选，用于完整监控）
        try {
            // Hook Companion中的setter方法
            var setCurrentPercent = Companion.setCurrentPercent;
            if (setCurrentPercent) {
                setCurrentPercent.overload('int').implementation = function (value) {
                    console.log("\n📊 [Companion] 更新 currentPercent: " + value);
                    return this.setCurrentPercent(value);
                };
            }
            
            var setCurrentAngle = Companion.setCurrentAngle;
            if (setCurrentAngle) {
                setCurrentAngle.overload('double').implementation = function (value) {
                    console.log("\n📊 [Companion] 更新 currentAngle: " + value + "°");
                    return this.setCurrentAngle(value);
                };
            }
            
            var setTouch = Companion.setTouch;
            if (setTouch) {
                setTouch.overload('boolean').implementation = function (value) {
                    console.log("\n📊 [Companion] 更新 touch: " + value);
                    return this.setTouch(value);
                };
            }
        } catch (e) {
            console.log("[!] Hook Companion setter失败: " + e);
        }

        console.log("[+] ScopeSpeedMoveCmd Hook 安装成功!");
        console.log("[*] 等待望远镜速度移动命令...");

    } catch (e) {
        console.log("[!] Hook过程中发生错误: " + e);
        console.log("[*] 请确认类路径是否正确: com.zwo.seestar.socket.command.ScopeSpeedMoveCmd");
    }
});