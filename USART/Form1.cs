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
        private int remainingSendCount = 0; // ʣ�෢�ʹ���
        public Dictionary<string, (string Message, int HoldTime)> keyMappings = new Dictionary<string, (string, int)>();
        private static readonly string ConfigFilePath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
    "USART",
    "keyMappings.json"
);
        private bool isMappingEnabled = false; // ӳ���Ƿ����õ�״̬����
        private StringBuilder receivedDataBuffer = new StringBuilder();
        public Form1()
        {
            InitializeComponent();
            DetectAvailablePorts(); // �����ô���
            serialPort.DataReceived += SerialPort_DataReceived; // �󶨽����¼�
                                                                // ��ʼ����ʱ��
            this.timerAutoSend = new System.Windows.Forms.Timer();
            this.timerAutoSend.Interval = 50; // ���ü��Ϊ 50ms
            this.timerAutoSend.Tick += new System.EventHandler(this.timerAutoSend_Tick);

            LoadKeyMappings(); // ���ذ���ӳ������
        }

        // ��ʱ���� Tick �¼�
        private void timerAutoSend_Tick(object sender, EventArgs e)
        {
            if (remainingSendCount > 0) // �������ʣ�෢�ʹ���
            {
                SendMessage(txtSendInput.Text); // ������Ϣ
                remainingSendCount--; // ����ʣ�෢�ʹ���
            }
            else
            {
                timerAutoSend.Stop(); // ֹͣ��ʱ��
            }
        }


        // �����ô��ڲ���ӵ� ComboBox
        private void DetectAvailablePorts()
        {
            // ��ȡ��ǰ���õĴ�������
            string[] ports = SerialPort.GetPortNames();

            // ��� ComboBox ��������
            cmbPort.Items.Clear();

            // ����⵽�Ĵ�����ӵ� ComboBox
            foreach (string port in ports)
            {
                cmbPort.Items.Add(port);
            }

            // ����п��õĴ��ڣ�Ĭ��ѡ���һ��
            if (cmbPort.Items.Count > 0)
            {
                cmbPort.SelectedIndex = 0;
            }
            else
            {
                MessageBox.Show("δ��⵽���ô��ڣ�");
            }
        }

        // ComboBox �����¼�
        private void cmbPort_DropDown(object sender, EventArgs e)
        {
            DetectAvailablePorts(); // ÿ�ε��������ͷʱˢ�´����б�
        }


        // ������Ϣ
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

                    // �����ѡ����ʾʱ�����������Ϣǰ���ʱ���
                    if (checkShowTime.Checked)
                    {
                        formattedMessage = $"[{DateTime.Now:HH:mm:ss.fff}] ����: " + message;
                    }
                    else
                    {
                        formattedMessage = "����: " + message;
                    }

                    // �жϷ���ģʽ��ASCII �� HEX��
                    if (radioSendASCII.Checked) // ASCII ģʽ
                    {
                        serialPort.Write(message); // ֱ�ӷ����ַ���
                    }
                    else if (radioSendHEX.Checked) // HEX ģʽ
                    {
                        // �� HEX �ַ���ת��Ϊ�ֽ�����
                        byte[] hexBytes = HexStringToByteArray(message);
                        serialPort.Write(hexBytes, 0, hexBytes.Length); // �����ֽ�����
                    }

                    // ��������ʾ����׷�ӷ��ͼ�¼
                    txtDataDisplay.AppendText(formattedMessage + Environment.NewLine);
                }
                else
                {
                    MessageBox.Show("����δ��");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("����ʧ��: " + ex.Message);
            }
        }

        // �� HEX �ַ���ת��Ϊ�ֽ�����
        private byte[] HexStringToByteArray(string hex)
        {
            hex = hex.Replace(" ", ""); // ȥ���ո�
            if (hex.Length % 2 != 0)
            {
                throw new ArgumentException("HEX �ַ������ȱ���Ϊż��");
            }

            byte[] bytes = new byte[hex.Length / 2];
            for (int i = 0; i < bytes.Length; i++)
            {
                bytes[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
            }
            return bytes;
        }

        // ������Ϣ
        private void SerialPort_DataReceived(object sender, SerialDataReceivedEventArgs e)
        {
            try
            {
                string receivedData = string.Empty;

                // �жϽ���ģʽ��ASCII �� HEX��
                if (radioASCII.Checked) // ASCII ģʽ
                {
                    receivedData = serialPort.ReadExisting(); // ֱ�Ӷ�ȡ�ַ���
                }
                else if (radioHEX.Checked) // HEX ģʽ
                {
                    // ��ȡ�ֽ����ݲ�ת��Ϊ HEX �ַ���
                    int bytesToRead = serialPort.BytesToRead;
                    byte[] buffer = new byte[bytesToRead];
                    serialPort.Read(buffer, 0, bytesToRead);
                    receivedData = BitConverter.ToString(buffer).Replace("-", " "); // ת��Ϊ HEX ��ʽ
                }

                // �����յ�������׷�ӵ�������
                receivedDataBuffer.Append(receivedData);

                // ��黺�������Ƿ�����������Ϣ��������Ϣ�Ի��з���β��
                string bufferContent = receivedDataBuffer.ToString();
                int newLineIndex = bufferContent.IndexOf('\n');
                if (newLineIndex >= 0)
                {
                    // ��ȡ��������Ϣ
                    string completeMessage = bufferContent.Substring(0, newLineIndex + 1);
                    receivedDataBuffer.Remove(0, newLineIndex + 1); // �ӻ��������Ƴ��Ѵ������Ϣ

                    this.Invoke(new Action(() =>
                    {
                        string formattedMessage = completeMessage.Trim(); // ȥ������Ŀհ��ַ�

                        // �����ѡ����ʾʱ�����������Ϣǰ���ʱ���
                        if (checkShowTime.Checked)
                        {
                            formattedMessage = $"[{DateTime.Now:HH:mm:ss.fff}] ����: " + formattedMessage;
                        }
                        else
                        {
                            formattedMessage = "����: " + formattedMessage;
                        }

                        // ��������ʾ����׷�ӽ��ռ�¼
                        txtDataDisplay.AppendText(formattedMessage + Environment.NewLine);
                    }));
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("����ʧ��: " + ex.Message);
            }
        }

        private void btnClearReceive_Click(object sender, EventArgs e)
        {
            txtDataDisplay.Clear(); // ���������ʾ����
        }

        // �򿪴��ڰ�ť����¼�
        private void btnOpenPort_Click(object sender, EventArgs e)
        {
            if (btnOpenPort.Text == "�򿪴���")
            {
                if (OpenSerialPort())
                {
                    btnOpenPort.Text = "�رմ���";
                    SetSerialSettingsEnabled(false); // �򿪴��ں�����������
                }
            }
            else
            {
                CloseSerialPort();
                btnOpenPort.Text = "�򿪴���";
                SetSerialSettingsEnabled(true); // �رմ��ں������������
            }
        }

        // �򿪴���
        private bool OpenSerialPort()
        {
            try
            {
                // ���ô��ڲ���
                serialPort.PortName = cmbPort.SelectedItem.ToString();
                serialPort.BaudRate = int.Parse(cmbBaudRate.SelectedItem.ToString());
                serialPort.DataBits = int.Parse(cmbDataBits.SelectedItem.ToString());
                serialPort.Parity = (Parity)Enum.Parse(typeof(Parity), cmbParity.SelectedItem.ToString());
                serialPort.StopBits = (StopBits)Enum.Parse(typeof(StopBits), cmbStopBits.SelectedItem.ToString());

                // �򿪴���
                serialPort.Open();
                return true; // �򿪳ɹ�
            }
            catch (Exception ex)
            {
                MessageBox.Show("�򿪴���ʧ��: " + ex.Message);
                return false; // ��ʧ��
            }
        }

        // �رմ���
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
                MessageBox.Show("�رմ���ʧ��: " + ex.Message);
            }
        }

        // ���ô����������������״̬
        private void SetSerialSettingsEnabled(bool enabled)
        {
            // �����������
            cmbPort.Enabled = enabled;
            cmbBaudRate.Enabled = enabled;
            cmbDataBits.Enabled = enabled;
            cmbParity.Enabled = enabled;
            cmbStopBits.Enabled = enabled;


        }

        // ���Ͱ�ť����¼�
        private void btnSend_Click(object sender, EventArgs e)
        {
            string message = txtSendInput.Text;
            if (!string.IsNullOrEmpty(message))
            {
                if (checkAutoSend.Checked) // �����ѡ���Զ�����
                {
                    // ��ȡ���ʹ���
                    if (int.TryParse(txtAutoSendInterval.Text, out int sendCount) && sendCount > 0)
                    {
                        // ������ʱ��
                        timerAutoSend.Start();
                        remainingSendCount = sendCount; // ����ʣ�෢�ʹ���
                    }
                    else
                    {
                        MessageBox.Show("��������Ч�ķ��ʹ�����");
                    }
                }
                else // ���û�й�ѡ�Զ�����
                {
                    SendMessage(message); // ֻ����һ��
                }
            }
            else
            {
                MessageBox.Show("������Ҫ���͵���Ϣ��");
            }
        }


        private void btnKeyMapping_Click(object sender, EventArgs e)
        {
            using (var dialog = new KeyMappingDialog(this)) // �� Form1 ��ʵ�����ݸ� KeyMappingDialog
            {
                if (dialog.ShowDialog() == DialogResult.OK)
                {
                    keyMappings[dialog.SelectedKey] = (dialog.Message, dialog.HoldTime);
                    SaveKeyMappings(); // ��������
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
                // ȷ��Ŀ¼����
                Directory.CreateDirectory(Path.GetDirectoryName(ConfigFilePath));

                // �� keyMappings ���л�Ϊ JSON �����浽�ļ�
                string json = JsonConvert.SerializeObject(keyMappings, Newtonsoft.Json.Formatting.Indented);
                File.WriteAllText(ConfigFilePath, json);
            }
            catch (Exception ex)
            {
                MessageBox.Show("��������ʧ��: " + ex.Message);
            }
        }

        private void LoadKeyMappings()
        {
            try
            {
                if (File.Exists(ConfigFilePath))
                {
                    // ���ļ���ȡ JSON �������л�Ϊ keyMappings
                    string json = File.ReadAllText(ConfigFilePath);
                    keyMappings = JsonConvert.DeserializeObject<Dictionary<string, (string Message, int HoldTime)>>(json);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("��������ʧ��: " + ex.Message);
            }
        }

        private void btnToggleMapping_Click(object sender, EventArgs e)
        {
            // �л�ӳ��״̬
            isMappingEnabled = !isMappingEnabled;

            // ���°�ť�ı�
            if (isMappingEnabled)
            {
                btnToggleMapping.Text = "�ر�ӳ��";
                MessageBox.Show("ӳ��������");
            }
            else
            {
                btnToggleMapping.Text = "����ӳ��";
                MessageBox.Show("ӳ���ѽ���");
            }

            // ����״̬���û����ӳ�书��
            ToggleKeyMapping(isMappingEnabled);
        }

        private void ToggleKeyMapping(bool isEnabled)
        {
            if (isEnabled)
            {
                // ����ӳ�书��
                this.KeyPreview = true; // ���ü����¼�����
            }
            else
            {
                // ����ӳ�书��
                this.KeyPreview = false; // ���ü����¼�����
            }
        }

    }



    partial class KeyMappingDialog : Form
    {

        private Form1 parentForm; // ���ڷ��� Form1 ��ʵ��

        public KeyMappingDialog(Form1 parentForm)
        {
            this.parentForm = parentForm; // ���� Form1 ��ʵ��
            InitializeComponent();
            // ���ز���ʾ�ѱ���İ���ӳ��
            LoadSavedMappings();
        }

        private void LoadSavedMappings()
        {
            // �����ѱ���İ���ӳ��
            foreach (var key in parentForm.keyMappings.Keys)
            {
                cmbKey.Items.Add(key); // ��������ӵ� ComboBox
            }

            // �� ComboBox ��ѡ���¼�
            cmbKey.SelectedIndexChanged += CmbKey_SelectedIndexChanged;
        }

        private void CmbKey_SelectedIndexChanged(object sender, EventArgs e)
        {
            // ���û�ѡ�񰴼�ʱ���Զ������Ϣ�Ͱ���ʱ��
            string selectedKey = cmbKey.SelectedItem?.ToString();
            if (!string.IsNullOrEmpty(selectedKey) && parentForm.keyMappings.ContainsKey(selectedKey))
            {
                var (message, holdTime) = parentForm.keyMappings[selectedKey];
                txtMessage.Text = message; // �����Ϣ
                txtHoldTime.Text = holdTime.ToString(); // ��䰴��ʱ��
            }
            else
            {
                // �������δӳ�䣬�����Ϣ�Ͱ���ʱ��
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
                MessageBox.Show("��������Ч�İ���ʱ�䣨���룩��");
                return;
            }

            this.DialogResult = DialogResult.OK;
            LoadSavedMappings();
            this.Close();
        }

        private void btnClearConfig_Click(object sender, EventArgs e)
        {
            // �������
            this.parentForm.keyMappings.Clear();
            this.parentForm.SaveKeyMappings(); // ���������

            // �������ĵ�ǰ����
            this.txtHoldTime.Clear();       // ��հ���ʱ�������
            this.cmbKey.SelectedIndex = -1; // ��հ���ѡ�������Ϊδѡ��״̬��
            this.txtMessage.Clear();        // �����Ϣ�����

            MessageBox.Show("���������");
        }

    }


}