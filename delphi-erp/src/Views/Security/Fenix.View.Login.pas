unit Fenix.View.Login;

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
  Vcl.StdCtrls,
  Vcl.ExtCtrls,
  Fenix.Controller.Auth,
  Fenix.Controller.Bootstrap,
  Fenix.Service.Auth,
  Fenix.Service.Bootstrap,
  Fenix.DM.Connection,
  Fenix.Model.User;

type
  TFrmLogin = class(TForm)
    PnlContainer: TPanel;
    LblTitle: TLabel;
    EdtLogin: TEdit;
    EdtPassword: TEdit;
    BtnLogin: TButton;
    LblStatus: TLabel;
    BtnCreateAdmin: TButton;
    EdtAdminName: TEdit;
    EdtAdminLogin: TEdit;
    EdtAdminPassword: TEdit;
    EdtAdminEmail: TEdit;
    LblBootstrapTitle: TLabel;
    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure BtnLoginClick(Sender: TObject);
    procedure BtnCreateAdminClick(Sender: TObject);
  private
    FAuthController: TAuthController;
    FBootstrapController: TBootstrapController;
    FAuthenticatedUser: TAuthenticatedUser;
    procedure InitializeServices;
    procedure UpdateScreenState;
  public
    property AuthenticatedUser: TAuthenticatedUser read FAuthenticatedUser;
  end;

var
  FrmLogin: TFrmLogin;

implementation

{$R *.dfm}

procedure TFrmLogin.BtnLoginClick(Sender: TObject);
begin
  LblStatus.Caption := '';

  try
    FAuthenticatedUser := FAuthController.Login(EdtLogin.Text, EdtPassword.Text);
    ModalResult := mrOk;
  except
    on E: Exception do
      LblStatus.Caption := E.Message;
  end;
end;

procedure TFrmLogin.BtnCreateAdminClick(Sender: TObject);
begin
  LblStatus.Caption := '';

  try
    FBootstrapController.CreateInitialAdmin(
      EdtAdminName.Text,
      EdtAdminLogin.Text,
      EdtAdminPassword.Text,
      EdtAdminEmail.Text
    );

    LblStatus.Font.Color := clLime;
    LblStatus.Caption := 'Administrador inicial criado. Agora faca login.';
    UpdateScreenState;
  except
    on E: Exception do
    begin
      LblStatus.Font.Color := clRed;
      LblStatus.Caption := E.Message;
    end;
  end;
end;

procedure TFrmLogin.FormCreate(Sender: TObject);
var
  LConfigFile: string;
begin
  Color := $0014171B;
  PnlContainer.Color := $001D2228;
  EdtPassword.PasswordChar := '*';
  EdtAdminPassword.PasswordChar := '*';

  LConfigFile := ExtractFilePath(ParamStr(0)) + 'config\appsettings.sample.json';
  DMConnection.Configure(LConfigFile);
  InitializeServices;
  UpdateScreenState;
end;

procedure TFrmLogin.FormDestroy(Sender: TObject);
begin
  FAuthenticatedUser.Free;
  FBootstrapController.Free;
  FAuthController.Free;
end;

procedure TFrmLogin.InitializeServices;
begin
  FAuthController := TAuthController.Create(TAuthService.Create(DMConnection));
  FBootstrapController := TBootstrapController.Create(TBootstrapService.Create(DMConnection));
end;

procedure TFrmLogin.UpdateScreenState;
var
  LHasUsers: Boolean;
begin
  LHasUsers := FAuthController.HasUsers;

  EdtLogin.Visible := LHasUsers;
  EdtPassword.Visible := LHasUsers;
  BtnLogin.Visible := LHasUsers;

  LblBootstrapTitle.Visible := not LHasUsers;
  EdtAdminName.Visible := not LHasUsers;
  EdtAdminLogin.Visible := not LHasUsers;
  EdtAdminPassword.Visible := not LHasUsers;
  EdtAdminEmail.Visible := not LHasUsers;
  BtnCreateAdmin.Visible := not LHasUsers;

  if LHasUsers then
  begin
    LblTitle.Caption := 'Acesso ao Fenix ERP';
    LblStatus.Font.Color := clRed;
  end
  else
  begin
    LblTitle.Caption := 'Configuracao inicial';
    LblStatus.Font.Color := clWhite;
    LblStatus.Caption := 'Nenhum usuario encontrado. Crie o administrador inicial.';
  end;
end;

end.
