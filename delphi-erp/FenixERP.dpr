program FenixERP;

uses
  Vcl.Forms,
  System.SysUtils,
  Fenix.View.Login in 'src\Views\Security\Fenix.View.Login.pas' {FrmLogin},
  Fenix.View.Main in 'src\Views\Shell\Fenix.View.Main.pas' {FrmMain},
  Fenix.DM.Connection in 'src\DataModules\Fenix.DM.Connection.pas' {DMConnection: TDataModule},
  Fenix.Config.App in 'src\Config\Fenix.Config.App.pas',
  Fenix.Config.Database in 'src\Config\Fenix.Config.Database.pas',
  Fenix.Controller.Auth in 'src\Controllers\Fenix.Controller.Auth.pas',
  Fenix.Service.Auth in 'src\Services\Fenix.Service.Auth.pas',
  Fenix.Model.User in 'src\Models\Fenix.Model.User.pas',
  Fenix.Model.Base in 'src\Models\Fenix.Model.Base.pas',
  Fenix.Utils.Crypto in 'src\Utils\Fenix.Utils.Crypto.pas',
  Fenix.Utils.Result in 'src\Utils\Fenix.Utils.Result.pas',
  Fenix.Service.Bootstrap in 'src\Services\Fenix.Service.Bootstrap.pas',
  Fenix.Controller.Bootstrap in 'src\Controllers\Fenix.Controller.Bootstrap.pas',
  Fenix.Service.Customer in 'src\Services\Fenix.Service.Customer.pas',
  Fenix.Controller.Customer in 'src\Controllers\Fenix.Controller.Customer.pas',
  Fenix.View.Customers in 'src\Views\Customers\Fenix.View.Customers.pas' {FrmCustomers};

{$R *.res}

begin
  Application.Initialize;
  Application.MainFormOnTaskbar := True;
  Application.Title := 'Fenix ERP';
  Application.CreateForm(TDMConnection, DMConnection);
  Application.CreateForm(TFrmLogin, FrmLogin);

  if FrmLogin.ShowModal = mrOk then
  begin
    Application.CreateForm(TFrmMain, FrmMain);
    Application.Run;
  end;
end.
