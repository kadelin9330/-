Java.perform(function () {
    console.log("[*] Starting Hook for GetSavedStationListCmd...");

    try {
        // 1. Hook目标类
        var TargetClass = Java.use("com.zwo.seestar.socket.command.sta.GetSavedStationListCmd");

        // 2. Hook encodeCommand() 方法 - 捕获发送的命令
        TargetClass.encodeCommand.implementation = function () {
            console.log("\n" + "═".repeat(50));
            console.log("📤 [GetSavedStationListCmd] encodeCommand() Called");
            console.log("═".repeat(50));

            // 调用原方法获取结果
            var originalResult = this.encodeCommand();

            try {
                // 原始结果通常是 JSONObject.toString() + 换行符
                var jsonStr = originalResult.trim();
                console.log("生成的JSON命令字符串 (原始):");
                console.log(jsonStr);

                // 尝试解析并美化JSON输出
                try {
                    var jsonObj = JSON.parse(jsonStr);
                    console.log("\n美化后的JSON结构:");
                    console.log(JSON.stringify(jsonObj, null, 2));
                } catch (e) {
                    console.log("[!] 无法解析为标准JSON，可能包含额外格式");
                }

                // 获取事务ID等关键信息
                var tid = this.getTransactionId();
                console.log("事务ID (Transaction ID): " + tid);

            } catch (e) {
                console.log("[!] 解析encodeCommand结果时出错: " + e.message);
            }

            console.log("═".repeat(50));
            return originalResult; // 必须返回原始结果
        };

        // 3. Hook decodeData() 方法 - 捕获解析的响应
        TargetClass.decodeData.overload('java.lang.String', 'org.json.JSONObject').implementation = function (b, parse) {
            console.log("\n" + "═".repeat(50));
            console.log("📥 [GetSavedStationListCmd] decodeData() Called");
            console.log("═".repeat(50));

            // 记录传入的原始数据
            console.log("原始响应字符串 (参数 b):");
            console.log(b.length > 500 ? b.substring(0, 500) + "..." : b);

            // 记录解析后的JSONObject关键信息
            console.log("\n解析后的JSONObject (参数 parse) 关键字段:");
            try {
                var code = parse.optInt("code");
                var method = parse.optString("method");
                console.log("  code: " + code);
                console.log("  method: " + method);
                
                // 如果响应成功，则Gson会解析原始字符串b
                if (code == 0) {
                    console.log("\n响应成功 (code == 0)，将用Gson解析原始字符串");
                }
            } catch (e) {
                console.log("[!] 读取parse参数字段出错: " + e);
            }

            // 调用原方法进行实际解析
            var resultBefore = this.getResult();
            console.log("\n调用前 result: " + (resultBefore ? "已设置" : "null"));

            this.decodeData(b, parse);

            // 获取解析后的result对象
            var resultAfter = this.getResult();
            console.log("\n调用后 result: " + (resultAfter ? "PiStationLResult对象" : "null"));

            if (resultAfter) {
                try {
                    // 将结果对象转回JSON查看
                    var gson = Java.use("com.google.gson.Gson");
                    var gsonInstance = gson.$new();
                    var resultJson = gsonInstance.toJson(resultAfter);
                    
                    console.log("\nGson解析后的 PiStationLResult 内容:");
                    try {
                        var formatted = JSON.stringify(JSON.parse(resultJson), null, 2);
                        console.log(formatted);
                    } catch (e) {
                        console.log(resultJson.length > 1000 ? resultJson.substring(0, 1000) + "..." : resultJson);
                    }
                } catch (e) {
                    console.log("[!] 转换result为JSON时出错: " + e);
                }
            }

            console.log("═".repeat(50));
        };

        // 4. Hook exec() 方法 - 了解何时触发
        TargetClass.exec.implementation = function (io) {
            console.log("\n" + "═".repeat(50));
            console.log("⚡ [GetSavedStationListCmd] exec() 被调用");
            console.log("═".repeat(50));
            
            try {
                console.log("IO对象: " + io);
                console.log("IO类名: " + io.$className);
            } catch (e) {
                // 忽略错误
            }
            
            // 调用原始方法
            this.exec(io);
            
            console.log("═".repeat(50));
        };

        console.log("[+] GetSavedStationListCmd Hook 安装成功!");
        console.log("[*] 等待命令执行...");

    } catch (e) {
        console.log("[!] Hook过程中发生错误: " + e);
        console.log("[*] 请确认类路径是否正确");
    }
});