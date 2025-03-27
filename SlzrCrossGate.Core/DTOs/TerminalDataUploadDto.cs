namespace SlzrDatatransferModel
{
    public class ConsumeData
    {
        public string MerchantID { get; set; } = "";

        public string MachineNO { get; set; } = "";

        public string MachineID { get; set; } = "";

        public string PsamNO { get; set; } = "";

        public required byte[] buffer { get; set; }
    }
}