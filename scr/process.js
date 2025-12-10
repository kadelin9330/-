Java.perform(function() {
    // 获取当前进程ID
    var myPid = android.os.Process.myPid();
    console.log("[*] 当前进程 PID: " + myPid);

    // 方法1: 尝试执行shell命令查找子进程 (需要相应权限)
    var cmd = "ps -ef | grep \"^[a-z A-Z]*\" | grep " + myPid + " | awk '{print $2}'";
    var result = Java.use("java.lang.Runtime").getRuntime().exec(cmd);
    // ... 处理结果输出

    // 方法2: 遍历 /proc/[pid]/task/[tid]/children 文件 (适用于较新内核)
    // 这是一种更底层、可靠的方法
});