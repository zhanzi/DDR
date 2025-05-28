using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SlzrCrossGate.Core.Models;

namespace SlzrCrossGate.Core.Service.BusinessServices
{
    public class TerminalEventMessage
    {
        public TerminalEventMessage() { }

        public required string MerchantID { get; set; }

        public required string TerminalID { get; set; }
        public DateTime EventTime { get; set; } = DateTime.Now;

        public string EventName { get; private set; } = string.Empty;

        TerminalEventType _eventType;
        public TerminalEventType EventType
        {

            get
            {
                return _eventType;
            }
            set
            {
                //设置EventType时，将EventName设置为对应的名称
                _eventType = value;
                EventName = _eventType.ToString();
            }
        }

        public EventSeverity Severity { get; set; } // 添加事件严重性字段

        public string? Remark { get; set; }

        public string? Operator { get; set; }

    }


}
