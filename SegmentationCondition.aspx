<%@ Page Language="C#" AutoEventWireup="true" Inherits="CMSCustomWebPages.SegmentationCondition" EnableEventValidation="false" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <title>Segmentation Condition</title>
    <%--<script type="text/javascript" language="javascript" src="/WebUI/Core/Controls/Popup/PopupInit.js"></script>--%>
    <link href="~/CustomPages_CSS/SegmentationCondition.css" rel="stylesheet" type="text/css" />
    <link href="./Content/bootstrap.css" rel="stylesheet" type="text/css" />
    <link href="./Content/query-builder.default.min.css" rel="stylesheet" type="text/css" />
    <script type="text/javascript">

        var args = window.dialogArguments;

        function getFirstField() {
            var fields = args.getFields();
            if (fields && fields.length > 0) {
                return fields[0];
            }
        }

        // decode field value from cms 
        function DecodeFieldValue() {
            var txtSegmentationCondition = document.getElementById('txtSegmentationCondition');
            txtSegmentationCondition.value = eval(decodeURIComponent(txtSegmentationCondition.value) + "[0]");
        }

        function SaveAndClose() {
            var ret = document.getElementById('txtSegmentationCondition').value;
            getFirstField().setValues([ret]);
            //window.returnValue=ret;          
            window.opener = 'x';
            window.close();
            return;
        }

        function Close() {
            window.opener = 'x';
            window.close();
            return;
        }
        function AddToCondition(param) {
            var conditionTag = document.getElementById('txtSegmentationCondition');
            conditionTag.value = conditionTag.value + ' ' + param.innerText; //innerHTML ;
        }
        function HideError() {
            var txtErrorMessage = document.getElementById('txtErrorMessage');
            txtErrorMessage.value = "";

            var txtErrorPosition = document.getElementById('txtErrorPosition');
            if (txtErrorPosition != null) {
                txtErrorPosition.style.display = "none";
            }
        }
    </script>

    <base target="_self" />
</head>
<body>
    <form id="form1" runat="server">
        <asp:ScriptManager ID="ScriptManager1" runat="server" />
        <asp:UpdatePanel ID="UpdatePanel1" runat="Server">
            <ContentTemplate>
                <div id="MainDiv">
                    <div class="Caption">
                        Segmentation
                    </div>
                    <div id="oldContent" class="tglOldImpl">
                        <div class="MiddleText">
                            <asp:TextBox ID="txtSegmentationCondition" onchange="HideError();" class="SegmentationCondition" EnableViewState="true" runat="server"></asp:TextBox>
                            <asp:Label ID="txtErrorPosition" class="SegmentationCondition" BorderColor="White" BorderWidth="1px"
                                Visible="false" display='block' EnableViewState="false" runat="server"></asp:Label>
                        </div>
                        <div class="MiddleText">
                            <asp:TextBox ID="txtErrorMessage" ReadOnly="true" runat="server"></asp:TextBox>
                        </div>
                        <div class="MiddleText">
                            <div style="position: relative; float: left;">
                                <asp:Button ID="btnSubmit" runat="server" Text="Submit" />
                            </div>
                            <div style="position: relative; float: right;">
                                <input id="btnCancel" type="submit" value="Close" onclick="Close();" />
                            </div>
                        </div>
                        <div>
                            <asp:Panel ID="pnParameters" GroupingText="Parameters" ToolTip="Double-click on list item will add it to condition." runat="server" Wrap="true">
                                <ul>
                                    <li ondblclick="AddToCondition(this);">@Lang</li>
                                    <li ondblclick="AddToCondition(this);">@anid</li>
                                    <li ondblclick="AddToCondition(this);">@V7</li>
                                    <li ondblclick="AddToCondition(this);">@sr</li>
                                    <li ondblclick="AddToCondition(this);">@vip</li>
                                    <li ondblclick="AddToCondition(this);">@cip</li>
                                    <li ondblclick="AddToCondition(this);">@real</li>
                                    <li ondblclick="AddToCondition(this);">@flag</li>
                                    <li ondblclick="AddToCondition(this);">@Domain</li>
                                    <li ondblclick="AddToCondition(this);">@IC</li>
                                    <li ondblclick="AddToCondition(this);">@MKW</li>
                                    <li ondblclick="AddToCondition(this);">@RefType</li>
                                    <li ondblclick="AddToCondition(this);">@SearchLang</li>
                                    <li ondblclick="AddToCondition(this);">@SearchTerm</li>
                                    <li ondblclick="AddToCondition(this);">@Country</li>
                                    <li ondblclick="AddToCondition(this);">@isWin</li>
                                    <li ondblclick="AddToCondition(this);">@version</li>
                                    <li ondblclick="AddToCondition(this);">@currency</li>
                                    <li ondblclick="AddToCondition(this);">@gpr</li>
                                </ul>
                            </asp:Panel>
                            <asp:Panel ID="pnElements" GroupingText="Elements" runat="server" ToolTip="Double-click on list item will add it to condition.">
                                <ul>
                                    <asp:Repeater ID="repElements" runat="server">
                                        <ItemTemplate>
                                            <li ondblclick="AddToCondition(this);"><%#Container.DataItem %></li>
                                        </ItemTemplate>
                                    </asp:Repeater>
                                </ul>
                            </asp:Panel>
                        </div>
                    </div>
                </div>
                <div id="MainDiv2" class="container">
                    <asp:Button ID="btnLoad" class="btn btn-primary input-group pull-left" ClientIDMode="Static" data-target="basic" runat="server" Text="Parse Expression" />
                    <asp:TextBox ID="txtExpression" onchange="HideError();" class="SegmentationCondition form-control" EnableViewState="true" runat="server"></asp:TextBox>
                    <asp:HiddenField ID="txtParseResult" runat="server"></asp:HiddenField>
                    <asp:HiddenField ID="hiddenRules" runat="server"></asp:HiddenField>
                    <asp:HiddenField ID="sessionParameters" runat="server" />
                </div>
            </ContentTemplate>
        </asp:UpdatePanel>
    </form>
    <div class="container" id="rules">
        <div id="builder-basic"></div>
        <div class="input-group">
            <button id="btnReset" class="btn btn-danger reset" data-target="basic">Reset</button>
            <button id="btnParse" class="btn btn-success parse-json" data-target="basic">Parse Rules</button>
            <span id="btnOldImpl" class="btn btn-default input-group pull-right">
                <span>Old Version </span>
                <i class="glyphicon glyphicon-menu-down"></i>
            </span>
        </div>
        <hr />
        <div class="form-horizontal">
            <div class="form-group">
                <label for="txtParam" class="col-sm-1 control-label">Parameter</label>
                <div class="col-sm-6">
                    <input id="txtParam" type="text" class="form-control" />
                </div>
            </div>
            <div class="form-group">
                <label for="paramType" class="col-sm-1 control-label">Type</label>
                <div class="col-sm-6">
                    <select id="paramType" class="form-control">
                        <option selected="" value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="datetime">Date</option>
                        <option value="boolean">Boolean</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <span class="col-sm-offset-1 col-sm-6 input-group-btn">
                    <button id="addParam" class="btn btn-default">Add New Parameter</button>
                </span>
            </div>
        </div>
    </div>


    <script type="text/javascript" language="javascript" src="./Scripts/jquery-2.2.4.js"></script>
    <script type="text/javascript" src="./Scripts/bootstrap.js"></script>
    <script type="text/javascript" src="./Scripts/query-builder.standalone.min.js"></script>
    <script type="text/javascript" src="./Scripts/segmentationBuilder.js"></script>
</body>
</html>
