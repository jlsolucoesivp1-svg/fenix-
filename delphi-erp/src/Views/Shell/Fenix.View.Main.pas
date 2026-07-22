unit Fenix.View.Main;

interface

uses
  Winapi.Windows,
  Winapi.Messages,
  System.SysUtils,
  System.Variants,
  System.Classes,
  Vcl.Graphics,
  Vcl.Controls,
  Vcl.Forms,
  Vcl.Dialogs,
  Vcl.ExtCtrls,
  Vcl.StdCtrls,
  Fenix.View.Customers;

type
  TFrmMain = class(TForm)
    PnlSidebar: TPanel;
    PnlHeader: TPanel;
    PnlContent: TPanel;
    BtnDashboard: TButton;
    BtnClientes: TButton;
    BtnOrdensServico: TButton;
    BtnFinanceiro: TButton;
    BtnEstoque: TButton;
    BtnVendas: TButton;
    LblAppTitle: TLabel;
    LblWelcome: TLabel;
    procedure FormCreate(Sender: TObject);
    procedure BtnClientesClick(Sender: TObject);
  private
  public
  end;

var
  FrmMain: TFrmMain;

implementation

{$R *.dfm}

procedure TFrmMain.FormCreate(Sender: TObject);
begin
  Color := $0014171B;
  PnlSidebar.Color := $001D2228;
  PnlHeader.Color := $00222931;
  PnlContent.Color := $0014171B;
end;

procedure TFrmMain.BtnClientesClick(Sender: TObject);
begin
  with TFrmCustomers.Create(Self) do
  try
    ShowModal;
  finally
    Free;
  end;
end;

end.
