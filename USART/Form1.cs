using System;
using System.IO.Ports;
using System.Text;
using System.Windows.Forms;
using System.Xml;
using Newtonsoft.Json;

namespace USART
{
    public partial class Form1 : Form
    {
        private System.Windows.Forms.Timer timerAutoSend;
        private SerialPort serialPort = new SerialPort();
        private int remainingSendCount = 0; // 剩余发送次数
        public Dictionary<string, (string Message, int HoldTime)> keyMappings = new Dictionary<string, (string, int)>();
        private static readonly string ConfigFilePath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
    "USART",
    "keyMappings.json"
);
        private bool isMappingEnabled = false; // 映射是否启用的状态变量
        private StringBuilder receivedDataBuffer = new StringBuilder();
        public Form1()
        {
            InitializeComponent();
            DetectAvailablePorts(); // 检测可用串口
            serialPort.DataReceived += SerialPort_DataReceived; // 绑定接收事件
                                                                // 初始化定时器
            this.timerAutoSend = new System.Windows.Forms.Timer();
            this.timerAutoSend.Interval = 50; // 设置间隔为 50ms
            this.timerAutoSend.Tick += new System.EventHandler(this.timerAutoSend_Tick);

            LoadKeyMappings(); // 加载按键映射配置
        }

        // 定时器的 Tick 事件
        private void timerAutoSend_Tick(object sender, EventArgs e)
        {
            if (remainingSendCount > 0) // 如果还有剩余发送次数
            {
                SendMessage(txtSendInput.Text); // 发送消息
                remainingSendCount--; // 减少剩余发送次数
            }
            else
            {
                timerAutoSend.Stop(); // 停止定时器
            }
        }


        // 检测可用串口并添加到 ComboBox
        private void DetectAvailablePorts()
        {
            // 获取当前可用的串口名称
            string[] ports = SerialPort.GetPortNames();

            // 清空 ComboBox 的现有项
            cmbPort.Items.Clear();

            // 将检测到的串口添加到 ComboBox
            foreach (string port in ports)
            {
                cmbPort.Items.Add(port);
            }

            // 如果有可用的串口，默认选择第一个
            if (cmbPort.Items.Count > 0)
            {
                cmbPort.SelectedIndex = 0;
            }
            else
            {
                MessageBox.Show("未检测到可用串口！");
            }
        }

        // ComboBox 下拉事件
        private void cmbPort_DropDown(object sender, EventArgs e)
        {
            DetectAvailablePorts(); // 每次点击下拉箭头时刷新串口列表
        }


        // 发送消息
        private void SendMessage(string message)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string>(SendMessage), message);
                return;
            }

            try
            {
                if (serialPort.IsOpen)
                {
                    string formattedMessage = message;

                    // 如果勾选了显示时间戳，则在消息前添加时间戳
                    if (checkShowTime.Checked)
                    {
                        formattedMessage = $"[{DateTime.Now:HH:mm:ss.fff}] 发送: " + message;
                    }
                    else
                    {
                        formattedMessage = "发送: " + message;
                    }

                    // 判断发送模式（ASCII 或 HEX）
                    if (radioSendASCII.Checked) // ASCII 模式
                    {
                        serialPort.Write(message); // 直接发送字符串
                    }
                    else if (radioSendHEX.Checked) // HEX 模式
                    {
                        // 将 HEX 字符串转换为字节数组
                        byte[] hexBytes = HexStringToByteArray(message);
                        serialPort.Write(hexBytes, 0, hexBytes.Length); // 发送字节数组
                    }

                    // 在数据显示区域追加发送记录
                    txtDataDisplay.AppendText(formattedMessage + Environment.NewLine);
                }
                else
                {
                    MessageBox.Show("串口未打开");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("发送失败: " + ex.Message);
            }
        }

        // 将 HEX 字符串转换为字节数组
        private byte[] HexStringToByteArray(string hex)
        {
            hex = hex.Replace(" ", ""); // 去除空格
            if (hex.Length % 2 != 0)
            {
                throw new ArgumentException("HEX 字符串长度必须为偶数");
            }

            byte[] bytes = new byte[hex.Length / 2];
            for (int i = 0; i < bytes.Length; i++)
            {
                bytes[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
            }
            return bytes;
        }

        // 接收消息
        private void SerialPort_DataReceived(object sender, SerialDataReceivedEventArgs e)
        {
            try
            {
                string receivedData = string.Empty;

                // 判断接收模式（ASCII 或 HEX）
                if (radioASCII.Checked) // ASCII 模式
                {
                    receivedData = serialPort.ReadExisting(); // 直接读取字符串
                }
                else if (radioHEX.Checked) // HEX 模式
                {
                    // 读取字节数据并转换为 HEX 字符串
                    int bytesToRead = serialPort.BytesToRead;
                    byte[] buffer = new byte[bytesToRead];
                    serialPort.Read(buffer, 0, bytesToRead);
                    receivedData = BitConverter.ToString(buffer).Replace("-", " "); // 转换为 HEX 格式
                }

                // 将接收到的数据追加到缓冲区
                receivedDataBuffer.Append(receivedData);

                // 检查缓冲区中是否有完整的消息（假设消息以换行符结尾）
                string bufferContent = receivedDataBuffer.ToString();
                int newLineIndex = bufferContent.IndexOf('\n');
                if (newLineIndex >= 0)
                {
                    // 提取完整的消息
                    string completeMessage = bufferContent.Substring(0, newLineIndex + 1);
                    receivedDataBuffer.Remove(0, newLineIndex + 1); // 从缓冲区中移除已处理的消息

                    this.Invoke(new Action(() =>
                    {
                        string formattedMessage = completeMessage.Trim(); // 去除多余的空白字符

                        // 如果勾选了显示时间戳，则在消息前添加时间戳
                        if (checkShowTime.Checked)
                        {
                            formattedMessage = $"[{DateTime.Now:HH:mm:ss.fff}] 接收: " + formattedMessage;
                        }
                        else
                        {
                            formattedMessage = "接收: " + formattedMessage;
                        }

                        // 在数据显示区域追加接收记录
                        txtDataDisplay.AppendText(formattedMessage + Environment.NewLine);
                    }));
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("接收失败: " + ex.Message);
            }
        }

        private void btnClearReceive_Click(object sender, EventArgs e)
        {
            txtDataDisplay.Clear(); // 清空数据显示区域
        }

        // 打开串口按钮点击事件
        private void btnOpenPort_Click(object sender, EventArgs e)
        {
            if (btnOpenPort.Text == "打开串口")
            {
                if (OpenSerialPort())
                {
                    btnOpenPort.Text = "关闭串口";
                    SetSerialSettingsEnabled(false); // 打开串口后禁用设置组件
                }
            }
            else
            {
                CloseSerialPort();
                btnOpenPort.Text = "打开串口";
                SetSerialSettingsEnabled(true); // 关闭串口后启用设置组件
            }
        }

        // 打开串口
        private bool OpenSerialPort()
        {
            try
            {
                // 设置串口参数
                serialPort.PortName = cmbPort.SelectedItem.ToString();
                serialPort.BaudRate = int.Parse(cmbBaudRate.SelectedItem.ToString());
                serialPort.DataBits = int.Parse(cmbDataBits.SelectedItem.ToString());
                serialPort.Parity = (Parity)Enum.Parse(typeof(Parity), cmbParity.SelectedItem.ToString());
                serialPort.StopBits = (StopBits)Enum.Parse(typeof(StopBits), cmbStopBits.SelectedItem.ToString());

                // 打开串口
                serialPort.Open();
                return true; // 打开成功
            }
            catch (Exception ex)
            {
                MessageBox.Show("打开串口失败: " + ex.Message);
                return false; // 打开失败
            }
        }

        // 关闭串口
        private void CloseSerialPort()
        {
            try
            {
                if (serialPort.IsOpen)
                {
                    serialPort.Close();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("关闭串口失败: " + ex.Message);
            }
        }

        // 设置串口设置组件的启用状态
        private void SetSerialSettingsEnabled(bool enabled)
        {
            // 串口设置组件
            cmbPort.Enabled = enabled;
            cmbBaudRate.Enabled = enabled;
            cmbDataBits.Enabled = enabled;
            cmbParity.Enabled = enabled;
            cmbStopBits.Enabled = enabled;


        }

        // 发送按钮点击事件
        private void btnSend_Click(object sender, EventArgs e)
        {
            string message = txtSendInput.Text;
            if (!string.IsNullOrEmpty(message))
            {
                if (checkAutoSend.Checked) // 如果勾选了自动发送
                {
                    // 获取发送次数
                    if (int.TryParse(txtAutoSendInterval.Text, out int sendCount) && sendCount > 0)
                    {
                        // 启动定时器
                        timerAutoSend.Start();
                        remainingSendCount = sendCount; // 设置剩余发送次数
                    }
                    else
                    {
                        MessageBox.Show("请输入有效的发送次数！");
                    }
                }
                else // 如果没有勾选自动发送
                {
                    SendMessage(message); // 只发送一次
                }
            }
            else
            {
                MessageBox.Show("请输入要发送的消息！");
            }
        }


        private void btnKeyMapping_Click(object sender, EventArgs e)
        {
            using (var dialog = new KeyMappingDialog(this)) // 将 Form1 的实例传递给 KeyMappingDialog
            {
                if (dialog.ShowDialog() == DialogResult.OK)
                {
                    keyMappings[dialog.SelectedKey] = (dialog.Message, dialog.HoldTime);
                    SaveKeyMappings(); // 保存配置
                }
            }
        }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            base.OnKeyDown(e);

            string key = e.KeyCode.ToString();
            if (keyMappings.ContainsKey(key))
            {
                var (message, holdTime) = keyMappings[key];
                Task.Delay(holdTime).ContinueWith(_ => SendMessage(message));
            }
        }

        public void SaveKeyMappings()
        {
            try
            {
                // 确保目录存在
                Directory.CreateDirectory(Path.GetDirectoryName(ConfigFilePath));

                // 将 keyMappings 序列化为 JSON 并保存到文件
                string json = JsonConvert.SerializeObject(keyMappings, Newtonsoft.Json.Formatting.Indented);
                File.WriteAllText(ConfigFilePath, json);
            }
            catch (Exception ex)
            {
                MessageBox.Show("保存配置失败: " + ex.Message);
            }
        }

        private void LoadKeyMappings()
        {
            try
            {
                if (File.Exists(ConfigFilePath))
                {
                    // 从文件读取 JSON 并反序列化为 keyMappings
                    string json = File.ReadAllText(ConfigFilePath);
                    keyMappings = JsonConvert.DeserializeObject<Dictionary<string, (string Message, int HoldTime)>>(json);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("加载配置失败: " + ex.Message);
            }
        }

        private void btnToggleMapping_Click(object sender, EventArgs e)
        {
            // 切换映射状态
            isMappingEnabled = !isMappingEnabled;

            // 更新按钮文本
            if (isMappingEnabled)
            {
                btnToggleMapping.Text = "关闭映射";
                MessageBox.Show("映射已启用");
            }
            else
            {
                btnToggleMapping.Text = "开启映射";
                MessageBox.Show("映射已禁用");
            }

            // 根据状态启用或禁用映射功能
            ToggleKeyMapping(isMappingEnabled);
        }

        private void ToggleKeyMapping(bool isEnabled)
        {
            if (isEnabled)
            {
                // 启用映射功能
                this.KeyPreview = true; // 启用键盘事件处理
            }
            else
            {
                // 禁用映射功能
                this.KeyPreview = false; // 禁用键盘事件处理
            }
        }

    }



    partial class KeyMappingDialog : Form
    {

        private Form1 parentForm; // 用于访问 Form1 的实例

        public KeyMappingDialog(Form1 parentForm)
        {
            this.parentForm = parentForm; // 接收 Form1 的实例
            InitializeComponent();
            // 加载并显示已保存的按键映射
            LoadSavedMappings();
        }

        private void LoadSavedMappings()
        {
            // 遍历已保存的按键映射
            foreach (var key in parentForm.keyMappings.Keys)
            {
                cmbKey.Items.Add(key); // 将按键添加到 ComboBox
            }

            // 绑定 ComboBox 的选择事件
            cmbKey.SelectedIndexChanged += CmbKey_SelectedIndexChanged;
        }

        private void CmbKey_SelectedIndexChanged(object sender, EventArgs e)
        {
            // 当用户选择按键时，自动填充消息和按下时间
            string selectedKey = cmbKey.SelectedItem?.ToString();
            if (!string.IsNullOrEmpty(selectedKey) && parentForm.keyMappings.ContainsKey(selectedKey))
            {
                var (message, holdTime) = parentForm.keyMappings[selectedKey];
                txtMessage.Text = message; // 填充消息
                txtHoldTime.Text = holdTime.ToString(); // 填充按下时间
            }
            else
            {
                // 如果按键未映射，清空消息和按下时间
                txtMessage.Clear();
                txtHoldTime.Clear();
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            this.SelectedKey = this.cmbKey.SelectedItem?.ToString();
            this.Message = this.txtMessage.Text;
            if (int.TryParse(this.txtHoldTime.Text, out int holdTime))
            {
                this.HoldTime = holdTime;
            }
            else
            {
                MessageBox.Show("请输入有效的按下时间（毫秒）。");
                return;
            }

            this.DialogResult = DialogResult.OK;
            LoadSavedMappings();
            this.Close();
        }

        private void btnClearConfig_Click(object sender, EventArgs e)
        {
            // 清除配置
            this.parentForm.keyMappings.Clear();
            this.parentForm.SaveKeyMappings(); // 保存空配置

            // 清空组件的当前内容
            this.txtHoldTime.Clear();       // 清空按下时间输入框
            this.cmbKey.SelectedIndex = -1; // 清空按键选择框（设置为未选择状态）
            this.txtMessage.Clear();        // 清空消息输入框

            MessageBox.Show("配置已清除");
        }

    }


}