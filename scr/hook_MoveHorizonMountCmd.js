// 以下是一个 Frida JavaScript 脚本框架，展示了如何 Hook 关键点
Java.perform(function() {
    var MoveHorizonMountCmd = Java.use('com.zwo.seestar.socket.command.MoveHorizonMountCmd');
    var Log = Java.use('android.util.Log');

    // 1. Hook 构造函数
    MoveHorizonMountCmd.$init.implementation = function(call) {
        console.log("\n=== [构造函数被调用] ===");
        console.log("  |- 回调对象 call: " + call);
        console.log("  |- 当前线程: " + Java.use('java.lang.Thread').currentThread().getName());
        // 打印调用栈，过滤掉无关行
        console.log("  |- 调用栈:");
        Log.getStackTraceString(Java.use('java.lang.Exception').$new()).split('\n').forEach(function(line) {
            if (line.indexOf('com.zwo.seestar') !== -1) { // 只显示公司相关包名，精简输出
                console.log("      " + line.trim());
            }
        });
        // 调用原构造函数
        return this.$init(call);
    };

    // 2. Hook exec 方法
    MoveHorizonMountCmd.exec.implementation = function(io) {
        console.log("\n=== [exec 被执行] ===");
        console.log("  |- IO 连接对象: " + io);
        console.log("  |- 当前命令状态码 (code): " + this.code.value);
        return this.exec(io); // 调用原方法
    };

    // 3. Hook encodeCommand 方法
    MoveHorizonMountCmd.encodeCommand.implementation = function() {
        var result = this.encodeCommand(); // 先调用原方法获取结果
        console.log("\n=== [将发送的命令] ===");
        console.log("  |- 原始JSON字符串: " + result);
        try {
            var json = JSON.parse(result.trim()); // 注意实际字符串末尾有\r\n
            console.log("  |- 事务ID (id): " + json.id);
            console.log("  |- 方法名 (method): " + json.method);
        } catch(e) {}
        return result;
    };

    // 4. Hook decodeData 方法
    MoveHorizonMountCmd.decodeData.implementation = function(b, parse) {
        console.log("\n=== [收到响应并解码] ===");
        console.log("  |- 原始响应字符串 b: " + b);
        var receivedCode = parse.optInt('keyCode');
        console.log("  |- 解析出的状态码 (keyCode): " + receivedCode);
        console.log("  |- 即将调用回调函数，传入 code: " + receivedCode);
        
        // 调用原方法，这会触发回调
        this.decodeData(b, parse);
        
        console.log("  |- decodeData 执行完毕。");
        console.log("  |- 命令对象最终状态码 (this.code): " + this.code.value);
    };
});