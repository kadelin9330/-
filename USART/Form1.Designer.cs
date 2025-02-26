namespace USART
{
    partial class Form1
    {
        private System.Windows.Forms.Label lblPort;
        private System.Windows.Forms.ComboBox cmbPort;
        private System.Windows.Forms.Label lblBaudRate;
        private System.Windows.Forms.ComboBox cmbBaudRate;
        private System.Windows.Forms.Label lblDataBits;
        private System.Windows.Forms.ComboBox cmbDataBits;
        private System.Windows.Forms.Label lblParity;
        private System.Windows.Forms.ComboBox cmbParity;
        private System.Windows.Forms.Label lblStopBits;
        private System.Windows.Forms.ComboBox cmbStopBits;
        private System.Windows.Forms.Button btnOpenPort;

        // 接收设置区域组件
        private System.Windows.Forms.GroupBox groupBoxReceive;
        private System.Windows.Forms.RadioButton radioASCII;
        private System.Windows.Forms.RadioButton radioHEX;
        private System.Windows.Forms.CheckBox checkShowTime;
        private System.Windows.Forms.Button btnClearReceive;

        // 发送设置区域组件
        private System.Windows.Forms.GroupBox groupBoxSend;
        private System.Windows.Forms.RadioButton radioSendASCII;
        private System.Windows.Forms.RadioButton radioSendHEX;
        //private System.Windows.Forms.CheckBox checkSendNewLine;
        private System.Windows.Forms.CheckBox checkAutoSend;

        private System.Windows.Forms.TextBox txtAutoSendInterval;
        private System.Windows.Forms.Label lblDataDisplay;
        private System.Windows.Forms.TextBox txtDataDisplay;
        private System.Windows.Forms.TextBox txtSendInput;
        private System.Windows.Forms.Button btnSend;

        private System.Windows.Forms.Panel panelDataContainer;
        private System.Windows.Forms.Panel panelBottom;
        private System.Windows.Forms.Button btnKeyMapping;
        private System.Windows.Forms.Button btnToggleMapping; // 切换映射状态的按钮
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.lblPort = new System.Windows.Forms.Label();
            this.cmbPort = new System.Windows.Forms.ComboBox();
            this.lblBaudRate = new System.Windows.Forms.Label();
            this.cmbBaudRate = new System.Windows.Forms.ComboBox();
            this.lblDataBits = new System.Windows.Forms.Label();
            this.cmbDataBits = new System.Windows.Forms.ComboBox();
            this.lblParity = new System.Windows.Forms.Label();
            this.cmbParity = new System.Windows.Forms.ComboBox();
            this.lblStopBits = new System.Windows.Forms.Label();
            this.cmbStopBits = new System.Windows.Forms.ComboBox();
            this.btnOpenPort = new System.Windows.Forms.Button();
            this.groupBoxReceive = new System.Windows.Forms.GroupBox();
            this.radioASCII = new System.Windows.Forms.RadioButton();
            this.radioHEX = new System.Windows.Forms.RadioButton();
            this.checkShowTime = new System.Windows.Forms.CheckBox();
            this.btnClearReceive = new System.Windows.Forms.Button();
            this.groupBoxSend = new System.Windows.Forms.GroupBox();
            this.radioSendASCII = new System.Windows.Forms.RadioButton();
            this.radioSendHEX = new System.Windows.Forms.RadioButton();
            //this.checkSendNewLine = new System.Windows.Forms.CheckBox();
            this.checkAutoSend = new System.Windows.Forms.CheckBox();
            this.txtAutoSendInterval = new System.Windows.Forms.TextBox();
            this.txtDataDisplay = new System.Windows.Forms.TextBox();
            this.lblDataDisplay = new System.Windows.Forms.Label();
            this.txtSendInput = new System.Windows.Forms.TextBox();
            this.btnSend = new System.Windows.Forms.Button();
            this.panelDataContainer = new System.Windows.Forms.Panel();
            this.panelBottom = new System.Windows.Forms.Panel();
            this.btnKeyMapping = new System.Windows.Forms.Button();
            this.btnToggleMapping = new System.Windows.Forms.Button();
            this.groupBoxReceive.SuspendLayout();
            this.groupBoxSend.SuspendLayout();
            this.SuspendLayout();

            // 
            // lblPort
            // 
            this.lblPort.AutoSize = true;
            this.lblPort.Location = new System.Drawing.Point(12, 15);
            this.lblPort.Name = "lblPort";
            this.lblPort.Size = new System.Drawing.Size(40, 16);
            this.lblPort.TabIndex = 0;
            this.lblPort.Text = "串口";

            // 
            // cmbPort
            // 
            this.cmbPort.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbPort.FormattingEnabled = true;
            this.cmbPort.Location = new System.Drawing.Point(60, 12);
            this.cmbPort.Name = "cmbPort";
            this.cmbPort.Size = new System.Drawing.Size(120, 24);
            this.cmbPort.TabIndex = 1;
            this.cmbPort.DropDown += new System.EventHandler(this.cmbPort_DropDown);

            // 
            // lblBaudRate
            // 
            this.lblBaudRate.AutoSize = true;
            this.lblBaudRate.Location = new System.Drawing.Point(12, 45);
            this.lblBaudRate.Name = "lblBaudRate";
            this.lblBaudRate.Size = new System.Drawing.Size(40, 16);
            this.lblBaudRate.TabIndex = 2;
            this.lblBaudRate.Text = "波特率";

            // 
            // cmbBaudRate
            // 
            this.cmbBaudRate.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbBaudRate.FormattingEnabled = true;
            this.cmbBaudRate.Items.AddRange(new object[] {
            "9600",
            "19200",
            "38400",
            "57600",
            "115200"});
            this.cmbBaudRate.Location = new System.Drawing.Point(60, 42);
            this.cmbBaudRate.Name = "cmbBaudRate";
            this.cmbBaudRate.Size = new System.Drawing.Size(120, 24);
            this.cmbBaudRate.TabIndex = 3;
            this.cmbBaudRate.SelectedIndex = 4;

            // 
            // lblDataBits
            // 
            this.lblDataBits.AutoSize = true;
            this.lblDataBits.Location = new System.Drawing.Point(12, 75);
            this.lblDataBits.Name = "lblDataBits";
            this.lblDataBits.Size = new System.Drawing.Size(40, 16);
            this.lblDataBits.TabIndex = 4;
            this.lblDataBits.Text = "数据位";

            // 
            // cmbDataBits
            // 
            this.cmbDataBits.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbDataBits.FormattingEnabled = true;
            this.cmbDataBits.Items.AddRange(new object[] {
            "5",
            "6",
            "7",
            "8"});
            this.cmbDataBits.Location = new System.Drawing.Point(60, 72);
            this.cmbDataBits.Name = "cmbDataBits";
            this.cmbDataBits.Size = new System.Drawing.Size(120, 24);
            this.cmbDataBits.TabIndex = 5;
            this.cmbDataBits.SelectedIndex = 3;

            // 
            // lblParity
            // 
            this.lblParity.AutoSize = true;
            this.lblParity.Location = new System.Drawing.Point(12, 105);
            this.lblParity.Name = "lblParity";
            this.lblParity.Size = new System.Drawing.Size(40, 16);
            this.lblParity.TabIndex = 6;
            this.lblParity.Text = "校验位";

            // 
            // cmbParity
            // 
            this.cmbParity.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbParity.FormattingEnabled = true;
            this.cmbParity.Items.AddRange(new object[] {
            "None",
            "Odd",
            "Even"});
            this.cmbParity.Location = new System.Drawing.Point(60, 102);
            this.cmbParity.Name = "cmbParity";
            this.cmbParity.Size = new System.Drawing.Size(120, 24);
            this.cmbParity.TabIndex = 7;
            this.cmbParity.SelectedIndex = 0;

            // 
            // lblStopBits
            // 
            this.lblStopBits.AutoSize = true;
            this.lblStopBits.Location = new System.Drawing.Point(12, 135);
            this.lblStopBits.Name = "lblStopBits";
            this.lblStopBits.Size = new System.Drawing.Size(40, 16);
            this.lblStopBits.TabIndex = 8;
            this.lblStopBits.Text = "停止位";

            // 
            // cmbStopBits
            // 
            this.cmbStopBits.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbStopBits.FormattingEnabled = true;
            this.cmbStopBits.Items.AddRange(new object[] {
            "1",
            "1.5",
            "2"});
            this.cmbStopBits.Location = new System.Drawing.Point(60, 132);
            this.cmbStopBits.Name = "cmbStopBits";
            this.cmbStopBits.Size = new System.Drawing.Size(120, 24);
            this.cmbStopBits.TabIndex = 9;
            this.cmbStopBits.SelectedIndex = 0;

            // 
            // btnOpenPort
            // 
            this.btnOpenPort.Location = new System.Drawing.Point(60, 162);
            this.btnOpenPort.Name = "btnOpenPort";
            this.btnOpenPort.Size = new System.Drawing.Size(120, 30);
            this.btnOpenPort.TabIndex = 10;
            this.btnOpenPort.Text = "打开串口";
            this.btnOpenPort.UseVisualStyleBackColor = true;
            this.btnOpenPort.Click += new System.EventHandler(this.btnOpenPort_Click);

            // 
            // groupBoxReceive
            // 
            this.groupBoxReceive.Controls.Add(this.radioASCII);
            this.groupBoxReceive.Controls.Add(this.radioHEX);
            this.groupBoxReceive.Controls.Add(this.checkShowTime);
            this.groupBoxReceive.Controls.Add(this.btnClearReceive);
            this.groupBoxReceive.Location = new System.Drawing.Point(12, 200);
            this.groupBoxReceive.Name = "groupBoxReceive";
            this.groupBoxReceive.Size = new System.Drawing.Size(200, 150);
            this.groupBoxReceive.TabIndex = 11;
            this.groupBoxReceive.TabStop = false;
            this.groupBoxReceive.Text = "接收设置";

            // 
            // radioASCII
            // 
            this.radioASCII.AutoSize = true;
            this.radioASCII.Location = new System.Drawing.Point(10, 20);
            this.radioASCII.Name = "radioASCII";
            this.radioASCII.Size = new System.Drawing.Size(60, 20);
            this.radioASCII.TabIndex = 0;
            this.radioASCII.TabStop = true;
            this.radioASCII.Text = "ASCII";
            this.radioASCII.UseVisualStyleBackColor = true;
            this.radioASCII.Checked = true; // 默认选中 ASCII

            // 
            // radioHEX
            // 
            this.radioHEX.AutoSize = true;
            this.radioHEX.Location = new System.Drawing.Point(10, 50);
            this.radioHEX.Name = "radioHEX";
            this.radioHEX.Size = new System.Drawing.Size(54, 20);
            this.radioHEX.TabIndex = 1;
            this.radioHEX.TabStop = true;
            this.radioHEX.Text = "HEX";
            this.radioHEX.UseVisualStyleBackColor = true;
            this.radioHEX.Checked = false; // 默认不选中 HEX

            // 
            // checkShowTime
            // 
            this.checkShowTime.AutoSize = true;
            this.checkShowTime.Location = new System.Drawing.Point(10, 80);
            this.checkShowTime.Name = "checkShowTime";
            this.checkShowTime.Size = new System.Drawing.Size(120, 20);
            this.checkShowTime.TabIndex = 2;
            this.checkShowTime.Text = "显示接收时间";
            this.checkShowTime.UseVisualStyleBackColor = true;
            this.checkShowTime.Checked = true; // 默认选中显示接收时间

            // 
            // btnClearReceive
            // 
            this.btnClearReceive.Location = new System.Drawing.Point(10, 110);
            this.btnClearReceive.Name = "btnClearReceive";
            this.btnClearReceive.Size = new System.Drawing.Size(100, 30);
            this.btnClearReceive.TabIndex = 3;
            this.btnClearReceive.Text = "清空接收";
            this.btnClearReceive.UseVisualStyleBackColor = true;
            this.btnClearReceive.Click += new System.EventHandler(this.btnClearReceive_Click); // 绑定点击事

            // 
            // groupBoxSend
            // 
            this.groupBoxSend.Controls.Add(this.radioSendASCII);
            this.groupBoxSend.Controls.Add(this.radioSendHEX);
            //this.groupBoxSend.Controls.Add(this.checkSendNewLine);
            this.groupBoxSend.Controls.Add(this.checkAutoSend);
            this.groupBoxSend.Controls.Add(this.txtAutoSendInterval);
            this.groupBoxSend.Location = new System.Drawing.Point(12, 360);
            this.groupBoxSend.Name = "groupBoxSend";
            this.groupBoxSend.Size = new System.Drawing.Size(200, 150);
            this.groupBoxSend.TabIndex = 12;
            this.groupBoxSend.TabStop = false;
            this.groupBoxSend.Text = "发送设置";

            // 
            // radioSendASCII
            // 
            this.radioSendASCII.AutoSize = true;
            this.radioSendASCII.Location = new System.Drawing.Point(10, 20);
            this.radioSendASCII.Name = "radioSendASCII";
            this.radioSendASCII.Size = new System.Drawing.Size(60, 20);
            this.radioSendASCII.TabIndex = 0;
            this.radioSendASCII.TabStop = true;
            this.radioSendASCII.Text = "ASCII";
            this.radioSendASCII.UseVisualStyleBackColor = true;
            this.radioSendASCII.Checked = true; // 默认选中 ASCII

            // 
            // radioSendHEX
            // 
            this.radioSendHEX.AutoSize = true;
            this.radioSendHEX.Location = new System.Drawing.Point(10, 50);
            this.radioSendHEX.Name = "radioSendHEX";
            this.radioSendHEX.Size = new System.Drawing.Size(54, 20);
            this.radioSendHEX.TabIndex = 1;
            this.radioSendHEX.TabStop = true;
            this.radioSendHEX.Text = "HEX";
            this.radioSendHEX.UseVisualStyleBackColor = true;
            this.radioSendHEX.Checked = false; // 默认不选中 HEX

            /*
            // 
            // checkSendNewLine
            // 
            this.checkSendNewLine.AutoSize = true;
            this.checkSendNewLine.Location = new System.Drawing.Point(10, 80);
            this.checkSendNewLine.Name = "checkSendNewLine";
            this.checkSendNewLine.Size = new System.Drawing.Size(90, 20);
            this.checkSendNewLine.TabIndex = 2;
            this.checkSendNewLine.Text = "发送新行";
            this.checkSendNewLine.UseVisualStyleBackColor = true;
            this.checkSendNewLine.Checked = false; // 默认不选中发送新行
            */
            // 
            // checkAutoSend
            // 
            this.checkAutoSend.AutoSize = true;
            this.checkAutoSend.Location = new System.Drawing.Point(10, 110);
            this.checkAutoSend.Name = "checkAutoSend";
            this.checkAutoSend.Size = new System.Drawing.Size(90, 20);
            this.checkAutoSend.TabIndex = 3;
            this.checkAutoSend.Text = "自动发送";
            this.checkAutoSend.UseVisualStyleBackColor = true;
            this.checkAutoSend.Checked = false; // 默认选中自动发送

            // 
            // txtAutoSendInterval
            // 
            this.txtAutoSendInterval.Location = new System.Drawing.Point(100, 110);
            this.txtAutoSendInterval.Name = "txtAutoSendInterval";
            this.txtAutoSendInterval.Size = new System.Drawing.Size(50, 22);
            this.txtAutoSendInterval.TabIndex = 4;
            this.txtAutoSendInterval.Text = "10"; // 默认自动发送间隔为 1000

            // 
            // panelDataContainer
            // 
            this.panelDataContainer.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom)
            | System.Windows.Forms.AnchorStyles.Left)
            | System.Windows.Forms.AnchorStyles.Right)));
            //this.panelDataContainer.Controls.Add(this.lblDataDisplay);
            this.panelDataContainer.Controls.Add(this.txtDataDisplay);
            this.panelDataContainer.Controls.Add(this.panelBottom); // 添加底部区域
            this.panelDataContainer.Location = new System.Drawing.Point(220, 20); // 设置容器的位置
            this.panelDataContainer.Name = "panelDataContainer";
            this.panelDataContainer.Size = new System.Drawing.Size(700, 500); // 设置容器的大小
            this.panelDataContainer.TabIndex = 18;

            // 
            // lblDataDisplay
            // 
            this.lblDataDisplay.AutoSize = true;
            this.lblDataDisplay.Location = new System.Drawing.Point(220, 0);
            this.lblDataDisplay.Name = "lblDataDisplay";
            this.lblDataDisplay.Size = new System.Drawing.Size(80, 16);
            this.lblDataDisplay.TabIndex = 0;
            this.lblDataDisplay.Text = "数据显示区域";

            // 
            // txtDataDisplay
            // 
            this.txtDataDisplay.Dock = System.Windows.Forms.DockStyle.Fill; // 填充剩余空间
            this.txtDataDisplay.Location = new System.Drawing.Point(0, 20); // 预留顶部空间
            this.txtDataDisplay.Multiline = true;
            this.txtDataDisplay.Name = "txtDataDisplay";
            this.txtDataDisplay.ReadOnly = true;
            this.txtDataDisplay.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.txtDataDisplay.Size = new System.Drawing.Size(700, 360);
            this.txtDataDisplay.TabIndex = 1;

            // 
            // panelBottom
            // 
            this.panelBottom = new System.Windows.Forms.Panel();
            this.panelBottom.Dock = System.Windows.Forms.DockStyle.Bottom; // 固定在容器底部
            this.panelBottom.Controls.Add(this.txtSendInput);
            this.panelBottom.Controls.Add(this.btnSend);
            this.panelBottom.Height = 40; // 设置底部区域的高度
            this.panelDataContainer.Controls.Add(this.panelBottom);

            // 
            // txtSendInput
            // 
            this.txtSendInput.Dock = System.Windows.Forms.DockStyle.Fill; // 填充底部区域的左侧
            this.txtSendInput.Location = new System.Drawing.Point(0, 10);
            this.txtSendInput.Name = "txtSendInput";
            this.txtSendInput.Size = new System.Drawing.Size(360, 25);
            this.txtSendInput.TabIndex = 2;

            // 
            // btnSend
            // 
            this.btnSend.Dock = System.Windows.Forms.DockStyle.Right; // 固定在底部区域的右侧
            this.btnSend.Location = new System.Drawing.Point(550, 0);
            this.btnSend.Name = "btnSend";
            this.btnSend.Size = new System.Drawing.Size(90, 25);
            this.btnSend.TabIndex = 3;
            this.btnSend.Text = "发送";
            this.btnSend.UseVisualStyleBackColor = true;
            this.btnSend.Click += new System.EventHandler(this.btnSend_Click);

            // 
            // btnKeyMapping
            // 
            this.btnKeyMapping = new System.Windows.Forms.Button();
            this.btnKeyMapping.Location = new System.Drawing.Point(12, 520); // 放置在左下角
            this.btnKeyMapping.Name = "btnKeyMapping";
            this.btnKeyMapping.Size = new System.Drawing.Size(70, 30);
            this.btnKeyMapping.TabIndex = 19;
            this.btnKeyMapping.Text = "配置按键映射";
            this.btnKeyMapping.UseVisualStyleBackColor = true;
            this.btnKeyMapping.Click += new System.EventHandler(this.btnKeyMapping_Click);


            // 
            // btnToggleMapping
            // 
            this.btnToggleMapping = new System.Windows.Forms.Button();
            this.btnToggleMapping.Location = new System.Drawing.Point(100, 520); // 放置在 btnKeyMapping 的右侧
            this.btnToggleMapping.Name = "btnToggleMapping";
            this.btnToggleMapping.Size = new System.Drawing.Size(70, 30);
            this.btnToggleMapping.TabIndex = 20;
            this.btnToggleMapping.Text = "开启映射"; // 初始状态为“开启映射”
            this.btnToggleMapping.UseVisualStyleBackColor = true;
            this.btnToggleMapping.Click += new System.EventHandler(this.btnToggleMapping_Click);
            this.Controls.Add(this.btnToggleMapping); // 将按钮添加到窗体

            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(960, 570);
            this.Controls.Add(this.panelDataContainer); // 将容器添加到窗体
            this.Controls.Add(this.groupBoxSend);
            this.Controls.Add(this.groupBoxReceive);
            this.Controls.Add(this.btnOpenPort);
            this.Controls.Add(this.cmbStopBits);
            this.Controls.Add(this.lblStopBits);
            this.Controls.Add(this.cmbParity);
            this.Controls.Add(this.lblParity);
            this.Controls.Add(this.cmbDataBits);
            this.Controls.Add(this.lblDataBits);
            this.Controls.Add(this.cmbBaudRate);
            this.Controls.Add(this.lblBaudRate);
            this.Controls.Add(this.cmbPort);
            this.Controls.Add(this.lblPort);
            this.Controls.Add(this.lblDataDisplay);
            // 将按钮添加到窗体
            this.Controls.Add(this.btnKeyMapping);
            this.Name = "Form1";
            this.Text = "USART Communication";
            this.groupBoxReceive.ResumeLayout(false);
            this.groupBoxReceive.PerformLayout();
            this.groupBoxSend.ResumeLayout(false);
            this.groupBoxSend.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        private void Form1_Resize(object sender, System.EventArgs e)
        {
            // 当窗体大小改变时，强制重绘
            this.Invalidate();
        }
        #endregion
    }

    partial class KeyMappingDialog : Form
    {
        private System.Windows.Forms.Label lblKey;
        private System.Windows.Forms.ComboBox cmbKey;
        private System.Windows.Forms.Label lblMessage;
        private System.Windows.Forms.TextBox txtMessage;
        private System.Windows.Forms.Label lblHoldTime;
        private System.Windows.Forms.TextBox txtHoldTime;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Button btnClearConfig;

        public string SelectedKey { get; private set; }
        public string Message { get; private set; }
        public int HoldTime { get; private set; }

        public KeyMappingDialog()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.lblKey = new System.Windows.Forms.Label();
            this.cmbKey = new System.Windows.Forms.ComboBox();
            this.lblMessage = new System.Windows.Forms.Label();
            this.txtMessage = new System.Windows.Forms.TextBox();
            this.lblHoldTime = new System.Windows.Forms.Label();
            this.txtHoldTime = new System.Windows.Forms.TextBox();
            this.btnSave = new System.Windows.Forms.Button();
            this.btnClearConfig = new System.Windows.Forms.Button();
            this.SuspendLayout();

            // 
            // lblKey
            // 
            this.lblKey.AutoSize = true;
            this.lblKey.Location = new System.Drawing.Point(10, 10);
            this.lblKey.Name = "lblKey";
            this.lblKey.Size = new System.Drawing.Size(40, 16);
            this.lblKey.TabIndex = 0;
            this.lblKey.Text = "按键";

            // 
            // cmbKey
            // 
            this.cmbKey.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbKey.FormattingEnabled = true;
            this.cmbKey.Items.AddRange(new object[] {
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "Space", // 空格键
    "Enter", // 回车键
    "Escape", // Esc 键
    "Backspace", // 退格键
    "Tab", // Tab 键
    "CapsLock", // 大写锁定键
    "Shift", // Shift 键
    "Control", // Ctrl 键
    "Alt", // Alt 键
    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", // 功能键
    "NumPad0", "NumPad1", "NumPad2", "NumPad3", "NumPad4", // 小键盘数字键
    "NumPad5", "NumPad6", "NumPad7", "NumPad8", "NumPad9",
    "Multiply", // 小键盘乘号
    "Add", // 小键盘加号
    "Subtract", // 小键盘减号
    "Decimal", // 小键盘小数点
    "Divide", // 小键盘除号
    "Left", "Right", "Up", "Down", // 方向键
    "Insert", "Delete", "Home", "End", "PageUp", "PageDown" // 编辑键
});
            this.cmbKey.Location = new System.Drawing.Point(60, 10);
            this.cmbKey.Name = "cmbKey";
            this.cmbKey.Size = new System.Drawing.Size(120, 24);
            this.cmbKey.TabIndex = 1;

            // 
            // lblMessage
            // 
            this.lblMessage.AutoSize = true;
            this.lblMessage.Location = new System.Drawing.Point(10, 50);
            this.lblMessage.Name = "lblMessage";
            this.lblMessage.Size = new System.Drawing.Size(40, 16);
            this.lblMessage.TabIndex = 2;
            this.lblMessage.Text = "消息";

            // 
            // txtMessage
            // 
            this.txtMessage.Location = new System.Drawing.Point(60, 50);
            this.txtMessage.Name = "txtMessage";
            this.txtMessage.Size = new System.Drawing.Size(200, 22);
            this.txtMessage.TabIndex = 3;

            // 
            // lblHoldTime
            // 
            this.lblHoldTime.AutoSize = true;
            this.lblHoldTime.Location = new System.Drawing.Point(10, 90);
            this.lblHoldTime.Name = "lblHoldTime";
            this.lblHoldTime.Size = new System.Drawing.Size(80, 16);
            this.lblHoldTime.TabIndex = 4;
            this.lblHoldTime.Text = "按下时间 (ms)";

            // 
            // txtHoldTime
            // 
            this.txtHoldTime.Location = new System.Drawing.Point(110, 90);
            this.txtHoldTime.Name = "txtHoldTime";
            this.txtHoldTime.Size = new System.Drawing.Size(80, 22);
            this.txtHoldTime.TabIndex = 5;

            // 
            // btnSave
            // 
            this.btnSave.Location = new System.Drawing.Point(110, 130);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(80, 30);
            this.btnSave.TabIndex = 6;
            this.btnSave.Text = "保存";
            this.btnSave.UseVisualStyleBackColor = true;
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);

            // 
            // btnClearConfig
            // 
            this.btnClearConfig = new System.Windows.Forms.Button();
            this.btnClearConfig.Location = new System.Drawing.Point(100, 170); // 设置按钮位置
            this.btnClearConfig.Name = "btnClearConfig";
            this.btnClearConfig.Size = new System.Drawing.Size(100, 30); // 设置按钮大小
            this.btnClearConfig.TabIndex = 7;
            this.btnClearConfig.Text = "清除配置";
            this.btnClearConfig.UseVisualStyleBackColor = true;
            this.btnClearConfig.Click += new System.EventHandler(this.btnClearConfig_Click);

            // 
            // KeyMappingDialog
            // 
            this.ClientSize = new System.Drawing.Size(300, 210);
            this.Controls.Add(this.btnSave);
            this.Controls.Add(this.txtHoldTime);
            this.Controls.Add(this.lblHoldTime);
            this.Controls.Add(this.txtMessage);
            this.Controls.Add(this.lblMessage);
            this.Controls.Add(this.cmbKey);
            this.Controls.Add(this.lblKey);
            this.Controls.Add(this.btnClearConfig);
            this.Name = "KeyMappingDialog";
            this.Text = "按键映射配置";
            this.ResumeLayout(false);
            this.PerformLayout();
        }


    }
}